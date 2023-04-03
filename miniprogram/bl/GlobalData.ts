import { PlaceInfo } from "./PlaceInfo";
import { VUser } from "./TeamRepo";

export interface GlobalData {
  /** 当前用户openid */
  openid:string,
  /** 当前用户的user信息 */
  user: VUser,
  /** 程序数据缓存的key */
  cacheKey: string,
  /** 用户所在位置信息 */
  placeInfo: PlaceInfo,
  /** 小程序云production环境的名称 */
  env: string,
  /** 设备屏幕信息 */
  sysInfo: WechatMiniprogram.SystemInfo,
}