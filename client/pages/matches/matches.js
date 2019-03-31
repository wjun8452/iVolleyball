var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchtype: 'byOwner',
    winWidth: 0,
    winHeight: 0,
    matches: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
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
    this.fetchMatches();
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

  switchNav: function (e) {
    if (this.data.searchtype == e.currentTarget.dataset.searchtype) {
      return false;
    } else {
      this.setData({
        searchtype: e.currentTarget.dataset.searchtype
      })
      
      this.fetchMatches();
    }
  },

  fetchMatches: function() {
    const db = wx.cloud.database()
    const matches = db.collection('vmatch')
    const that = this
    
    util.showBusy("正在加载...")
    
    var byOwner = {
      _openid: getApp().globalData.openid
    }
    
    var byCity = {
      city: getApp().globalData.city
    }

    var where = this.data.searchtype=='byOwner'?byOwner:byCity;

    matches.where(where)
      .get()
      .then(res => {
        console.log('[vmatch] get', this.data.searchtype, res.data)
        that.setData({ matches: res.data })
        util.hideToast()
      })
      .catch(err => {
        console.error('[vmatch] get', + this.data.searchtype, err)
        util.hideToast()
      })
  },

  tapMatch: function(e) {
    var url = util.buildURL('/pages/score_board/score_board',  {match: e.currentTarget.dataset.match}, true)
    console.log(url)
      wx.navigateTo({
        url: url
      })
  }
})