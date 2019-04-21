var court = require("../../utils/court.js")

Page({
  data:
  {
    myScore: 0,
    yourScore: 0,
    all_players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"],
    players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"], //index: 显示位置, 0: 后排最右即1号区域, 1: 2号区域,  value: 姓名
    play_items: [[], [], [], [], [], []], //items avaialbe for the player
    stat_items: [], //stat items in history
    who_serve: -1, //发球球员的index
    serve: false,  //true: 我发发球， false: 我方接发球
    front_back_mode: true, //true: 1号和2号轮换，3号与6号轮换，4号与5号轮换， false: 正常转位，6->5->4->3->2->1->6
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
    court.updateAvailableItems(this.data);
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
    court.addScoreRotate(this.data)
    this.setData(this.data);
  },

  onTapLooseScore: function () {
    wx.vibrateShort();
    court.looseScoreRotate(this.data);
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
    court.stateRotate(this.data, position, item_index);
    this.setData(this.data)
  },

  onTapRevert: function (e) {
    court.popStatItem(this.data);
    this.setData(this.data);
  },

  onTapScore: function (e) {
    wx.navigateTo({
      url: '../score_board/score_board',
    })
  }

})
