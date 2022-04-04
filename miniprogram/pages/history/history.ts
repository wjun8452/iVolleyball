// miniprogram/pages/history.js

import { BasePage } from "../../BasePage";
import { VolleyCourt } from "../../VolleyCourt";

class HistoryPageData {
  matches: VolleyCourt[] = []; //以前上传过的比赛
  isLoading : boolean  = false
}

class HistoryPage extends BasePage {
  data: HistoryPageData = new HistoryPageData();

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad = function (this: HistoryPage) {
    wx.setNavigationBarTitle({
      title: '历史记录',
    })
    this.fetchData()
  }


  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh = function (this: HistoryPage) {
    console.log("onPullDownRefresh")
    this.fetchData()
  }


  fetchData = function (this: HistoryPage) {
    var app = getApp()
    var openid = app.globalData.openid

    this.data.isLoading = true
    wx.showLoading({
      title: '正在加载...',
    })

    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    var that = this

    db.collection('vmatch').where({
      _openid: openid,
    }).field({
      _id: true,
      myScore: true,
      yourScore: true,
      create_time: true,
      myTeam: true,
      yourTeam: true,
      place: true,
      _openid: true,
      status: true,
    }).orderBy('create_time', 'desc')
      .get({
        success(res) {
          //console.log("[db.vmatch.get] res:", res)
          that.data.matches = res.data
          for (var i in that.data.matches) {
            that.data.matches[i].create_time = that.data.matches[i].create_time.toLocaleString()
          }
          that.data.isLoading = false
          wx.hideLoading()
          that.setData(that.data)
        },
        fail(res) {
          console.log(res)
          that.data.isLoading = false
          wx.hideLoading()
          wx.showToast({
            title: '加载失败',
          })
        }
      })

  }
}

Page(new HistoryPage())