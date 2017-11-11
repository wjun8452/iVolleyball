// pages/score_board/score_board.js
Page({

  /**
   * 页面的初始数据
   */
  data:
  {
    "height": 0,
    "width": 0,
    "score_height": 0,
    "score_width": 0,
    "colon_height": 0,
    "colon_width": 0,
    "myScore": 0,
    "yourScore": 0,
    "stat_items": []
  },
  start_x_1: 0,
  start_y_1: 0,
  start_x_2: 0,
  start_y_2: 0,


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '大记分牌'
    })

    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    this.setData(saved || this.data);
    var res = wx.getSystemInfoSync()
    //can not use this.data.height to set score_height
    this.setData({
      height: res.windowHeight, width: res.windowWidth,
      score_height: res.windowHeight / 80 * 39,
      score_width: res.windowWidth,
      colon_height: res.windowHeight / 80 * 2,
      colon_width: res.windowWidth
    })
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
 
  touchStart1: function (e) {
    this.start_x_1 = e.changedTouches[0].pageX;
    this.start_y_1 = e.changedTouches[0].pageY;
    //console.log("touchstart: ");
    //console.log(e);
  },

  touchMove1: function (e) {

  },

  touchEnd1: function (e) {
    var end_x = e.changedTouches[0].pageX;
    var end_y = e.changedTouches[0].pageY;
    this.touch_end(true, this.start_x_1, this.start_y_1, end_x, end_y);
    //console.log("touchend: ");
    //console.log(e);
  },

  touchStart2: function (e) {
    this.start_x_2 = e.changedTouches[0].pageX;
    this.start_y_2 = e.changedTouches[0].pageY;
  },

  touchEnd2: function (e) {
    var end_x = e.changedTouches[0].pageX;
    var end_y = e.changedTouches[0].pageY;

    this.touch_end(false, this.start_x_2, this.start_y_2, end_x, end_y);
  },

  touch_end: function (mine, start_x, start_y, end_x, end_y) {
    var changeX = end_x - start_x;
    var changeY = end_y - start_y;

    var change_x_abs = Math.abs(changeX);
    var change_y_abs = Math.abs(changeY);

    if (change_x_abs < 50 && change_y_abs < 50) return;

    if (change_y_abs < change_x_abs) {
      if (changeX > 0) {
        mine ? this.changeMyScore(1) : this.changeYourScore(1);
      } else {
        mine ? this.changeMyScore(-1) : this.changeYourScore(-1);
      }
    } else if (change_y_abs > this.data.height*2/3) {
      this.changeMyScore(-this.data.myScore);
      this.changeYourScore(-this.data.yourScore);
    }
  },

  changeMyScore: function (delta) {
    this.data.stat_items.push(this.createStatItem("", "", delta));

    var s = this.data.myScore + delta;

    if (s >= 0) {
      this.setData({ myScore: s });
    } else {

    }
  },

  changeYourScore: function (delta) {
    this.data.stat_items.push(this.createStatItem("", "", delta));
    var s = this.data.yourScore + delta;
    if (s >= 0) {
      this.setData({ yourScore: s });
    }
  },

  createStatItem: function (player, item, score) {
    var obj = new Object();
    obj.player = player
    obj.item = item;
    obj.score = score;
    return obj;
  },
})