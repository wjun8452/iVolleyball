// pages/matches/scoreboard.ts

import { Event, EventHelper, EventRepo } from "../../bl/EventRepo";
import { VUser } from "../../bl/TeamRepo";

type Column = Record<string, number | string>
type Row = Record<string, Column>

let globalData = getApp().globalData

Page({
  sync_lock: false,

  /**
   * 页面的初始数据
   */
  data: {
    row_edit: -1,
    col_edit: -1,
    score_left_edit: "",
    score_right_edit: "",

    showScoreInput: false,

    scoreInputUp: true,

    column_num: 1,

    row_num: 1,

    globalData: globalData,

    landscape: false,

    //淘汰赛
    taotai_matches: [],

    group_num: 1,
    event: new Event(0, "", new VUser(), 0, []) ,
    event_openid: "",
    base_id: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    if (options && options.openid && options.base_id) {
      this.data.event_openid = options.openid;
      this.data.base_id = Number.parseInt(options.base_id);
    }
  },


  onLandscape() {
    this.data.landscape = !this.data.landscape;
    this.setData(this.data);
  },

  onTapTable(e) {
    let rindex = e.currentTarget.dataset.rindex;
    let cindex = e.currentTarget.dataset.cindex;
    let that = this;
    console.log("onTapTable", rindex, cindex)
    if (rindex > cindex) {
      wx.navigateTo({
        url: "./round",
        events: {
          updateSetScore: (result) => {
            console.log("updateSetScore triggered", result)
            that.sync_lock = true;
            that.data.event.team_matches[0][result.row_edit][result.col_edit] = result.score_sets;
            that.data.event.team_matches[0][result.col_edit][result.row_edit] = result.score_sets;
            new EventHelper().updateTeamScore(that.data.event);
            new EventRepo().updateEvent(that.data.event_openid, that.data.event, (success) => {
              if (success) {
                wx.showToast({ "title": "更新成功！" })
              } else {
                wx.showToast({ "title": "更新失败!" })
              }
              that.setData(that.data);
              that.sync_lock = false;
            })
          }
        },

        success: function (res: any) {
          let score_sets = that.data.event.team_matches[0][rindex][cindex];
          if (score_sets == "") {
            score_sets = { score: "-:-", win: 0, loose: 0, sets: [], win_scores: [], loose_scores: [] };
          }

          res.eventChannel.emit('editRound', { row_edit: rindex, col_edit: cindex, score_sets: score_sets })
        }
      })
    }
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
    console.log("onShow")

    if (this.sync_lock) {
      return;
    }

    console.log("onShow2")

    const that = this;

    new EventRepo().fetchEvent(this.data.event_openid, this.data.base_id, (success: boolean, event: Event | null) => {
      if (success && event) {
        that.data.event = event;
        that.data.column_num = that.data.event.teams.length + 4;
        that.data.row_num = that.data.event.teams.length + 1;
        console.log(that.data)
        that.setData(that.data);
      }
    })
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

})


