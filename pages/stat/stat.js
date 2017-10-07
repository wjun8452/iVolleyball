Page({
  data:
  {
    "myScore": 0,
    "yourScore": 0,
    "players" : [
        {
          "name" : "1",
          "play_items": [],
        }, 
        
        {
          "name": "2",
          "play_items": [],
        },

        {
          "name": "3",
          "play_items": [],
        },

        {
          "name": "4",
          "play_items": [],
        },

        {
          "name": "5",
          "play_items": [],
        },

        {
          "name": "6",
          "play_items": [],
        }
      ],
    "stat_items" : [],
    "serve" : false  //true: we serve, false: we serve return and attack
  },

  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '复杂记分牌'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var saved = wx.getStorageSync('stats');

    this.setData(saved || this.data);

    this.updatePlayItems();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    wx.setStorageSync("stats", this.data);
  },

  onUnload: function () {
  
  },

  onTapAddScore: function () {
    stat_items.push(this.createStatItem("", "", 1));

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

  undo: function() {
  },

  reset: function() {
    this.setData({myScore:0, yourScore:0});
  },

  createPlayItem: function (name, score) {
    var obj = new Object();
    obj.name = name;
    obj.score = score;
    return obj;
  },

  updatePlayItems: function () {
    var players = this.data.players;
    var serve = this.data.serve;

    var index = 0

    for (; index < players.length; index++) {
      var player = players[index];
      player.play_items = [];

      player.play_items.push(this.createPlayItem("扣球", 1));
      
      if (serve && index==0) {
        player.play_items.push(this.createPlayItem("发球", 1));
      }

      if (index >=1 && index <=3) {
        player.play_items.push(this.createPlayItem("拦网", 1));
      }

      //--------- negotive
      player.play_items.push(this.createPlayItem("扣球", -1));
      player.play_items.push(this.createPlayItem("串联", -1));
      if (serve && index == 0) {
        player.play_items.push(this.createPlayItem("发球", -1));
      }

      if (!serve) {
        player.play_items.push(this.createPlayItem("一传", -1));
      }

      if (index >= 1 && index <= 3) {
        player.play_items.push(this.createPlayItem("拦网", -1));
      }
    }

    this.setData({players: players});
  },

  onTapSetting: function() {
    wx.navigateTo({
      url: 'stat_setting',
    })
  },

  onTapPlayItem: function(e) {
    console.log(e)

    var player_index = e.target.dataset.player;
    var item_index = e.target.dataset.item;

    var player = this.data.players[player_index];
    var item = this.data.players[player_index].play_items[item_index];

    this.data.stat_items.push(this.createStatItem(player.name, item.name, item.score));
   
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

    console.log(this.data)
  },

  createStatItem: function(player, item, score) {
    var obj = new Object();
    obj.player = player
    obj.item = item;
    obj.score = score;
    return obj;
  },

})
