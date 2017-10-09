Page({
  data:
  {
    "myScore": 0,
    "yourScore": 0,
    "all_players": ["1号", "2号", "3号", "4号", "5号", "6号"],
    "players": ["1号", "2号", "3号", "4号", "5号", "6号"],
    "play_items" : [[], [], [], [], [], []],
    "stat_items" : [],
    "serve" : false,  //true: we serve, false: we serve return and attack
  },

  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '技术统计'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("onShow")
    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    // console.log(saved)
    this.setData(saved || this.data);
    this.updatePlayItems();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    console.log("onHide")
  },

  onUnload: function () {
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
    console.log("onUnload")
  },

  onTapAddScore: function () {
    this.data.stat_items.push(this.createStatItem("", "", 1));

    this.addScore();

    //next position
    if (!this.data.serve) {
      this.updateServe(true);
      this.updatePosition();
      this.updatePlayItems();
    }
  },

  addScore: function() {
    var myScore = this.data.myScore;
    myScore = myScore + 1;
    this.setData({ myScore: myScore });
  },

  updatePosition: function() {
    var players = this.data.players;
    var player = players[5];
    players[5] = players[0];
    players[0] = players[1];
    players[1] = players[2];
    players[2] = players[3];
    players[3] = players[4];
    players[4] = player;
    this.setData({players: players});
  },

  updateServe: function(serve) {
    this.setData({serve, serve});
  },

  onTapLooseScore: function() {
    this.data.stat_items.push(this.createStatItem("", "", -1));
    this.looseScore();
    if (this.data.serve) {
      this.updateServe(false);
      this.updatePlayItems();
    }
  },

  looseScore: function () {
    var yourScore = this.data.yourScore;
    yourScore = yourScore + 1;
    this.setData({ yourScore: yourScore });
  },

  createPlayItem: function (name, score) {
    var obj = new Object();
    obj.name = name;
    obj.score = score;
    return obj;
  },

  updatePlayItems: function () {
    var serve = this.data.serve;
    var m_play_items = this.data.play_items;

    for (var index in m_play_items) {
      m_play_items[index] = [];
      var play_items = m_play_items[index];

      play_items.push(this.createPlayItem("进攻", 1));
      
      if (serve && index==0) {
        play_items.push(this.createPlayItem("发球", 1));
      }

      if (index >=1 && index <=3) {
        play_items.push(this.createPlayItem("拦网", 1));
      }

      //--------- negotive
      play_items.push(this.createPlayItem("进攻", -1));
      play_items.push(this.createPlayItem("串联", -1));
      if (serve && index == 0) {
        play_items.push(this.createPlayItem("发球", -1));
      }

      if (!serve) {
        play_items.push(this.createPlayItem("一传", -1));
      }

      if (index >= 1 && index <= 3) {
        play_items.push(this.createPlayItem("拦网", -1));
      }
    }

    this.setData({play_items: m_play_items});
  },

  onTapSetting: function() {
    wx.navigateTo({
      url: 'stat_setting',
    })
  },

  onTapPlayItem: function(e) {

    var position = e.target.dataset.position;
    var item_index = e.target.dataset.play_item_index;

    var player = this.data.players[position];
    var item = this.data.play_items[position][item_index];

    this.data.stat_items.push(this.createStatItem(player, item.name, item.score));
   
    if (item.score == 1) {
      this.addScore();

      //next position
      if (!this.data.serve) {
        this.updateServe(true);
        this.updatePosition();
        this.updatePlayItems();
      }

    } else if (item.score == -1) {
      this.looseScore();
      if (this.data.serve) {
        this.updateServe(false);
        this.updatePlayItems();
      }
    }
  },

  createStatItem: function(player, item, score) {
    var obj = new Object();
    obj.player = player
    obj.item = item;
    obj.score = score;
    return obj;
  },

  onPlayerChanged: function(e) {
    var position = e.target.dataset.position;
    var new_player_index = e.detail.value;

    var players = this.data.players;
    players[position] = this.data.all_players[new_player_index];
    this.setData({ players: players })
  }

})
