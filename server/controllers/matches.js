const { mysql } = require('../qcloud')

module.exports = async ctx => {
  if (!ctx.state.$wxInfo.loginState) {
    ctx.throw(400, "user not login")
  } else {
    const matches = await mysql('vmatch').select('*').orderBy('create_time','DESC').limit(20)

    //convert JSON string to object
    for (var index in matches) {
      const owner = JSON.parse(matches[index].owner)
      matches[index].owner = owner
    }
    ctx.state.data = matches
  }
}
