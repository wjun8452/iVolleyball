// pages/matches/scoreboard.ts

import { Event, EventHelper, EventRepo, MatchScore, MatchScoreHelper } from "../../bl/EventRepo";
import { VTeam, VUser } from "../../bl/TeamRepo";

type Column = Record<string, number | string>
type Row = Record<string, Column>

let globalData = getApp().globalData
let MAX_NAME_LENGHT = 6; //队名中文字符数，多估计了一个中文，保证一栏能显示完整

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
    font_size: 0,

    globalData: globalData,

    landscape: true,

    //淘汰赛
    taotai_matches: [],

    group_num: 1,
    event: new Event(0, "", new VUser(), 0, []),
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
    wx.showToast({ 'title': '长按可编辑', 'icon': 'none' })
  },


  onLandscape() {
    this.data.landscape = !this.data.landscape;
    this.setData(this.data);
  },

  onTapTable(e) {
    this.data.row_edit = e.currentTarget.dataset.rindex;
    this.data.col_edit = e.currentTarget.dataset.cindex;
    this.setData(this.data);
    console.log("onTapTable", this.data.row_edit, this.data.col_edit)
  },

  onLongTapTable(e) {
    this.data.row_edit = e.currentTarget.dataset.rindex;
    this.data.col_edit = e.currentTarget.dataset.cindex;
    let that = this;
    let rindex = this.data.row_edit;
    let cindex = this.data.col_edit;
    console.log("onLongTapTable", rindex, cindex)
    if (rindex != cindex) {
      wx.navigateTo({
        url: "./round",
        events: {
          updateSetScore: (result) => {
            console.log("updateSetScore triggered", result)
            that.sync_lock = true;
            that.data.event.team_matches[0][result.row_edit][result.col_edit] = result.matchScore;
            that.data.event.team_matches[0][result.col_edit][result.row_edit] = new MatchScoreHelper().getMirrorMatchScore(result.matchScore);

            new EventHelper().updateTeamScore(that.data.event);

            new EventRepo().updateEvent(that.data.event_openid, that.data.event, (success) => {
              if (success) {
                wx.showToast({ "title": "更新成功！" })
              } else {
                wx.showToast({ "title": "更新失败!", icon: "error" })
              }
              that.setData(that.data);
              that.sync_lock = false;
            })
          }
        },

        success: function (res: any) {
          let matchScore = that.data.event.team_matches[0][rindex][cindex];
          res.eventChannel.emit('editRound', { team1: that.data.event.teams[rindex].name, team2: that.data.event.teams[cindex].name, row_edit: rindex, col_edit: cindex, matchScore: matchScore, event_openid: that.data.event_openid })
        },

        fail: function (res: any) {
          console.error(res);
        }
      })
    } else {
      wx.showToast({ "title": "此处不能编辑", "icon": "error" })
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
        new EventHelper().updateTeamScore(that.data.event);
        that.data.column_num = that.data.event.teams.length + 1 + that.data.event.equal_times;
        that.data.row_num = that.data.event.teams.length + 1;
        let max_font_width = globalData.sysInfo.windowWidth / that.data.row_num / 2;
        let max_font_height = globalData.sysInfo.windowHeight / that.data.column_num / MAX_NAME_LENGHT;
        that.data.font_size = max_font_width < max_font_height ? max_font_width : max_font_height;

        console.log("fetchEvent", ", max_font_width:", max_font_width, ", max_font_height:", max_font_height, ", data:", that.data)
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
    let path = '/pages/events/board?openid=' + this.data.event_openid + "&base_id=" + this.data.base_id;
    return {
      title: '赛事组织',
      path: path,
    }
  },

  calMirrorScores(score_set: {}): {} {
    let mirror = {};
    mirror["win"].win = 0;
    this.data.score_sets.loose = 0;
    for (let i = 0; i < this.data.score_sets.win_scores.length; i++) {
      if (this.data.score_sets.win_scores[i] > this.data.score_sets.loose_scores[i]) {
        this.data.score_sets.win++;
      } else {
        this.data.score_sets.loose++;
      }
    }
    this.data.score_sets.score = this.data.score_sets.win.toString() + ":" + this.data.score_sets.loose.toString();
  },

  onTapWindow(e) {
    this.data.row_edit = -1;
    this.data.col_edit = -1;
    this.setData(this.data);
  },

  getNamesLength(teams: VTeam[]): number {
    let length = 0;
    for (let i = 0; i < teams.length; i++) {
      let team = teams[i];
      Array.from(team.name).map(function (char) {
        if (char.charCodeAt(0) > 255) {//字符编码大于255，说明是双字节字符
          length += 2;
        } else {
          length ++;
        }
      });
    }
    return length;
  }

})


