import json

from flask import request, jsonify, g
from random import randint
import requests
from sqlalchemy import func
from . import main
from app.models import User, Box, BoxWithCard, Card, db, UserOpenid, Photo, Message
from app.utils.tool import Token, user_login_required, user_often_get_api, msg_unsafe, have_access_token, check_img

from config import redis_store, wx_appid, wx_secret, qq_appid, qq_secret, minute, check_img_trace_id_expire
from ..utils.TXcos.upload import upload_file
from ..utils.sms import send


# 获取 wx openid
@main.route('/wx/login')
def wx_login():
    """
    请求获得用户的openid
    属性	类型	默认值	必填	说明
    appid	string		是	小程序 appId
    secret	string		是	小程序 appSecret
    js_code	string		是	登录时获取的 code
    grant_type	string		是	授权类型，此处只需填写 authorization_code

    :return:
    返回的 JSON 数据包

    属性	类型	说明
    openid	string	用户唯一标识
    session_key	string	会话密钥
    unionid	string	用户在开放平台的唯一标识符，在满足 UnionID 下发条件的情况下会返回，详见 UnionID 机制说明。
    errcode	number	错误码
    errmsg	string	错误信息

    """
    lg_code = request.args.get('lg_code')
    url = f"https://api.weixin.qq.com/sns/jscode2session?appid={wx_appid}&secret={wx_secret}&js_code={lg_code}&grant_type=authorization_code"
    rq = requests.get(url)
    rq_json = rq.json()
    print(rq_json)
    if rq_json.get('errcode') is not None:
        data = {"error": rq_json.get('errmsg')}
        data = jsonify(data)
        return data
    else:
        openid = rq_json.get('openid')
        payload = {
            "openid": openid
        }
        openid_token = Token().create_token(payload)
        return jsonify(code=200, openid=openid, openid_token=openid_token)


# 获取 qq openid
@main.route('/qq/login')
def qq_login():
    """
    请求获得用户的openid
    属性	类型	默认值	必填	说明
    appid	string		是	小程序 appId
    secret	string		是	小程序 appSecret
    js_code	string		是	登录时获取的 code
    grant_type	string		是	授权类型，此处只需填写 authorization_code

    :return:
    返回的 JSON 数据包

    属性	类型	说明
    openid	string	用户唯一标识
    session_key	string	会话密钥
    unionid	string	用户在开放平台的唯一标识符，在满足 UnionID 下发条件的情况下会返回，详见 UnionID 机制说明。
    errcode	number	错误码
    errmsg	string	错误信息

    """
    lg_code = request.args.get('lg_code')
    url = f"https://api.q.qq.com/sns/jscode2session?appid={qq_appid}&secret={qq_secret}&js_code={lg_code}&grant_type=authorization_code"
    rq = requests.get(url)
    rq_json = rq.json()
    print(rq_json)
    if rq_json.get('errcode') != 0:
        data = {"error": rq_json.get('errmsg')}
        data = jsonify(data)
        return data

    else:
        openid = rq_json.get('openid')
        payload = {
            "openid": openid
        }
        openid_token = Token().create_token(payload)
        return jsonify(code=200, openid=openid, openid_token=openid_token)


# 通过openid获取token
@main.route('/openid/token', methods=['GET'])
def get_token():
    openid_token = request.args.get('openid_token')
    # 判断用户的登录状态
    if openid_token is None:
        return jsonify(code=4000, msg="参数不完整")

    # 解析token
    try:
        token_data = Token().var_token(openid_token)
        openid = token_data.get('openid')
        print(openid, openid)
    except Exception as e:
        print(e)
        return jsonify(code=4003, msg="请重新登录")
    # 查找openid是否存在
    user_openid = UserOpenid.query.filter_by(openid=openid).first()
    # 注册
    if user_openid is None:
        user = User(username=openid, avatar="https://hicaiji.com/avatar", password=openid[:6])
        try:
            db.session.add(user)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify(code=4001, msg="注册用户失败")

        # 保存openid
        user_openid = UserOpenid(openid=openid, avatar="https://hicaiji.com/avatar", user_id=user.id)
        try:
            db.session.add(user_openid)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify(code=4002, msg="注册用户失败")

    # 验证并生成token
    payload = {
        "id": user_openid.user.id
    }
    token = Token().create_token(payload)
    return jsonify(code=200, msg="获取token成功", openid=openid, token=token)


# 其他端登录 // 暂未做密码验证
@main.route('/token/login', methods=['POST'])
def token_login():
    """
    具体逻辑用户可以二次开发写密码验证
    :return:
    """
    print(request.path)
    req_json = request.get_json()
    username = req_json.get("username")
    password = req_json.get("password")
    if not all([username, password]):
        return jsonify(code=4000, msg="参数不完整"), 400
    user = User.query.filter_by(username=username).first()
    if user:
        # 验证并生成token
        payload = {
            "id": user.id
        }
        token = Token().create_token(payload)
        return jsonify(code=200, msg="登录成功", token=token), 200
    else:
        return jsonify(code=4001, msg="登录失败"), 400


# 发送手机验证码 v
@main.route("/sms", methods=["POST"])
@user_login_required
@user_often_get_api
def send_sms():
    req_json = request.get_json()
    phone = req_json.get("phone")
    if not all([phone]):
        # 表示参数不完整
        return jsonify(code=4000, msg="参数不完整")

    sms_code = randint(100000, 999999)  # 生成验证码

    print(sms_code, "验证码")
    print(phone, "手机号")
    # 保存真实的短信验证码
    try:
        redis_store.setex("sms_code_%s" % phone, minute * 60, sms_code)
        # 保存发送给这个手机号的记录，防止用户在60s内再次出发发送短信的操作
        redis_store.setex("send_sms_code_%s" % phone, 60, 1)
    except Exception as e:
        print(e)
        return jsonify(code=4003, msg="保存短信验证码异常,请稍后在试"), 400

    # 发送验证码
    try:
        code = send.send_sms(phone, sms_code, minute)
        if code == "Ok":
            return jsonify({"code": 200, "msg": "发送成功"}), 200
        else:
            return jsonify({"code": 4004, "msg": "发送失败"}), 400
    except Exception as e:
        print(e)
        return jsonify(code=4004, msg="发送异常"), 400


# 校验手机验证码 v
@main.route("/check/sms_code", methods=["POST"])
@user_login_required
def check_code():
    req_json = request.get_json()
    phone = req_json.get("phone")
    sms_code = req_json.get("code")
    user_id = g.user_id

    if not all([phone, sms_code, user_id]):
        return jsonify(code=4000, msg="参数不完整"), 400

    # 从redis中取出短信验证码
    try:
        real_sms_code = redis_store.get("sms_code_%s" % phone)
    except Exception as e:
        print(e)
        return jsonify(code=4001, msg="读取真实短信验证码异常"), 400

    # 判断短信验证码是否过期
    if real_sms_code is None:
        return jsonify(code=4002, msg="短信验证码失效"), 400

    # 删除redis中的短信验证码，防止重复使用校验
    try:
        redis_store.delete("sms_code_%s" % phone)
    except Exception as e:
        print(e)

    # 判断用户填写短信验证码的正确性
    if str(real_sms_code) != str(sms_code):
        return jsonify(code=4003, msg="短信验证码错误"), 400

    # 查询当前账号
    cur_user = User.query.get(user_id)

    # 查询手机号是否被添加
    user = User.query.filter_by(phone=phone).first()
    # 如果手机号对应账号已经存在 并且不是当前账号
    if user and user.id != user_id:
        # 添加当前openid到新账号
        for uo in cur_user.user_openid:
            uo.user_id = user.id
            db.session.add(uo)

    # 其他情况就是手机号没被添加或者手机号被添加的那个对象是自己的当前账号
    else:
        # 当前账号绑定手机号
        cur_user.phone = phone
        db.session.add(cur_user)

    try:
        db.session.commit()
    except Exception as e:
        print(e)
        # 数据库操作错误后的回滚
        db.session.rollback()
        # 表示手机号出现了重复值，即手机号已注册过
        return jsonify(code=4005, msg="手机号已存在"), 400
    return jsonify({"code": 200, "msg": "绑定手机成功"})


# 创建卡集 v
@main.route("/box", methods=["POST"])
@user_login_required
@user_often_get_api
@have_access_token
def create_box():
    """
     创建一个新的卡集
     新卡集没有卡片

     获取用户的手机号
     卡集的名字
     卡集的密码
    :return:
    """
    req_json = request.get_json()
    name = req_json.get("name")
    password = req_json.get("password")
    color = req_json.get("color")
    user_id = g.user_id
    if not all([name, password, color]):
        return jsonify(code=4000, msg="参数不完整")

    msg_data = name + "内容的拼接" + password
    access_token = g.access_token

    if msg_unsafe(access_token, msg_data):
        return jsonify(code=4010, msg="提交含有敏感内容")

    try:
        # 判断账号是否存在
        user = User.query.filter_by(id=user_id, is_active=True).first()
        if user is None:
            return jsonify(code=4001, msg="用户不存在或者用户状态异常")

        # 创建卡集
        box = Box(name=name, password=password, color=color)
        user.boxes.append(box)
        db.session.add(box)
        db.session.add(user)
        # 提交更改的数据
        try:
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify(code=4002, msg="创建失败")

        return jsonify(code=200, msg="创建成功", box_id=box.id, box_name=box.name)
    except Exception as e:
        print(e)
        return jsonify(code=4003, msg="创建失败")


# 克隆卡集 v
@main.route("/box/clone", methods=["POST"])
@user_login_required
@user_often_get_api
def share_box():
    """
    用于克隆卡集
    参数：
    卡集的id
    卡集的密码
    :return:
    """
    req_json = request.get_json()
    user_id = g.user_id
    box_id = req_json.get("box_id")
    password = req_json.get("password")
    if not all([user_id, box_id, password]):
        return jsonify(code=4000, msg="参数不完整")
    try:
        user = User.query.filter_by(id=user_id, is_active=True).first()
        if user is None:
            return jsonify(code=4001, msg="用户不存在或者用户状态异常")

        # box = Box.query.filter_by(id=box_id, is_active=True, password=password).first()
        box = Box.query.filter_by(id=box_id, password=password).first()

        if box is None:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
        # 复制卡片
        new_box = Box(name=box.name, password=password, color=box.color, cards=box.cards)
        db.session.add(new_box)

        user.boxes.append(new_box)
        db.session.add(user)
        try:
            db.session.commit()
            return jsonify(code=200, msg="克隆成功", new_box=new_box.id, box_name=new_box.name)
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify(code=4003, msg="提交数据库变更失败")

    except Exception as e:
        print(e)
        return jsonify(code=4004, msg="克隆失败")


# 查看卡集主页介绍 vv
@main.route("/box/index", methods=["GET"])
@user_login_required
def get_boxes_index():
    """
    查看对应的卡集的主页信息
        卡集的名字
        卡集的颜色
        卡集的id
        卡集的密码
        卡集的克隆次数
        卡集的简介
        卡集的作者头像
        卡集的卡片数量
        卡集的创建时间
    :return:
    """
    box_id = request.args.get('box_id')
    box_password = request.args.get('box_password')
    if not all([box_id, box_password]):
        return jsonify(code=4000, msg="参数不完整")
    try:
        box = Box.query.filter_by(id=box_id, password=box_password, is_share=True).first()
        if not box:
            return jsonify(code=4001, msg="卡集不存在")
        else:
            # 获取卡集的数据
            data = {
                "name": box.name,
                "box_id": box.id,
                "color": box.color,
                "password": box.password,
                # "clone_times": box.clone_times,
                "summary": box.summary,
                # "author_avatar": box.user.avatar,
                "cards_number": len(box.cards),
                "create_time": box.create_time.strftime("%Y-%m-%d %H:%M:%S")
            }
            payload = jsonify(data)
            return jsonify(code=200, msg="获取成功", data=payload)

    except Exception as e:
        print(e)
        return jsonify(code=4002, msg="查询出错")


# 查看卡集 v
@main.route("/boxes", methods=["GET"])
@user_login_required
def get_boxes():
    """
    查看用户的手机号手下有多少卡集
    :return:
    """
    user_id = g.user_id
    try:
        # 判断账号是否存在
        user = User.query.filter_by(id=user_id, is_active=True).first()
        if user is None:
            return jsonify(code=4001, msg="用户不存在或者用户状态异常")

        payload = []
        boxes = Box.query.filter_by(is_active=True, user_id=user.id).order_by(Box.create_time.desc())
        for box in boxes:
            payload.append({
                "box_id": box.id,
                "box_name": box.name,
                "password": box.password,
                "box_color": box.color,
                "cards_count": len(box.cards),
                "create_time": box.create_time.strftime("%Y-%m-%d %H:%M:%S")
            })
        return jsonify(code=200, msg="查询成功", data=payload)
    except Exception as e:
        print(e)
        return jsonify(code=4002, msg="查询出错")


# 查看卡集士多  vx
@main.route("/boxes/share/store", methods=["GET"])
@user_login_required
def get_boxes_share():
    """
    查看卡集士多的所有卡集
    :return:
    """
    try:
        payload = []
        boxes = Box.query.filter_by(is_share=True).order_by(Box.id.desc())
        for box in boxes:
            payload.append({
                "box_id": box.id,
                "box_name": box.name,
                "password": box.password,
                "box_color": box.color,
                "create_time": box.create_time.strftime("%Y-%m-%d %H:%M:%S")
            })
        return jsonify(code=200, msg="查询成功", data=payload)
    except Exception as e:
        print(e)
        return jsonify(code=4002, msg="查询出错")


# 申请分享我的卡集到广场
@main.route("/box/share/apply", methods=["POST"])
@user_login_required
def box_share_apply():
    user_id = g.user_id
    box_id = request.get_json().get("box_id")
    summary = request.get_json().get("summary")
    try:
        box = Box.query.filter_by(id=box_id, user_id=user_id, is_share=False, is_active=True).first()
        if not box:
            return jsonify(code=200, msg="要分享的盒子不存在")
        else:
            box.summary = summary
            db.session.add(box)
            try:
                db.session.commit()
                return jsonify(code=200, msg="申请分享成功，等待审核")
            except Exception as e:
                print(e)
                return jsonify(code=4002, msg="提交错误，请稍后重试")
    except Exception as e:
        print(e)
        return jsonify(code=4002, msg="查询数据库出错")


# 查看我的分享的卡集  vx
@main.route("/boxes/share", methods=["GET"])
@user_login_required
def get_my_share_boxes():
    """
    查看我的分享的卡集
    :return:
    """
    user_id = g.user_id
    try:
        payload = []
        boxes = Box.query.filter_by(user_id=user_id, is_share=True).order_by(Box.id.desc())
        for box in boxes:
            payload.append({
                "box_id": box.id,
                "box_name": box.name,
                "password": box.password,
                "box_color": box.color,
                "create_time": box.create_time.strftime("%Y-%m-%d %H:%M:%S")
            })
        return jsonify(code=200, msg="查询成功", data=payload)
    except Exception as e:
        print(e)
        return jsonify(code=4002, msg="查询出错")


# 删除我的分享的卡集  vx
@main.route("/box/share", methods=["DELETE"])
@user_login_required
def delete_my_share_boxes():
    """
    查看我的分享的卡集
    :return:
    """
    user_id = g.user_id
    box_id = request.args.get("box_id")
    try:
        box = Box.query.filter_by(id=box_id, user_id=user_id, is_share=True).first()
        if not box:
            return jsonify(code=200, msg="分享的盒子不存在")
        else:
            box.is_share = False
            db.session.add(box)
            try:
                db.session.commit()
                return jsonify(code=200, msg="删除成功")
            except Exception as e:
                print(e)
                return jsonify(code=4002, msg="删除出错")
    except Exception as e:
        print(e)
        return jsonify(code=4002, msg="查询数据库出错")


# 删除卡集 v
@main.route("/box", methods=["DELETE"])
@user_login_required
@user_often_get_api
def delete_box():
    """
    删除卡集的存在
    :return:
    """
    req_json = request.get_json()
    box_id = req_json.get("box_id")
    user_id = g.user_id
    # 参数完整
    if not all([box_id, user_id]):
        return jsonify(code=4000, msg="参数不完整")

    # 用户存在且正常
    user = User.query.filter_by(id=user_id, is_active=True).first()
    if user is None:
        return jsonify(code=4001, msg="用户不存在或者用户状态异常")

    # 卡集存在且正常
    box = Box.query.filter_by(id=box_id, is_active=True, user_id=user.id).first()
    if box is None:
        return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
    else:
        box.is_active = False
        try:
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify(code=4003, msg="删除卡集失败")
        return jsonify(code=200, msg="删除卡集成功")


# 修改卡集 v
@main.route("/box", methods=["PUT"])
@user_login_required
@user_often_get_api
@have_access_token
def mod_box():
    """
    删除卡集的存在
    :return:
    """
    req_json = request.get_json()
    box_id = req_json.get("box_id")
    password = req_json.get("password")
    color = req_json.get("color")
    box_name = req_json.get("box_name")
    user_id = g.user_id
    # 参数完整
    if not all([box_id, password, box_name, color]):
        return jsonify(code=4000, msg="参数不完整")

    msg_data = password + "内容的过度" + box_name
    access_token = g.access_token
    if msg_unsafe(access_token, msg_data):
        return jsonify(code=4010, msg="提交含有敏感内容")

    # # 用户存在且正常
    # user = User.query.filter_by(id=user_id, is_active=True).first()
    # if user is None:
    #     return jsonify(code=4001, msg="用户不存在或者用户状态异常")

    # 卡集存在且正常
    box = Box.query.filter_by(id=box_id, is_active=True, user_id=user_id).first()
    if box is None:
        return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
    else:
        box.name = box_name
        box.password = password
        box.color = color
        try:
            db.session.add(box)
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify(code=4003, msg="修改卡集失败")
        return jsonify(code=200, msg="修改卡集成功")


# 创建卡片 v
@main.route("/card", methods=["POST"])
@user_login_required
@user_often_get_api
@have_access_token
def create_card():
    """
    写一个新的卡片
    把卡片绑定到卡集
    参数：
    卡片的问题
    卡片的答案
    卡片的类型
    卡集的id
    用户的手机号

    :return:
    """
    req_json = request.get_json()
    question = req_json.get("question")
    answer = req_json.get("answer")
    answer_html = req_json.get("answer_html")
    delta = req_json.get("delta")
    box_id = req_json.get("box_id")
    color = req_json.get("color")
    user_id = g.user_id  # 用于身份认证，或许可以缓存session验证或者token
    if not all([question, answer, box_id, color, delta,answer_html]):
        return jsonify(code=4000, msg="参数不完整")

    msg_data = question + "内容的过度" + answer
    access_token = g.access_token
    if msg_unsafe(access_token, msg_data):
        return jsonify(code=4010, msg="提交含有敏感内容")

    try:
        # 查找卡集
        box = Box.query.filter_by(id=box_id, user_id=user_id, is_active=True).first()
        if box is None:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")

        delta = json.dumps(delta)  # 将对象转换为字符串存到数据库 在前端可以通过 JSON.parse(delta) 字符串转换为json对象

        # 创建卡片
        card = Card(question=question, answer=answer, color=color, delta=delta,answer_html=answer_html)
        # card = Card(question=question, answer=answer, color=color)
        box.cards.append(card)

        db.session.add(card)
        db.session.add(box)
        # 提交数据更改
        try:
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify(code=4003, msg="提交数据失败。数据库出现异常")

        return jsonify(code=200, msg="创建成功", card_id=card.id, card_question=card.question)
    except Exception as e:
        print(e)
        db.session.rollback()
        return jsonify(code=4004, msg="创建失误")


# 修改卡片 v
@main.route("/card", methods=["PUT"])
@user_login_required
@user_often_get_api
@have_access_token
def mod_card():
    """
    修改卡片的信息
    参数：
    卡片的问题
    卡片的类型
    卡片的答案
    卡片的id
    卡集的id
    用户手机号
    :return:
    """
    req_json = request.get_json()
    question = req_json.get("question")
    color = req_json.get("color")
    answer = req_json.get("answer")
    answer_html = req_json.get("answer_html")
    print(answer_html,"html")
    delta = req_json.get("delta")
    delta = json.dumps(delta)  # 序列化
    card_id = req_json.get("card_id")
    box_id = req_json.get("box_id")
    user_id = g.user_id  # 用于身份认证，或许可以缓存session验证或者token

    # 判断敏感内容
    msg_data = question + "内容的过度" + answer
    access_token = g.access_token
    if msg_unsafe(access_token, msg_data):
        return jsonify(code=4010, msg="提交含有敏感内容")

    try:
        # 判断账号是否存在
        user = User.query.filter_by(id=user_id, is_active=True).first()
        if user is None:
            return jsonify(code=4001, msg="用户不存在或者用户状态异常")

        # 查询卡集是否是用户的
        box = Box.query.filter_by(id=box_id, is_active=True, user_id=user.id).first()
        if box is None:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")

        # 查询卡片是否是卡集的
        box_with_card = BoxWithCard.query.filter_by(card_id=card_id, box_id=box_id).first()
        if box_with_card is None:
            return jsonify(code=4003, msg="找不到此卡片")

        # 判断卡是自己的还是共享的
        print(box_with_card.card.get_status, "查找卡被多少引用")
        flag = len(box_with_card.card.get_status)
        # 引用卡的超过一个人
        if flag > 1:
            #  新建卡
            card = Card(question=question, answer=answer, color=color, delta=delta,answer_html=answer_html)
            db.session.add(card)

            # 提交变更 获取card的id
            try:
                db.session.commit()
            except Exception as e:
                print(e)
                db.session.rollback()
                return jsonify(code=4004, msg="修改卡失败")

            # 将中间表对应的新卡给替换掉原来绑定的卡
            box_with_card.card_id = card.id
            db.session.add(box_with_card)
            msg = "新增卡片"

        # 引用卡的只有自己
        else:
            # 直接在旧卡修改值
            box_with_card.card.answer = answer
            box_with_card.card.question = question
            box_with_card.card.color = color
            box_with_card.card.delta = delta
            box_with_card.card.answer_html = answer_html

            db.session.add(box_with_card.card)
            msg = "直接修改"

        try:
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify(code=4005, msg="提交数据库变更失败")

        return jsonify(code=200, msg=msg, card_id=box_with_card.card_id)
    except Exception as e:
        print(e)
        return jsonify(code=4006, msg="提交数据库变更失败")


# 删除卡片 v
@main.route("/card", methods=["DELETE"])
@user_login_required
@user_often_get_api
def delete_card():
    """
    删除卡集与卡片的关联
    :return:
    """
    req_json = request.get_json()
    box_id = req_json.get("box_id")
    card_id = req_json.get("card_id")
    user_id = g.user_id

    user = User.query.filter_by(id=user_id, is_active=True).first()
    if user is None:
        return jsonify(code=4001, msg="用户不存在或者用户状态异常")

    # 卡集存在且正常
    box = Box.query.filter_by(id=box_id, is_active=True, user_id=user.id).first()
    if box is None:
        return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")

    # 新方法
    delete_box_with_card_times = BoxWithCard.query.filter_by(box_id=box_id, card_id=card_id, is_active=True).delete()
    try:
        db.session.commit()
        return jsonify(code=200, msg="操作删除卡片成功", delete_amount=delete_box_with_card_times)
    except Exception as e:
        print(e)
        return jsonify(code=4003, msg="操作删除卡片失败")


# 标记卡片状态 v
@main.route('/card/status', methods=["PUT"])
@user_login_required
@user_often_get_api
def mark_status():
    """
    错误次数增加
    标记为理解/取消理解
    标记为收藏/取消收藏
    参数：
    卡集id
    卡片id
    :return:
    """
    req_json = request.get_json()
    box_id = req_json.get("box_id")
    status = req_json.get("status")
    card_id = req_json.get("card_id")
    user_id = g.user_id
    try:
        if not all([box_id, status, card_id, user_id]):
            return jsonify(code=4000, msg="参数不完整")

        # 判断账号是否存在
        user = User.query.filter_by(id=user_id, is_active=True).first()
        if user is None:
            return jsonify(code=4001, msg="用户不存在或者用户状态异常")

        # 判断账号是否是卡集的拥有者
        box = Box.query.filter_by(id=box_id, is_active=True).first()
        if box is None:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")

        box_with_card = BoxWithCard.query.filter_by(box_id=box_id, card_id=card_id).first()
        if not box_with_card:
            return jsonify(code=4003, msg="找不到对应卡片")
        if status == "error":
            box_with_card.error_times += 1
        elif status == "understand":
            box_with_card.understand = True
        elif status == "un_understand":
            box_with_card.understand = False
        elif status == "collect":
            box_with_card.collection = True
        elif status == "un_collect":
            box_with_card.collection = False
        else:
            return jsonify(code=4004, msg="参数错误")
        # 提交修改
        try:
            db.session.add(box_with_card)
            db.session.commit()
            return jsonify(code=200, msg="操作成功")
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify(code=4004, msg="提交数据操作失败")
    except Exception as e:
        print(e)
        return jsonify(code=4005, msg="操作失败")


# 获取卡片 （这里的查询代码可以优化 等待执行）
@main.route("/cards", methods=["GET"])
@user_login_required
def get_cards():
    """
    查看卡片
    参数：
        卡集：id
        类型：文字 代码 图片 全部
        状态：收藏的卡片 掌握的卡片  没掌握的卡片 全部
        排序：随机 顺序 倒序 错误次数
        页数：分页
        显示数量：一页显示的数量
    :return:
    """
    req_json = request.args
    all_box_id = req_json.get("all_box_id")
    card_status = req_json.get("card_status")
    order = req_json.get("order")
    page = req_json.get("page")
    limit = req_json.get("limit")
    user_id = g.user_id
    if not all([all_box_id, card_status, order, page, limit]):
        return jsonify(code=4000, msg="参数不完整")

    # 判断是要全部卡片还是分卡集查看
    if all_box_id == "all":
        boxes = Box.query.filter_by(is_active=True, user_id=user_id).all()
        if not boxes:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
        box_ids = [box.id for box in boxes]
    else:
        # ！！！！下面这行不可删除 因为此时all_box_id不是list了 目的： '[1,2,3]' 转为 [1,2,3]
        all_box_id = [int(item) for item in all_box_id.strip('[]').split(',')]  # 目的： '[1,2,3]' 转为 [1,2,3]
        # 判断卡集是否存在
        boxes = Box.query.filter(Box.id.in_(all_box_id)).filter_by(is_active=True, user_id=user_id).all()
        if not boxes:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
        box_ids = [box.id for box in boxes]

    # 状态：收藏的卡片 掌握的卡片 没掌握的卡片 全部
    if card_status not in ["collect", "understand", "un_understand", "all"]:
        card_status = "un_understand"

    # 排序：随机 顺序 倒序 错误次数
    if order not in ["random", "up", "down", "error_times"]:
        order = "up"
    # 保证分页数据正确
    try:
        page = int(page)
        limit = int(limit)
    except Exception as e:
        print(e)
        page = 1
        limit = 10

    # 全部
    if card_status == "all":
        if order == "random":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(func.rand()).limit(limit)

        elif order == "up":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id). \
                paginate(page, per_page=limit, error_out=False).items

        elif order == "down":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id.desc()). \
                paginate(page, per_page=limit, error_out=False).items

        # elif order == "error_times":
        else:
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(BoxWithCard.error_times.desc()). \
                paginate(page, per_page=limit, error_out=False).items

    # 收藏
    elif card_status == "collect":
        if order == "random":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(collection=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(func.rand()).limit(limit)
        elif order == "up":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(collection=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id).paginate(page, per_page=limit,
                                                                                error_out=False).items
        elif order == "down":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(collection=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id.desc()).paginate(page, per_page=limit,
                                                                                       error_out=False).items
        # elif order == "error_times":
        else:
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(collection=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(BoxWithCard.error_times.desc()).paginate(page,
                                                                                                       per_page=limit,
                                                                                                       error_out=False).items

    # 理解
    elif card_status == "understand":
        if order == "random":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(func.rand()).limit(limit)

        elif order == "up":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id).paginate(page, per_page=limit,
                                                                                error_out=False).items
        elif order == "down":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id.desc()).paginate(page, per_page=limit,
                                                                                       error_out=False).items
        # elif order == "error_times":
        else:
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=True). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(BoxWithCard.error_times.desc()).paginate(page,
                                                                                                       per_page=limit,
                                                                                                       error_out=False).items

    # 未理解
    else:
        if order == "random":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=False). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(func.rand()).limit(limit)
        elif order == "up":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=False). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id).paginate(page, per_page=limit,
                                                                                error_out=False).items
        elif order == "down":
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=False). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(Card.id.desc()).paginate(page, per_page=limit,
                                                                                       error_out=False).items
        # elif order == "error_times":
        else:
            bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
                filter_by(understand=False). \
                join(Card,
                     Card.id == BoxWithCard.card_id).order_by(BoxWithCard.error_times.desc()).paginate(page,
                                                                                                       per_page=limit,
                                                                                                       error_out=False).items

    payload = []
    print(bwc, "xxx")
    for card in bwc:
        payload.append({
            "box_id": card.box_id,
            "box_name": card.box.name,
            "card_id": card.card_id,
            "card_color": card.card.color,
            "question": card.card.question,
            "answer": card.card.answer,
            "delta": card.card.delta,
            "error_times": card.error_times,
            "understand": card.understand,
            "collection": card.collection
        })

    return jsonify(code=200, msg="查询成功", data=payload)


# 获取分享的卡集的卡片
@main.route("/share/cards", methods=["GET"])
@user_login_required
def get_share_cards():
    """
    查看卡片
    参数：
        卡集：id
        类型：文字 代码 图片 全部
        状态：收藏的卡片 掌握的卡片  没掌握的卡片 全部
        排序：随机 顺序 倒序 错误次数
        页数：分页
        显示数量：一页显示的数量
    :return:
    """
    req_json = request.args
    all_box_id = req_json.get("all_box_id")
    card_status = req_json.get("card_status")
    order = req_json.get("order")
    page = req_json.get("page")
    limit = req_json.get("limit")
    user_id = g.user_id
    if not all([all_box_id, card_status, order, page, limit]):
        return jsonify(code=4000, msg="参数不完整")

    # 判断是要全部卡片还是分卡集查看
    if all_box_id == "all":
        boxes = Box.query.filter_by(is_share=True, user_id=user_id).all()
        if not boxes:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
        box_ids = [box.id for box in boxes]

    else:
        # ！！！！下面这行不可删除 因为此时all_box_id不是list了 目的： '[1,2,3]' 转为 [1,2,3]
        all_box_id = [int(item) for item in all_box_id.strip('[]').split(',')]  # 目的： '[1,2,3]' 转为 [1,2,3]
        # 判断卡集是否存在
        boxes = Box.query.filter(Box.id.in_(all_box_id)).filter_by(is_share=True).all()
        if not boxes:
            return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
        box_ids = [box.id for box in boxes]

    # 状态：收藏的卡片 掌握的卡片 没掌握的卡片 全部
    if card_status not in ["collect", "understand", "un_understand", "all"]:
        card_status = "un_understand"

    # 排序：随机 顺序 倒序 错误次数
    if order not in ["random", "up", "down"]:
        order = "up"
    # 保证分页数据正确
    try:
        page = int(page)
        limit = int(limit)
    except Exception as e:
        print(e)
        page = 1
        limit = 10

    # 全部
    if order == "random":
        bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
            join(Card,
                 Card.id == BoxWithCard.card_id).order_by(func.rand()).limit(limit)

    elif order == "up":
        bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
            join(Card,
                 Card.id == BoxWithCard.card_id).order_by(Card.id). \
            paginate(page, per_page=limit, error_out=False).items

    elif order == "down":
        bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
            join(Card,
                 Card.id == BoxWithCard.card_id).order_by(Card.id.desc()). \
            paginate(page, per_page=limit, error_out=False).items

    # elif order == "error_times": 删除
    else:
        bwc = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
            join(Card,
                 Card.id == BoxWithCard.card_id).order_by(BoxWithCard.error_times.desc()). \
            paginate(page, per_page=limit, error_out=False).items

    payload = []
    summary = ''
    for card in bwc:
        payload.append({
            "box_id": card.box_id,
            "box_name": card.box.name,
            "card_id": card.card_id,
            "card_color": card.card.color,
            "question": card.card.question,
            "answer": card.card.answer,
            "delta": card.card.delta,
            "error_times": card.error_times,
            "understand": card.understand,
            "collection": card.collection
        })
        summary = card.box.summary

    return jsonify(code=200, msg="查询分享成功", summary=summary, data=payload)


# 获取主页的卡片数量
@main.route("/count", methods=["GET"])
@user_login_required
def count_card():
    user_id = g.user_id

    boxes = Box.query.filter_by(is_active=True, user_id=user_id).all()
    if not boxes:
        return jsonify(code=4002, msg="卡集不存在或者你不是卡集拥有者")
    box_ids = [box.id for box in boxes]

    # 收藏
    collect_count = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
        filter_by(collection=True). \
        join(Card,
             Card.id == BoxWithCard.card_id).order_by(Card.id).count()

    # 理解
    understand_count = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
        filter_by(understand=True). \
        join(Card,
             Card.id == BoxWithCard.card_id).order_by(Card.id).count()

    # 未理解
    un_understand_count = db.session.query(BoxWithCard).filter(BoxWithCard.box_id.in_(box_ids)). \
        filter_by(understand=False). \
        join(Card,
             Card.id == BoxWithCard.card_id).order_by(Card.id).count()

    return jsonify(code=200, count={"collect_count": collect_count, "understand_count": understand_count,
                                    "un_understand_count": un_understand_count})


# 获取个人信息 v
@main.route("/user/profile", methods=["GET"])
@user_login_required
def get_profile():
    """
    id
    用户名
    头像
    注册时间
    最新上线时间
    :return:
    """
    user_id = g.user_id
    user = User.query.filter_by(id=user_id, is_active=True).first()
    if not user:
        return jsonify(code=400, msg="查询不到用户")

    # 将数据转换为json字符串
    try:
        openids = [uo.openid for uo in user.user_openid]
        data = {
            "id": user.id,
            "username": user.username,
            "phone": user.phone,
            "create_time": user.create_time.strftime("%Y-%m-%d %H:%M:%S"),
            "openids": openids,
            "messages": len(user.messages),
            "photos": len(user.photos)
        }
        resp_dict = dict(code=200, msg="查询用户信息成功!", data=data)
        return jsonify(resp_dict)
    except Exception as e:
        print(e)
        return jsonify(code=4000, msg="出错了", data=[])


# 反馈 v
@main.route("/feedback", methods=["POST"])
@user_login_required
@user_often_get_api
@have_access_token
def message():
    req_json = request.get_json()
    user_id = g.user_id
    content = req_json.get("content")
    connect = req_json.get("connect")
    if not all([user_id, connect, content]):
        return jsonify(code=4000, msg="参数不完整")

    # 判断敏感内容
    msg_data = content + "内容的过度" + connect
    access_token = g.access_token
    if msg_unsafe(access_token, msg_data):
        return jsonify(code=4010, msg="提交含有敏感内容")

    msg = Message(user_id=user_id, content=content, connect=connect)
    try:
        db.session.add(msg)
        db.session.commit()
        return jsonify(code=200, msg="你的反馈发送成功,感谢你的反馈")
    except Exception as e:
        print(e)
        db.session.rollback()
        return jsonify(code=400, msg="操作数据库失败,请稍后再试")


# 用户上传图片、文件 v
@main.route("/user/file", methods=["POST"])
@user_login_required
@have_access_token
def upload_user_photo():
    """
        1. 先上传图片到腾讯云cos
        2. 调用图片安全接口判断用户发送的图片是否完整
        3. 获取安全接口返回的唯一id
        4. 存user_id和图片url到redis
        5. 等回调函数进行存储到mysql
    :return:
    """
    # 装饰器的代码中已经将user_id保存到g对象中，所以视图中可以直接读取
    user_id = g.user_id
    # 获取图片
    image_files = request.files.getlist("file")
    if image_files is None:
        return jsonify(code=4000, msg="未上传图片")
    file_urls = []
    for image_file in image_files:
        try:
            # 1. 先上传图片到腾讯云cos
            cos_path = '/card/user/' + str(user_id) + '/'
            file_url = upload_file(image_file, path=cos_path)

        except Exception as e:
            print(e)
            return jsonify(code=400, msg="上传图片失败")

        # 2. 调用图片安全接口判断用户发送的图片是否完整
        # 3. 获取安全接口返回的唯一id
        access_token = g.access_token
        trace_id = check_img(access_token, file_url)
        print(trace_id)
        # 4. 存user_id和图片url到redis
        data = {
            "user_id": user_id,
            "file_url": file_url
        }

        try:
            redis_store.setex("check_img_%s" % trace_id, check_img_trace_id_expire * 60, json.dumps(data))
        except Exception as e:
            print(e)
    return jsonify(code=200, msg="等待验证图片", data={"url": file_urls})


# 查看用户上传图片、文件 v
@main.route("/user/file", methods=["GET"])
@user_login_required
def user_photos():
    # 装饰器的代码中已经将user_id保存到g对象中，所以视图中可以直接读取
    user_id = g.user_id
    photos = Photo.query.filter_by(user_id=user_id).order_by(Photo.create_time.desc())
    payload = []
    for p in photos:
        md_url = f"![{user_id}]({p.url})\n\n"
        data = {"url": p.url, "create_time": p.create_time.strftime("%Y-%m-%d"), "md_url": md_url,
                "small_url": p.url + "?imageMogr2/thumbnail/500x"}
        payload.append(data)

    return jsonify(code=200, msg="获取成功", data=payload)


# 删除用户上传图片、文件 v
@main.route("/user/file", methods=["DELETE"])
@user_login_required
@user_often_get_api
def delete_user_photos():
    # 装饰器的代码中已经将user_id保存到g对象中，所以视图中可以直接读取
    user_id = g.user_id
    req_json = request.get_json()
    url = req_json.get("url")
    count = Photo.query.filter(Photo.url == url, Photo.user_id == user_id).delete()
    try:
        db.session.commit()
    except Exception as e:
        print(e)
        db.session.rollback()
        return jsonify(code=4000, msg="数据库错误")
    print(count)
    if count >= 1:
        return jsonify(code=200, msg="删除成功")
    else:
        return jsonify(code=4001, msg="不存在此图片")
