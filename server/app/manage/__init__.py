from flask import Blueprint

# 创建蓝图对象
manage = Blueprint("manage", __name__)

from . import api
