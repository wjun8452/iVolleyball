const { mysql } = require('../qcloud')

module.exports = async ctx => {
  if (!ctx.state.$wxInfo.loginState) {
    ctx.throw(400, "user not login")
  } 
  const match = await mysql('vmatch').select('*').where(ctx.request.query).first()
  const owner = JSON.parse(match.owner)
  match.owner = owner
  ctx.state.data = match
}
