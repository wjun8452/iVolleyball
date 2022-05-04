// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()


const db = cloud.database()


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
