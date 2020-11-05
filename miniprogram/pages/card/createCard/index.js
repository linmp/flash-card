var Api = require('../../../utils/api.js');
const app = getApp() 

Page({
  data: {
      formats: {},
      readOnly: false,
      placeholder: '在此输入你想记忆的内容...',
      editorHeight: 100,
      keyboardHeight: 0,
      isIOS: false,

      isHtml:true,
      question:"",
      answer:"",
      color:"white",
      box_id:null,
      md : '',
  
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
      ],
      orderType:[
        {value:"random",name:"随机排序"},
        {value:"up",name:"升序排序"},
        {value:"down",name:"降序排序", checked: 'true'}
      ]

  },

  /**
   * 页面首次加载事件
   */
  onLoad: function(options) {

    //deitor编辑器的设置 
    const platform = wx.getSystemInfoSync().platform
    const isIOS = platform === 'ios'
    this.setData({ isIOS})
    const that = this
    this.updatePosition(0)
    let keyboardHeight = 0
    wx.onKeyboardHeightChange(res => {
      if (res.height === keyboardHeight) return
      const duration = res.height > 0 ? res.duration * 1000 : 0
      keyboardHeight = res.height
      setTimeout(() => {
        wx.pageScrollTo({
          scrollTop: 0,
          success() {
            that.updatePosition(keyboardHeight)
            that.editorCtx.scrollIntoView()
          }
        })
      }, duration)

    })

    // 初始化盒子的id
    var box_id = options.box_id;
    console.log(options)
    that.setData({
        box_id: box_id
    });
  },


  readOnlyChange() {
      this.setData({
        readOnly: !this.data.readOnly
      })
    },
    
  updatePosition(keyboardHeight) {
    const toolbarHeight = 50
    const { windowHeight, platform } = wx.getSystemInfoSync()
    let editorHeight = keyboardHeight > 0 ? (windowHeight - keyboardHeight - toolbarHeight) : windowHeight
    this.setData({ editorHeight, keyboardHeight })
  },
  calNavigationBarAndStatusBar() {
    const systemInfo = wx.getSystemInfoSync()
    const { statusBarHeight, platform } = systemInfo
    const isIOS = platform === 'ios'
    const navigationBarHeight = isIOS ? 44 : 48
    return statusBarHeight + navigationBarHeight
  },
  onEditorReady() {
    const that = this
    wx.createSelectorQuery().select('#editor').context(function (res) {
      that.editorCtx = res.context
    }).exec()
  },
  blur() {
    this.editorCtx.blur()
  },
  format(e) {
    let { name, value } = e.target.dataset
    if (!name) return
    // console.log('format', name, value)
    this.editorCtx.format(name, value)

  },
  onStatusChange(e) {
    const formats = e.detail
    this.setData({ formats })
  },
  insertDivider() {
    this.editorCtx.insertDivider({
      success: function () {
        console.log('insert divider success')
      }
    })
  },
  clear() {
    this.editorCtx.clear({
      success: function (res) {
        console.log("clear success")
      }
    })
  },
  removeFormat() {
    this.editorCtx.removeFormat()
  },
  insertDate() {
    const date = new Date()
    const formatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    this.editorCtx.insertText({
      text: formatDate
    })
  },



      
  /**
   * 页面渲染事件
   */
  onShow: function() {
  },

  /** 
   * 跳转选择图片页面
   */
  getPhoto:function(){
      wx.navigateTo({
          url: '/pages/photo/index',
        })
  },
  /** 
   * 获取选择的颜色
   */
  getColor:function(e){
      
    console.log(e.currentTarget.dataset.color)
    this.setData({
        color:e.currentTarget.dataset.color
    })
  },


  /**
   * 保存数据事件
   */
  onSubmit: function(event) {
      
      var question = event.detail.value.question;

          // 获取富文本值
    var that = this;
    this.editorCtx.getContents({
      success: function(res) {
        console.log(res.delta,"delta对象")
        console.log(res.text)
        console.log(res.html)
        that.setData({
          md:res.text,
          answer:res.text,
          answer_html:res.html,
          delta:res.delta
        })
      }
    })
      var answer = this.data.answer
      console.log(question,"需要填写问题")
      console.log(answer,"需要填写answer")
      if (question == "") {
          wx.showToast({
              title: '需要填写问题',
              icon:'none'
          })
          return 0;
      }
      if (answer == "") {
          wx.showToast({
              title: '需要填写answer',
              icon:'none'
          })
          return 0;
      }
      this.setData({
          question: question,
          answer:answer
      });
      this.create()
  },

  /**
   * 创建卡片请求方法
   */
  create: function () {
  var that = this;
      wx.request({
      url: Api.createCard() + app.globalData.token,
      data: {
          "question":that.data.question,
          "answer":that.data.answer,
          "answer_html":that.data.answer_html,
          "delta":that.data.delta,
          "box_id":that.data.box_id,
          "color":that.data.color
      },
      method: 'POST',
      header: {
          'content-type': 'application/json',
      },
      success: function(res) {
          if(res.data.code=='200'){
              wx.showModal({
                  title: '创建成功',
                  content: res.data.msg,
                  showCancel: false,
                })
                setTimeout(function () {
                  wx.navigateBack({
                    delta: 1
                  })
                }, 1000)                
          }else{
              wx.showModal({
                  title: '创建失败',
                  content: res.data.msg,
                  showCancel: false,
                })
          }
          
          console.log(res.data.card_question)
          console.log(res.data.msg)
      },
      fail: function() {},
      complete: function() {}
      })
  },


  /**
   * 设置自动增高
   */
  bindTextAreaBlur: function(e) {

    // 获取富文本值
    var that = this;
    this.editorCtx.getContents({
      success: function(res) {
        console.log(res)
        console.log(res.text)
        console.log(res.html)
        that.setData({
          md:res.text,
          answer:res.text,
          answer_html:res.html,
          delta:res.delta,
        })
      }
    })
    },

  /**
   * 获取标题事件
   */
  getTitle:function(e){
      console.log(e.detail.value)
      this.setData({
          question:e.detail.value
      });
      }

});
