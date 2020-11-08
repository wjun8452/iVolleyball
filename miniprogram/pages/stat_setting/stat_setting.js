// pages/stat_setting/stat_setting.js
var court = require("../../utils/court.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '场上设置'
    })
    this.data.edit_pos = -1,
      this.data.total_scores = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]
    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    Object.assign(this.data, court.default_data, saved);

    if (options._id) { //from url
      this.data._id = options._id
    }

    console.log("[onLoad] data:", this.data)

    this.onDataLoaded()
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
    console.log("[onUnload]")
    delete this.data.total_scores;
    delete this.data.edit_pos;
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

  onDataLoaded: function () {
    this.data.edit_pos = -1;
    this.setData(this.data)
  },

  onReset: function () {
    this.data.stat_items = []
    this.data.myScore = 0
    this.data.yourScore = 0
    
    if (this.data._id) {
      var obj = new Object()
      obj["stat_items"] = this.data.stat_items;
      obj["myScore"] = this.data.myScore;
      obj["yourScore"] = this.data.yourScore;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data)
    }
  },

  onChangeMyScore: function (e) {
    this.data.myScore = parseInt(e.detail.value);
    if (this.data._id) {
      var obj = new Object()
      obj["myScore"] = this.data.myScore;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data);
    }
  },

  onChangeYourScore: function (e) {
    this.data.yourScore = parseInt(e.detail.value);
    if (this.data._id) {
      var obj = new Object()
      obj["yourScore"] = this.data.yourScore;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data);
    }
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

    if (this.data._id) {
      var obj = new Object()
      obj["players"] = this.data.players;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data)
    }
  },

  onCheckWhoServe: function (e) {
    var position = e.target.dataset.position;
    var checked = e.detail.value.length == 1;

    if (checked) {
      this.data.who_serve = position;
    } else {
      this.data.serve = false;
    }
    if (this.data._id) {
      var obj = new Object()
      obj["who_serve"] = this.data.who_serve;
      obj["serve"] = this.data.serve;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data)
    }
  },

  onTapMode: function (e) {
    var mode = e.detail.value; //0: front_back, 1: normal
    if (mode == "0") {
      this.data.front_back_mode = true;
    } else {
      this.data.front_back_mode = false;
    }
    if (this.data._id) {
      var obj = new Object()
      obj["front_back_mode"] = this.data.front_back_mode;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data);
    }

  },

  onTapServe: function (e) {
    var serve = e.detail.value; //0: 我方发球, 1: 对方发球
    if (serve == 0) {
      this.data.serve = true;
      if (this.data.who_serve == -1) {
        this.data.who_serve = 0;
      }
    } else {
      this.data.serve = false;
      //this.data.who_serve = -1; //must not change who_serve, 记录上次我方是谁在发球，如果复位，则会丢失状态
    }

    if (this.data._id) {
      var obj = new Object()
      obj["who_serve"] = this.data.who_serve;
      obj["serve"] = this.data.serve;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data);
    }
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
      if (player.length > 4) {
        wx.showToast({
          title: '名称不能超过4个字符或汉字!',
          icon: 'none'
        })
      } else if (player.length == 0) {
        wx.showToast({
          title: '名称不能为空',
          icon: 'none'
        })
      } else if (this.data.all_players.indexOf(player) == -1) {
        this.data.all_players.unshift(player);
        this.data.players[position] = player;
        this.data.edit_pos = -1
        if (this.data._id) {
          var obj = new Object()
          obj["all_players"] = this.data.all_players;
          obj["players"] = this.data.players;
          this.updateMatch(this.data._id, obj)
        } else {
          this.setData(this.data)
        }
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
    if (this.data._id) {
      var obj = new Object()
      obj["players"] = this.data.players;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data)
    }
  },

  rotate: function (e) {
    court.rotate(this.data);
    if (this.data._id) {
      var obj = new Object()
      obj["players"] = this.data.players;
      obj["who_serve"] = this.data.who_serve;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data);
    }
  },

  onAddMyScore: function() {
    this.changeMyScore(1);
  },

  onReduceMyScore: function() {
    this.changeMyScore(-1);
  },

  onAddYourScore: function() {
    this.changeYourScore(1);
  },

  onReduceYourScore: function() {
    this.changeYourScore(-1);
  },


  changeMyScore: function (delta) {
    var s = this.data.myScore + delta;
    if (s >= 0) {
      this.data.myScore = s;
      if (this.data._id) {
        var obj = new Object()
        obj["myScore"] = this.data.myScore;
        this.updateMatch(this.data._id, obj)
      } else {
        this.setData(this.data);
      }
    }
  },

  changeYourScore: function (delta) {
    var s = this.data.yourScore + delta;
    if (s >= 0) {
      this.data.yourScore = s;
      if (this.data._id) {
        var obj = new Object()
        obj["yourScore"] = this.data.yourScore;
        this.updateMatch(this.data._id, obj)
      } else {
        this.setData(this.data);
      }
    }
  },

  onCheckAllowedStatItem: function (e) {
    this.data.cat_allowed = e.detail.value;
    if (this.data._id) {
      var obj = new Object()
      obj["cat_allowed"] = this.data.cat_allowed;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data)
    }
  },

  

  onCheckAllowedPlayer: function (e) {
    var player_allowed = e.detail.value;

    //循环查看场上球员是否被勾选
    for (var i = 0 ; i < this.data.players.length; i++) {
      var player = this.data.players[i];
      var index = player_allowed.indexOf (player);
      if (index == -1) { //该球员未被勾选
          var index2 = this.data.player_allowed.indexOf(player);
          if (index2 != -1) {
              this.data.player_allowed.splice(index2);
          }
      } else {
        var index2 = this.data.player_allowed.indexOf(player);
        if (index2 == -1) {
          this.data.player_allowed.push(player);
        }
      }
    }

    if (this.data._id) {
      var obj = new Object()
      obj["player_allowed"] = this.data.player_allowed;
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData(this.data)
    }
  },

  onEditTeam: function (e) {
    let dataset = e.currentTarget.dataset
    let name = e.detail.value

    name = name.replace(/^\s*|\s*$/g, "");
    if (name.length > 4) {
      wx.showToast({
        title: '名称不能超过4个字符或汉字!',
        icon: 'none'
      })
    } else if (name.length > 0) {
      this.data[dataset.obj] = e.detail.value
      var update_parts = new Object()
      update_parts[dataset.obj] = e.detail.value
      if (this.data._id) {
        this.updateMatch(this.data._id, update_parts)
      } else {
        this.setData(this.data)
      }
    } else {
      wx.showToast({
        title: '名称不能为空！',
        icon: 'none'
      })
    }

  },

  updateMatch: function (id, updated_parts) {
    var that = this

    wx.showLoading({
      title: '正在上传',
    })

    const db = wx.cloud.database({
      env: getApp().globalData.env
    })


    db.collection('vmatch').doc(id).update({
      // data 传入需要局部更新的数据
      data: updated_parts,
      success: function (res) {
        console.log(res.data)
        that.setData(that.data)
        wx.hideLoading()
      }
    })

  },

  bindTotalScoreChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.data.total_score = this.data.total_scores[e.detail.value]

    if (this.data._id) {
      var obj = new Object()
      obj["total_score"] = this.data.total_score
      this.updateMatch(this.data._id, obj)
    } else {
      this.setData({
        total_score: this.data.total_score
      })
    }
  },


  setterEnabled: function(e) {
    const values = e.detail.value;
    this.data.is_setter_enabled  = values.length > 0;
    if (this.data._id) {
      var obj = new Object();
      obj["is_setter_enabled"] = this.data.is_setter_enabled;
      this.updateMatch(this.data._id, obj);
    } else {
      this.setData({
        is_setter_enabled: this.data.is_setter_enabled
      })
    }
  }, 

  bindSetterChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.setter = e.detail.value;

    if (this.data._id) {
      var obj = new Object();
      obj["setter"] = this.data.setter;
      this.updateMatch(this.data._id, obj);
    } else {
      this.setData({
        setter: e.detail.value
      })
  }
  },


  bindLiberoChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.libero = e.detail.value;

    if (this.data._id) {
      var obj = new Object();
      obj["libero"] = this.data.libero;
      this.updateMatch(this.data._id, obj);
    } else {
      this.setData({
        libero: e.detail.value
      })
  }
  },

  liberoEnabled: function(e) {
    const values = e.detail.value;
    this.data.is_libero_enabled  = values.length > 0;
    if (this.data._id) {
      var obj = new Object();
      obj["is_libero_enabled"] = this.data.is_libero_enabled;
      this.updateMatch(this.data._id, obj);
    } else {
      this.setData({
        is_libero_enabled: this.data.is_libero_enabled
      })
    }
  }, 

  bindLiberoReplacement1: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value);

    this.data.libero_replacement1 = e.detail.value;

    if (this.data._id) {
      var obj = new Object();
      obj["libero_replacement1"] = this.data.libero_replacement1;
      this.updateMatch(this.data._id, obj);
    } else {
      this.setData({
        libero_replacement1: e.detail.value
      })
    }
  },

  bindLiberoReplacement2: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.data.libero_replacement2 = e.detail.value;

    if (this.data._id) {
      var obj = new Object();
      obj["libero_replacement2"] = this.data.libero_replacement2;
      this.updateMatch(this.data._id, obj);
    } else {
      this.setData({
        libero_replacement2: e.detail.value
      })
    }
  },


})