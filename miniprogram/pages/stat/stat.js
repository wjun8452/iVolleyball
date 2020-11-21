var court = require("../../utils/court.js")

Page({
  data: court.default_data,
  _id: null,
  _openid: null,
  watcher: null,

  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '技术统计'
    })

    if (options._id && options._openid) {
      this._id = options._id;
      this._openid = options._openid
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    //always load from local storage if not explicitly said from URL
    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    this.data = Object.assign(this.data, court.default_data, saved);

    var from_home_page = true
    if (this._id) {
      this.data._id = this._id;
      from_home_page = false
    }

    if (this._openid) {
      this.data._openid = this._openid
    }
      
    if (!this.data._openid && !this.data._id) {
      this.data._openid = getApp().globalData.openid
    }

    console.log("[onShow] _id:", this.data._id, "_openid:", this.data._openid, "data", this.data)

    if (this.data._id) { //if it has a vmatch id
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
    } else {
      this.onDataLoaded()
    }
  },

  onDataLoaded: function () {
    this.data.isOwner = (getApp().globalData.openid == this.data._openid);
    console.log("isOwner:", this.data.isOwner)
    this.data.opCat = null
    this.data.opPosition = -1
    if (this.data.player_allowed == null) {
      this.data.player_allowed = this.data.all_players
    }
    court.updateAvailableItems(this.data);
    this.setData(this.data)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.data.isOwner && this.data.status == 1) {
      wx.setStorageSync(getApp().globalData.cacheKey, this.data);
      console.log("[onHide] save data:", this.data)
    }
    if (this.watcher) {
      this.watcher.close()
    }
  },

  onUnload: function () {
    this.onHide() //sometimes only onUnload called, onHide is not called
  },

  onShareAppMessage: function (e) {

  },

  onTapAddScore: function () {
    court.addScoreRotate(this.data)
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
      this.setData(this.data);
      wx.vibrateShort();
    }
    this.checkMatchOver()
  },

  onTapLooseScore: function () {
    court.looseScoreRotate(this.data);
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
      this.setData(this.data);
      wx.vibrateShort();
    }
    this.checkMatchOver()
  },

  onTapSetting: function () {
    wx.navigateTo({
      url: '../stat_setting/stat_setting',
    })
  },

  onTapPlayItem: function (e) {
    this.data.opCat = null
    this.data.opPosition = -1
    var position = e.target.dataset.position;
    var item_index = e.target.dataset.play_item_index;
    court.stateRotate(this.data, position, item_index);
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
    }
    this.checkMatchOver()
  },

  onTapRevert: function (e) {
    court.popStatItem(this.data);
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
      this.setData(this.data);
    }
  },

  onTapScore: function (e) {
    var mid = this.data._id ? this.data._id : ""
    var oid = this.data._openid ? this.data._openid : ""
    wx.navigateTo({
      url: '../score_board/score_board?_id=' + mid + '&_openid=' + oid,
    })
  },

  onTapCat: function (e) {
    var position = e.target.dataset.position;
    var category = e.target.dataset.cat;
    this.data.opPosition = position
    this.data.opCat = category
    this.setData(this.data)
  },

  onTapBoard: function (e) {
    this.data.opCat = null
    this.data.opPosition = -1
    this.setData(this.data)
  },

  isMatchOver: function () {
    var score = this.data.total_score;
    var s1 = this.data.myScore
    var s2 = this.data.yourScore
    return (s1 >= score || s2 >= score) && (s1 - s2 >= 2 || s2 - s1 >= 2);
  },

  checkMatchOver: function () {
    var that = this
    if (this.isMatchOver()) {
      this.onTapMatchOver();
    }
  },

  uploadData: function (e) {
    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    var that = this
    wx.showLoading({
      title: '正在加载',
    })

    this.data.city = getApp().globalData.city
    this.data.create_time = db.serverDate()
    this.data.latlon = {
      latitude: getApp().globalData.lat,
      longitude: getApp().globalData.lon
    }
    this.data.place = getApp().globalData.place
    delete this.data._id //向数据库插入数据时_id不能有哦，否则报内部错误
    delete this.data._openid //

    db.collection('vmatch').add({
      data: this.data,
      success: function (res) {
        console.log(res)
        that.resetData()
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '上传成功! 进入主页历史记录可查看统计数据！现在就去查看？',
          success (res2) {
            if (res2.confirm) {
              wx.navigateTo({ 
                url: '../report/report?_id=' + res._id, 
              }) 
            } else if (res2.cancel) {
              console.log('用户点击取消')
            }
          }
        })
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '上传失败!',
          icon: 'none'
        })
      }
    })
  },

  resetData: function () {
    this._openid = getApp().globalData.openid
    this.data.stat_items = []
    this.data.myScore = 0
    this.data.yourScore = 0
    this.data._id = null
    this.data.status = 1
    this.setData(this.data)
  },

  onTapMatchOver: function () {
    var that = this
    wx.showModal({
      title: '比赛结束?',
      content: '点击确定将清零比分并上传数据',
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          that.data.status = 0
          if (that.data._id) {
            var obj = new Object()
            obj["status"] = 0
            that.updateMatch(that.data._id, obj, true)
          } else {
            that.uploadData()
          }
        } else if (res.cancel) {

        }
      }
    })
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
          console.log('[db.vmatch.watch] id:', id, snapshot)
          var data = snapshot.docs[0]
          that.data = Object.assign(that.data, data)
          that.data.create_time = that.data.create_time.toLocaleString()

          if (from_home_page && that.data.status==0) {//特殊处理一个偶尔出现的严重bug，从主页点击进来的无参数比赛不可能是结束状态，否则用户再也没办法开始新的比赛了,目前还未查明原因 
            that.resetData() 
          } 

          that.onDataLoaded()
          if (snapshot.type === 'init') {
            if (toShare) {
              // wx.setStorageSync(getApp().globalData.cacheKey, that.data);
              // wx.navigateTo({
              //   url: '../share/share',
              // })
            }
          } else {
            wx.vibrateShort();
          }
          wx.hideLoading()
        },
        onError: function (err) {
          wx.hideLoading()
          console.error('[db.vmatch.watch] err:', err)
        }
      })
  },

  updateMatch: function (id, myScore, yourScore, stat_items) {
    var that = this

    wx.showLoading({
      title: '正在加载',
    })

    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    db.collection('vmatch').doc(id).update({
      // data 传入需要局部更新的数据
      data: {
        // 表示将 done 字段置为 true
        myScore: myScore,
        yourScore: yourScore,
        stat_items: stat_items
      },
      success: function (res) {
        console.log("[db.vmatch.update] id:", id)
        that.setData(that.data)
      },
      fail: function (res) {
        console.error("[db.vmatch.update] id:", id, "err:", res)
      }
    })

  },

  loadOnlineData: function (id) {
    const db = wx.cloud.database({
      env: getApp().globalData.env
    })

    var that = this

    db.collection('vmatch').where({
      _id: id,
    }).get({
      success(res) {
        console.log("[db.vmatch.get] id:", id, "res:", res)
        var data = res.data[0]
        that.data = Object.assign(that.data, data)
        that.data.create_time = that.data.create_time.toLocaleString()

        if (from_home_page && that.data.status==0) {//特殊处理一个偶尔出现的严重bug，从主页点击进来的无参数比赛不可能是结束状态，否则用户再也没办法开始新的比赛了,目前还未查明原因 
          that.resetData() 
        } 
        
        wx.hideLoading()
        that.onDataLoaded()
      },
      fail(res) {
        console.error("[db.vmatch.get] id:", id, "res", res)
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
        console.log("[db.vmatch.update] id:", id, "res", res)
        if (reset) {
          that.resetData()
          wx.showModal({
            title: '提示',
            content: '上传成功! 进入主页历史记录可查看统计数据！现在就去查看？',
            success (res2) {
              if (res2.confirm) {
                wx.navigateTo({ 
                  url: '../report/report?_id=' + res._id, 
                }) 
              } else if (res2.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        } else {
          that.setData(that.data)
        }
        wx.hideLoading()
      },
      fail: function (res) {
        console.error("[db.vmatch.update] id:", id, "res", res)
      }
    })

  },

})