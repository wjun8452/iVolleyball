//app.js
var qqMap = require('./utils/qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js')

App({
  onLaunch: function () {
    //初始化云
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true
      })

      //获取openid
      this.fetchOpenId()

      this.initLocation()
      
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      wx.showToast({
        title: '云初始化失败，可能您的微信基础库版本太低哦',
      })
    }
  },

  fetchOpenId: function () {
    var that = this
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        that.globalData.openid = res.result.openid
        console.log('[wx.cloud.login] openid:', that.globalData.openid)
      },
      fail: err => {
        console.error('[wx.cloud.login] failed!', err)
      }
    })
  },

  //getUserInfo is currently not used, but kept here for further reference
  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
      console.log("userInfo", this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function (res) {
          console.log("[wx.login] code:", res.code)
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
              console.log('[wx.getUserInfo]', that.globalData.userInfo)
            },
            fail: function(res) {
              console.error("[wx.getUserInfo]", res)
            }
          })
        },
        fail: function(res) {
          console.error([wx.login], res)
        },
      })
    }
  },

  initLocation: function () {
    var qqmap = new qqMap({
      key: '6MWBZ-XDZL6-FPOSU-MKDSZ-DANKF-EOBRN' // 必填
    });

    var that = this

    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        that.globalData.lat = res.latitude
        that.globalData.lon = res.longitude
        console.log("[wx.getLocation]", that.globalData.lat, that.globalData.lon)
        qqmap.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (res) {
            console.log('[qqMap.RGC]', res.result.address);
            that.globalData.place = res.result.formatted_addresses.recommend
            that.globalData.city = res.result.address_component.city
          },
          fail: function (res) {
            console.error('[qqMap.RGC] failed!', res);
          },
          complete: function (res) {
            //console.log(res);
          }
        });
      }
    })
  },

  globalData:{
    openid:null,
    userInfo:null,
    cacheKey: "stats17",
    lat: 0,
    lon: 0,
    place: '',
    city: '',
    env: 'ilovevolleyball-d1813b' //,test-705bde
  }
})