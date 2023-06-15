// 云函数模板
// 部署：在 cloud-functions/iciba 文件夹右击选择 “上传并部署”
const cloud = require('wx-server-sdk')
const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser();

const ENV = 'ilovevolleyball-d1813b';
cloud.init({ evn: ENV })

const db = cloud.database({ env: cloud.DYNAMIC_CURRENT_ENV })

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
  console.log("clear DB ends. ", result);
}


//load news by url to parse the html and save html content to db
loadNewsDetail = async function (url) {
  console.log("load news detail starts ...  ", url)

  const aURL = new URL(url);

  axios({
    method: 'get',
    url: url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'Cache-Control': 'max-age=0',
      'Connection':'keep-alive',
      'Host': aURL.host,
      'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': "macOS",
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cookie':''
    },
  })
    .then(function (response) {
      console.log(response)
    });

  console.log("load news detail ends.")
}


// 云函数入口函数
exports.main = async (event, context) => {
  let url = 'https://news.baidu.com/n?cmd=4&class=volleyball&tn=rss';
  console.log("collect RSS news starts ...")
  let feed = await parser.parseURL(url);
  console.log("total news: ", feed.items.length, ", from ", feed.title);
  console.log("collect RSS news end.")

  await clearDB()

  for (const index in feed.items) {
    console.log(feed.items[index].title + ':' + feed.items[index].link)
    await addNewsToDB(feed.items[index])
  }

  //访问摘要的link，爬取新闻的细节
  for (const index in [0]) {
    feed.items[index].link = feed.items[index].link.replace("http:", "https:")

    //nok
    // await loadNewsDetail(feed.items[index].link + '&usm=3&rsv_idx=2&rsv_page=1')

    //ok
    // await loadNewsDetail("https://www.baidu.com/s?rtt=1&bsst=1&cl=2&tn=news&ie=utf-8&word=%E6%8E%92%E7%90%83")

    // nok
    // await loadNewsDetail("https://baijiahao.baidu.com/s?id=1764148019204143368&wfr=spider&for=pc")

    //ok
    // await loadNewsDetail("http://news.yongzhou.gov.cn/hzdw/folder1318/2023-04-25/1OV5msFmVIXuasDx.html")

    //ok
    // await loadNewsDetail("https://sports.sohu.com/a/670138201_120168436")

    //nok 动态生成的新闻摘要和链接
    // await loadNewsDetail("https://www.sohu.com/xtopic/TURBd05Ea3lOVGc1?spm=smpc.channel_255.block3_77_mRZJlu_g_link.2.1682429582404ILOBIKt_1253")
  }

  return { msg: 'ok' };
}