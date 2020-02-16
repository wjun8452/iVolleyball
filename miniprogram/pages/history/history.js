// miniprogram/pages/history.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    matches: [], //以前上传过的比赛
    isLoading: false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '历史记录',
    })
    this.fetchData()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.fetchData()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  fetchData: function() {
    var app = getApp()
    var openid = app.globalData.openid

    this.data.isLoading = true
    wx.showLoading({
      title: '正在加载...',
    })

    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    var that = this

    db.collection('vmatch').where({
        _openid: openid,
      }).field({
        _id: true,
        myScore: true,
        yourScore: true,
        create_time: true,
        myTeam: true,
        yourTeam: true,
        place: true
      }).orderBy('create_time', 'desc')
      .get({
        success(res) {
          //console.log(res)
          that.data.matches = res.data
          for (var i in that.data.matches) {
            that.data.matches[i].create_time = that.data.matches[i].create_time.toLocaleString()
          }
          that.data.isLoading = false
          wx.hideLoading()
          that.setData(that.data)
        },
        fail(res) {
          console.log(res)
          that.data.isLoading = false
          wx.hideLoading()
          wx.showToast({
            title: '加载失败',
          })
        }
      })

  },
  tapMatch: function(e) {
    var _id = e.currentTarget.dataset.matchid;
    wx.navigateTo({
      url: '../stat/report?_id=' + _id,
    })
  }

})