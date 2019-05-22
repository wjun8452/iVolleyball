var court = require("../../utils/court.js")

Page({
  data: court.default_data,

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '技术统计'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log("onShow")
    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    this.data = Object.assign(this.data, court.default_data, saved);
    this.data.opCat = null
    this.data.opPosition = -1
    if (this.data.player_allowed == null) {
      this.data.player_allowed = this.data.players
    }
    court.updateAvailableItems(this.data);
    this.setData(this.data)
    console.log(this.data)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    console.log("onHide")
  },

  onUnload: function() {
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    console.log("onUnload")
  },

  onTapAddScore: function() {
    wx.vibrateShort();
    court.addScoreRotate(this.data)
    this.setData(this.data);
  },

  onTapLooseScore: function() {
    wx.vibrateShort();
    court.looseScoreRotate(this.data);
    this.setData(this.data);
  },

  onTapSetting: function() {
    wx.navigateTo({
      url: 'stat_setting',
    })
  },

  onTapPlayItem: function(e) {
    wx.vibrateShort();

    this.data.opCat = null
    this.data.opPosition = -1
    var position = e.target.dataset.position;
    var item_index = e.target.dataset.play_item_index;
    court.stateRotate(this.data, position, item_index);

    this.setData(this.data)
  },

  onTapRevert: function(e) {
    court.popStatItem(this.data);
    this.setData(this.data);
  },

  onTapScore: function(e) {
    wx.navigateTo({
      url: '../score_board/score_board',
    })
  },

  onTapCat: function(e) {
    var position = e.target.dataset.position;
    var category = e.target.dataset.cat;
    this.data.opPosition = position
    this.data.opCat = category
    this.setData(this.data)
  },

  onTapBoard: function(e) {
    this.data.opCat = null
    this.data.opPosition = -1
    this.setData(this.data)
  }

})