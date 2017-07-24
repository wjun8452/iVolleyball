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
    "lastOp" : 0 //0: no op, 1: add my score, -1: add your score
  },

  start_x_1: 0,
  start_y_1: 0,
  start_x_2: 0,
  start_y_2: 0,


  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '竖版记分牌'
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

   this.setData({height: res.windowHeight, width: res.windowWidth, 
     score_height: res.windowHeight / 60 * 29, 
     score_width: res.windowWidth,
   colon_height: res.windowHeight / 60 * 2,
   colon_width: res.windowWidth})

    console.log("height: " + this.data.height);
    console.log("width: " + this.data.width);
    console.log("score_height: " + this.data.score_height);
    console.log("score_width: " + this.data.score_width);
    console.log("colon_height: " + this.data.colon_height);
    console.log("colon_width: " + this.data.colon_width);

  },

  onUnload: function () {
    wx.setStorageSync("stats", this.data);
  },

  changeMyScore: function (delta) {
    var my = this.data.myScore;
    my = my + delta;
    this.setData({lastOp: 1});
    this.setData({myScore: my})
  },

  changeYourScore: function (delta) {
    var you = this.data.yourScore;
    you = you + delta;
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
  },

  drawScore: function(context, score) {
    var font_size = this.data.score_height;
    context.font = "Georgia";
    context.setFontSize(font_size)
    context.setFillStyle("#ff0000");
    context.fillText(score, 0, this.data.score_height * 9 / 10)
    context.draw()
  },

  drawColon: function() {
      var context = wx.createCanvasContext('colon');
      context.beginPath()
      context.setFillStyle("#ff0000")
      context.arc(this.data.width / 2 - 2*this.data.colon_height, this.data.colon_height / 2, this.data.colon_height / 2, 0, 2 * Math.PI)
      context.fill();

      context.arc(this.data.width / 2 + 2*this.data.colon_height, this.data.colon_height / 2, this.data.colon_height / 2, 0, 2 * Math.PI)
      context.fill();
      context.draw()
  },

  touchStart1: function(e) {
    console.log("touchStart:");
    console.log(e.changedTouches[0].x);
    console.log(e.changedTouches[0].y);
    this.start_x_1 = e.changedTouches[0].x;
    this.start_y_1 = e.changedTouches[0].y;
  },

  touchMove1: function(e) {
    console.log("touchMove:");
    console.log(e.changedTouches[0].x);
    console.log(e.changedTouches[0].y);
  },

  touchEnd1: function(e) {
    console.log("touchEnd:");
    console.log(e.changedTouches[0].x);
    console.log(e.changedTouches[0].y);

    var end_x = e.changedTouches[0].x
    var end_y = e.changedTouches[0].y;

    this.touch_end(true, this.start_x_1, this.start_y_1, end_x, end_y);
  },

  touchStart2: function (e) {
    console.log("touchStart:");
    console.log(e.changedTouches[0].x);
    console.log(e.changedTouches[0].y);
    this.start_x_2 = e.changedTouches[0].x;
    this.start_y_2 = e.changedTouches[0].y;
  },

  touchMove2: function (e) {
    console.log("touchMove:");
    console.log(e.changedTouches[0].x);
    console.log(e.changedTouches[0].y);
  },

  touchEnd2: function (e) {
    console.log("touchEnd:");
    console.log(e.changedTouches[0].x);
    console.log(e.changedTouches[0].y);

    var end_x = e.changedTouches[0].x
    var end_y = e.changedTouches[0].y;

    this.touch_end(false, this.start_x_2, this.start_y_2, end_x, end_y);
  },


  touch_end: function(mine, start_x, start_y, end_x, end_y) {
    var changeX = end_x - start_x;
    var changeY = end_y - start_y;

    var change_x_abs = Math.abs(changeX);
    var change_y_abs = Math.abs(changeY);

    console.log("change_x: " + changeX);
    console.log("change_y: " + changeY);

    if (change_x_abs < 50 && change_y_abs < 50) return;


    if (change_y_abs > change_x_abs) {
      if (changeY < 0) {
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
  }
})

