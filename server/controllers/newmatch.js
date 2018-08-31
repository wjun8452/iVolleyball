const { mysql } = require('../qcloud')
const uuidGenerator = require('uuid/v4')
const moment = require('moment')

module.exports = async ctx => {
    if (!ctx.state.$wxInfo.loginState) {
      ctx.throw(400, "user not login")
    } 
  
    const uuid = uuidGenerator()
    const create_time = moment().format('YYYY-MM-DD HH:mm:ss')
    const score1 = 0
    const score2 = 0
    const lat = ctx.request.body.lat
    const lon = ctx.request.body.lon
    const place = ctx.request.body.place
    const owner = JSON.stringify(ctx.state.$wxInfo.userinfo)
    const openid = ctx.state.$wxInfo.userinfo.openId
    
    await mysql('vmatch').insert({
        uuid, score1, score2, openid, owner, create_time, lat, lon, place
    })

    ctx.state.data =  await mysql('vmatch').select('*').where('uuid', uuid).first()
}
