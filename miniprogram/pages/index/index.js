//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    userInfo: {}
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onShareAppMessage: function(e) {
  },

  onLoad: function (options) {
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    })

    if (options._id != null && options._id != undefined) {
      this.data._id = options._id
    } else {
    }

    if (options._openid != null && options._openid != undefined) {
      this.data._openid = options._openid
      this.data.isOwner = (getApp().globalData.openid == this.data._openid);
    } else {
      this.data.isOwner = true
    }

    this.setData(this.data)
  }
})
