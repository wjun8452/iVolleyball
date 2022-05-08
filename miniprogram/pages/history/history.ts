// miniprogram/pages/history.js

import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { GameStatus, VolleyCourt } from "../../bl/VolleyCourt";
import { FriendsCourtRepo, onMatchesFeched, VolleyRepository2 } from "../../bl/VolleyRepository";

class HistoryPageData {
  matches: VolleyCourt[] = []; //以前上传过的比赛
  matches2: VolleyCourt[] = []; //已经结束的比赛
  matches3: VolleyCourt[] = []; //来自他人分享的比赛
  court: VolleyCourt | null = null;
  globalData: GlobalData | null = null;
}

class HistoryPage extends BasePage {
  data: HistoryPageData = new HistoryPageData();
  repo: VolleyRepository2 = new VolleyRepository2();

  onDataFetched: onMatchesFeched = function (this: HistoryPage, courts: VolleyCourt[]) {
    console.log("courts:", courts)
    wx.hideLoading();
    this.data.matches = courts;
    this.setData(this.data);
  }

  onDataFetched2: onMatchesFeched = function (this: HistoryPage, courts: VolleyCourt[]) {
    console.log("courts:", courts)
    wx.hideLoading();
    this.data.matches2 = courts;
    this.setData(this.data);
  }

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad = function (this: HistoryPage) {
  }

  onShow = function (this:HistoryPage) {
    getApp().getOpenId((openid: string) => {
      this.fetchData(openid);
    });

    this.data.court = this.repo.loadFromLocal();

    let friendsRepo = new FriendsCourtRepo();
    this.data.matches3 = friendsRepo.getCourts();

    this.setData(this.data);
  }


  fetchData = function (this: HistoryPage, openid: string) {
    wx.showLoading({
      title: '正在加载...',
    })
    this.repo.fetchMatches(openid, 8,  this.onDataFetched)
    this.repo.fetchJointMatches(openid, 8,  this.onDataFetched2)
  }

  newMatch = function () {
    wx.navigateTo({
      url: "../score_board/score_board"
    }
    );
  }

  onTapMatch = function (this: HistoryPage, e: any) {
    let _id: string = e.currentTarget.dataset.matchid;
    if (_id) {
      wx.navigateTo({
        url: "../score_board/score_board?_id=" + _id,
      })
    } else {
      wx.navigateTo({
        url: "../score_board/score_board"
      })
    }
  }

  stopPageScroll = function () {

  }

  onDeleteMatch = function(this: HistoryPage,  e:any) {
    let that = this
    let _id:string = e.currentTarget.dataset.matchid;
    if (_id) {
      this.repo.deleteMatch(_id, (errorCode:number) => {
        if (errorCode == 0) {
          wx.showToast({icon: "success", title: "删除成功"})
          that.fetchData(getApp().globalData.openid);
        } else {
          wx.showToast({icon: "error", title: "删除失败"})
        }
      })
    }
  }
}

Page(new HistoryPage())