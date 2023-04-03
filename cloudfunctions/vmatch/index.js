// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()


const db = cloud.database()

handleUmpireStats = async function (who, who_id, matchId, matchData) {
  if (!who) {
    return {
      errMsg: "invalid param, who must not be null!"
    }
  }

  if (!who_id) {
    return {
      errMsg: "invalid param, who_id must not be empty!"
    }
  }

  try {
    const _ = db.command
    let exist = false;
    if (who === "umpire1") {
      let result = await db.collection('vmatch').where({
        "_id": matchId,
        "stat_umpire1.openid": who_id
      }).get();

      console.log("result", result)

      if (result.data.length > 0) {
        exist = true;
      }
    } else if (who == "umpire2") {
      let result = await db.collection('vmatch').where({
        "_id": matchId,
        "stat_umpire2.openid": who_id
      }).get();

      console.log("result", result)

      if (result.data.length > 0) {
        exist = true;
      }
    }
    if (!exist) {
      return {
        errMsg: "not authorized"
      }
    } else {
      return await db.collection('vmatch').where({
        _id: matchId
      }).update({
        data: matchData
      })
    }
  } catch (e) {
    console.error(e)
  }
}


handleSetUmpire = async function (matchId, who, user ) {
  console.log("handleSetUmpire ", matchId, who, user)

  if (!who) {
    return {
      errMsg: "invalid param, who must not be null!"
    }
  }

  if (!user) {
    return {
      errMsg: "invalid param, user must not be empty!"
    }
  }

  try {
    const _ = db.command

    if (who === "umpire1") {
      //检查不允许两个统计员id一样
      let query = await db.collection('vmatch').where({
        _id: matchId
      }).get();

      if (query.data.length > 0) {
        if (user.openid!="" && query.data[0].stat_umpire2.openid == user.openid) {
          return {
            errMsg: "invalid param, the user is already a umpire"
          }
        }
      }

      let result = await db.collection('vmatch').where({
        _id: matchId
      }).update({
        data: {"stat_umpire1": user}
      });
      console.log(result)
      return result;
    } else if (who == "umpire2") {

      //检查不允许两个统计员id一样
      let query = await db.collection('vmatch').where({
        _id: matchId
      }).get();

      if (query.data.length > 0) {
        if (user.openid!="" && query.data[0].stat_umpire1.openid == user.openid) {
          return {
            errMsg: "invalid param, the user is already a umpire"
          }
        }
      }
      
      return await db.collection('vmatch').where({
        _id: matchId
      }).update({
        data: {"stat_umpire2": user}
      });
    } else {
      return {
        errMsg: "invalid param, who=" + who + " is not support"
      }
    }
  } catch (e) {
    console.error(e)
  }
}

//对vmatch数据库进行更新，action表示做什么操作
//who: who
//action: 'update',
//matchId: matchId,
//matchData: matchData,
//who_id: who_id
exports.main = async (event, context) => {
  console.log(event)
  console.log(context)

  let action = event.action;
  let matchId = event.matchId;

  if (!action) {
    return {
      errMsg: "invalid param, action must not be null!"
    }
  }
  if (!matchId) {
    return {
      errMsg: "invalid param, matchID must not be null!"
    }
  }

  if (action == "handleUmpireStats") {
    let who = event.who;
    let who_id = event.who_id;
    let matchData = event.matchData;
    return handleUmpireStats(who, who_id, matchId, matchData);
  } else if (action == "handleSetUmpire") {
    let who = event.who;
    let user = event.user
    return handleSetUmpire(matchId, who, user);
  } else {
    return {
      errMsg: "invalid param, action not support"
    }
  }
}