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


  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '大记分牌'
    })

    var saved = wx.getStorageSync(getApp().globalData.cacheKey);
    this.setData(saved || this.data);
    var res = wx.getSystemInfoSync()
    //can not use this.data.height to set score_height
   this.setData({height: res.windowHeight, width: res.windowWidth, 
     score_height: res.windowHeight / 80 * 39, 
     score_width: res.windowWidth,
     colon_height: res.windowHeight / 80 * 2,
     colon_width: res.windowWidth})
  },

  onShow: function() {
  },

  onHide: function() {
  },

  onUnload: function () {
    wx.setStorageSync(getApp().globalData.cacheKey, this.data);
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
    this.start_x_1 = e.changedTouches[0].x;
    this.start_y_1 = e.changedTouches[0].y;
  },

  touchMove1: function(e) {
  },

  touchEnd1: function(e) {
    var end_x = e.changedTouches[0].x
    var end_y = e.changedTouches[0].y;
    this.touch_end(true, this.start_x_1, this.start_y_1, end_x, end_y);
  },

  touchStart2: function (e) {
    this.start_x_2 = e.changedTouches[0].x;
    this.start_y_2 = e.changedTouches[0].y;
  },

  touchEnd2: function (e) {
    var end_x = e.changedTouches[0].x
    var end_y = e.changedTouches[0].y;

    this.touch_end(false, this.start_x_2, this.start_y_2, end_x, end_y);
  },


  touch_end: function(mine, start_x, start_y, end_x, end_y) {
    var changeX = end_x - start_x;
    var changeY = end_y - start_y;

    var change_x_abs = Math.abs(changeX);
    var change_y_abs = Math.abs(changeY);

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

