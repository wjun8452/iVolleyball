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

  onShareAppMessage:function(e) {

  },

  onTapAddScore: function() {
    wx.vibrateShort();
    court.addScoreRotate(this.data)
    this.setData(this.data);
    this.checkMatchOver()
  },

  onTapLooseScore: function() {
    wx.vibrateShort();
    court.looseScoreRotate(this.data);
    this.setData(this.data);
    this.checkMatchOver()
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
    this.checkMatchOver()
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
  },

  isMatchOver: function() {
    var score = this.data.fifth ? 15 : 25
    var s1 = this.data.myScore
    var s2 = this.data.yourScore
    return (s1 >= score || s2 >= score) && (s1 - s2 >= 2 || s2 - s1 >= 2);
  },

  checkMatchOver: function() {
    var that = this
    if (this.isMatchOver()) {
      this.onTapMatchOver();
    }
  },

  uploadData: function(e) {
    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    var that = this
    wx.showLoading({
      title: '正在上传...',
    })

    this.data.city = getApp().globalData.city
    this.data.create_time = db.serverDate()
    this.data.latlon = {
      latitude: getApp().globalData.lat,
      longitude: getApp().globalData.lon
    }
    this.data.place = getApp().globalData.place
    delete this.data._id //向数据库插入数据时_id不能有哦，否则报内部错误

    db.collection('vmatch').add({
      data: this.data,
      success: function(res) {
        console.log(res)
        that.data._id = res._id
        that.resetData()
        that.setData(that.data)
        wx.hideLoading()
        wx.showToast({
          title: '上传成功!',
          icon: 'success'
        })
        wx.navigateTo({
          url: 'report?_id=' + res._id,
        })
      },
      fail: function(res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '上传失败!',
          icon: 'none'
        })
      }
    })
  },

  resetData: function() {
    this.data.stat_items = []
    this.data.myScore = 0
    this.data.yourScore = 0
    this.data._id = null
  },

  onTapMatchOver: function() {
    var that = this
    wx.showModal({
      title: '比赛结束?',
      content: '点击确定将清零比分并上传数据',
      showCancel: true,
      success: function(res) {
        if (res.confirm) {
          that.uploadData()
        } else if (res.cancel) {}
      }
    })
  }

})