let app = getApp();

Page({
  data: {
    iciba: "", //每日一句名言
    globalData: app.globalData,
  },

  onShareAppMessage: function (e) {},

  onLoad: function (options) {
    var that = this

    //获取每日一句正能量名言
    wx.cloud.callFunction({
      name: 'iciba',
      data: {},
      success: res => {
        var obj = JSON.parse(res.result as string)
        that.data.iciba = obj.note
        console.log('[wx.cloud.iciba]', obj)
        that.setData(that.data)
      },
      fail: err => {
        console.error('[wx.cloud.iciba] failed!', err)
      }
    })
    this.setData(this.data)
  },

  onShow: function () {
  },

  stopPageScroll: function () {
    return
  },

  onUnload: function() {
  },

  onMenu: function(res:any) {
    console.log("[onMenu]", res);
    wx.navigateTo({
      url: res.target.dataset.url,
    })
  }
})