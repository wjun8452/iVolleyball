// 云函数模板
// 部署：在 cloud-functions/iciba 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')
var rp = require('request-promise');

const ENV = 'ilovevolleyball-d1813b'; 
cloud.init({evn: ENV})


// 云函数入口函数
exports.main = async (event, context) => {
  let url = 'http://open.iciba.com/dsapi/';
  return await rp(url)
    .then(function (res) {
      return res
    })
    .catch(function (err) {
      return '失败'
    });
}
