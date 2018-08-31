//app.js
var qcloud = require('./vendor/wafer2-client-sdk/index')
var config = require('./config')
var util = require('./utils/util.js')
var qqMap = require('./utils/qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js')

App({
  onLaunch: function () {
    qcloud.setLoginUrl(config.service.loginUrl)
    this.login()
    this.initLocation()
  },

  login: function() {
      if (this.globalData.logged) return
      util.showBusy('正在登录')
      const session = qcloud.Session.get()
      const that = this
      if (session) {
        console.log("第二次登录")
        console.log("Navigated to " + config.service.loginUrl)
        // 第二次登录,或者本地已经有登录态,可使用本函数更新登录态
        qcloud.loginWithCode({
          success: res => {
            that.globalData.userInfo = res
            that.globalData.logged = true
            util.showSuccess('登录成功')
          },
          fail: err => {
            console.error(err)
            util.showModel('登录错误', err.message)
          }
        })
      } else {
        console.log("首次登录")
        console.log("Navigated to " + config.service.loginUrl)
        // 首次登录
        qcloud.login({
          success: res => {
            that.globalData.userInfo = res
            that.globalData.logged = true
            util.showSuccess('登录成功')
          },
          fail: err => {
            console.error(err)
            util.showModel('登录错误', err.message)
          }
        })
      }
    },

  initLocation: function () {
    var demo = new qqMap({
      key: '6MWBZ-XDZL6-FPOSU-MKDSZ-DANKF-EOBRN' // 必填
    });

    var that = this

    wx.getLocation({
      type: 'gcj02',
      success: function (res) {

        that.globalData.lat = res.latitude
        that.globalData.lon = res.longitude

        demo.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (res) {
            console.log(res);
            that.globalData.place = res.result.formatted_addresses.recommend
          },
          fail: function (res) {
            console.log(res);
          },
          complete: function (res) {
            //console.log(res);
          }
        });
      }
    })
  },

  globalData:{
    logged: false,
    userInfo:null,
    cacheKey: "stats15",
    lat:0,
    lon:0,
    place:''
  }
})