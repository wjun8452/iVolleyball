const { mysql } = require('../qcloud')

module.exports = async ctx => {
  if (!ctx.state.$wxInfo.loginState) {
    ctx.throw(400, "user not login")
  }

  const uuid = ctx.request.body.uuid
  const team1 = ctx.request.body.team1
  const team2 = ctx.request.body.team2
  const match = await mysql('vmatch').select('*').where({ uuid }).first()

  if (match.openid != ctx.state.$wxInfo.userinfo.openId) {
    ctx.throw(400, 'no permission to update the match')
  } else {
    ctx.state.data = await mysql('vmatch').where({ uuid }).update({ team1, team2 })
  }
}
