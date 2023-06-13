// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
const ENV = 'ilovevolleyball-d1813b'; 
cloud.init({env: ENV})

const db = cloud.database({env: cloud.DYNAMIC_CURRENT_ENV})


//对vevent做操作
//update a event
exports.main = async (event, context) => {
  console.log("cloud function vevent: ", event)
  let action = event.action;
  let _openid = event._openid;
  let event_data = event.event;
  // let _id = event._id;

  if (!_openid) {
   return { errMsg: "_openid must not be empty!" }
  }

  if (!action) {
    return { errMsg: "action must not be empty!" }
  }

  if (_openid != cloud.getWXContext().OPENID) {
    return { errMsg: "permission denied!"}
  }

  if (action == "insert") {
    try {
      const _ = db.command
      let result = await db.collection('vevent').where({'_openid': _openid})
        .update(
          {
            data: {
              'events': _.push(event_data),
              'base_id': event_data.base_id,
              'update_time': db.serverDate(),
            }
          }
        );
        console.log(result)
        return result;
    } catch (e) {
      console.error(e)
    }
  } else if (action == "update") {
    try {
      const _ = db.command
      let result = await db.collection('vevent').where({
        'events.base_id': event_data.base_id, 
        '_openid': _openid})
        .update(
          {
            data: {
              'events.$': event_data,
              'update_time': db.serverDate(),
            }
          }
        );
        console.log(result)
        return result;
    } catch (e) {
      console.error(e)
    }
  }
 

  
}
