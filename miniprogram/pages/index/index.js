//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    iciba: "", //每日一句名言
    windowHeight: 0,
    windowWidth: 0,
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
        console.log('[wx.cloud.iciba]', that.data.iciba)
        that.setData(that.data)
      },
      fail: err => {
        console.error('[wx.cloud.iciba] failed!', err)
      }
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