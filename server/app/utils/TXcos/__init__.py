import os
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client
from config import BUCKET, TENCENT_APP_ID, TENCENT_APP_KEY, REGION, CDN_DOMAIN

# 配置信息
bucket = BUCKET
secret_id = TENCENT_APP_ID  # 替换为用户的 secretId
secret_key = TENCENT_APP_KEY  # 替换为用户的 secretKey
region = REGION  # 替换为用户的 Region
CDN_DOMAIN = CDN_DOMAIN  # COS的CDN内容分发加速域名

config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key)
# 2. 获取客户端对象
client = CosS3Client(config)
