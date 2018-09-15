const {
  mysql
} = require('../qcloud')

const MAX_DISTANCE = 20000; //20km
function toRad(d) { return d * Math.PI / 180; }
function distance(lat1, lng1, lat2, lng2) {
//lat为纬度, lng为经度, 一定不要弄错
  var dis = 0;
  var radLat1 = toRad(lat1);
  var radLat2 = toRad(lat2);
  var deltaLat = radLat1 - radLat2;
  var deltaLng = toRad(lng1) - toRad(lng2);
  var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
  return dis * 6378137;
}

module.exports = async ctx => {
  if (!ctx.state.$wxInfo.loginState) {
    ctx.throw(400, "user not login")
  } else {
    const city = ctx.request.body.city
    const searchtype = ctx.request.body.searchtype;
    const openid = ctx.state.$wxInfo.userinfo.openId;

    if (searchtype == 'mine') {
      const matches = await mysql('vmatch').select('*').where('openid', openid).orderBy('create_time', 'DESC').limit(200)

      //convert JSON string to object
      for (var index in matches) {
        const owner = JSON.parse(matches[index].owner)
        matches[index].owner = owner
      }
      ctx.state.data = matches
    }

    if (searchtype == 'nearby') {
      const matches = await mysql('vmatch').select('*').whereNot(
        'openid', openid).where('city', city).orderBy('create_time', 'DESC').limit(200)

      //convert JSON string to object
      for (var index in matches) {
        const owner = JSON.parse(matches[index].owner)
        matches[index].owner = owner
      }
      ctx.state.data = matches
    }
  }
}