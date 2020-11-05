const app = getApp();
var Api = require('../../../utils/api.js');
var startX, endX;
var moveFlag = true;// 判断执行滑动事件
Page({
  data: {
    showNot:false,
    index: 0,
    cardsData : [],
    color:'green',
    box_id:[],
    page:1,
    limit:10,
    order : "down",
    md:'',
    bindCardId:'',
    orderType:[
      {value:"random",name:"随机排序"},
      {value:"up",name:"升序排序"},
      {value:"down",name:"降序排序", checked: 'true'}
    ]
  },


  /**
   * 监听加载数据
   */
  onLoad: function(options) {
    console.log("第一次加载")
    console.log(options)
    var box_id = options.box_id;
    var box_password = options.box_password;
    var color = options.box_color;
    var box_name = options.box_name;
    console.log('提取的数据',box_id,color,box_name,box_password)
    this.setData({
      box_id: box_id,
      box_password: box_password,
      color:color,
      box_name:box_name
    })
    console.log("存储的数据",this.data.box_id)
  },

  /**
   * 加载页面数据
   */
  onShow:function(){
    var that = this;
    console.log(that.data.box_id)
    console.log("长度",that.data)
    if(that.data.box_id.length > 0){
      console.log("有盒子id")
      this.getCArdsMethods(that.data.box_id,that.data.order)
    }
  },
  // 选择单选框事件
  showModal(e) {
    this.setData({
      modalName: e.currentTarget.dataset.target
    })
  },
  
  /**
   * 单选框
   */
  radioChange(e) {
    console.log(e)
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    console.log(e)
    const items = this.data.orderType
    for (let i = 0, len = items.length; i < len; ++i) {
      items[i].checked = items[i].value === e.detail.value
    }
    this.setData({
      orderType:items
    })
  },
    /**
   * 更新卡的排序方式
   */
  updateNewOrderCards: function() {
    var that = this;

    // 退出点击页面
    that.setData({
      modalName: null
    })

    var orderItem = that.data.orderType
    var order_type =  that.data.order
    for (let i = 0, lenI = orderItem.length; i < lenI; ++i) {
      if(orderItem[i].checked){
        order_type = orderItem[i].value
        that.setData({
          order: order_type
        })
      }
    }
    wx.showToast({
      title: '正在更新数据',
      icon: 'loading'
    });
    this.onShow()
  },


  /** 
   * 打开选择图片页面
   */
  toCreateCard:function(){
    wx.navigateTo({
        url: '/pages/card/createCard/index?box_id=' + this.data.box_id,
      })
  },

  /**
   * 编辑卡片事件
   */
  onEditItem: function (event) {
    console.log(event.currentTarget.dataset)
    console.log('编辑卡片')
    var card_data = ''
    for (let i = 0, lenI = this.data.cardsData.length; i < lenI; ++i) {
      if(this.data.cardsData[i].card_id == event.currentTarget.dataset.card_id){
        card_data = this.data.cardsData[i]
        break
      }
    }

    wx.setStorage({

      key:"mod_card",
      
      data:card_data
      
     })

    wx.navigateTo({
      url: '/pages/card/modCard/index?card_id=' + card_data.card_id +'&box_id'+card_data.box_id
    })
  },

  // 点击卡片查看信息
  onShowCardAnswer:function(event){

    // 更新点击事件
    this.show();
    
    console.log(event.currentTarget.dataset)
    console.log('查看背面')
    var card_data = ''
    for (let i = 0, lenI = this.data.cardsData.length; i < lenI; ++i) {
      if(this.data.cardsData[i].card_id == event.currentTarget.dataset.card_id){
        card_data = this.data.cardsData[i]
        break
      }
    }
    if(this.data.bindCardId==card_data.card_id){
      this.setData({
        md:card_data.answer,
        bindCardId:''
      })
    }else{
      this.setData({
        md:card_data.answer,
        bindCardId:card_data.card_id
      })
    }

  },


  /**
   * 获取卡片第一页数据
   */
  getCArdsMethods:function(all_box_id,order){
    console.log("请求的盒子是"+all_box_id)

    var that = this;
    wx.request({
      url: Api.getCards() + app.globalData.token,
      data: {
        all_box_id: all_box_id,
        card_status: "all",
        order: order,
        page: 1,
        limit: that.data.limit
      },
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function(res) {
        if(res.data.code == "200"){
          if(res.data.data.length>=1){
            console.log(res.data.data)
            that.setData({
              cardsData:res.data.data ,
              box_id:all_box_id,
              order:order,
              page:2,
              index: 0,
            })
          }else{
            wx.showModal({
              title: '当前没有卡片',
              content: '快去添加你的第一张卡吧~',
              success(res){
                if(res.confirm){
                  setTimeout(function () {
                    wx.navigateTo({
                      url: '/pages/card/createCard/index?box_id=' + all_box_id
                    })
                  }, 500)
                }else{
                  setTimeout(function () {
                    wx.reLaunch({
                      url: '/pages/box/getBoxes/index',
                    })
                  }, 500)
                }
            }
          })
          }
        }else{
          wx.showModal({
            title: '请求失败',
            content: '快去添加你的卡集与卡片数据吧~',
            showCancel: false,
          })
          setTimeout(function () {
            wx.reLaunch({
              url: '/pages/box/getBoxes/index',
            })
          }, 1500)
        }
        }
    })
    
  },

  /**
   * 展示卡片正反面数据
   */
  show: function() {
    var that = this;
    console.log(!that.data.showNot);
    this.setData({
      showNot: !that.data.showNot
    })
  },

  /**
   * 下一页的请求方法
   */
  nextCard:function(){
    var that = this
    wx.request({
      url: Api.getCards() + app.globalData.token,
      data: {
        all_box_id: that.data.box_id,
        card_status: "all",
        order: that.data.order,
        page: that.data.page,
        limit: that.data.limit
      },
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function(res) {
        if(res.data.code =='200'){
          console.log(res.data.code)

          if(res.data.data.length>0){
            that.setData({
              cardsData:that.data.cardsData.concat(res.data.data),
              page:that.data.page + 1
            })
            // that.next()

          }else{
            console.log("没有函数了")
          }
        }else{
          console.log('请求失败000')
        }
      },
    })
  },

  /**
   * 下一页
   */
  next: function() {
    var that = this;
    console.log('当前卡集数据是'+that.data.box_id)
    this.nextCard()
    
  },


  /**
   * 双击卡片的方法
   */
  markCardStatus:function(box_id,card_id,status){
    var that = this
    wx.request({
      url: Api.markCardStatus() + app.globalData.token,
        data: {
          box_id: box_id,
          card_id: card_id,
          status: status
        },
        header: {
            'content-type': 'application/json'
        },
        method: 'PUT',
        success(res) {
          console.log(res)
            if (res.data.code == "200") {
              if(status == "un_understand"){
                status = "取消掌握"
              }else if(status == "understand"){
                status = "掌握"
              }else if(status == "un_collect"){
                status = "取消收藏"
              }else{
                status = "收藏"
              }
              console.log(status)
                wx.showToast({
                    title: status + '成功',
                })
            }else if(res.data.code == "4444"){
              wx.showToast({
                title: '请求过快',
                icon: 'none',
                duration:3000
              })    
            }else {
                wx.showToast({
                    title: '更新失败',
                    icon: 'none',
                    duration:3000
                })
            }
        }
    })
  },


   // 单击双击
  mytap: function(e){
    var curTime = e.timeStamp;
    var lastTime = this.data.lastTabDiffTime;
    if(lastTime > 0){
      if(curTime - lastTime < 300){
        console.log(e.timeStamp + '双击')

        var box_id = this.data.cardsData[this.data.index].box_id
        var card_id = this.data.cardsData[this.data.index].card_id
        var status = 'collect'
        this.markCardStatus(box_id,card_id,status);

      }else{
        this.show();
      }
    }else{
      this.show();
    }
    this.setData({
      lastTabDiffTime:curTime
    });
  },

  /**
   * 下拉刷新事件, 数据同步
   */
  onPullDownRefresh: function () {
    wx.showToast({
      title: '正在同步数据',
      icon: 'loading'
    });
    this.onShow()
    wx.stopPullDownRefresh()

  },

    //上滑
    onReachBottom: function() {
    this.next()
  },


    /**
   * 分享网页
   */
  onShareAppMessage: function () {
    var data = this.data
    return {
      title: '记忆手卡',
      desc: '让你记住每一个知识点',
      path: '/pages/box/cardsList/index?box_id=' + data.box_id +'&box_color=' + data.color + "&box_name=" + data.box_name  + "&box_password=" + data.box_password
    }
 },

})