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
  const _ = db.command
  const result = await db.collection('vnews').where({
    title: item.title
  }).get()
  console.log(result)
  if (result.data && result.data.length > 0) {
    console.log("duplicated record, abandon adding.")
    return;
  }

  try {
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
  } catch (e) {
    console.error(e)
  }
}

clearDB = async function () {
  console.log("clear DB starts...")
  const _ = db.command
  const result = await db.collection("vnews").where({
    _id: _.exists(true)
  }).remove()
  console.log("clear DB ends. ", result);
}

// 云函数入口函数
exports.main = async (event, context) => {
  let urls = [
    //'https://feedx.net/rss/thepaper.xml', //feedx.net 经常无响应
    //'https://feedx.net/rss/infzm.xml', //feedx.net 经常无响应
    //'https://feedx.net/rss/bjnews.xml', //feedx.net 经常无响应
    'https://www.chinanews.com.cn/rss/sports.xml', //中新网体育新闻
    'https://news.baidu.com/n?cmd=1&class=sportnews&tn=rss', //百度新闻频道
    //'https://news.baidu.com/n?cmd=4&class=volleyball&tn=rss' //百度排球新闻
  ];
  let keywords = '排球|男排|女排|沙排|气排'
  let news = new Array();

  for (const index in urls) {
    try {
      console.log("collect RSS news starts, from ", urls[index])
      let feed = await parser.parseURL(urls[index]);
      console.log("total news: ", feed.items.length, ", from ", feed.title);

      for (const index2 in feed.items) {
        console.log(index2, ": ", feed.items[index2].title);
        if (feed.items[index2].title.match(keywords) != null) {
          news.push(feed.items[index2])
          console.log("volleyball in title, add it.")
        } else if (feed.items[index2].content.match(keywords) != null) {
          news.push(feed.items[index2])
          console.log("volleyball in content, add it.")
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  //todo: 后续再删除发布日期在3个月之前的新闻
  //await clearDB()

  console.log("***** 排球新闻总条数:  ", news.length, ". 保存到数据库 ...")
  for (const index in news) {
    console.log(index, ": ", news[index].title);
    await addNewsToDB(news[index])
  }
  return { msg: 'ok' };
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
      'Connection': 'keep-alive',
      'Host': aURL.host,
      'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': "macOS",
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cookie': ''
    },
  })
    .then(function (response) {
      console.log(response)
    });

  console.log("load news detail ends.")
}
