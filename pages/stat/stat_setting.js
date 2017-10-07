// pages/stat/stat_setting.js
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
    wx.setNavigationBarTitle({
      title: '设置'
    })

    var saved = wx.getStorageSync(getApp().globalData.cacheKey);

    this.setData(saved || this.data);
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
    console.log("onUnload")
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    // console.log(this.data);
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

  onTapServe: function(e) {
    var serve = e.detail.value;
    this.setData({serve: serve});
    wx.navigateBack({
      delta: 1
    })
  },

  onReset: function() {
    this.setData({myScore:0, yourScore:0, stat_items:[]});
    wx.navigateBack({
      delta: 1
    })
  },

  onNextPosition: function() {
    this.updatePosition();
    wx.navigateBack({
      delta: 1
    })
  },

  updatePosition: function () {
    var players = this.data.players;
    var player = players[5];
    players[5] = players[0];
    players[0] = players[1];
    players[1] = players[2];
    players[2] = players[3];
    players[3] = players[4];
    players[4] = player;
    this.setData({ players: players });
  },

  // onResetAll: function() {
  //   this.data = null;
  //   wx.navigateBack({
  //     delta: 1
  //   })
  // }
})