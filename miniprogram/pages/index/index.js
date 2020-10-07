//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    userInfo: {},
    iciba: "", //每日一句英语
    windowHeight: 0,
    windowWidth: 0,
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onShareAppMessage: function (e) {},

  onLoad: function (options) {
    //
    var res = wx.getSystemInfoSync()
    //can not use this.data.height to set score_height
    this.data.windowHeight = res.windowHeight
    this.data.windowWidth = res.windowWidth
    this.setData(this.data)

    var that = this

    //获取每日一句正能量名言
    wx.cloud.callFunction({
      name: 'iciba',
      data: {},
      success: res => {
        var obj = JSON.parse(res.result)
        that.data.iciba = obj.note
        //console.log('[iciba]', that.data.iciba)
        that.setData(that.data)
      },
      fail: err => {
        console.error('[iciba] failed!', err)
      }
    })

    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      that.setData({
        userInfo: userInfo
      })
    })

    if (options._id != null && options._id != undefined) {
      this.data._id = options._id
    } else {}

    if (options._openid != null && options._openid != undefined) {
      this.data._openid = options._openid
      this.data.isOwner = (getApp().globalData.openid == this.data._openid);
    } else {
      this.data.isOwner = true
    }

    this.setData(this.data)
  },

  onShow: function () {
  },

  stopPageScroll: function () {
    return
  },

  onUnload: function() {
  }
})