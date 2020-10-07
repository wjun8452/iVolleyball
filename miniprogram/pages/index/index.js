//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    userInfo: {},
    iciba: "", //每日一句英语
    marqueeDistance: -30, //初始滚动距离
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
        that.data.iciba = obj.content
        console.log('[iciba]', that.data.iciba)
        that.setData(that.data)

        //开始滚动显示金句
        var length = that.data.iciba.length * 14; //文字长度
        var windowWidth = wx.getSystemInfoSync().windowWidth; // 屏幕宽度
        that.setData({
          length: length,
          windowWidth: windowWidth
        });
        that.scrolltxt(); // 第一个字消失后立即从右边出现
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

  scrolltxt: function () {
    var that = this;
    var length = that.data.iciba.length * 7; //滚动文字的宽度
    var windowWidth = that.data.windowWidth; //屏幕宽度
    console.log(windowWidth)
    if (length > windowWidth) {
      var interval = setInterval(function () {
        var maxscrollwidth = length; //滚动的最大宽度，文字宽度+间距，如果需要一行文字滚完后再显示第二行可以修改marquee_margin值等于windowWidth即可
        var crentleft = that.data.marqueeDistance;
        //console.log(crentleft, maxscrollwidth)
        if (crentleft < maxscrollwidth) { //判断是否滚动到最大宽度
          that.setData({
            marqueeDistance: crentleft + 1
          })
        } else {
          //console.log("替换");
          that.setData({
            marqueeDistance: 0 // 直接重新滚动
          });
          clearInterval(interval);
          that.scrolltxt();
        }
      }, 60);
    } else {
      that.setData({
        marquee_margin: "1000"
      }); //只显示一条不滚动右边间距加大，防止重复显示
    }
  },


  stopPageScroll: function () {
    return
  },
})