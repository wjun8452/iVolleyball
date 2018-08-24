const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}


// 显示繁忙提示
var showBusy = text => wx.showToast({
    title: text,
    icon: 'loading',
    duration: 10000
})

// 显示成功提示
var showSuccess = text => wx.showToast({
    title: text,
    icon: 'success'
})

// 显示失败提示
var showModel = (title, content) => {
    wx.hideToast();

    wx.showModal({
        title,
        content: JSON.stringify(content),
        showCancel: false
    }) 
}


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



module.exports = { formatTime, showBusy, showSuccess, showModel }
