
var g_can_start_vibration = true;

Page({
  data:
  {
    "height": 0,
    "width": 0,
    "score_height": 0,
    "score_width": 0,
    "colon_height": 0,
    "colon_width" : 0,
    "myScore": 0,
    "yourScore": 0,
    "stat_items": []
  },
  start_x_1: 0,
  start_y_1: 0,
  start_x_2: 0,
  start_y_2: 0,
  isShow: false,


  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '大记分牌'
    })

    var saved = wx.getStorageSync('stats');

    this.setData(saved || this.data);

    var res = wx.getSystemInfoSync()
    console.log(res.model)
    console.log(res.pixelRatio)
    console.log(res.windowWidth)
    console.log(res.windowHeight)
    console.log(res.language)
    console.log(res.version)
    console.log(res.platform)

//can not use this.data.height to set score_height
   this.setData({height: res.windowHeight, width: res.windowWidth, 
     score_height: res.windowHeight / 80 * 39, 
     score_width: res.windowWidth,
     colon_height: res.windowHeight / 80 * 2,
     colon_width: res.windowWidth})

    console.log("height: " + this.data.height);
    console.log("width: " + this.data.width);
    console.log("score_height: " + this.data.score_height);
    console.log("score_width: " + this.data.score_width);
    console.log("colon_height: " + this.data.colon_height);
    console.log("colon_width: " + this.data.colon_width);

    wx.startAccelerometer()
  },

  onAccelerometerChange: function(res) {
    var that = this;
    console.log("------------------")
    console.log("g_can_start_vibration=" + g_can_start_vibration)
    //console.log("acc_x=" + res.x)
    console.log("acc_y=" + res.y)
    //console.log("acc_z=" + res.z)

    if (!that.isShow) {
      console.log("page not show, return")
      return
    }

    var acc = 1.5;

    if (res.y > acc && g_can_start_vibration) {
      that.logScore()
      console.log("my score +1")
      wx.vibrateLong();
      that.changeMyScore(+1);
      that.logScore()
      that.drawMyScore();
      g_can_start_vibration = false;
    } else if (res.y < -acc && g_can_start_vibration) {
      that.logScore()
      console.log("your score +1")
      wx.vibrateLong();
      that.changeYourScore(+1);
      that.logScore()
      that.drawYourScore();
      g_can_start_vibration = false;
    } else if (res.y <= acc && res.y >= -acc) {
      console.log("reset g_can_start_vibration to true")
      g_can_start_vibration = true;
    }

    console.log("g_can_start_vibration=" + g_can_start_vibration)
  },

  onShow: function() {
    var that = this;
    this.isShow = true;
    wx.onAccelerometerChange(that.onAccelerometerChange)

  },

  onHide: function() {
    this.isShow = false;
  },

  logScore : function() {
    //console.log("my_score: " + this.data.myScore);
    //console.log("your_score: " + this.data.yourScore);
  },

  onUnload: function () {
    wx.stopAccelerometer();
    wx.setStorageSync("stats", this.data);
  },

  changeMyScore: function (delta) {
    this.data.stat_items.push(this.createStatItem("", "", delta));

    var s = this.data.myScore + delta;
    this.setData({myScore: s});
    
  },

  changeYourScore: function (delta) {
    this.data.stat_items.push(this.createStatItem("", "", delta));
    var s = this.data.yourScore + delta;
    this.setData({yourScore: s});
  },

  reset: function() {
    this.setData({myScore:0, yourScore:0, lastOp:0});
  },

  drawScore: function(context, score) {
    var font_size = this.data.score_height - 40;
    var off_set = (this.data.width - font_size)/2;
    context.rotate(90 * Math.PI / 180);
    context.translate(0, -this.data.score_height - off_set)

    //context.strokeRect(0, 0, this.data.score_width, this.data.score_height);

    context.font = "Arial";
    context.setFontSize(font_size) //
    context.setFillStyle("#ff0000");

    var offset = this.data.score_height/4;
    if (score < 10) {
      context.fillText(score, 0+offset, this.data.score_height)
    } else {
      context.fillText(score, 0, this.data.score_height)
    }
    context.draw()
    
  },

  drawColon: function() {
      var context = wx.createCanvasContext('colon');
      context.beginPath()
      context.setFillStyle("#ff0000")
      context.arc(this.data.score_height / 2 - 2*this.data.colon_height, this.data.colon_height / 2, this.data.colon_height / 2, 0, 2 * Math.PI)
      context.fill();

      context.arc(this.data.score_height / 2 + 2*this.data.colon_height, this.data.colon_height / 2, this.data.colon_height / 2, 0, 2 * Math.PI)
      context.fill();
      context.draw()
  },

  touchStart1: function(e) {
    //console.log("touchStart:");
    //console.log(e.changedTouches[0].x);
    //console.log(e.changedTouches[0].y);
    this.start_x_1 = e.changedTouches[0].x;
    this.start_y_1 = e.changedTouches[0].y;
  },

  touchMove1: function(e) {
    console.log("touchMove:");
    console.log(e.changedTouches[0].x);
    console.log(e.changedTouches[0].y);
  },

  touchEnd1: function(e) {
    //console.log("touchEnd:");
    //console.log(e.changedTouches[0].x);
    //console.log(e.changedTouches[0].y);

    var end_x = e.changedTouches[0].x
    var end_y = e.changedTouches[0].y;

    this.touch_end(true, this.start_x_1, this.start_y_1, end_x, end_y);
  },

  touchStart2: function (e) {
    //console.log("touchStart:");
    //console.log(e.changedTouches[0].x);
    //console.log(e.changedTouches[0].y);
    this.start_x_2 = e.changedTouches[0].x;
    this.start_y_2 = e.changedTouches[0].y;
  },

  touchMove2: function (e) {
    //console.log("touchMove:");
    //console.log(e.changedTouches[0].x);
    //console.log(e.changedTouches[0].y);
  },

  touchEnd2: function (e) {
    //console.log("touchEnd:");
    //console.log(e.changedTouches[0].x);
    //console.log(e.changedTouches[0].y);

    var end_x = e.changedTouches[0].x
    var end_y = e.changedTouches[0].y;

    this.touch_end(false, this.start_x_2, this.start_y_2, end_x, end_y);
  },


  touch_end: function(mine, start_x, start_y, end_x, end_y) {
    var changeX = end_x - start_x;
    var changeY = end_y - start_y;

    var change_x_abs = Math.abs(changeX);
    var change_y_abs = Math.abs(changeY);

    //console.log("change_x: " + changeX);
    //console.log("change_y: " + changeY);

    if (change_x_abs < 50 && change_y_abs < 50) return;


    if (change_y_abs < change_x_abs) {
      if (changeX > 0) {
        mine? this.changeMyScore(1) : this.changeYourScore(1);
      } else {
        mine ? this.changeMyScore(-1) : this.changeYourScore(-1);
      }
      mine ? this.drawMyScore() : this.drawYourScore();
    }
  },

  drawMyScore() {
    var context = wx.createCanvasContext('myScore');
    this.drawScore(context, this.data.myScore);
  },

  drawYourScore() {
    var context = wx.createCanvasContext('yourScore');
    this.drawScore(context, this.data.yourScore);
  },

  onReady: function (e) {
    this.drawMyScore();
    this.drawYourScore();
    this.drawColon();
  },

  createStatItem: function (player, item, score) {
    var obj = new Object();
    obj.player = player
    obj.item = item;
    obj.score = score;
    return obj;
  },

})

