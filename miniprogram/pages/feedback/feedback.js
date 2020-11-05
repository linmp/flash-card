var app = getApp()
var Api = require('../../utils/api.js');


Page({
  data: {
    content: "",
    connect: ""
  },
  onLoad: function (options) {
  },

  getContent: function (e) {
    this.setData({
      content: e.detail.value
    })
  },

  getConnection: function (e) {
    this.setData({
      connect: e.detail.value
    })
  },


  submitSuggestion: function () {
    var that = this;
    if(that.data.connect == ''){
      wx.showModal({
        title: '靓仔检查一下有没有漏写呀',
        content: "哈哈哈，没有就再次点击次提交吧~",
        showCancel: false,
      })
    }else{
      wx.request({
        url: Api.feedback() + app.globalData.token,
        data: {
            "content":that.data.content,
            "connect":that.data.connect,
        },
        method: 'POST',
        header: {
            'content-type': 'application/json',
        },
        success: function(res) {

            if(res.data.code=='200'){
              wx.showModal({
                title: '提示',
                content: '提交成功！感谢您的反馈！',
                showCancel: false,
                success: function (res) {
                  if (res.confirm) {
                    console.log('用户点击确定')
                  }
                  setTimeout(function () {
                    wx.navigateBack({
                      delta: 1
                    })
                  }, 500)     
                }
                
              })       
            }else{
                wx.showModal({
                    title: '不小心丢失数据，请再次点击提交',
                    content: res.data.msg,
                    showCancel: false,
                  })
            }
        },
        })
    }
  }
})