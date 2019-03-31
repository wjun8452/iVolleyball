var court = require("../../utils/court.js")
var util = require("../../utils/util.js")
//var qcloud = require('../../vendor/wafer2-client-sdk/index')


Page({
  data:
  {
    ui: {
      height: 0,
      width: 0,
    },
    match: {}
  },
  timer: null,
  start_x_1: 0,
  start_y_1: 0,
  start_x_2: 0,
  start_y_2: 0,


  /**
   * 生命周期函数--监听页面加载
   * options.uuid 显示指定id的比赛，本页面将根据id去server查询
   * options.match 显示match的内容，无需查询
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '大记分牌'
    })

    this.adjustWindowSize()

    if (options.uuid) {
      this.fetchMatch(options.uuid)
    } else if (options.match) {
      this.showMatch(options)
    } else {
      this.createMatch(options.team1, options.team2)
    }
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
    clearTimeout(this.timer)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    clearTimeout(this.timer)
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
  },

  touchEnd1: function (e) {
    var end_x = e.changedTouches[0].pageX;
    var end_y = e.changedTouches[0].pageY;
    this.touch_end(true, this.start_x_1, this.start_y_1, end_x, end_y);
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
      if (changeX < 0) {
        mine ? this.changeMyScore(1) : this.changeYourScore(1);
        wx.vibrateShort();
      } else {
        mine ? this.changeMyScore(-1) : this.changeYourScore(-1);
        wx.vibrateShort();
      }
    } else if (change_y_abs > this.data.ui.height*2/3) {
      this.changeMyScore(-this.data.match.score1);
      this.changeYourScore(-this.data.match.score2);
      wx.vibrateShort();
    }
  },

  startTimer: function(uuid) {
    if (this.checkPermission()) {
      return; //auther do not need refresh
    }

    var that = this;
    this.timer = setTimeout(function() {
      that.fetchMatch(uuid)
    } ,5000);
  },

  checkPermission: function() {
    if (this.data.match._openid == getApp().globalData.openid) {
        return true;
    } else {
      console.log("this match is owned by " + this.data.match._openid)
      console.log("current user id " + getApp().globalData.openid)
      wx.showToast({title:'没有权限修改分数'})
      return false;
    }
  },

  changeMyScore: function (delta) {
    if (!this.checkPermission()) {
      return;
    }

    var s = this.data.match.score1 + delta;
    if (s >= 0) {
      this.data.match.score1 = s;
      this.setData({match: this.data.match});
      this.updateScore();
    }
  },

  changeYourScore: function (delta) {
    if (!this.checkPermission()) {
      return;
    }

    var s = this.data.match.score2 + delta;
    if (s >= 0) {
      this.data.match.score2 = s;
      this.setData({ match: this.data.match });
      this.updateScore();
    }
  },

  updateScore: function() {
    const db = wx.cloud.database()
    const vmatch = db.collection('vmatch')
    util.showBusy("正在加载...")
    vmatch.doc(this.data.match._id).update({
      // data 传入需要局部更新的数据
      data: {
        // 表示将 done 字段置为 true
        score1: this.data.match.score1,
        score2: this.data.match.score2
      },
      success: function (res) {
        console.log('[vmatch] update score succeed.')
        util.hideToast()
      }
    })
  },

  adjustWindowSize: function() {
    var res = wx.getSystemInfoSync()
    this.setData({
      ui: {
        height: res.windowHeight-2,
        width: res.windowWidth-2,
      }
    })
    console.log("window height:" + this.data.ui.height + "px")
    console.log("window width:" + this.data.ui.width + "px")
  },

  fetchMatch: function(uuid) {
    var that = this
    const db = wx.cloud.database()
    const vmatches = db.collection('vmatch')
    util.showBusy("正在加载...")
    vmatches.where({
      _id: uuid
    }).skip(0) // 跳过结果集中的前 10 条，从第 11 条开始返回
      .limit(10) // 限制返回数量为 10 条
      .get()
      .then(res => {
        console.log(res.data)
        util.hideToast()
        that.setData({match: res.data})
      })
      .catch(err => {
        console.error(err)
        util.hideToast()
      })
  },

  //   const url = config.service.matchUrl + '?uuid=' + uuid
  //   var that = this;
  //  // console.log("Navigated to " + url)
  //   //util.showBusy("正在加载...")
  //   qcloud.request({
  //     url: url,
  //     method: 'POST',
  //     success: function (res) {
  //       console.log(res)
  //       that.setData({ match: res.data.data })
  //       that.startTimer(uuid)
  //     },
  //     fail: function (res) {
  //       console.log(res)
  //     },
  //     complete: function (res) {
  //       util.hideToast()
  //     }
  //   })
  // },

  createMatch: function (team1, team2) {
    var that = this;
    const db = wx.cloud.database()
    const vmatches = db.collection('vmatch')
    var data = {
      city: getApp().globalData.city,
      create_time: db.serverDate(),
      latlon: {
        latitude: getApp().globalData.lat,
        longitude: getApp().globalData.lon
        },
      place: getApp().globalData.place,
      score1: 0,
      score2: 0,
      team1: team1,
      team2: team2
      }
    util.showBusy("正在创建...")
    vmatches.add({
      data: data,
      success: function(res) {
        console.log("[vmatch] created. ", res)
        data._id = res._id
        that.setData({ match: data })
        util.hideToast()
      },
      fail: function(res) {
        console.error("[vmatch] failed to create!", res)
        util.hideToast()
        util.showBusy("网络同步失败，创建在本地")
        that.setData({ match: data })
        util.hideToast()
      },
      complete: function() {
        
      }
    })
  },

  swapTeam: function() {
    const team1 = this.data.match.team1
    const team2 = this.data.match.team2
    if (team1 != team2) {
      this.data.match.team1 = team2
      this.data.match.team2 = team1
      this.setData(this.data)
      if(this.checkPermission()) {
        this.updateScore()
      } 
    }
  },

  showMatch: function(options) {
    let match = util.decodeQuery(options).match
    // console.log(match)
    this.setData({match: match});
  }
})