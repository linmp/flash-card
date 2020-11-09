from . import manage


@manage.route("/index", methods=["GET"])
def share_apply():
    print("hey")
    return "Hey 用户你好"
