const {
  mysql
} = require('../qcloud')
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
  const city = ctx.request.body.city
  const team1 = ctx.request.body.team1
  const team2 = ctx.request.body.team2
  const owner = JSON.stringify(ctx.state.$wxInfo.userinfo)
  const openid = ctx.state.$wxInfo.userinfo.openId

  await mysql('vmatch').insert({
    uuid,
    score1,
    score2,
    team1,
    team2,
    openid,
    owner,
    create_time,
    lat,
    lon,
    place,
    city
  })

  const team1_exist = await mysql('vteam').select('*').where({
    name: team1,
    openid: openid})
  if (team1_exist.length == 0) {
    await mysql('vteam').insert({
      name: team1,
      openid: openid
    })
  }

  const team2_exist = await mysql('vteam').select('*').where({
    name: team2,
    openid: openid
  })
  if (team2_exist.length == 0) {
    await mysql('vteam').insert({
      name: team2,
      openid: openid
    })
  }

    ctx.state.data = await mysql('vmatch').select('*').where('uuid', uuid).first()
  }