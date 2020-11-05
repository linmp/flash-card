
const app = getApp();
var Api = require('../../utils/api.js');
Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        count:null
    },

  exit:function(){
    this.setData({
      hasUserInfo: false,
      userInfo: {},
      canIUse: wx.canIUse('button.open-type.getUserInfo')
    })
  },

    onLoad: function () {
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            })
        } else if (this.data.canIUse) {
            app.userInfoReadyCallback = res => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                })
            }
        } else {
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    })
                }
            })

        }

    },
    getUserInfo: function (e) {
        app.globalData.userInfo = e.detail.userInfo
        this.setData({
            userInfo: e.detail.userInfo,
            hasUserInfo: true
        })
      wx.reLaunch({
        url: '/pages/user/user'
      })
    },

    getCountMethods:function(){
      var that = this;
      wx.request({
        url: Api.getCount() + app.globalData.token,
          success(res) {
            if(res.data.code=='200'){
              that.setData({
                count:res.data.count
              })
              // wx.setStorage({
              //   key:"count",
              //   data:res.data.count
              //  })
            }
          }
      })
    },

    onShow(){
        var that = this;
        this.getCountMethods()
    },

       // 单击
  mytap: function(e){
    console.log('成功点击');
    wx.showModal({
        title: '成功点击',
        content: '成功点击',
        showCancel: false,
      })
  },

  showQrcode() {
    wx.previewImage({
      urls: ['https://cdn.jamkung.com/card/user/1/202007/23/140522_25.png'],
      current: 'https://cdn.jamkung.com/card/user/1/202007/23/140522_25.png' // 当前显示图片的http链接      
    })
  },

    /**
   * 分享网页
   */
  onShareAppMessage: function () {
    return {
      title: '记忆手卡',
      desc: '让你记住每一个知识点',
      path: '/pages/user/user'
    }
 },

})
