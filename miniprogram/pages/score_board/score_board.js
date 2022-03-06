// pages/score_board/score_board.js
var court = require("../../utils/court.js")
Page({
  /**
   * 页面的初始数据
   */
  data: {
    height: 0,
    width: 0,
    leftMode: false, //true：team_name[0]是我方，冗余变量，跟team_name的顺序始终保持一致, 技术统计页面只统计我方的得分情况，记分牌要考虑两队相对左右方位，因此引入此变量 
    team_name: ["对方", "我方"], //team_name[0]将始终显示在左边，显示用
  },
  start_x_1: 0,
  start_y_1: 0,
  start_x_2: 0,
  start_y_2: 0,
  watcher: null,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '大记分牌'
    })

    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    this.data = Object.assign(this.data, court.default_data, saved);

    var from_home_page = true
    if (options._id) {
      this.data._id = options._id
      from_home_page = false
    }

    if (options._openid) {
      this.data._openid = options._openid
    }

    if (!this.data._id && !this.data._openid) {//新创建的本地比赛最初是没有openid的
        this.data._openid = getApp().globalData.openid
    }

    console.log("[onLoad] _id:", this.data._id, "_openid:", this.data._openid, this.data)

    if (this.data._id) {
      const version = wx.getSystemInfoSync().SDKVersion
      if (this.compareVersion(version, '2.8.1') >= 0) {
        this.watchOnlinData(this.data._id, false, from_home_page)
      } else {
        this.loadOnlineData(this.data._id, from_home_page)
        // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
        wx.showModal({
          title: '提示',
          content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
        })
      }
    } else { //onDataLoaded will be invoked too in above if branch
      this.onDataLoaded()
    }
  },

  onDataLoaded: function () {
    // console.log(this.data)
    var res = wx.getSystemInfoSync()
    console.log("[wx.getSystemInfoSync]", res)
    console.log(this.data)
    this.data.height = res.windowHeight
    this.data.width = res.windowWidth
    this.data.team_name[0] = this.data.leftMode ? this.data.myTeam : this.data.yourTeam
    this.data.team_name[1] = this.data.leftMode ? this.data.yourTeam : this.data.myTeam
    this.data.isOwner = getApp().globalData.openid == this.data._openid;
    this.setData(this.data)
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if (!this.data.firstTimeUse) return;

    this.animate("#score_board", [
      { opacity: 0.1 },
      { opacity: 1}
    ], 4000, function() {
      this.clearAnimation("#score_board", function () {
        console.log("清除了#score_board")
      })
    }.bind(this))

    this.animate("#fresh_guide", [ 
      { opacity: 1 },
      { opacity: 1, ease: 'ease', translateY: -this.data.width/5*2} ],  
    4000, function() {
      this.clearAnimation("#fresh_guide", function () {
        console.log("清除了#fresh_guide")
      })
    }.bind(this))
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
    if (this.data.isOwner && this.data.status==1) {
      //console.log("score board onUnload")
      wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    }

    if (this.watcher) {
      this.watcher.close()
    }
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

  touchStart1: function (e) {
    this.start_x_1 = e.changedTouches[0].pageX;
    this.start_y_1 = e.changedTouches[0].pageY;
    //console.log("touchstart: ");
    //console.log(e);
  },

  touchEnd1: function (e) {
    var end_x = e.changedTouches[0].pageX;
    var end_y = e.changedTouches[0].pageY;
    this.touch_end(this.data.leftMode, this.start_x_1, this.start_y_1, end_x, end_y);
    //console.log("touchend: ");
    //console.log(e);
    this.data.firstTimeUse = false;
  },

  touchStart2: function (e) {
    this.start_x_2 = e.changedTouches[0].pageX;
    this.start_y_2 = e.changedTouches[0].pageY;
  },

  touchEnd2: function (e) {
    var end_x = e.changedTouches[0].pageX;
    var end_y = e.changedTouches[0].pageY;

    this.touch_end(!this.data.leftMode, this.start_x_2, this.start_y_2, end_x, end_y);
    this.data.firstTimeUse = false;
  },

  touch_end: function (mine, start_x, start_y, end_x, end_y) {
    var changeX = end_x - start_x;
    var changeY = end_y - start_y;

    var change_x_abs = Math.abs(changeX);
    var change_y_abs = Math.abs(changeY);

    if (change_x_abs < 50 && change_y_abs < 50) return;

    if (!this.data.isOwner || this.data.status == 0) {
      wx.showToast({
        title: '无法操作',
      })
      return;
    }

    if (change_y_abs < change_x_abs) { //上下滑动幅度大于左右
      if (changeX < 0) { //加分
        mine ? court.addScoreRotate(this.data) : court.looseScoreRotate(this.data);
        if (this.data._id) {
          var obj = new Object()
          obj["myScore"] = this.data.myScore;
          obj["yourScore"] = this.data.yourScore;
          obj["stat_items"] = this.data.stat_items;
          obj["who_serve"] = this.data.who_serve;
          obj["serve"] = this.data.serve;
          obj["players"] = this.data.players
          this.updateMatch(this.data._id, obj)
        } else {
          this.setData(this.data)
          wx.vibrateShort();
          this.checkMatchOver()
        }
      } else { //减分
        var item = court.getTopItem(this.data)
        if (item != null && mine && item.score > 0) {
          court.popStatItem(this.data);
        } else if (item != null && (!mine) && item.score < 0) {
          court.popStatItem(this.data);
        } else { //revert score and remove stat item
          court.revertScore(this.data, mine)
        }

        if (this.data._id) {
          var obj = new Object()
          obj["myScore"] = this.data.myScore;
          obj["yourScore"] = this.data.yourScore;
          obj["stat_items"] = this.data.stat_items;
          obj["who_serve"] = this.data.who_serve;
          obj["serve"] = this.data.serve;
          obj["players"] = this.data.players
          this.updateMatch(this.data._id, obj)
        } else {
          this.setData(this.data)
          wx.vibrateShort();
          this.checkMatchOver()
        }
      }
    } else if (change_y_abs > this.data.height * 2 / 3) { //从左滑到右
      this.onReset();
      wx.vibrateShort();
    }
  },

  swapTeam: function () {
    this.data.leftMode = !this.data.leftMode;
    var temp = this.data.team_name[0];
    this.data.team_name[0] = this.data.team_name[1];
    this.data.team_name[1] = temp;
    this.setData(this.data);
  },

  stopPageScroll: function () {
    return
  },

  onReset: function () {
    var that = this
    if (this.data._id) {
      wx.showModal({
        title: '比赛结束?',
        content: '结束分享，回到本地模式重开一局',
        showCancel: true,
        success: function (res) {
          if (res.confirm) {
            that.data.status = 0
            var obj = new Object()
            obj["status"] = 0
            that.updateMatch(that.data._id, obj, true)
          } else if (res.cancel) {}
        }
      })
    } else {
      wx.showModal({
        title: '比赛结束?',
        content: '分数将清零',
        showCancel: true,
        success: function (res) {
          if (res.confirm) {
            that.reset()
          } else if (res.cancel) {}
        }
      })

    }
  },

  reset: function () {
    this.data._id = null
    this.data._openid = getApp().globalData.openid
    this.data.status = 1
    this.data.stat_items = []
    this.data.myScore = 0
    this.data.yourScore = 0
    this.data.team_name = ["对方", "我方"]
    this.setData(this.data)
  },

  watchOnlinData: function (id, toShare, from_home_page) {
    wx.showLoading({
      title: '正在加载',
    })

    const that = this
    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    this.watcher = db.collection('vmatch').where({
        _id: id
      })
      .watch({
        onChange: function (snapshot) {
          console.log('[db.vmatch.watch]', id, snapshot)
          
          wx.hideLoading()

          var data = snapshot.docs[0]

          if (data) {
            that.data = Object.assign(that.data, data)
            that.data.create_time = that.data.create_time.toLocaleString()

            if (from_home_page && that.data.status==0) {//特殊处理一个偶尔出现的严重bug，从主页点击进来的无参数比赛不可能是结束状态，否则用户再也没办法开始新的比赛了,目前还未查明原因 
              that.reset() 
            } 

            that.onDataLoaded()
            if (snapshot.type === 'init') {
              if (toShare && that.data.isOwner) {
                wx.setStorageSync(getApp().globalData.cacheKey, that.data);
                //console.log("to share", that.data)
                wx.navigateTo({
                  url: '../share/share',
                })
              }
            } else {
              wx.vibrateShort();
            }
          } else {
            wx.showToast({
              title: '加载失败!',
              icon: 'none'
            })
          }
        },
        onError: function (err) {
          wx.hideLoading()
          wx.showToast({
            title: '加载失败!',
            icon: 'none'
          })
          console.error('[db.vmatch.watch]', id, err)
        }
      })
  },

  loadOnlineData: function (id, from_home_page) {
    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    var that = this

    db.collection('vmatch').where({
      _id: id,
    }).get({
      success(res) {
        console.log("[db.vmatch.get]", id)
        var data = res.data[0]
        that.data = Object.assign(that.data, data)
        that.data.create_time = that.data.create_time.toLocaleString()

        if (from_home_page && that.data.status==0) {//特殊处理一个偶尔出现的严重bug，从主页点击进来的无参数比赛不可能是结束状态，否则用户再也没办法开始新的比赛了,目前还未查明原因 
          that.reset() 
        } 

        wx.hideLoading()
        that.onDataLoaded()
      },
      fail(res) {
        console.log("[db.vmatch.get]", id, res)
        wx.hideLoading()
        wx.showToast({
          title: '加载失败',
        })
      }
    })
  },

  compareVersion: function (v1, v2) {
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)

    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }

    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i])
      const num2 = parseInt(v2[i])

      if (num1 > num2) {
        return 1
      } else if (num1 < num2) {
        return -1
      }
    }

    return 0
  },

  onShare: function () {
    if (this.data._id) {
      wx.setStorageSync(getApp().globalData.cacheKey, this.data);
      wx.navigateTo({
        url: '../share/share',
      })
    } else {
      this.uploadMatch();
    }
  },

  uploadMatch: function (e) {
    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    var that = this
    wx.showLoading({
      title: '正在加载...',
    })

    this.data.city = getApp().globalData.city
    this.data.create_time = db.serverDate()
    this.data.latlon = {
      latitude: getApp().globalData.lat,
      longitude: getApp().globalData.lon
    }
    this.data.place = getApp().globalData.place
    delete this.data._id //向数据库插入数据时_id不能有哦，否则报内部错误
    delete this.data._openid //这个也是内部数据，不能有哦

    db.collection('vmatch').add({
      data: this.data,
      success: function (res) {
        console.log("[db.vmatch.add]", res._id)
        wx.hideLoading()
        wx.showToast({
          title: '上传成功!',
          icon: 'success'
        })

        that.data._id = res._id
        that.watchOnlinData(res._id, true);
      },
      fail: function (res) {
        console.log("[db.vmatch.add]", res)
        wx.hideLoading()
        wx.showToast({
          title: '上传失败!',
          icon: 'none'
        })
      }
    })
  },

  updateMatch: function (id, updated_parts, reset) {
    var that = this

    wx.showLoading({
      title: '正在加载',
    })

    const db = wx.cloud.database({
      env: getApp().globalData.env
    })


    db.collection('vmatch').doc(id).update({
      // data 传入需要局部更新的数据
      data: updated_parts,
      success: function (res) {
        console.log("[db.vmatch.update]", id, res)
        if (reset) {
          that.reset()
        } else {
          that.checkMatchOver()
          that.setData(that.data)
        }
        wx.hideLoading()
      }
    })

  },

  isMatchOver: function () {
    var score = this.data.total_score;
    var s1 = this.data.myScore
    var s2 = this.data.yourScore
    return (s1 >= score || s2 >= score) && (s1 - s2 >= 2 || s2 - s1 >= 2);
  },

  checkMatchOver: function () {
    if (this.isMatchOver()) {
      this.onReset();
    }
  },

})