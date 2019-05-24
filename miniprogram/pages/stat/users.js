// pages/stat/users.js
var court = require("../../utils/court.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    all_players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"],
    temp_player_name: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '球队成员',
    })
    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    this.data = Object.assign(this.data, court.default_data, saved);
    this.setData(this.data);
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

  onAddPlayer: function (e) {
    var player = e.detail.value.player;
    player = player.replace(/^\s*|\s*$/g, "");
    if (player.length > 4) {
      wx.showToast({
        title: '名称不能超过4个字符或汉字!',
        icon: 'none'
      })
    } 
    else if (player.length > 0) {
      this.data.all_players.unshift(player);
      this.data.temp_player_name = ""
      this.setData(this.data)
    }
  },

  onTeamName: function(e) {
    var team = e.detail.value.team;
    team = team.replace(/^\s*|\s*$/g, "");
    if (team.length > 4) {
      wx.showToast({
        title: '名称不能超过4个字符或汉字!',
        icon: 'none'
      })
    }
    else if (team.length > 0) {
      this.data.myTeam = team
      this.data.temp_team_name = ""
      this.setData(this.data)
    }
  },

  onDeletePlayer: function (e) {
    var player_index = e.target.dataset.player_index;
    this.data.all_players.splice(player_index, 1);
    this.setData(this.data)
  }
})