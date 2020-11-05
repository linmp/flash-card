// pages/index/pinfo.js
const app = getApp();
var Api = require('../../utils/api.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    username:"",
    create_time:"",
    id:null,
    messages:0,
    photos:null,
    openids:[''],
    phone: null,
  },

  gotobind: function () {
    wx.navigateTo({
      url: '/pages/phone/phone',
    })
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    wx.request({
      url: Api.getUserProfile() + app.globalData.token,
      method: 'GET',
      success(res) {
        that.setData({
          create_time:res.data.data.create_time,
          id:res.data.data.id,
          messages:res.data.data.messages,
          openids:res.data.data.openids,
          phone: res.data.data.phone,
          photos:res.data.data.photos,
          username:res.data.data.username
        })
        wx.showToast({
          title: "加载完成",
        })
      }
    })
  },

})