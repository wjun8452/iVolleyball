import { PlaceInfo } from "./PlaceInfo";

export interface GlobalData {
  /** 当前用户openid */
  openid:string,
  /** 当前用户的信息 */
  userInfo: WechatMiniprogram.UserInfo | null,
  /** 程序数据缓存的key或者版本号 */
  cacheKey: string,
  /** 用户所在位置信息 */
  placeInfo: PlaceInfo,
  /** 小程序云环境的名称 */
  env: string,
  /** 屏幕设备信息 */
  sysInfo: WechatMiniprogram.SystemInfo,
}