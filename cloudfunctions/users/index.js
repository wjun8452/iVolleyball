// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
const ENV = 'ilovevolleyball-d1813b'; 
cloud.init({env: ENV})

const db = cloud.database({env: cloud.DYNAMIC_CURRENT_ENV})


//新增或更新openid对应的头像
exports.main = async (event, context) => {
  console.log(event)
  console.log(context)

  let openid = event.openid; //修改谁的资料
  let avatarUrl = event.avatarUrl; //头像URL
  let nickName = event.nickName; //昵称
  let action = event.action; //做啥操作？

  if (!openid) {
   return { errMsg: "openid must not be empty!" }
  }

  if (!action) {
    return { errMsg: "action must not be empty!" }
   }

   if (action == "update") { //更新资料
    try {
      const _ = db.command
    } finally {

    }
   }
}
