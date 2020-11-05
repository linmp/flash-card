var Api = require('../../../utils/api.js');
var startX, endX;
var moveFlag = true;// 判断执行滑动事件
const app = getApp();
Page({
  data: {
    showNot:false,
    cardsData : [],
    index: 0,

    all_box_id:null,
    order:'down',
    page:1,
    limit:5,

    card_status:null,
    doubleTabStatus:null
  },
  /**
   * 监听
   */
  onLoad: function(options) {
    console.log(options)
    var card_status = options.card_status
    var doubleTabStatus = options.doubleTabStatus
    this.setData({
      card_status:card_status,
      doubleTabStatus:doubleTabStatus
    })
    var all_box_id = 'all'
    var order = 'error_times'
    this.getCardsMethods(all_box_id,card_status,order)
  },

  /**
   * 改变卡的状态方法
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
                status = "操作"
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


  /**
   * 获取卡片的请求方法
   */
  getCardsMethods:function(all_box_id,card_status,order){
    var that = this;
    wx.request({
      url: Api.getCards() + app.globalData.token,
      data: {
        all_box_id: all_box_id,
        card_status: card_status,
        order: order,
        page: that.data.page,
        limit: that.data.limit
      },
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function(res) {
        console.log(res.data.data.length>=1)
        console.log('请求成功')
        if(res.data.data.length>=1){
          that.setData({
            cardsData:that.data.cardsData.concat(res.data.data) ,
            page:that.data.page + 1,
            all_box_id:all_box_id,

          })
        }else{
          wx.showModal({
            title: '当前没有卡片',
            content: '快去添加你的新卡片吧~',
            showCancel: false,
          })
          setTimeout(function () {
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        }

      },
    })
    
  },


  /**
   * 设置卡片背面的展示与否
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
        all_box_id: that.data.all_box_id,
        card_status: that.data.card_status,
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



   // 单击双击
  mytap: function(e){
    var curTime = e.timeStamp;
    var lastTime = this.data.lastTabDiffTime;
    if(lastTime > 0){
      if(curTime - lastTime < 300){
        console.log(e.timeStamp + '双击')
        console.log(this.data.cardsData[this.data.index].box_id)

        var box_id = this.data.cardsData[this.data.index].box_id
        var card_id = this.data.cardsData[this.data.index].card_id
        var doubleTabStatus = this.data.doubleTabStatus

        console.log(box_id,card_id,doubleTabStatus)
        this.markCardStatus(box_id,card_id,doubleTabStatus);

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