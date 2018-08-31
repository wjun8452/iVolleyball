var config = require("../../config.js")
var util = require("../../utils/util.js")
var qcloud = require('../../vendor/wafer2-client-sdk/index')

Page({

  /**
   * 页面的初始数据
   */
  data: {
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.fetchMatches()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  fetchMatches: function() {
    const that = this
    const url = config.service.matchesUrl
    console.log("Navigated to " + url)
    util.showBusy("正在加载...")
    qcloud.request({
      url: url,
      method: 'POST',
      success: function (res) {
        that.setData(res)
        console.log(res)
      },
      fail: function (res) {
        console.log(res)
        wx.showToast({
          title: '获取数据失败',
        })
      },
      complete: function (res) {
        util.hideToast()
      }
    })
  }
})