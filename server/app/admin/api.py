import json
import hashlib
from . import admin
from ..models import Box, db

from app.utils.tool import save_file_url_to_mysql_is_ok, admin_login_required
from flask import request, jsonify, g
from config import wx_mnp_token, redis_store


"""
管理员端
"""

# 回调函数
@admin.route("/callback", methods=["POST", "GET"])
def callback():
    """
    {
    属性	类型	说明
    ToUserName	string	小程序的username
    FromUserName	string	平台推送服务UserName
    CreateTime	number	发送时间
    MsgType	string	默认为：Event
    Event	string	默认为：wxa_media_check
    isrisky	number	检测结果，0：暂未检测到风险，1：风险
    extra_info_json	string	附加信息，默认为空
    appid	string	小程序的appid
    trace_id	string	任务id
    status_code	number	默认为：0，4294966288(-1008)为链接无法下载
    }
    :return:
    """
    args_data = request.args
    signature = args_data.get("signature")
    nonce = args_data.get("nonce")
    timestamp = args_data.get("timestamp")
    token = wx_mnp_token
    if not all([signature, nonce, timestamp]):
        print("参数不完整")
        return jsonify(code=4000, msg="参数不完整")

    arr = [token, nonce, timestamp]
    arr.sort()
    temp_str = "".join(arr)
    wx_token = hashlib.sha1(temp_str.encode('utf-8')).hexdigest()

    if signature != wx_token:
        print('数据不是腾讯给的')
        return jsonify(code=4001, msg="出错")
    else:
        data = request.get_json()
        print(data, '回调参数')
        print(data.get("isrisky"))
        print(data.get("trace_id"))
        isrisky = data.get("isrisky")
        trace_id = data.get("trace_id")

        # 从redis中取出内容
        try:
            user_id_file_url_data = redis_store.get("check_img_%s" % trace_id)
        except Exception as e:
            print(e)
            return jsonify(code=4001, msg="读取异常用户id和图片redis数据异常"), 400

        # 判断否过期
        if user_id_file_url_data is None:
            return jsonify(code=4002, msg="读取异常用户id和图片redis数据异常"), 400

        try:
            redis_store.delete("check_img_%s" % trace_id)
        except Exception as e:
            print(e)

        if isrisky:
            print("图片违规")
            pass
        else:
            user_id_file_url_data = json.loads(user_id_file_url_data)
            print(user_id_file_url_data, 'redis参数')
            user_id = user_id_file_url_data.get('user_id')
            file_url = user_id_file_url_data.get('file_url')
            print(user_id)
            print(file_url)
            if save_file_url_to_mysql_is_ok(user_id=user_id, file_url=file_url):
                print("成功储存")
                return jsonify(code=200, msg="成功储存")

        return jsonify(code=200, msg="接收到数据")


# 浏览分享申请 v
@admin.route("/share/apply", methods=["GET"])
@admin_login_required
def share_apply():
    try:
        boxes = Box.query.filter(Box.summary != '').filter_by(is_share=False).all()
        payload = []
        for box in boxes:
            data = {
                "name": box.name,
                "password": box.password,
                "color": box.color,
                "summary": box.summary,
                "clone_times": box.clone_times,
                "is_active": box.is_active,
                "create_time": box.create_time,
                "user_id": box.user_id
            }
            payload.append(data)

        return jsonify(msg="查询成功", code=200, data=payload)
    except Exception as e:
        print(e)
        return jsonify(msg="heyyy", code=4010)


# 同意卡集被分享
@admin.route("/share/apply/agree", methods=["POST"])
@admin_login_required
def agree_share_apply():
    box_id = request.get_json().get('box_id')
    box = Box.query.get(box_id)
    if not box:
        return jsonify(code=4000, msg="卡集不存在")
    else:
        name = box.name
        password = box.password
        color = box.color
        is_active = False  # 不展示在用户端
        is_share = True  # 是新建分享的卡集
        user_id = box.user_id
        cards = box.cards

        new_box = Box(name=name, password=password, color=color, is_active=is_active, is_share=is_share,
                      user_id=user_id, cards=cards)

        try:
            db.session.add(new_box)
            db.session.commit()
            return jsonify(code=200, msg="卡集同意分享申请成功")
        except Exception as e:
            print(e)
            return jsonify(code=4001, msg="卡集提交出错")


# 不同意卡集被分享
@admin.route("/share/apply/disagree", methods=["POST"])
@admin_login_required
def disagree_share_apply():
    box_id = request.get_json().get('box_id')
    msg = request.get_json().get('msg')
    box = Box.query.get(box_id)

    # 发生提醒信息到用户

    return jsonify(code=200, msg="操作成功")


# 删除卡集广场上的卡集
@admin.route("/share/box", methods=["DELETE"])
@admin_login_required
def delete_share_box():
    box_id = request.get_json().get('box_id')
    box = Box.query.get(box_id)
    if not box:
        return jsonify(code=4000, msg="卡集不存在")
    else:
        box.is_share = False
        box.summary = None
        try:
            db.session.add(box)
            db.session.commit()
            return jsonify(code=200, msg="卡集同意分享申请成功")
        except Exception as e:
            print(e)
            return jsonify(code=4001, msg="卡集提交出错")
