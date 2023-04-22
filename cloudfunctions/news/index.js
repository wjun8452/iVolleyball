// 云函数模板
// 部署：在 cloud-functions/iciba 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')
// var rp = require('request-promise');
const Parser = require('rss-parser');

const parser = new Parser();

const ENV = 'ilovevolleyball-d1813b'; 
cloud.init({evn: ENV})

const db = cloud.database({env: cloud.DYNAMIC_CURRENT_ENV})

// {"creator":"","title":"“FIVB世界女排联赛香港2023”将于6月中旬在..","link":"https://baijiahao.baidu.com/s?id=1763876970868891712","pubDate":"2023-04-22T12:19:58.000Z","author":"","content":"<a target=\"_blank\" href=http://baijiahao.baidu.com/s?id=1763876970868891712><img border=\"0\" src=\"http://t1.baidu.com/it/u=http%3A%2F%2Ft11.baidu.com%2Fit%2Fu%3D3026368709%2C202316589%26fm%3D30%26app%3D106%26f%3DJPEG%3Fw%3D312%26h%3D208%26s%3D3F23488442B281D2461A1F910300D08E&fm=30\"></a><br>主礼嘉宾为赛事进行启动仪式。　陈永诺　摄中新网香港4月22日电(记者魏华都)香港排球总会22日召开记者会宣布，“中国人寿(海外)FIVB世界女排联赛香港2023”将于6月13日至18日在香港体育馆举行","contentSnippet":"主礼嘉宾为赛事进行启动仪式。　陈永诺　摄中新网香港4月22日电(记者魏华都)香港排球总会22日召开记者会宣布，“中国人寿(海外)FIVB世界女排联赛香港2023”将于6月13日至18日在香港体育馆举行","isoDate":"2023-04-22T12:19:58.000Z"}
addNewsToDB = async function (item) {
  const result = await db.collection("vnews").add({
    data: {
      creator: item.creator,
      title: item.title,
      link: item.link, //detail news link
      pubDate: item.pubDate,
      author: item.author,
      content: item.content,
      contentSnippet: item.contentSnippet,
      isoDate: item.isoDate, 
      updateTime: new Date(),
    }
  })
  console.log(result)
}

clearDB = async function () {
  console.log("clear DB starts...")
  const _ = db.command
  const result = await db.collection("vnews").where({
    _id: _.exists(true)
  }).remove()
  console.log(result);
}


// 云函数入口函数
exports.main = async (event, context) => {
  let url = 'https://news.baidu.com/n?cmd=4&class=volleyball&tn=rss';
  let feed = await parser.parseURL(url);
  console.log(feed.title);

  await clearDB()

  for (const index in feed.items) {
    console.log(feed.items[index].title + ':' + feed.items[index].link)
    await addNewsToDB(feed.items[index])
    // item.link = item.link.replace("http:", "https:")
  }

  return {msg: 'ok'};
}