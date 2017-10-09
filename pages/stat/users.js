// pages/stat/users.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    temp_player_name: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    // console.log(saved)
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
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
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

  onAddPlayer: function(e) {
    var player = e.detail.value.player;
    this.data.all_players.push(player);
    this.data.temp_player_name = ""
    this.setData(this.data)
  },

  onDeletePlayer: function(e) {
    var player_index = e.target.dataset.player_index;
    this.data.all_players.splice(player_index, 1);
    this.setData(this.data)
  }
})