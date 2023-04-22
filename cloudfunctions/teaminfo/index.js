// 云函数入口文件
const cloud = require('wx-server-sdk')

const ENV = 'ilovevolleyball-d1813b'; 
cloud.init({env: ENV})

const db = cloud.database({env: cloud.DYNAMIC_CURRENT_ENV})

// 返回一个队伍的详细信息，包括其成员的头像、昵称等
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const team_id = event.team_id

  return await db.collection('vteams').doc('team_id')

  // return await db.collection('vteams').aggregate().match({
  //     _id: team_id
  //   }).lookup({
  //     from: 'vusers',
  //     localField: 'players._openid',
  //     foreignField: '_openid',
  //     as: 'players_info', //成员头像、昵称
  //   })
  //   .end()
  //   .then(
  //     res => {

  //       console.log("[cloud function db]", res)
  //       return res
  //     })
  //   .catch(error => {
  //     console.log("[cloud function db]", error)
  //     return error
  //   })
}