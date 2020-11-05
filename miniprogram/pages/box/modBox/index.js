var Api = require('../../../utils/api.js');
const app = getApp() 
Page({
  data: {
    box_id:'' ,
    color:'',
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('onLoad函数开始执行' ,options)
    var that = this
      console.log("现在是初始化前的box_id" + options.box_id ,options.box_color)
      that.setData({
        box_id: options.box_id,
        color:options.box_color
      })
    
      wx.getStorage({
        key: 'mod_box',
        success: function(res) {
          console.log(res.data)
          that.setData({
            box_id:res.data.box_id,
            box_color:res.data.box_color,
            box_name:res.data.box_name,
            password:res.data.password,
            create_time:res.data.create_time,
        });
        }
    })  
  },



  /**
   * 获取用户的点击的颜色
   */
  getColor:function(e){
    console.log(e.currentTarget.dataset.color)
    this.setData({
        color:e.currentTarget.dataset.color
    })
  },

  /**
   * 提交表单
   */
  formSubmit(e) { 
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
        title: '需要填写卡集的访问密码',
        icon: 'none'
      })
      return 0;
    }{

      this.setData({
        password:password,
        box_name:name
      })
      this.changeBoxMessage()
  }
  },

  /**
   * 修改盒子名称和密码方法
   */
  changeBoxMessage:function(){
    console.log('修改盒子名称和密码')
    wx.request({
      url: Api.modBox() + app.globalData.token,
      data: {
        "box_id":this.data.box_id,
        "password":this.data.password,
        "color":this.data.color,
        "box_name":this.data.box_name
      },
        header: {
            'content-type': 'application/json'
        },
        method: 'PUT',
        
        success(res) {

          console.log(res.data)
          if (res.data.code == "200") {
            wx.showModal({
              title: '修改成功',
              content: res.data.msg,
              showCancel: false,
            })
            setTimeout(function () {
              wx.switchTab({
                url: '/pages/box/getBoxes/index',
              })
            }, 1500)


          } else {
            wx.showModal({
              title: '修改失败！！',
              content: res.data.msg,
              showCancel: false,
            })

          }
        }
    })    
  },

    /**
     * 删除盒子
     */
    onDelete: function(event) {
      var that = this;
      wx.showModal({  
        title: '删除卡集操作',
        content: '确定删除该卡集吗',
        success(res){
          if(res.confirm){
            wx.request({
              url: Api.deleteBox() + app.globalData.token,
              data: {
                "box_id":that.data.box_id
              },
                header: {
                    'content-type': 'application/json'
                },
                method: 'DELETE',
                
                success(res) {
      
                  console.log(res.data)
                  if (res.data.code == "200") {
                    console.log(res.data)
                    wx.showModal({
                      title: '删除成功！！',
                      content: res.data.msg,
                      showCancel: false,
                    })
      
                    setTimeout(function () {
                      wx.navigateBack({
                        delta: 1
                      })
                    }, 1000)
                  } else {
                    wx.showModal({
                      title: '删除失败！！',
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