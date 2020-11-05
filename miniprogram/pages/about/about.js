// pages/settings/help/help.js
Page({
  data:{
  },


  // 展示赞赏码
  showQrcode() {
    wx.previewImage({
      urls: ['https://cdn.jamkung.com/card/user/1/202007/23/140522_25.png'],
      current: 'https://cdn.jamkung.com/card/user/1/202007/23/140522_25.png' // 当前显示图片的http链接      
    })
  },

  // 复制链接
  CopyLink(e) {
    var that = this
    wx.setClipboardData({
      data:e.currentTarget.dataset.mdurl,
      success: res => {
        wx.showToast({
          title: '已复制',
          duration: 1000,
        })
      }
    })
  },
  
})