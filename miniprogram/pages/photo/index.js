// pages/photo/index.js
var Api = require('../../utils/api.js');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgList: [],
    imgListData:[],
    payload:[],
    md_links:'',
    md_links_count:0,
    i:0,
    success:0,
    fail:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      imgList: [],
      i:0,
      success:0,
      fail:0
    })
    this.getPhoto()
  },
  // 获取图片
  getPhoto:function(){
    var that = this;
    wx.request({
    url: Api.getFile() + app.globalData.token,
    method: 'GET',
    success: function(res) {
        if(res.data.code=='200'){
          console.log(res.data.data)
          that.setData({
            payload:res.data.data
          })
          console.log(that.data.payload)

        }else{
            wx.showModal({
                title: '获取图片失败',
                content: res.data.msg,
                showCancel: false,
              })
        }
    },
    fail: function() {},
    complete: function() {}
    })
  },

  flashPage:function(){
    console.log("刷新页面")
    this.onLoad()
  },

  /** 
   * 打开上传图片页面
   */
  uploadPhoto:function(){
    if(this.data.imgList.length <1 || this.data.i == this.data.imgList.length){
      
      wx.showModal({
        title: '获取图片失败',
        content: "请选择图片吧~",
        showCancel: false,
      })
    }else{
      this.uploadimg(this.data)
    }
  },
   //多张图片上传
   uploadimg: function(data) {
    wx.showLoading({
      title: '上传中...',
      mask: true,
    })
    var that = this,
      i = data.i ? data.i : 0,
      success = data.success ? data.success : 0,
      fail = data.fail ? data.fail : 0;
    wx.uploadFile({
      url: Api.uploadFile() + app.globalData.token,
      filePath: data.imgList[i],
      name: 'file',
      formData: null,
      success: (resp) => {
        wx.hideLoading();
        success++;
        console.log("成功")
      },
      fail: (res) => {
        fail++;
        console.log('fail:' + i + "fail:" + fail);
      },
      complete: () => {
        i++;
        if (i == data.imgList.length) { //当图片传完时，停止调用 
          console.log('执行完毕');
          console.log('成功：' + success + " 失败：" + fail);
          setTimeout(function () {
            wx.showModal({
              title: '上传信息',
              content: '成功：' + success + " 失败：" + fail,
              showCancel: false,
            })
          }, 1000)

          setTimeout(function (){
            that.flashPage()
          }, 2000)

        } else { //若图片还没有传完，则继续调用函数
          data.i = i;
          data.success = success;
          data.fail = fail;
          that.uploadimg(data);//递归，回调自己
        }
      }
    });
  },

  /**
   * 选择图片
   */
  ChooseImage() {
    wx.chooseImage({
      count: 4, //默认9
      sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], //从相册选择 ['album', 'camera'] 
      
      success: (res) => {
        if (this.data.imgList.length != 0) {
          this.setData({
            imgList: this.data.imgList.concat(res.tempFilePaths)
          })
        } else {
          this.setData({
            imgList: res.tempFilePaths
          })
        }
      }
    });
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },
  DelImg(e) {
    wx.showModal({
      title: '靓仔',
      content: '确定要删除这图片吗？',
      cancelText: '再看看',
      confirmText: '删除',
      success: res => {
        if (res.confirm) {
          this.data.imgList.splice(e.currentTarget.dataset.index, 1);
          this.setData({
            imgList: this.data.imgList
          })
        }
      }
    })
  },
  // 复制图片
  CopyLink(e) {
    var that = this
    console.log(that.data.md_links)
    wx.setClipboardData({
      data:that.data.md_links + e.currentTarget.dataset.mdurl,
      success: res => {
        that.setData({
          md_links:that.data.md_links + e.currentTarget.dataset.mdurl,
          md_links_count:that.data.md_links_count + 1
        })
        wx.showToast({
          title: '已复制'+that.data.md_links_count +"张",
          duration: 1000,
        })
      }
    })
    console.log(that.data.md_links)
  },

  // 删除图片操作
  deletePhoto(e){
    var that = this
    console.log(e.currentTarget.dataset.url)
    wx.showModal({
      title: '靓仔',
      content: '是否确定删除此图片',
      success (res) {
        if (res.confirm) {
          that.deletePhotoMethods(e)
          
          setTimeout(function () {
            that.onLoad()
          }, 1000)

        }
      }
    })

  },

  deletePhotoMethods: function (e){
    wx.request({
      url: Api.deleteFile() + app.globalData.token,
        data: {
            url: e.currentTarget.dataset.url,
        },
        header: {
            'content-type': 'application/json'
        },
        method: 'DELETE',
        success(res) {
          console.log(res)
            if (res.data.code == "200") {
                wx.showToast({
                    title: '删除成功',
                })
            }else if(res.data.code == "4444"){
              wx.showToast({
                title: '请求过快',
                icon: 'none',
                duration:3000
              })    
            }else {
                wx.showToast({
                    title: '删除失败',
                    icon: 'none',
                    duration:3000
                })
            }
        }
    })
  },
})