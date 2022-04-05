const qqMap = require('./utils/qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js')

import {LoginInfo} from './LoginInfo'
import {GlobalData} from './GlobalData'

let globalData:GlobalData = {
  openid: '',
  userInfo: null,
  cacheKey: "stats17",
  placeInfo: {
    place: "",
    latlon: {latitude:0, longitude:0},
    city: "",
  },
  env: 'ilovevolleyball-d1813b', //,test-705bde
  sysInfo: wx.getSystemInfoSync()
}


  /**
   * 云端获取当前登录用户的openid,并赋值给 @globalData
   * @param globalData 包含openid的全局数据
   * @return
   */
function fetchOpenId (globalData: GlobalData) {
  wx.cloud.callFunction({
    name: 'login',
    data: {},
    success: res => {
      //console.log(res)
      if (res.result) {
        globalData.openid = (res.result as LoginInfo).openid
      }
      console.log('[wx.cloud.login] openid:', globalData.openid)
    },
    fail: err => {
      console.error('[wx.cloud.login] failed!', err)
    }
  })
}

/**
 * 调用wx.getLocation获取用户位置并使用QQMap做RGC，并将经纬度和地址更新到全局数据
 * @param globalData 包含位置信息的全局数据
 */
function initLocation (globalData : GlobalData) {
  let qqmap = new qqMap({
    key: '6MWBZ-XDZL6-FPOSU-MKDSZ-DANKF-EOBRN' // 必填
  });

  wx.getLocation({
    type: 'gcj02',
    success: function (res) {
      globalData.placeInfo.latlon.latitude = res.latitude
      globalData.placeInfo.latlon.longitude = res.longitude
      console.log("[wx.getLocation]",res.latitude, res.longitude)
      qqmap.reverseGeocoder({
        location: {
          latitude: res.latitude,
          longitude: res.longitude
        },
        success: function (res: { result: { address: any; formatted_addresses: { recommend: string }; address_component: { city: string } } }) {
          console.log('[qqMap.RGC]', res.result.address);
          globalData.placeInfo.place = res.result.formatted_addresses.recommend
          globalData.placeInfo.city = res.result.address_component.city
        },
        fail: function (res: any) {
          console.error('[qqMap.RGC] failed!', res);
        },
        complete: function (res:any) {
          console.log(res);
        }
      });
    }
  })
}

App ({
  globalData: globalData,
  
  onLaunch () {
    if (wx.cloud) {
      wx.cloud.init({
        env: globalData.env,
        traceUser: true
      })

      fetchOpenId(globalData)

      initLocation(globalData)
      
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      wx.showToast({
        title: '云初始化失败，可能您的微信基础库版本太低哦',
      })
    }
    this.globalData = globalData;

    console.log("globalData:", globalData)

  }

  // //getUserInfo is currently not used, but kept here for further reference
  // getUserInfo:function(cb){
  //   let that = this
  //   if(globalData.userInfo){
  //     typeof cb == "function" && cb(globalData.userInfo)
  //     console.log("userInfo", globalData.userInfo)
  //   }else{
  //     //调用登录接口
  //     wx.login({
  //       success: function (res) {
  //         console.log("[wx.login] code:", res.code)
  //         wx.getUserInfo({
  //           success: function (res) {
  //             that.globalData.userInfo = res.userInfo
  //             typeof cb == "function" && cb(that.globalData.userInfo)
  //             console.log('[wx.getUserInfo]', that.globalData.userInfo)
  //           },
  //           fail: function(res) {
  //             console.error("[wx.getUserInfo]", res)
  //           }
  //         })
  //       },
  //       fail: function(res) {
  //         console.error([wx.login], res)
  //       },
  //     })
  //   }
  // },
})