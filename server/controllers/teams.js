const { mysql } = require('../qcloud')

module.exports = async ctx => {
  if (!ctx.state.$wxInfo.loginState) {
    ctx.throw(400, "user not login")
  } else {
    const openid = ctx.state.$wxInfo.userinfo.openId
    const teams = await mysql('vteam').select('*').where('openid', openid).orderBy('create_time', 'DESC').limit(20)
    ctx.state.data = teams
  }
}
