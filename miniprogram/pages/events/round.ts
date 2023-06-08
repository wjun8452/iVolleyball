// pages/matches/round.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showScoreInput: false,
    score_left_edit: "",
    score_right_edit: "",
    set_index_edit: -1,

    row_edit: -1,
    col_edit: -1,
    
    score_sets: {score: "-:-", win:0, loose:0, sets: [], win_scores: [], loose_scores: []},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const that = this;
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('editRound', function (data) {
      console.log('editRound', data)
      that.data = Object.assign(that.data, data);
      that.setData(that.data);
      console.log(that.data)
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  onConfirm() {
    console.log("onConfirm")
    this.getOpenerEventChannel().emit('updateSetScore', {row_edit: this.data.row_edit,
      col_edit: this.data.col_edit, score_sets: this.data.score_sets});
    wx.navigateBack();
  },

  onSetScore(e) {
    this.data.set_index_edit = e.currentTarget.dataset.index;
    this.data.showScoreInput = true;
    this.setData(this.data);
  },

  hideScoreInput() {
    this.data.showScoreInput = false;
    this.setData(this.data);
  },

  onTapScore(e) {
    console.log(e)
    let isLeft = e.currentTarget.dataset.isleft == "true";
    let score = e.currentTarget.dataset.score.toString()
    console.log(isLeft, score)
    if (isLeft) {
      this.data.score_left_edit = this.data.score_left_edit + score;
    } else {
      this.data.score_right_edit = this.data.score_right_edit + score;
    }
    this.setData(this.data);
  },

  clearScore(e) {
    let isLeft = e.currentTarget.dataset.isleft == "true";
    if (isLeft) {
      this.data.score_left_edit = ""
    } else {
      this.data.score_right_edit = ""
    }
    this.setData(this.data);
  },

  on25(e) {
    let isLeft = e.currentTarget.dataset.isleft == "true";
    if (isLeft) {
      this.data.score_left_edit = "25";
    } else {
      this.data.score_right_edit = "25"
    }
    this.setData(this.data);
  },

  on0(e) {
    let isLeft = e.currentTarget.dataset.isleft == "true";
    if (isLeft) {
      this.data.score_left_edit = this.data.score_left_edit + "0";
    } else {
      this.data.score_right_edit = this.data.score_right_edit + "0";
    }
    this.setData(this.data);
  },

  calScores() {
    this.data.score_sets.win = 0;
    this.data.score_sets.loose = 0;
    for (let i=0; i<this.data.score_sets.win_scores.length; i++) {
      if (this.data.score_sets.win_scores[i] > this.data.score_sets.loose_scores[i]) {
        this.data.score_sets.win++;
      } else {
        this.data.score_sets.loose++;
      }
    }
    this.data.score_sets.score = this.data.score_sets.win.toString() + ":" + this.data.score_sets.loose.toString();
  },

  confirmScore() {
    this.data.score_sets.sets[this.data.set_index_edit] = this.data.score_left_edit + ":" + this.data.score_right_edit;
    this.data.score_sets.win_scores[this.data.set_index_edit] = Number.parseInt(this.data.score_left_edit);
    this.data.score_sets.loose_scores[this.data.set_index_edit] = Number.parseInt(this.data.score_right_edit);

    this.calScores();
    
    this.data.score_left_edit = "";
    this.data.score_right_edit = "";
    this.data.showScoreInput = false;


    this.setData(this.data);
  },

  onNewSet() {
    this.data.score_sets.sets.push("");
    this.data.score_sets.win_scores.push(-1);
    this.data.score_sets.loose_scores.push(-1);
    this.setData(this.data);
  },

  deleteSet(e) {
    let index = e.currentTarget.dataset.index;
    this.data.score_sets.sets.splice(index, 1);
    this.data.score_sets.win_scores.splice(index, 1);
    this.data.score_sets.loose_scores.splice(index, 1);
    this.calScores();
    this.setData(this.data);
  },


})