var Api = require('../../../utils/api.js');
var startX, endX;
var moveFlag = true;// 判断执行滑动事件
const app = getApp();
Page({
  data: {
    showNot:false,
    index: 0,
    cardsData : [],
    
    all_box_id:null,
    order:'',
    page:1,
    limit:15,

    checkbox: [{
      box_id:null,
      box_name:null,
      checked:false
    }],
    orderType:[
      {value:"random",name:"随机排序", checked: 'true'},
      {value:"up",name:"升序排序"},
      {value:"down",name:"降序排序"}
    ]
  },

  /**
   * 多选框
   */
  showModal(e) {
    this.setData({
      modalName: e.currentTarget.dataset.target
    })
  },
  hideModal(e) {
    this.setData({
      modalName: null
    })
  },
  ChooseCheckbox(e) {
    let items = this.data.checkbox;
    let box_id = e.currentTarget.dataset.box_id;
    console.log(box_id,items)
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      if (items[i].box_id == box_id) {
        items[i].checked = !items[i].checked;
        break
      }
    }
    console.log(box_id,items)
    this.setData({
      checkbox: items
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
   * 监听加载数据
   */
  onLoad: function(options) {


    /**
     * 获取用户的token 回调函数
     */
    var that = this;
    app.getUserToken(function(token) {
      //更新数据
      console.log("更新数据app.globalData.token " + app.globalData.token)
      console.log("options",options)
      // 加载盒子
      that.onLoadData()
  
      if(that.data.cardsData.length <1){
        console.log("this.data.cardsData.length",that.data.cardsData.length)
        var boxes_id = "all"
        var order = "random"
        that.getCArdsMethods(boxes_id,order)
      }else{
        var all_box_id =  that.data.all_box_id
        var order = that.data.order
        that.getCArdsMethods(all_box_id,order)
      }
    })

    // 修改回调函数前 
    // console.log("xxxx",options)
    // // 加载盒子
    // this.onLoadData()

    // if(this.data.cardsData.length <1){
    //   console.log("this.data.cardsData.length",this.data.cardsData.length)
    //   var boxes_id = "all"
    //   var order = "up"
    //   this.getCArdsMethods(boxes_id,order)
    // }else{
    //   var all_box_id =  this.data.all_box_id
    //   var order = this.data.order
    //   this.getCArdsMethods(all_box_id,order)
    // }

  },

  /**
   * 获取卡片的数据
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
          var checkbox = []
          let items = res.data.data;
          for (let i = 0, lenI = items.length; i < lenI; ++i) {
              checkbox.push({
                box_id:items[i].box_id,
                box_name:items[i].box_name,
                checked:true
              })
          }
          that.setData({
            checkbox: checkbox
          })
        },
        fail: function() {},
        complete: function() {}
      })
  },

  /**
   * 获取卡片第一页数据
   */
  getCArdsMethods:function(all_box_id,order){
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
              all_box_id:all_box_id,
              order:order,
              page:2,
              index: 0,
            })
          }else{
            wx.showModal({
              title: '当前没有卡片',
              content: '快去添加你的第一张卡吧~',
              showCancel: false,
            })
            setTimeout(function () {
              wx.reLaunch({
                url: '/pages/box/getBoxes/index',
              })
            }, 1500)
          }
        }else{
          wx.showModal({
            title: '当前没有卡集',
            content: '快去添加你的第一个卡集吧~',
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
   * 更新卡的新选择方式
   */
  updateNewSelectCards: function() {
    var that = this;

    // 退出点击页面
    that.setData({
      modalName: null
    })

    var box_id = []
    let items = that.data.checkbox;
    for (let i = 0, lenI = items.length; i < lenI; ++i) {
      if(items[i].checked){
        box_id.push(items[i].box_id)
      }
    }
    var orderItem = that.data.orderType
    var order_type = "random"
    for (let i = 0, lenI = orderItem.length; i < lenI; ++i) {
      if(orderItem[i].checked){
        order_type = orderItem[i].value
      }
    }
    console.log(box_id,order_type)
    wx.showToast({
      title: '正在更新数据',
      icon: 'loading'
    });
    this.getCArdsMethods(box_id,order_type)
  },

  /**
   * 下一页的请求方法
   */
  nextCard:function(){
    var that = this
    wx.request({
      url: Api.getCards() + app.globalData.token,
      data: {
        all_box_id: that.data.all_box_id,
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
            that.next()

          }else{
            that.setData({
              page:0,
              index:-1
            })
            console.log("调用函数")
            that.next()
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
    this.setData({
      showNot: false
    })
    var that = this;

    console.log('当前数据是'+that.data.cardsData)

    if(that.data.index < that.data.cardsData.length -1){
      console.log('直接使用index'+ (that.data.index + 1) )
      that.setData({
        index:that.data.index + 1
      })
    }else{
      // 获取下一页分页的数据
      console.log(that.data.page + 1)
      console.log("最后一页 调用函数增加")
      this.nextCard()
    }
  },

  /**
   * 上一页
   */
  last: function() {
    this.setData({
      showNot: false
    })
    var that = this;
    if(that.data.index > 0){
      console.log('直接使用前一个index'+ (that.data.index - 1) )
      that.setData({
        index:that.data.index - 1
      })


    }else{
      // 获取最后一页的数据 index 指向 length

      that.setData({
        index:that.data.cardsData.length
      })
      that.last()

    }
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
        var status = 'understand'
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


  //长按事件
  mylongtap: function(e){
      console.log(e.timeStamp + '- long tap')
      console.log('编辑卡片')

      var card_data = this.data.cardsData[this.data.index]

      wx.setStorage({
 
        key:"mod_card",
        
        data:card_data
        
       })

      wx.navigateTo({
        url: '../modCard/index?card_id=' + card_data.card_id +'&box_id'+card_data.box_id
      })
  },

  /**
   * 滑动
   */
  touchStart: function (e) {
    startX = e.touches[0].pageX; // 获取触摸时的原点
    console.log('开始')
    moveFlag = true;
  },
  
  // 触摸移动事件
  touchMove: function (e) {
    endX = e.touches[0].pageX; // 获取触摸时的原点
    if (moveFlag) {
      if (endX - startX > 50) {
        console.log("move right");
        this.last()
        moveFlag = false;
        
      }
      if (startX - endX > 50) {
        console.log("move left");
        // this.move2left();

        this.next();
        moveFlag = false;
      }
    }

  },
  // 触摸结束事件
  touchEnd: function (e) {
    moveFlag = true; // 回复滑动事件
    console.log('结束')
  },

  /**
   * 下拉刷新事件, 数据同步
   */
  onPullDownRefresh: function () {
    wx.showToast({
      title: '正在同步数据',
      icon: 'loading'
    });
    this.onLoad()
    wx.stopPullDownRefresh()
  },

})