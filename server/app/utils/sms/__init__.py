# import os
#
# secret_id = os.environ.get("TENCENT_APP_ID") or ""
# secret_key = os.environ.get("TENCENT_APP_KEY") or ""
from config import secret_id, secret_key, SmsSdkAppid, SmsSign, SmsTemplateID

secret_id = secret_id
secret_key = secret_key
SmsSdkAppid = SmsSdkAppid  # 短信应用ID
SmsSign = SmsSign  # 短信签名内容
SmsTemplateID = SmsTemplateID  # 短信模板ID
