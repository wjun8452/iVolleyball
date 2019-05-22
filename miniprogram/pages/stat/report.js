var court = require("../../utils/court.js")


Page({

  /**
   * 页面的初始数据
   */
  data: {
    summary: {}, //临时计算出来的
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '历史报表'
    })

    wx.showLoading({
      title: '加载中...',
    })

    //load data
    if (options.id != null && options.id != undefined) {
      this.loadData(options.id)
    } else {
      var saved = wx.getStorageSync(getApp().globalData.cacheKey);
      this.data = Object.assign(this.data, court.default_data, saved);

      //create summary
      var statistics = this.createStatistics(this.data.stat_items)
      this.data.summary["标题"] = this.createSummaryForPlayer(null)
      this.data.summary['meta'] = {
        myScore: this.data.myScore,
        yourScore: this.data.yourScore
      }
      this.createSummary(this.data.summary, this.data.players, statistics);

      wx.hideLoading();
      this.setData(this.data);
    }
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
    var saved = wx.getStorageSync('stats');
    this.setData(saved || this.data);
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(res) {
    var path = '/pages/stat/report?id=' + this.data.summary.meta.id
    console.log("share path=" + path)
    return {
      title: '分享本局赛况',
      path: path,
      fail: function(res) {
        wx.showToast({
          title: '分享失败',
        })
      }
    }
  },

  //将项目次数按人头汇总
  createStatistics: function(stats) {
    var statistics = {}
    for (var index in stats) {
      var stat = stats[index];

      var player = stat.player;
      if (player.length == 0) {
        continue;
      }

      if (statistics.hasOwnProperty(player)) {
        console.log("add new stat")
        var it = statistics[player]
        this._addStatistic(it, stat.item)

      } else {
        console.log("create new stat")
        var it = this._createNewStatistic(player, stat.item);
        statistics[player] = it;

      }
    }

    return statistics;
  },

  createSummary: function(summary, players, statistics) {
    for (var index in players) {
      var player = players[index]
      var statistic = statistics[player]
      var sum = this.createSummaryForPlayer(statistic)
      summary[player] = sum
    }
  },

  createSummaryForPlayer: function(statistic) {
    var summary = {
      "得分": {
        "总得分": 0,
        "发球防反阶段得分": 0,
        "净得分": 0
      },
      "发球": {
        "总数": 0,
        "失误": 0,
        "直接得分": 0,
        "效率": 0
      },
      "一传": {
        "总数": 0,
        "失误": 0,
        "到位率": 0,
        "完美到位率": 0,
        "到位效率": 0
      },
      "进攻": {
        "总数": 0,
        "失误": 0,
        "被拦死": 0,
        "得分": 0,
        "成功率": 0,
        "成功效率": 0
      },
      "拦网": {
        "得分": 0,
        "失误": 0
      },
      "防反起球": {
        "总数": 0,
        "失误": 0,
        "到位": 0,
        "到位率": 0,
        "到位效率": 0
      },
      "传球": {
        "总数": 0,
        "失误": 0,
        "到位率": 0,
        "到位效率": 0
      },
    }

    if (statistic == undefined || statistic == null) {
      return summary;
    }

    //得分
    var win = 0;
    var win_items = [court.StatName.ServeWin, court.StatName.AttackWin, court.StatName.BlockWin];

    for (var index in win_items) {
      var item = win_items[index]
      if (statistic.hasOwnProperty(item)) {
        win += statistic[item]
      }
    }

    summary["得分"]["总得分"] = win;

    //净得分
    var lost = 0;
    var lost_items = [court.StatName.ServeLost, court.StatName.ErChuanLost, court.StatName.ReceptionLost, court.StatName.AttackLost, court.StatName.DefendLost]

    for (var index in lost_items) {
      var item = lost_items[index]
      if (statistic.hasOwnProperty(item)) {
        lost += statistic[item]
      }
    }

    var net = win - lost
    summary["得分"]["净得分"] = net

    //发球
    var total = 0
    lost = 0
    win = 0

    //court.StatName.ServeLost, StatName.ServeNormal, StatName.ServeWin

    if (statistic.hasOwnProperty(court.StatName.ServeLost)) {
      lost += statistic[court.StatName.ServeLost]
      total += statistic[court.StatName.ServeLost]
    }

    if (statistic.hasOwnProperty(court.StatName.ServeNormal)) {
      total += statistic[court.StatName.ServeNormal]
    }

    if (statistic.hasOwnProperty(court.StatName.ServeWin)) {
      win += statistic[court.StatName.ServeWin]
      total += statistic[court.StatName.ServeWin]
    }

    summary["发球"]["总数"] = total
    summary["发球"]["失误"] = lost
    summary["发球"]["直接得分"] = win
    summary["发球"]["效率"] = total == 0 ? 0 : ((win - lost) / total).toFixed(2)

    //一传
    total = 0
    lost = 0 //不到位
    win = 0 //完美到位
    var normal = 0 //半到位
    // ReceptionBad: "一传不到位",
    // ReceptionGood: "一传半到位",
    //   ReceptionPerfect: "一传到位",
    //     ReceptionLost: "一传失误",

    if (statistic.hasOwnProperty(court.StatName.ReceptionLost)) {
      lost += statistic[court.StatName.ReceptionLost]
      total += statistic[court.StatName.ReceptionLost]
    }

    if (statistic.hasOwnProperty(court.StatName.ReceptionGood)) {
      normal += statistic[court.StatName.ReceptionGood]
      total += statistic[court.StatName.ReceptionGood]
    }

    if (statistic.hasOwnProperty(court.StatName.ReceptionPerfect)) {
      win += statistic[court.StatName.ReceptionPerfect]
      total += statistic[court.StatName.ReceptionPerfect]
    }

    summary["一传"]["总数"] = total
    summary["一传"]["失误"] = lost
    summary["一传"]["到位率"] = total == 0 ? 0.00 : ((win + normal) / total).toFixed(2)
    summary["一传"]["完美到位率"] = total == 0 ? 0.00 : (win / total).toFixed(2)
    summary["一传"]["到位效率"] = total == 0 ? 0.00 : ((win + normal - lost) / total).toFixed(2)

    //AttackNormal: "进攻一般",
    // AttackBlk: "进攻拦死",
    //   AttackWin: "进攻得分",
    //     AttackLost: "进攻失误",
    total = 0
    lost = 0
    win = 0
    var block = 0

    if (statistic.hasOwnProperty(court.StatName.AttackLost)) {
      lost += statistic[court.StatName.AttackLost]
      total += statistic[court.StatName.AttackLost]
    }

    if (statistic.hasOwnProperty(court.StatName.AttackBlk)) {
      block += statistic[court.StatName.AttackBlk]
      total += statistic[court.StatName.AttackBlk]
    }

    if (statistic.hasOwnProperty(court.StatName.AttackWin)) {
      win += statistic[court.StatName.AttackWin]
      total += statistic[court.StatName.AttackWin]
    }

    if (statistic.hasOwnProperty(court.StatName.AttackNormal)) {
      total += statistic[court.StatName.AttackNormal]
    }

    summary["进攻"]["总数"] = total
    summary["进攻"]["失误"] = lost
    summary["进攻"]["被拦死"] = block
    summary["进攻"]["得分"] = win
    summary["进攻"]["成功率"] = total == 0 ? 0 : (win / total).toFixed(2)
    summary["进攻"]["成功效率"] = total == 0 ? 0 : ((win - lost) / total).toFixed(2)


    //BlockWin: "拦网得分",
    // BlockLost: "拦网失误",

    total = 0
    lost = 0
    win = 0

    if (statistic.hasOwnProperty(court.StatName.BlockLost)) {
      lost += statistic[court.StatName.BlockLost]
      total += statistic[court.StatName.BlockLost]
    }
    if (statistic.hasOwnProperty(court.StatName.BlockWin)) {
      win += statistic[court.StatName.BlockWin]
      total += statistic[court.StatName.BlockWin]
    }

    summary["拦网"]["失误"] = lost
    summary["拦网"]["得分"] = win

    //   DefendLost: "防守失误",
    //     DefendGood: "防守到位",
    //       DefendNormal: "防守一般",
    total = 0
    lost = 0
    win = 0
    normal = 0

    if (statistic.hasOwnProperty(court.StatName.DefendLost)) {
      lost += statistic[court.StatName.DefendLost]
      total += statistic[court.StatName.DefendLost]
    }

    if (statistic.hasOwnProperty(court.StatName.DefendNormal)) {
      normal += statistic[court.StatName.DefendNormal]
      total += statistic[court.StatName.DefendNormal]
    }

    if (statistic.hasOwnProperty(court.StatName.DefendGood)) {
      win += statistic[court.StatName.DefendGood]
      total += statistic[court.StatName.DefendGood]
    }

    summary["防反起球"]["总数"] = total
    summary["防反起球"]["失误"] = lost
    summary["防反起球"]["到位"] = win
    summary["防反起球"]["到位率"] = total == 0 ? 0 : (win / total).toFixed(2)
    summary["防反起球"]["到位效率"] = total == 0 ? 0 : ((win - lost) / total).toFixed(2)

    //   ErChuanGood: "二传到位",
    //     ErChuanBad: "二传不到位",
    //       ErChuanLost: "二传失误",
    total = 0
    lost = 0
    win = 0
    normal = 0

    if (statistic.hasOwnProperty(court.StatName.ErChuanLost)) {
      lost += statistic[court.StatName.ErChuanLost]
      total += statistic[court.StatName.ErChuanLost]
    }

    if (statistic.hasOwnProperty(court.StatName.ErChuanGood)) {
      win += statistic[court.StatName.ErChuanGood]
      total += statistic[court.StatName.ErChuanGood]
    }

    if (statistic.hasOwnProperty(court.StatName.ErChuanBad)) {
      normal += statistic[court.StatName.ErChuanBad]
      total += statistic[court.StatName.ErChuanBad]
    }

    summary["传球"]["总数"] = total
    summary["传球"]["失误"] = lost
    summary["传球"]["到位率"] = total == 0 ? 0 : (win / total).toFixed(2)
    summary["传球"]["到位效率"] = total == 0 ? 0 : ((win - lost) / total).toFixed(2)

    return summary
  },

  _addStatistic: function(stat, stat_name) {
    if (stat.hasOwnProperty(stat_name)) {
      stat[stat_name] = stat[stat_name] + 1
    } else {
      stat[stat_name] = 1;
    }
  },

  _createNewStatistic: function(player, stat_name) {
    var stat = new Object();
    stat[stat_name] = 1;
    return stat;
  },

  createItemSet: function(stats) {
    var obj = new HashMap();
    for (var k in stats) {
      var stat = stats[k];
      if (stat.item.length == 0) continue;
      if (stat.score == 0) continue;
      if (!obj.containsKey(stat.item)) {
        obj.put(stat.item, 999)
      }
    }
    return obj.keySet();
  },

  createNonscoreItemSet: function(stats) {
    var obj = new HashMap();
    for (var k in stats) {
      var stat = stats[k];
      if (stat.item.length == 0) continue;
      if (!obj.containsKey(stat.item)) {
        obj.put(stat.item, 999)
      }
    }
    return obj.keySet();
  },


  //Object score_rows:Array(4)
  //0: (5)["姓名", "串联", "进攻", "拦网", "总计"]
  //1: (5)["副攻2", -1, 1, 0, 0]
  //2: (5)["主攻1", -2, 0, -1, -3]
  createReport: function(itemsByPlayer, score_item_names) {
    var result = new Array();

    var row = new Array();
    row.push("姓名");
    row = row.concat(score_item_names, ["总计"]); //1st row.
    result.push(row);

    var players = itemsByPlayer.keySet();
    for (var index in players) {
      var player = players[index];
      var items = itemsByPlayer.get(player);

      var row = new Array();
      row.push(player);

      var total = 0;

      for (var index in score_item_names) {
        var item = score_item_names[index];
        var score = 0;
        if (items.containsKey(item)) {
          score = items.get(item);
        }
        total += score;
        row.push(score);
      }
      row.push(total);
      result.push(row);
    }

    return result;
  },

  createNonscoreReport: function(itemsByPlayer, score_item_names) {
    var result = new Array();

    var row = new Array();
    row.push("姓名");
    row = row.concat(score_item_names, ["总计"]); //1st row.
    result.push(row);

    var players = itemsByPlayer.keySet();
    for (var index in players) {
      var player = players[index];
      var items = itemsByPlayer.get(player);

      var row = new Array();
      row.push(player);

      var total = 0;

      for (var index in score_item_names) {
        var item = score_item_names[index];
        var score = 0;
        if (items.containsKey(item)) {
          score = items.get(item);
        }
        total += score;
        row.push(score);
      }
      row.push(total);
      result.push(row);
    }

    return result;
  },

  loadData: function(id) {
    const db = wx.cloud.database({
      env: 'test-705bde'
    })

    var that = this

    db.collection('vmatch').where({
        _id: id,
      })
      .get({
        success(res) {
          console.log(res)
          //create summary
          var statistics = that.createStatistics(res.data[0].stat_items)
          that.data.summary["标题"] = that.createSummaryForPlayer(null)
          that.data.summary['meta'] = {
            myScore: res.data[0].myScore,
            yourScore: res.data[0].yourScore,
            id:id,
          }
          that.createSummary(that.data.summary, res.data[0].players, statistics);
          wx.hideLoading()
          that.setData(that.data)
        },
        fail(res) {
          console.log(res)
          wx.hideLoading()
          wx.showToast({
            title: '加载失败',
          })
        }
      })
  },

})