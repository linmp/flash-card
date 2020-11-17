# 需要的配置
import redis
import os
from random import randint

# redis_store = redis.Redis(host='127.0.0.1', port=6379, db=1)  # 操作的redis配置
redis_store = redis.Redis(host='127.0.0.1', port=6379, password="123456", db=3,
                          decode_responses=True)  # 操作的redis配置

# 常量
wx_appid = "xxx"  # 微信小程序appid
wx_secret = "xxx"  # 微信小程序app密码
qq_appid = 'xxx'  # qq小程序appid
qq_secret = 'xxx'  # qq小程序appid密码

token_salt = "yingong"  # 服务端生成token的混淆加盐值
token_exp = 3600  # token过期时间 单位秒
api_limit = 5  # api请求限制时间 秒

# 短信配置
secret_id = os.environ.get("TENCENT_APP_ID") or "xxx"  # 腾讯云APPID
secret_key = os.environ.get("TENCENT_APP_KEY") or "xxx"  # 腾讯云密钥

# 短信
SmsSdkAppid = "1400311239"  # 短信应用ID
SmsSign = "记忆手卡"  # 短信签名内容
SmsTemplateID = "673053"  # 短信模板ID
minute = 10  # 验证码有效时间 分钟

check_img_trace_id_expire = 30  # 安全内容-图片验证的唯一id 过期时间 分钟
wx_mnp_token = 'xxx'  # 微信小程序回调函数的token


# 腾讯云COS信息配置
BUCKET = os.environ.get("COS_bucket") or 'cdn-13001735'
TENCENT_APP_ID = os.environ.get("TENCENT_APP_ID") or 'xxx'  # 替换为用户的 secretId 腾讯云APPID
TENCENT_APP_KEY = os.environ.get("TENCENT_APP_KEY") or 'xxx'  # 替换为用户的 secretKey 腾讯云密钥
REGION = os.environ.get("COS_region") or 'ap-shanghai'  # 替换为用户的 Region
CDN_DOMAIN = "https://cdn.jamkung.com"  # cdn配置的加速域名


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "sdfsdfsdf"


# 开发环境
class DevelopmentConfig(Config):
    """开发模式的配置信息"""
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:password@127.0.0.1:3306/flash_card_dev?charset=utf8mb4'
    DEBUG = True


# 线上环境
class ProductionConfig(Config):
    """生产环境配置信息 jamkung环境"""
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:123456@127.0.0.1:3306/flash_card?charset=utf8mb4'


config_map = {
    "develop": DevelopmentConfig,
    "product": ProductionConfig
}
