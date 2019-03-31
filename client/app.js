//app.js
var qqMap = require('./utils/qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js')

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true
      })

      // 获取用户信息
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              success: res => {
                this.globalData.userInfo = res.userInfo
                console.log('[getUserInfo]', res.userInfo)
              },
              fail: console.error('[getUserInfo] failed!')
            })
          }
        }
      })

      this.initLocation()

      this.fetchOpenId()
    }
  },

  fetchOpenId: function () {
    var that = this
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[login]', res)
        that.globalData.openid = res.result.openid
      },
      fail: err => {
        console.error('[login] failed!', err)
      }
    })
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
            console.log('[getLocation]', res);
            that.globalData.place = res.result.formatted_addresses.recommend
            that.globalData.city = res.result.address_component.city
          },
          fail: function (res) {
            console.error('[getLocation] failed!', res);
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
    openid: "",
    userInfo:null,
    cacheKey: "stats15",
    lat:0,
    lon:0,
    place:'',
    city:''
  }
})