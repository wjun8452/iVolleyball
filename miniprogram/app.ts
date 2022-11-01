import { LoginInfo } from './bl/LoginInfo'
import { GlobalData } from './bl/GlobalData'
import touch from './utils/touch.js'

let globalData: GlobalData = {
  openid: '',
  cacheKey: "stats17",
  placeInfo: {
    place: "",
    latlon: { latitude: 0, longitude: 0 },
    city: "",
  },
  env: 'ilovevolleyball-d1813b', //,test-705bde
  sysInfo: wx.getSystemInfoSync()
}

App({
  globalData: globalData,
  touch: new touch(),

  getOpenId: function (callback: (openid: string, success: boolean) => void) {
    if (globalData.openid) {
      callback(globalData.openid, true)
    }
    else {
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          //console.log(res)
          if (res.result) {
            globalData.openid = (res.result as LoginInfo).openid;
            callback(globalData.openid, true)
            console.log('[wx.cloud.login] openid:', globalData.openid)
          } else {
            callback("null", false)
          }
        },
        fail: err => {
          callback("null", false)
          console.error('[wx.cloud.login] failed!', err)
        }
      })
    }
  },

  /**
 * 云端获取当前登录用户的openid,并赋值给 @globalData
 * @param globalData 包含openid的全局数据
 * @return
 */
  _fetchOpenId: function (globalData: GlobalData) {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        //console.log(res)
        if (res.result) {
          globalData.openid = (res.result as LoginInfo).openid;
          console.log('[wx.cloud.login] openid:', globalData.openid)
        }
      },
      fail: err => {
        console.error('[wx.cloud.login] failed!', err)
      }
    })
  },

  onLaunch: function () {
    if (wx.cloud) {
      wx.cloud.init({
        env: globalData.env,
        traceUser: true
      })

      this._fetchOpenId(globalData)

      // this.initLocation(globalData)

    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      wx.showToast({
        title: '云初始化失败，可能您的微信基础库版本太低哦',
      })
    }
    this.globalData = globalData;

    console.log("globalData:", globalData)

  },


  /**
   * 调用wx.getLocation获取用户位置并使用QQMap做RGC，并将经纬度和地址更新到全局数据
   * @param globalData 包含位置信息的全局数据
   */
  // initLocation: function (globalData: GlobalData) {
  //   let qqmap = new qqMap({
  //     key: '6MWBZ-XDZL6-FPOSU-MKDSZ-DANKF-EOBRN' // 必填
  //   });

  //   wx.getLocation({
  //     type: 'gcj02',
  //     success: function (res) {
  //       globalData.placeInfo.latlon.latitude = res.latitude
  //       globalData.placeInfo.latlon.longitude = res.longitude
  //       console.log("[wx.getLocation]", res.latitude, res.longitude)
  //       qqmap.reverseGeocoder({
  //         location: {
  //           latitude: res.latitude,
  //           longitude: res.longitude
  //         },
  //         success: function (res: { result: { address: any; formatted_addresses: { recommend: string }; address_component: { city: string } } }) {
  //           console.log('[qqMap.RGC]', res.result.address);
  //           globalData.placeInfo.place = res.result.formatted_addresses.recommend
  //           globalData.placeInfo.city = res.result.address_component.city
  //         },
  //         fail: function (res: any) {
  //           console.error('[qqMap.RGC] failed!', res);
  //         },
  //         complete: function (res: any) {
  //           console.log(res);
  //         }
  //       });
  //     }
  //   })
  // }
})