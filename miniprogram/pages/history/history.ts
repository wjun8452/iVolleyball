// miniprogram/pages/history.js

import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { GameStatus, VolleyCourt } from "../../bl/VolleyCourt";
import { FriendsCourtRepo, onMatchesFeched, JointVolleyRepository } from "../../bl/VolleyRepository";

const App = getApp()

class HistoryPageData {
  matches: VolleyCourt[] = []; //我创建的比赛
  joint_matches: VolleyCourt[] = []; //我参加过的比赛
  shared_matches: VolleyCourt[] = []; //来自他人分享的比赛
  court: VolleyCourt | null = null;
  globalData: GlobalData | null = null;
}

class HistoryPage extends BasePage {
  data: HistoryPageData = new HistoryPageData();
  repo: JointVolleyRepository = new JointVolleyRepository();

  onDataFetched: onMatchesFeched = function (this: HistoryPage, courts: VolleyCourt[]) {
    console.log("courts:", courts)
    wx.hideLoading();
    this.data.matches = courts;
    this.setData(this.data);
  }

  onDataFetched2: onMatchesFeched = function (this: HistoryPage, courts: VolleyCourt[]) {
    console.log("courts:", courts)
    wx.hideLoading();
    this.data.joint_matches = courts;
    this.setData(this.data);
  }

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad = function (this: HistoryPage) {
    wx.setNavigationBarTitle({
      title: '历史记录'
    })
  }

  onShow = function (this:HistoryPage) {
    getApp().getOpenId((openid: string, success:boolean) => {
      this.fetchData(openid);
    });

    this.data.court = this.repo.loadFromLocal();

    let friendsRepo = new FriendsCourtRepo();
    this.data.shared_matches = friendsRepo.getCourts();

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
    console.log("delet match" , e )
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

  touchstart = function(this: HistoryPage, e:any) {
    //开始触摸时 重置所有删除
    let data = App.touch._touchstart(e, this.data.matches)
    //console.log("touchstart",data)
    this.setData({
      matches: data
    })
  }

  //滑动事件处理
  touchmove = function(this: HistoryPage, e:any) {
    let data = App.touch._touchmove(e, this.data.matches, '_id')
    
    this.setData({
      matches: data
    })
    //console.log("touchmaove", data, this.data.matches)
  }
}

Page(new HistoryPage())