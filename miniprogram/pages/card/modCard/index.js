var Api = require('../../../utils/api.js');
const app = getApp();
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
      delta:'',
      box_id:null,
      card_id:'',
      color:'green',
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
          color: '#ffffff'
        },
      ]
  },

  /**
   * 页面首次加载事件
   */
  onLoad: function(options) {


    wx.getStorage({
      key: 'mod_card',
      success: function(res) {
        console.log(res.data,"加载要更改数据")

        that.setData({
          card_id:res.data.card_id,
          question:res.data.question,
          answer:res.data.answer,
          delta:JSON.parse(res.data.delta),
          color:res.data.card_color,
          box_id:res.data.box_id,
          md:res.data.answer
      });
      }
  })


    //editor的初始化
    const platform = wx.getSystemInfoSync().platform
    const isIOS = platform === 'ios'
    this.setData({ isIOS})
    const that = this
    this.updatePosition(0)
    let keyboardHeight = 0
    wx.onKeyboardHeightChange(res => {
      console.log("onKeyboardHeightChange")
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
  },


  // 获取颜色
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
      // var answer = event.detail.value.answer;

      var that = this;
      this.editorCtx.getContents({
        success: function(res) {
          console.log(res)
          console.log(res.text,"值")
          console.log(res.html)
          that.setData({
            md:res.text,
            answer:res.text,
            answer_html:res.html
          })
        }
      })
      var answer = this.data.answer
      console.log(question,"wt")
      console.log(answer)
      if (question == "") {
          wx.showToast({
              title: '需要填写提示语',
              icon:'none'
          })
          return 0;
      }
      if (answer == "") {
          wx.showToast({
              title: '需要填写记忆的知识点',
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
     * 打开选择图片页面
     */
    getPhoto:function(){
        console.log("点击图片成功")
        wx.navigateTo({
            url: '/pages/photo/index',
          })
    },

    /**
     * 修改卡片
     */
    create: function () {
    var that = this;
        wx.request({
        url: Api.modCard() + app.globalData.token,
        data: {
            "question":that.data.question,
            "answer":that.data.answer,
            "answer_html":that.data.answer_html,
            "delta":that.data.delta,
            "box_id":that.data.box_id,
            "color":that.data.color,
            "card_id":that.data.card_id
        },
        method: 'PUT',
        header: {
            'content-type': 'application/json',
        },
        success: function(res) {
            if(res.data.code=='200'){
                wx.showModal({
                    title: '修改成功',
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
                    title: '修改失败',
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

    deleteCard:function(){
        var that = this
        wx.showModal({
            title: '提示',
            content: '确定删除吗',
            
            success: function (res) {
              if (res.confirm) {
                console.log('用户点击确定')
                var box_id = that.data.box_id;
                var card_id = that.data.card_id;
                that.deleteCardMethods(box_id,card_id)

              }
            }
          })     
    },

    deleteCardMethods:function(box_id,card_id){
        wx.request({
            url: Api.deleteCard() + app.globalData.token,
              data: {
                box_id: box_id,
                card_id:card_id
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
                    setTimeout(function () {
                        wx.navigateBack({
                          delta: 1
                        })
                      }, 1000)
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



    /**
     * 富文本编辑器配置
     */
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
      console.log("编辑器初始化")
      const that = this
      console.log(that.data.delta,"xxxxxx数据")
      wx.createSelectorQuery().select('#editor').context(function (res) {
        that.editorCtx = res.context;
        that.editorCtx.setContents({
          delta:that.data.delta
        })
      }).exec()
      
    },


    blur() {
      console.log("xxxxx？？？什么鬼收焦")
      this.editorCtx.blur({
        success:function(){
          console.log("xxx什么鬼")
        }
      })
      
    },
    format(e) {
      let { name, value } = e.target.dataset
      if (!name) return
      // console.log('format', name, value)
      this.editorCtx.format(name, value)
  
    },
    onStatusChange(e) {
      const formats = e.detail
      console.log("状态变更")
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

  /**
   * 获取富文本值
   */
  bindTextAreaBlur: function(e) {
    // console.log(e.detail.value)
    // this.setData({
    //     answer:e.detail.value
    // });

    // 获取富文本值
    var that = this;
    this.editorCtx.getContents({
      success: function(res) {
        console.log(res)
        console.log(res.html,"html")
        that.setData({
          md:res.text,
          answer:res.text,
          answer_html:res.html,
          delta:res.delta
        })
      }
    })
    },

  // 获取标题值
  getTitle:function(e){
      console.log(e.detail.value)
      this.setData({
          question:e.detail.value
      });
  }
});
