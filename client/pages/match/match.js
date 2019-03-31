var util = require("../../utils/util.js")
var qcloud = require('../../vendor/wafer2-client-sdk/index')

Page({

  /**
   * Page initial data
   */
  data: {
    teams:[{name:"队1"}, {name:"队2"}],
    team1: "队1",
    team2: "队2"
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '创建一个比赛'
    })

    this.loadTeams()
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {

  },

  bindChange1: function (e) {
    const val = e.detail.value
    this.setData({
      team1: this.data.teams[val[0]].name
    })
  },

  bindChange2: function (e) {
    const val = e.detail.value
    this.setData({
      team2: this.data.teams[val[0]].name
    })
  },

  ok: function(e) {

  },

  bindKeyInput1: function(e) {
    console.log(e)
    this.setData({
      team1: e.detail.value
    })
  },

  bindKeyInput2: function (e) {
    this.setData({
      team2: e.detail.value
    })
  },

  loadTeams: function (e) {
    const url = config.service.teamsUrl
    var that = this;
//    console.log("Navigated to " + url)
    util.showBusy("正在加载...")
    qcloud.request({
      url: url,
      method: 'POST',
      success: function (res) {
        console.log(res)
        that.setData({ teams: res.data.data })
      },
      fail: function (res) {
        console.log(res)
      },
      complete: function (res) {
        util.hideToast()
      }
    })
  }

})