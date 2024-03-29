// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
const ENV = 'ilovevolleyball-d1813b';
cloud.init({ env: ENV })

const db = cloud.database({ env: cloud.DYNAMIC_CURRENT_ENV })


//对vevent做操作
//update a event
exports.main = async (event, context) => {
  console.log("cloud function vevent: ", event)
  let action = event.action;
  let _openid = event._openid;
  let event_data = event.event; //如果action是updateAvatar，则event是VUser对象
  // let _id = event._id;

  if (!_openid) {
    return { errMsg: "_openid must not be empty!" }
  }

  if (!action) {
    return { errMsg: "action must not be empty!" }
  }

  if (_openid != cloud.getWXContext().OPENID) {
    return { errMsg: "permission denied!" }
  }

  if (action == "insert") {
    try {
      const _ = db.command
      let result = await db.collection('vevent').where({ '_openid': _openid })
        .update(
          {
            data: {
              'events': _.push(event_data),
              'base_id': _.inc(1), //数组元素个数+1
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
        '_openid': _openid
      })
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
  } else if (action == "delete") {
    try {
      const _ = db.command
      //如果该用户只有一条赛事记录，则销户删除
      let result = "";
      let deleted = false;
      result = await db.collection('vevent').where({
        base_id: _.eq(0),
        '_openid': _openid
      }).remove();
      console.log("try to remove the only 1 event:", result)
      deleted = result.stats.removed == 1;
      // {
      //   "stats": {
      //     "removed": 1
      //   },
      //   "errMsg": "collection.remove:ok"
      // }


      if (deleted) {
        return result;
      }

      //该用户有两条以上的赛事记录，则只删除赛事记录
      result = await db.collection('vevent').where({
        '_openid': _openid
      }).update(
        {
          data: {
            events: _.pull({
              base_id: event_data.base_id
            }),
            'base_id': _.inc(-1), //数组元素个数-1
            'update_time': db.serverDate(),
          }
        }
      );
      console.log("remove one of multi-events:", result)
      return result;
    } catch (e) {
      console.error(e)
    }
  } else if (action == 'updateAvatar') {
    try {
      const _ = db.command
      let result = await db.collection('vevent').where({
        '_openid': _openid
      })
        .update(
          {
            data: {
              'owner': event_data,
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
