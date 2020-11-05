//app.js
var Api = require('/utils/api.js');

// !function(){
//   var PageTmp = Page;
 
//   Page =function (pageConfig) {
     
//     // 设置全局默认分享
//     pageConfig = Object.assign({
//       onShareAppMessage:function () {
//         return {
//           title:'记忆手卡a',
//           desc: '让你记住每一个知识点',
//           path:'/pages/user/user',
//           imageUrl:'https://cdn.jamkung.com/cards/yg.jpg',
//         };
//       }
//     },pageConfig);
 
//     PageTmp(pageConfig);
//   };
// }();


App({
  onLaunch: function() {
    // wx.login({
    //   success: res => {
    //     if (res.code) {
    //       wx.request({
    //         url: Api.getOpenidToken() + res.code,
    //         success: function(res) {
    //           if (res.data.openid) {
    //             var app = getApp();
                
    //             app.globalData.openid = res.data.openid;
    //             var openid_token = res.data.openid_token;

    //             wx.request({
    //               url: Api.getToken() + openid_token,
    //               success: function(res) {
    //                 console.log(res)
    //                 if (res.data.code=='200') {
    //                   app.globalData.token = res.data.token;
    //                   console.log("用户的真实token " +  app.globalData.token);
    //                   wx.hideLoading()
    //                 }
    //               },
    //               fail: function() {
    //                 wx.showModal({
    //                   title: '提示',
    //                   content: '加载失败,请检查网络状态,重新启动小程序',
    //                   showCancel: false,
    //                   success: function(res) {
    //                     wx.navigateBack({
    //                       delta: 1
    //                     })
    //                   }
    //                 })
    //               }
    //             })
    //             wx.hideLoading()
                
    //           }
    //         },
    //         fail: function() {
    //           wx.showModal({
    //             title: '提示',
    //             content: '加载失败,请检查网络状态,重新启动小程序',
    //             showCancel: false,
    //             success: function(res) {
    //               wx.navigateBack({
    //                 delta: 1
    //               })
    //             }
    //           })
    //         }
    //       })
    //     }
    //   }
    // })

    wx.showLoading({

      title: "加载信息ing",

      mask: true

    })

    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let capsule = wx.getMenuButtonBoundingClientRect();
        if (capsule) {
          this.globalData.Custom = capsule;
          this.globalData.CustomBar = capsule.bottom + capsule.top - e.statusBarHeight;
        } else {
          this.globalData.CustomBar = e.statusBarHeight + 50;
        }
      }
    })

    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },

  getUserToken: function(cb) {
    var that = this
    if (this.globalData.token) {
      console.log("已经获取了openid")
      cb(this.globalData.token)
    } else {
    wx.login({
      success: res => {
        console.log("第一步获取openid")
        if (res.code) {
          wx.request({
            url: Api.getOpenidToken() + res.code,
            success: function(res) {
              if (res.data.openid) {
                var app = getApp();
                
                app.globalData.openid = res.data.openid;
                var openid_token = res.data.openid_token;

                wx.request({
                  url: Api.getToken() + openid_token,
                  success: function(res) {
                    console.log("第二步获取token")
                    console.log(res)
                    if (res.data.code=='200') {
                      app.globalData.token = res.data.token;
                      console.log("用户的真实token " +  app.globalData.token)
                      console.log("第三步返回token")
                      cb(that.globalData.token)                      
                    }
                  },
                  fail: function() {
                    wx.showModal({
                      title: '提示',
                      content: '加载失败,请检查网络状态,重新启动小程序',
                      showCancel: false,
                      success: function(res) {
                        wx.navigateBack({
                          delta: 1
                        })
                      }
                    })
                  }
                })
                wx.hideLoading()
                
              }
            },
            fail: function() {
              wx.showModal({
                title: '提示',
                content: '加载失败,请检查网络状态,重新启动小程序',
                showCancel: false,
                success: function(res) {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              })
            }
          })
        }
      }
    })

    }

  },
  globalData: {
    userInfo: null,
    openid: null,
    token:null    
  }
})