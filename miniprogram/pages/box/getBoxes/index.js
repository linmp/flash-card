var Api = require('../../../utils/api.js');
const app = getApp();

Page({
  data: {
    items: [],
  },

  onLoad: function (options) {

  },

  /**
   * 首次渲染事件
   */
  onShow: function () {
    // 获取数据
    var that = this;

    that.onLoadData();

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

  /**
   * 跳转新增卡集
   */
  onNewItem: function () {
    wx.navigateTo({
      url: "../createBox/index"
    })
  },

  /**
   * 跳转编辑卡集事件
   */
  onEditItem: function (event) {
    console.log(event.currentTarget.dataset.key)
    wx.navigateTo({
      url: '/pages/card/createCard/index?box_id=' + event.currentTarget.dataset.key 
    })
  },

  /**
   * 跳转查看卡片
   */
  getBoxCard: function (event) {
    var data = event.currentTarget.dataset
    console.log(data)
    wx.navigateTo({
      url: '/pages/box/cardsList/index?box_id=' + data.key +'&box_color=' + data.color + "&box_name=" + data.box_name  + "&box_password=" + data.box_password
    })
  },


  /**
   * 获取卡集数据事件
   */
  onLoadData: function () {
    var that = this;
      wx.request({
        url: Api.getUserBoxes() + app.globalData.token,
        method: 'GET',
        header: {
          'content-type': 'application/json',
        },
        success: function(res) {
          console.log(res.data.data)
          that.setData({
            items:res.data.data
          })
        },
      })
  },

  /**
   * 下拉刷新事件, 数据同步
   */
  onPullDownRefresh: function () {
    wx.showToast({
      title: '正在同步数据',
      icon: 'loading'
    });
    this.onLoadData()
    wx.stopPullDownRefresh()
  },

  /**
   * 长按编辑事件
   */
  mylongtap: function(event){
    // 获取key值id
    console.log(event)
    console.log(event.currentTarget.dataset.key)
    var box_id = event.currentTarget.dataset.key;
    var mod_box = ''
    var items = this.data.items
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      if(items[i].box_id == box_id){
        mod_box = items[i]
        wx.setStorage({
          key:"mod_box",
          data:mod_box
         })
        break
      }
    }

      console.log('编辑卡片')
      wx.navigateTo({
        url: '../modBox/index?box_id=' + event.currentTarget.dataset.key +'&box_color=' + event.currentTarget.dataset.color
      })
  },
})
