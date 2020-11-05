var Api = require('../../../utils/api.js');
const app = getApp() 
Page({
  data: {
    color:"green",
    ColorList: [{
        title: '嫣红',
        name: 'red',
        color: '#e54d42'
      },
      {
        title: '桔橙',
        name: 'orange',
        color: '#f37b1d'
      },
      {
        title: '明黄',
        name: 'yellow',
        color: '#fbbd08'
      },
      {
        title: '橄榄',
        name: 'olive',
        color: '#8dc63f'
      },
      {
        title: '森绿',
        name: 'green',
        color: '#39b54a'
      },
      {
        title: '海蓝',
        name: 'blue',
        color: '#0081ff'
      },
      {
        title: '奶白',
        name: 'white',
        color: '#000'
      },
    ]

},


    /**
     * 获取点击的颜色
     */
    getColor:function(e){
            
      console.log(e.currentTarget.dataset.color)
      this.setData({
          color:e.currentTarget.dataset.color
      })
    },

    /**
     * 跳转到克隆卡集的页面 
     */
    onClone: function() {
      wx.navigateTo({
        url: '/pages/box/clone/index',
      })
    },
    
    /**
     * 提交数据 
     */
    formSubmit(e) { 
      var that = this
        var password = e.detail.value.password;
        var name = e.detail.value.name;

      if (name == "") {
        wx.showToast({
          title: '需要填写卡集的名称',
          icon: 'none'
        })
        return 0;
      }
      if (password == "") {
        wx.showToast({
          title: '需要填写卡集的密码',
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
                      url: Api.createBox() + app.globalData.token,
                      data: {
                        "name":name,
                        "password":password,
                        "color":that.data.color
                      },
                        header: {
                            'content-type': 'application/json'
                        },
                        method: 'POST',
                        
                        success(res) {
                          console.log(res.data)
                          if (res.data.code == "200") {
                            console.log(res.data)
                            wx.showModal({
                              title: '创建成功',
                              content: res.data.box_name,
                              showCancel: false,
                            })
                            setTimeout(function () {
                              wx.navigateBack({
                                delta: 1
                              })
                            }, 1000)
                          } else {
                            wx.showModal({
                              title: '创建失败',
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