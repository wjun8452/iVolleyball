// pages/news.ts
import { parseTime } from "../../utils/Util"
const ENV = 'ilovevolleyball-d1813b';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isOwner: false,
    news: [],
    // {"creator":"","title":"“FIVB世界女排联赛香港2023”将于6月中旬在..","link":"https://baijiahao.baidu.com/s?id=1763876970868891712","pubDate":"2023-04-22T12:19:58.000Z","author":"","content":"<a target=\"_blank\" href=http://baijiahao.baidu.com/s?id=1763876970868891712><img border=\"0\" src=\"http://t1.baidu.com/it/u=http%3A%2F%2Ft11.baidu.com%2Fit%2Fu%3D3026368709%2C202316589%26fm%3D30%26app%3D106%26f%3DJPEG%3Fw%3D312%26h%3D208%26s%3D3F23488442B281D2461A1F910300D08E&fm=30\"></a><br>主礼嘉宾为赛事进行启动仪式。　陈永诺　摄中新网香港4月22日电(记者魏华都)香港排球总会22日召开记者会宣布，“中国人寿(海外)FIVB世界女排联赛香港2023”将于6月13日至18日在香港体育馆举行","contentSnippet":"主礼嘉宾为赛事进行启动仪式。　陈永诺　摄中新网香港4月22日电(记者魏华都)香港排球总会22日召开记者会宣布，“中国人寿(海外)FIVB世界女排联赛香港2023”将于6月13日至18日在香港体育馆举行","isoDate":"2023-04-22T12:19:58.000Z"}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    var that = this
    wx.showLoading({
      title: "正在加载..."
    })
    //获取每日一句正能量名言
    const db = wx.cloud.database(
      { env: ENV }
    );
    db.collection("vnews").field({
      _id: true,
      title: true,
      contentSnippet: true,
      pubDate: true,
      updateTime: true,
    }).get().then(res => {
      console.log('[wx.db.vnews]', res)
      for (const i in res.data) {
        const item = res.data[i];
        item.updateTime = parseTime(item.updateTime);
      }
      that.data.news = res.data
      console.log(that.data.news)
      that.setData(that.data)
      wx.hideLoading()
    }).catch(err => {
      console.error('[wx.cloud.news] failed!', err)
      wx.hideLoading
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    getApp().getOpenId((openid: string, success: boolean) => {
      this.data.isOwner = openid == "oHxEZ0fcvotOBudda695zijW3NkY";
      this.setData({ isOwner: this.data.isOwner })
      console.log(openid, success)
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  onRefreshNews() {
    wx.showLoading({
      title: "正在加载..."
    })
    wx.cloud.callFunction({
      name: "news",
      data: {},
      success: res => {
        wx.hideLoading()
        console.log(res)
        wx.showToast({
          title: res.errMsg
        })
      },
      fail: err => {
        console.log(err)
        wx.hideLoading()
        wx.showToast({
          title: err.errMsg
        })
      }
    })
  }
})