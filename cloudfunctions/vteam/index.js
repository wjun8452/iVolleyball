// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
const ENV = 'ilovevolleyball-d1813b'; 
cloud.init({env: ENV})

const db = cloud.database({env: cloud.DYNAMIC_CURRENT_ENV})


//对vteam做操作，譬如joinTeam, 申请人申请加入一个team
exports.main = async (event, context) => {
  console.log(event)
  console.log(context)

  let teamId = event.teamId;
  let applicantId = event.applicantId;
  let avatarUrl = event.avatarUrl;
  let nickName = event.nickName;
  let applicantName = event.applicantName;

  if (!applicantName) {
   return { errMsg: "name must not be empty!" }
  }

  try {
    const _ = db.command

    let exist = false;

    if (applicantId === "") {
      let result = await db.collection('vteam').where({
        "_id": teamId,
        "players.name": applicantName
      }).get();
  
      console.log("result", result)
  
      if (result.data.length > 0) {
        exist = true;
      }
    } else {
      let result = await db.collection('vteam').where(_.or([{
        "_id": teamId,
        "players.user.openid": applicantId
      }, {
        "_id": teamId,
        "players.name": applicantName
      }])).get();
  
      console.log("result", result)
  
      if (result.data.length > 0) {
        exist = true;
      }
    }
    if (exist) {
      return { errMsg: "exists!" }
    } else {
      return await db.collection('vteam').where({
        _id: teamId
      }).update({
        data: {
          players: _.push({ name: applicantName, user: { openid: applicantId, userInfo: {avatarUrl: avatarUrl, nickname: nickName }} })
        }
      })
    }
  } catch (e) {
    console.error(e)
  }
}
