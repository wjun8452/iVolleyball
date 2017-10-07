/** 
* *********  操作实例  ************** 
*   var map = new HashMap(); 
*   map.put("key1","Value1"); 
*   map.put("key2","Value2"); 
*   map.put("key3","Value3"); 
*   map.put("key4","Value4"); 
*   map.put("key5","Value5"); 
*   alert("size："+map.size()+" key1："+map.get("key1")); 
*   map.remove("key1"); 
*   map.put("key3","newValue"); 
*   var values = map.values(); 
*   for(var i in values){ 
*       document.write(i+"："+values[i]+"   "); 
*   } 
*   document.write("<br>"); 
*   var keySet = map.keySet(); 
*   for(var i in keySet){ 
*       document.write(i+"："+keySet[i]+"  "); 
*   } 
*   alert(map.isEmpty()); 
*/

function HashMap() {
  //定义长度  
  var length = 0;
  //创建一个对象  
  var obj = new Object();

  /** 
  * 判断Map是否为空 
  */
  this.isEmpty = function () {
    return length == 0;
  };

  /** 
  * 判断对象中是否包含给定Key 
  */
  this.containsKey = function (key) {
    return (key in obj);
  };

  /** 
  * 判断对象中是否包含给定的Value 
  */
  this.containsValue = function (value) {
    for (var key in obj) {
      if (obj[key] == value) {
        return true;
      }
    }
    return false;
  };

  /** 
  *向map中添加数据 
  */
  this.put = function (key, value) {
    if (!this.containsKey(key)) {
      length++;
    }
    obj[key] = value;
  };

  /** 
  * 根据给定的Key获得Value 
  */
  this.get = function (key) {
    return this.containsKey(key) ? obj[key] : null;
  };

  /** 
  * 根据给定的Key删除一个值 
  */
  this.remove = function (key) {
    if (this.containsKey(key) && (delete obj[key])) {
      length--;
    }
  };

  /** 
  * 获得Map中的所有Value 
  */
  this.values = function () {
    var _values = new Array();
    for (var key in obj) {
      _values.push(obj[key]);
    }
    return _values;
  };

  /** 
  * 获得Map中的所有Key 
  */
  this.keySet = function () {
    var _keys = new Array();
    for (var key in obj) {
      _keys.push(key);
    }
    return _keys;
  };

  /** 
  * 获得Map的长度 
  */
  this.size = function () {
    return length;
  };

  /** 
  * 清空Map 
  */
  this.clear = function () {
    length = 0;
    obj = new Object();
  };
}

 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    summary_rows: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '历史报表'
    })

    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    if (saved) {
      var itemMap = this.createItemsByPlayer(saved.stat_items);
      var itemNames = this.createItemSet(saved.stat_items);
      var tableData = this.createReport(itemMap, itemNames);
      this.setData({summary_rows: tableData});
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
    var saved = wx.getStorageSync('stats');
    this.setData(saved || this.data);
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

  createItemsByPlayer: function (stats) {
    var map = new HashMap();
    for(var index in stats) {
      var stat = stats[index];
      var player = stat.player;
      
      if (player.length == 0) {
        continue;
      }

      if (!map.containsKey(player)) {
        map.put(player, new HashMap());
      }

      var itemByNameMap = map.get(player);
      if (!itemByNameMap.containsKey(stat.item)) {
        itemByNameMap.put(stat.item, 0);
      }

      var savedScore = itemByNameMap.get(stat.item);
      var totalScore = savedScore + stat.score;
      itemByNameMap.put(stat.item, totalScore);
    }
    return map;
  },

  createItemSet: function (stats) {
    var obj = new HashMap();
    for(var k in stats) {
      var stat = stats[k].item;
      if (stat.length == 0) continue;
      if (!obj.containsKey(stat.item)) {
          obj.put(stat, 0)
      }
    }
    return obj.keySet();
  },

//key: item_name
  createReport: function (itemsByPlayer, itemNames) {
    var result = new Array();

    var row = new Array();
    row.push("姓名");
    row = row.concat(itemNames, ["总计"]); //1st row.
    result.push(row);

    var players = itemsByPlayer.keySet();
    for(var index in players) {
      var player = players[index];
      var items = itemsByPlayer.get(player);

      var row = new Array();
      row.push(player);

      var total = 0;

      for (var index in itemNames) {
        var item = itemNames[index];
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
  }
})