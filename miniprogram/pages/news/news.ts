// pages/news.ts
import { parseTime } from "../../utils/Util"
const ENV = 'ilovevolleyball-d1813b';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentPage: 0, // 当前第几页,0代表第一页 
    pageSize:10, //每页显示多少数据 
    isOwner: false,
    loadMore: false, //"上拉加载"的变量，默认false，隐藏  
    loadAll: false, //“没有数据”的变量，默认false，隐藏  
    news: [],
    // {"creator":"","title":"“FIVB世界女排联赛香港2023”将于6月中旬在..","link":"https://baijiahao.baidu.com/s?id=1763876970868891712","pubDate":"2023-04-22T12:19:58.000Z","author":"","content":"<a target=\"_blank\" href=http://baijiahao.baidu.com/s?id=1763876970868891712><img border=\"0\" src=\"http://t1.baidu.com/it/u=http%3A%2F%2Ft11.baidu.com%2Fit%2Fu%3D3026368709%2C202316589%26fm%3D30%26app%3D106%26f%3DJPEG%3Fw%3D312%26h%3D208%26s%3D3F23488442B281D2461A1F910300D08E&fm=30\"></a><br>主礼嘉宾为赛事进行启动仪式。　陈永诺　摄中新网香港4月22日电(记者魏华都)香港排球总会22日召开记者会宣布，“中国人寿(海外)FIVB世界女排联赛香港2023”将于6月13日至18日在香港体育馆举行","contentSnippet":"主礼嘉宾为赛事进行启动仪式。　陈永诺　摄中新网香港4月22日电(记者魏华都)香港排球总会22日召开记者会宣布，“中国人寿(海外)FIVB世界女排联赛香港2023”将于6月13日至18日在香港体育馆举行","isoDate":"2023-04-22T12:19:58.000Z"}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
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
    let that = this;
    getApp().getCurrentUser((user:VUser, success: boolean) => {
      that.data.isOwner = user.openid == "oHxEZ0fcvotOBudda695zijW3NkY";
      that.setData({ isOwner: that.data.isOwner })
      console.log(user.openid, success)

      that.getData()
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
    console.log("上拉触底事件")
    let that = this
    if (!that.data.loadMore) {
      that.setData({
        loadMore: true, //加载中  
        loadAll: false //是否加载完所有数据
      });

      //加载更多，这里做下延时加载
      setTimeout(function() {
        that.getData()
      }, 2000)
    }
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
  },

  //访问网络,请求数据  
  getData() {
    wx.showLoading({
      title: "正在加载..."
    })

    let that = this;
    //第一次加载数据
    if (this.data.currentPage == 0) {
      this.setData({
        loadMore: true, //把"上拉加载"的变量设为true，显示  
        loadAll: false //把“没有数据”设为false，隐藏  
      })
    }

    const db = wx.cloud.database(
      { env: ENV }
    );

    //云数据的请求
    db.collection("vnews").field({
      _id: true,
      title: true,
      contentSnippet: true,
      pubDate: true,
      updateTime: true,
    }).skip(this.data.currentPage * this.data.pageSize) //从第几个数据开始
      .limit(this.data.pageSize)
      .get({
        success(res) {
          wx.hideLoading()
          console.log('[wx.db.vnews]', res)
          if (res.data && res.data.length > 0) {
            that.data.currentPage++
            for (const i in res.data) {
              const item = res.data[i];
              item.updateTime = parseTime(item.updateTime);
              item.pubDate = item.pubDate.substring(0,10);
            }
            that.data.news = that.data.news.concat(res.data)

            that.setData({
              news: that.data.news, //获取数据数组    
              loadMore: false //把"上拉加载"的变量设为false，显示  
            });
            if (res.data.length < that.data.pageSize) {
              that.setData({
                loadMore: false, //隐藏加载中。。
                loadAll: true //所有数据都加载完了
              });
            }
          } else {
            that.setData({
              loadAll: true, //把“没有数据”设为true，显示  
              loadMore: false //把"上拉加载"的变量设为false，隐藏  
            });
          }
        },
        fail(res) {
          console.log("请求失败", res)
          that.setData({
            loadAll: false,
            loadMore: false
          });
        }
      })
  },
})