// miniprogram/pages/customize/customize.js
var Api = require('../../../utils/api.js');
const app = getApp() 


Page({
    formSubmit(e) { 
        var password = e.detail.value.password;
        var box_id = e.detail.value.box_id;
      if (box_id == "") {
        wx.showToast({
          title: '卡集ID需要填写',
          icon: 'none'
        })
        return 0;
      }
      if (password == "") {
        wx.showToast({
          title: '卡集的访问密码需要填写',
          icon: 'none'
        })
        return 0;
      }

        wx.getSetting({
            success: res => {
                if (!res.authSetting['scope.userInfo']) {
                    wx.showToast({
                        title: '请先授权用户登录:点击右下角我的 - 一键登录',
                        icon: 'none'
                    })
                    return 0;
                }else{
                    wx.request({
                      url: Api.cloneBox() +app.globalData.token,
                      data: {
                        box_id: box_id,
                        password: password
                      },
                        header: {
                            'content-type': 'application/json'
                        },
                        method: 'POST',
                        
                        success(res) {
                          if (res.data.code == "200") {
                            wx.showModal({
                              title: '克隆成功',
                              content: res.data.box_name,
                              showCancel: false,
                            })
                          } else {
                            wx.showModal({
                              title: '克隆失败',
                              content: res.data.msg,
                              showCancel: false,
                            })

                          }
                        }
                    })
                }
            }
        })

    },
})