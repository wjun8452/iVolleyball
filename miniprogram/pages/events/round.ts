import { MatchScore, MatchScoreHelper, SetScore } from "../../bl/EventRepo";
import { VUser } from "../../bl/TeamRepo";

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

    //parameters from caller throw 'editRound'
    row_edit: -1,
    col_edit: -1,
    matchScore: new MatchScore(3),
    event_openid: "",
    team1: "",
    team2: "",

    user: new VUser(),
    isOwner: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const that = this;
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('editRound', function (data) {
      console.log('editRound', data)
      if (!data.matchScore.setScores) {
        data.matchScore = new MatchScore(3);
      }
      that.data = Object.assign(that.data, data);
      getApp().getCurrentUser((user: VUser, success: boolean) => {
        if (success) {
          that.data.user = user;
          that.data.isOwner = (that.data.event_openid == user.openid);
        } else {
          wx.showToast({ title: "获取openid失败！" })
          wx.stopPullDownRefresh();
        }
      });

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
    let path = '/pages/events/events';
    return {
      title: '赛事组织',
      path: path,
    }
  },

  onConfirm() {
    console.log("onConfirm")
    this.getOpenerEventChannel().emit('updateSetScore', {
      row_edit: this.data.row_edit,
      col_edit: this.data.col_edit, matchScore: this.data.matchScore
    });
    wx.navigateBack();
  },

  onSetScore(e) {
    this.data.set_index_edit = e.currentTarget.dataset.index;
    this.data.showScoreInput = true;
    this.setData(this.data);
  },

  onGotoBoard(e) {
    
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

  confirmScore() {
    this.data.matchScore.setScores[this.data.set_index_edit] = new SetScore(Number.parseInt(this.data.score_left_edit), Number.parseInt(this.data.score_right_edit));
    new MatchScoreHelper().update(this.data.matchScore);

    this.data.score_left_edit = "";
    this.data.score_right_edit = "";
    this.data.showScoreInput = false;
    this.setData(this.data);
  },

  onNewSet() {
    this.data.matchScore.setScores.push(new SetScore(0, 0));
    new MatchScoreHelper().update(this.data.matchScore);
    this.setData(this.data);
  },

  deleteSet(e) {
    let index = e.currentTarget.dataset.index;
    this.data.matchScore.setScores.splice(index, 1);
    new MatchScoreHelper().update(this.data.matchScore);
    this.setData(this.data);
  },


})