// pages/index/bind.js
const app = getApp();
var Api = require('../../utils/api.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone:"",

  },
  gcode:function(e){
    this.data.phone=e.detail.value;
  },

  getcode:function(e){
    var that = this;
    var phone = this.data.phone;

    if (phone == "") {
      wx.showToast({
        title: '请填写手机号',
        icon: 'none'
      })
      return 0;
    }

    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.userInfo']) {
          wx.showToast({
            title: '请返回个人页面授权用户登录',
            icon: 'none'
          })
        } else {
          wx.request({
            url: Api.getSms() + app.globalData.token,
            data: {
              phone: phone,
            },
            header: {
              'content-type': 'application/json'
            },
            method: 'POST',
            success(res) {
              console.log(res.data)
              if (res.data.code == "200") {
                wx.showToast({
                  title: '发送验证码成功',
                })

              } else {
                wx.showToast({
                  title: '发送失败，请稍后再试',
                  icon: 'none'
                })
              }
            },
          })
        }
      }
    })

  },

  formSubmit(e) {
    var that = this;
    var code = e.detail.value.code;
    var phone=e.detail.value.phone;

    if (code == "") {
      wx.showToast({
        title: '请填写验证码',
        icon: 'none'
      })
      return 0;
    }
    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.userInfo']) {
          wx.showToast({
            title: '请返回个人页面授权用户登录',
            icon: 'none'
          })
        } else {
          wx.request({
            url: Api.checkSms() + app.globalData.token,
            data: {
              phone: phone,
              code: code,
            },
            header: {
              'content-type': 'application/json'
            },
            method: 'POST',
            success(res) {
              console.log(res.data)
              if (res.data.code == "200") {
                wx.showToast({
                  title: '绑定手机成功',
                })
                setTimeout(function () {
                  wx.navigateBack({
                    delta: 1
                  })
                }, 1500)
              } else {
                wx.showToast({
                  title: '绑定失败，请检查验证码是否正确',
                  icon: 'none'
                })
              }
            },
          })
        }
      }
    })
  },
})