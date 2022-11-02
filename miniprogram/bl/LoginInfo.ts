//login 云函数的返回类型
export interface LoginInfo {
  event: any,
  openid: string,
  appid: string,
  unionid: string,
}