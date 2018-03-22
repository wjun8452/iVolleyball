var court = require("../../utils/court.js")

Page({
  data:
  {
    myScore: 0,
    yourScore: 0,
    all_players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"],
    players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"], //index: 显示位置, 0: 后排最右即1号区域, 1: 2号区域,  value: 姓名
    positions: [5, 2, 3, 4, 1, 6], //index: 显示位置, value: 正常转位时应该站在哪个位置， 1号区域的球员应该站在5号区域
    play_items: [[], [], [], [], [], []], //items avaialbe for the player
    stat_items: [], //stat items in history
    serves: [false, false, false, false, false, false], //index: 场上显示位置, value: 是否发球
    front_back_mode: true,
  },

  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '技术统计'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("onShow")
    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    this.setData(saved || this.data);
    court.updatePlayItems(this.data);
    this.setData(this.data)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    console.log("onHide")
  },

  onUnload: function () {
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    console.log("onUnload")
  },

  onTapAddScore: function () {
    wx.vibrateShort();

    court.addScore(this.data)
    this.setData(this.data);
  },

  onTapLooseScore: function () {
    wx.vibrateShort();
    
    court.looseScore(this.data);
    this.setData(this.data);
  },

  onTapSetting: function () {
    wx.navigateTo({
      url: 'stat_setting',
    })
  },

  onTapPlayItem: function (e) {
    wx.vibrateShort();

    var position = e.target.dataset.position;
    var item_index = e.target.dataset.play_item_index;
    court.addPlayItem(this.data, position, item_index);
    this.setData(this.data)
  },

  onTapRevert: function (e) {
    court.popStatItem(this.data);
    this.setData(this.data);
  },

})
