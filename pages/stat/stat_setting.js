// pages/stat/stat_setting.js
var court = require("../../utils/court.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    edit_pos: -1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '设置'
    })

    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    if (saved) {
      saved.edit_pos = -1;
    }
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

  onReset: function () {
    this.data.myScore = 0;
    this.data.yourScore = 0;
    this.data.stat_items = [];
    this.setData(this.data)
  },

  onChangeMyScore: function (e) {
    this.data.myScore = parseInt(e.detail.value);
    this.setData(this.data);
  },

  onChangeYourScore: function (e) {
    this.data.yourScore = parseInt(e.detail.value);
    this.setData(this.data);
  },

  onChoosePlayer: function (e) {
    var players = this.data.players;
    var player = e.target.dataset.player;
    var pos = e.target.dataset.position;

    //swap
    for (var i in players) {
      if (players[i] == player) {
        players[i] = this.data.players[pos];
      }
    }

    this.data.players[pos] = player;

    this.data.edit_pos = -1;

    this.setData(this.data)
  },

  onCheckServe: function (e) {
    var position = e.target.dataset.position;
    var checked = e.detail.value.length == 1;
    var serves = this.data.serves;

    //clear serves
    for (var i in serves) {
      serves[i] = false;
    }

    serves[position] = checked;

    var serve = false;
    for (var i in serves) {
      if (serves[i]) {
        serve = true;
        break;
      }
    }

    this.data.serve = serve;

    this.setData({ serves: serves })
  },

  onTapMode: function (e) {
    var mode = e.detail.value; //0: front_back, 1: normal
    if (mode == "0") {
      this.data.front_back_mode = true;
    } else {
      this.data.front_back_mode = false;
    }

    var serves = this.data.serves;
    for (var i in serves) {
      serves[i] = false;
    }
    this.setData(this.data);
  },

  onClickPlayer: function (e) {
    var position = e.target.dataset.position;
    if (position == this.data.edit_pos) {
      this.data.edit_pos = -1
    } else {
      this.data.edit_pos = position;
    }

    this.setData(this.data);
  },

  onAddPlayer: function (e) {
    var position = e.target.dataset.position;
    var player = e.detail.value;
    if (player != null) {
      player = player.replace(/^\s*|\s*$/g, "");
      if (player == "") {
        
      } else if (this.data.all_players.indexOf(player) == -1) {
        this.data.all_players.push(player);
        this.data.players[position] = player;
        this.data.edit_pos = -1
        this.setData(this.data)
      } else {
        wx.showToast({
          title: '球员已存在',
        })
      }
    }
  },

  onDeletePlayer: function (e) {
    var position = e.target.dataset.position;
    var player = this.data.players[position];

    this.data.edit_pos = -1

    if (player != "??") {
      this.data.players[position] = "??"
    }

    var index_all = this.data.all_players.indexOf(player)
    if (index_all != -1) {
      this.data.all_players.splice(index_all, 1);
      wx.showToast({
        title: '成功删除',
      })
    }

    this.setData(this.data)
  },

})