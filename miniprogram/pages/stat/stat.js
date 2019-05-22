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
  },

  isGameOver: function (s1, s2) {
    return (s1 >= 25 || s2 >= 25) && (s1 - s2 >= 2 || s2 - s1 >= 2);
  },

  onTapUpload: function(e) {
    if (this.isGameOver(this.data.myScore, this.data.yourScore)) {
      const db = wx.cloud.database({
        env: 'test-705bde'
      })

      var that = this

      db.collection('vmatch').add({
        data: this.data,
        success: function (res) {
          console.log(res)
          that.data.stat_items = []
          that.data.myScore = 0
          that.data.yourScore = 0
          if (that.data.history==null || that.data.hisotry==undefined) {
          that.data.history = new Array()
          }
          that.data.history.push(res._id)
          that.setData(that.data)
          wx.showToast({
            title: '上传成功!',
            icon: 'success'
          })
          wx.navigateTo({
            url: 'report?id='+res._id,
          })
        },
        fail: function (res) {
          wx.showToast({
            title: '上传失败!',
            icon: 'none'
          })
        }
      })
    } else {
      wx.showToast({
        title: '局分未结束，不能上传!',
        icon: 'none'
      })
    }
  }

})