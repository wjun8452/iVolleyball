Page({
  data:
  {
    "myScore": 0,
    "yourScore": 0,
    "lastOp" : 0 //0: no op, 1: add my score, -1: add your score
  },

  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '简单记分'
    })

    var saved = wx.getStorageSync('stats');

    this.setData(saved || this.data);
  },

  onUnload: function () {
    wx.setStorageSync("stats", this.data);
  },

  addScore: function () {
    var my = this.data.myScore;
    my = my + 1;
    this.setData({lastOp: 1});
    this.setData({myScore: my})
  },

  looseScore: function () {
    var you = this.data.yourScore;
    you = you + 1;
    this.setData({lastOp: -1})
    this.setData({ yourScore: you })
  },

  undo: function() {
    if (this.data.lastOp == 1) {
      var my = this.data.myScore;
      my = my - 1;
      this.setData({ myScore: my });
    } else if (this.data.lastOp == -1) {
      var you = this.data.yourScore;
      you = you - 1;
      this.setData({ yourScore: you })
    }

    this.setData({lastOp: 0});
  },

  reset: function() {
    this.setData({myScore:0, yourScore:0, lastOp:0});
  }

})



/*
 {

            "id": "b291fa3b-8f8c-4ff4-8bdf-10cbd4beae1e",
            "name": "上海大学第一场比赛",
            "status": "Lost",
            "date": 1486885125609,
            "isFaqiuLun": true,
            "totalScore": 25,
            "myScore": 0,
            "yourScore": 0,
            "stats": [
        {
            "statResult": "ADD_SCORE",
            "player": {
                "name": "陈沛"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "二师兄"
            },
            "playItem": "FAQIU",
            "isFaqiuBefore": true,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "player": {
                "name": "绒球"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "石头"
            },
            "playItem": "FANGSHOU",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "ADD_SCORE",
            "player": {
                "name": "小红帽"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": false,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "player": {
                "name": "石头"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "player": {
                "name": "二师兄"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "陈沛"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": true,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "陈沛"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "石头"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "小红帽"
            },
            "playItem": "YICHUAN",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "小红帽"
            },
            "playItem": "YICHUAN",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "ADD_SCORE",
            "player": {
                "name": "石头"
            },
            "playItem": "LANWANG",
            "isFaqiuBefore": false,
            "isFaqiuAfter": true
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "二师兄"
            },
            "playItem": "FAQIU",
            "isFaqiuBefore": true,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "小红帽"
            },
            "playItem": "YICHUAN",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "陈沛"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "石头"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "LOOSE_SCORE",
            "player": {
                "name": "绒球"
            },
            "playItem": "YICHUAN",
            "isFaqiuBefore": false,
            "isFaqiuAfter": false
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": false,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "player": {
                "name": "绒球"
            },
            "playItem": "JINGONG",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        },
        {
            "statResult": "ADD_SCORE",
            "isFaqiuBefore": true,
            "isFaqiuAfter": true
        }
    ],
    "players": [
        null,
        {
            "name": "石头"
        },
        {
            "name": "陈沛"
        },
        {
            "name": "张老师"
        },
        {
            "name": "绒球"
        },
        {
            "name": "小红帽"
        },
        {
            "name": "二师兄"
        }
    ]
    */