import json
import time
import functools
import requests
from app.models import Photo, db
from flask import jsonify, g, request
from config import token_exp, token_salt, redis_store, api_limit, wx_appid, wx_secret
from yg_token import YgToken


# 定义的验证登录状态的装饰器
def user_login_required(view_func):
    # # wraps函数的作用是将wrapper内层函数的属性设置为被装饰函数view_func的属性
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        # 判断用户的登录状态
        var_token = request.args.get("token")
        if var_token is None:
            return jsonify(code=4002, msg="认证失败")
        # 解析token
        try:
            token_data = Token().var_token(var_token)
            user_id = token_data.get('id')
            print(user_id, user_id)
            g.user_id = user_id
        except Exception as e:
            print(e)
            return jsonify(code=4040, msg="请重新登录")
        return view_func(*args, **kwargs)

    return wrapper


# 定义的验证登录状态的装饰器
def admin_login_required(view_func):
    # # wraps函数的作用是将wrapper内层函数的属性设置为被装饰函数view_func的属性
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        # 判断用户的登录状态
        var_token = request.args.get("admin_token")
        if var_token is None:
            return jsonify(code=4002, msg="认证失败")
        # 解析token
        try:
            token_data = Token().var_token(var_token)
            admin_id = token_data.get('admin_id')
            print(admin_id, admin_id)
            g.admin_id = admin_id
        except Exception as e:
            print(e)
            return jsonify(code=4040, msg="请重新登录")
        return view_func(*args, **kwargs)

    return wrapper


class Token:
    def __init__(self):
        self.ygt = YgToken(salt=token_salt, exp=token_exp)

    def create_token(self, payload):
        # 实例化jwt序列化对象，设置salt和超时时间，这里设置xs后超时
        ygt = self.ygt

        # 编码payload数据，生成token
        token = ygt.create_token(payload=payload)
        return token

    def var_token(self, ver_token):
        ygt = self.ygt
        token_data, message = ygt.load_token(ver_token)
        if message.get("ok"):
            return token_data
        else:
            return None


def user_often_get_api(view_func):
    # # wraps函数的作用是将wrapper内层函数的属性设置为被装饰函数view_func的属性
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        # 判断用户的登录状态
        user_id = g.user_id
        api_path = request.path
        print("api_path", user_id, api_path)

        # 判断对于用户的操作，在5秒内有没有之前的记录，如果有，则认为用户操作频繁，不接受处理
        try:
            send_flag = redis_store.get(f"user:{user_id}:path:{api_path}")
            if send_flag:
                # 表示在5秒内之前有过发送的记录
                return jsonify(code=4444, msg="请求过于频繁，请5秒后重试"), 400
        except Exception as e:
            print(e)
            return jsonify(code=4401, msg="请求出错，请10秒后重试"), 400

        # 保存访问接口数据
        try:
            redis_store.setex(f"user:{user_id}:path:{api_path}", api_limit, api_path)
        except Exception as e:
            print(e)
            return jsonify(code=4402, msg="保存数据异常,请稍后在试"), 400

        return view_func(*args, **kwargs)

    return wrapper


# 定义　是否存在access_token的装饰器
def have_access_token(view_func):
    # wraps函数的作用是将wrapper内层函数的属性设置为被装饰函数view_func的属性
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        # 去取出access_token
        try:
            access_token = redis_store.get("wx_access_token")
        except Exception as e:
            print(e)
            return jsonify(code=4001, msg="服务异常,暂时无法使用该功能")

        # 判断access_token是否过期
        if access_token is None:

            # 调用函数去获取access_token
            access_token, expires_in = get_access_token()

            # 保存access_token到redis
            try:
                redis_store.setex("wx_access_token", expires_in, access_token)
            except Exception as e:
                print(e)
                return jsonify(code=4002, msg="服务异常,暂时无法使用该功能")

        # 如果判断access_token不是空
        if access_token is not None:
            # 将access_token保存到g对象中，在视图函数中可以通过g对象获取保存数据
            g.access_token = access_token
            return view_func(*args, **kwargs)
        else:
            # 如果access_token没有
            return jsonify(code=4003, msg="服务异常,暂时无法使用该功能")

    return wrapper


# 获取AccessToken
def get_access_token():
    headers = {
        'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/"
                      "537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/537.75.14"}

    # 用来处理cookie等信息的session实例化
    session = requests.Session()
    # 登录url
    url = f'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={wx_appid}&secret={wx_secret}'

    res = session.get(url=url, headers=headers)
    res_json = res.json()
    access_token = res_json.get("access_token")
    expires_in = res_json.get("expires_in")
    return access_token, expires_in


# 检查一段文本是否正常没有敏感信息。
def msg_unsafe(access_token, content):
    """
    敏感返回true，正常返回false
    遇到bug,解决了两个钟　最后发现：python requests 调用msgSecCheck 全都返回0
    https://developers.weixin.qq.com/community/develop/doc/000c2483a7ccf04aa3c8dead95b000
    感谢神人
    :return:敏感返回true，正常返回false
    """
    url = "https://api.weixin.qq.com/wxa/msg_sec_check?access_token={}".format(access_token)

    body = {"content": content.encode("utf-8").decode("latin1")}
    data = json.dumps(body, ensure_ascii=False)

    res = requests.post(url=url, data=data)
    res_json = res.json()

    errcode = res_json.get("errcode")
    return errcode == 87014


# 检查　图片的链接不含有违法违规内容 未完成
def check_img(access_token, img_url):
    """
    media_url:多媒体url
    media_type:多媒体类型,1是音频,2是图片
    :param access_token:
    :param img_url:
    :return: trace_id 唯一编号
    """
    url = "https://api.weixin.qq.com/wxa/media_check_async?access_token={}".format(access_token)

    data = {"media_type": 2, "media_url": img_url}
    data = json.dumps(data, ensure_ascii=False)
    res = requests.post(url=url, data=data)

    res_json = res.json()

    trace_id = res_json.get("trace_id")

    print(trace_id)

    return trace_id


# 将图片链接保存到数据库
def save_file_url_to_mysql_is_ok(user_id, file_url):
    if not all([user_id, file_url]):
        print("参数不足")
        return False

    try:
        photo = Photo(url=file_url, user_id=user_id)
        db.session.add(photo)
        db.session.commit()
    except Exception as e:
        print(e)
        return False
    return True


# 发送订阅信息---新留言提醒
# def send_message_to_wechat(access_token, sender_name, to_user, text):
#     # 发送RUL
#     url = f'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token={access_token}'
#     template_id = "gUWEJHQA7ikwF5g9tQQTtaO0uNZs"  # 收到新留言推送模板
#     data = {
#         'touser': to_user,  # 接收者的用户的openid
#         'template_id': template_id,  # 模板信息
#         "page": "/pages/index/email",  # 跳到邮件
#
#         "data": {
#             "name1": {
#                 "value": sender_name
#             },
#             "thing2": {
#                 "value": text
#             },
#             "date3": {
#                 "value": time.strftime("%Y年%m月%d日 %H:%M")
#             }
#         }
#     }
#
#     # 发送请求
#     res = requests.post(url=url, data=jsonify(data))
#     res_json = res.json()
#     errcode = res_json.get("errcode")
#     return errcode


if __name__ == '__main__':
    pass
