from app import db
from datetime import datetime

"""
python3 manage.py db init # 第一次需要运行
python3 manage.py db migrate -m "message"
python3 manage.py db upgrade
python3 manage.py db downgrade
"""


# insert into user(username,phone,avatar) values ('菜鸡','12312312312','https://gopy.xyz/avatar')


# openid表 用于多端保存openid等
class UserOpenid(db.Model):
    __tablename__ = "user_openid"
    id = db.Column(db.Integer, primary_key=True)  # 主键
    openid = db.Column(db.String(128), nullable=False, unique=True)  # openid
    avatar = db.Column(db.String(128), nullable=False)  # 头像
    create_time = db.Column(db.DateTime, index=True, default=datetime.now)  # 添加时间
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))  # 所属用户 外键

    def __repr__(self):
        return "<openid表 id:%r" % (self.id)


# 反馈表
class Message(db.Model):
    __tablename__ = "message"
    id = db.Column(db.Integer, primary_key=True)  # 主键
    content = db.Column(db.Text, nullable=False)  # 图片的url
    connect = db.Column(db.Text, nullable=False)  # 图片的url
    create_time = db.Column(db.DateTime, index=True, default=datetime.now)  # 添加时间

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))  # 所属用户 外键

    def __repr__(self):
        return "<反馈表 id:%r" % (self.id)


# 图片表
class Photo(db.Model):
    __tablename__ = "photo"
    id = db.Column(db.Integer, primary_key=True)  # 主键
    url = db.Column(db.String(128), nullable=False)  # 图片的url
    create_time = db.Column(db.DateTime, index=True, default=datetime.now)  # 添加时间

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))  # 所属用户 外键

    def __repr__(self):
        return "<图片表 id:%r" % (self.id)


# 用户表
class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)  # 主键
    username = db.Column(db.String(32), nullable=False, unique=True)  # 账号名字
    phone = db.Column(db.String(11))  # 手机号
    avatar = db.Column(db.String(128), nullable=False)  # 头像
    password = db.Column(db.String(16), nullable=False)  # 密码 可以将openid后六位拿来当作密码
    is_active = db.Column(db.Boolean, default=True)  # 是否正常用户
    create_time = db.Column(db.DateTime, index=True, default=datetime.now)  # 添加时间

    boxes = db.relationship("Box", backref="user")  # 用户与卡集的关系 关联卡集
    user_openid = db.relationship("UserOpenid", backref="user")  # 用户与openid的关系 关联openid
    photos = db.relationship("Photo", backref="user")  # 用户与图片的关系 用于查看用户上传了多少照片
    messages = db.relationship("Message", backref="user")  # 用户与反馈的关系 用于查看用户反馈的数据

    def __repr__(self):
        return "<用户的\tid:%r \t用户名:%r \t手机号:%r>" % (self.id, self.username, self.phone)


# 卡集表
class Box(db.Model):
    __tablename__ = "box"
    id = db.Column(db.Integer, primary_key=True)  # 主键
    name = db.Column(db.String(10), nullable=False)  # 卡集名字
    password = db.Column(db.String(10), nullable=False)  # 卡集密码
    color = db.Column(db.String(10), default='green')  # 卡集的颜色
    summary = db.Column(db.String(1024))  # 卡集简介
    clone_times = db.Column(db.Integer, nullable=False, default=0)  # 卡集被克隆次数
    is_active = db.Column(db.Boolean, nullable=False, default=True)  # 卡集状态 存在与删除
    is_share = db.Column(db.Boolean, nullable=False, default=False)  # 卡集是公众分享的
    create_time = db.Column(db.DateTime, index=True, default=datetime.now)  # 添加时间

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))  # 所属用户 外键

    cards = db.relationship("Card", secondary="box_with_card", backref="boxes")  # 卡集与卡片的关系 多对多
    get_status = db.relationship("BoxWithCard", backref="box")  # 卡集的状态信息

    def __repr__(self):
        return "<卡集表 id:%r %r" % (self.id, self.name)


# 卡集与卡片 中间.id表collect_status
class BoxWithCard(db.Model):
    __tablename__ = "box_with_card"
    id = db.Column(db.Integer, primary_key=True)  # 主键
    box_id = db.Column(db.Integer, db.ForeignKey("box.id", ondelete='CASCADE'))  # 所属卡集
    card_id = db.Column(db.Integer, db.ForeignKey("card.id", ondelete='CASCADE'))  # 所属卡片
    is_active = db.Column(db.Boolean, unique=False, default=True)  # 卡片是否存在
    error_times = db.Column(db.Integer, nullable=False, default=0)  # 错的次数
    understand = db.Column(db.Boolean, nullable=False, index=True, default=False)  # 已经掌握 默认是未掌握
    collection = db.Column(db.Boolean, nullable=False, index=True, default=False)  # 收藏 默认未收藏
    create_time = db.Column(db.DateTime, index=True, default=datetime.now)  # 添加时间


# 卡片表
class Card(db.Model):
    __tablename__ = "card"
    id = db.Column(db.Integer, primary_key=True)  # 主键
    question = db.Column(db.String(256), nullable=False)  # 问题
    answer = db.Column(db.Text, nullable=False)  # 答案
    answer_html = db.Column(db.Text)  # 答案的html格式数据
    delta = db.Column(db.Text)  # delta对象
    color = db.Column(db.String(10), default='white')  # 卡片的颜色
    create_time = db.Column(db.DateTime, index=True, default=datetime.now)  # 添加时间

    get_status = db.relationship("BoxWithCard", backref="card")  # 关联中间表

    def __repr__(self):
        return "<卡片表 id:%r %r" % (self.id, self.question)


if __name__ == '__main__':
    db.create_all()
    # db.drop_all()
