// miniprogram/pages/history.js

import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { VUser } from "../../bl/TeamRepo";
import { VolleyCourt } from "../../bl/VolleyCourt";
import { FriendsCourtRepo, JointVolleyRepository } from "../../bl/VolleyRepository";

const App = getApp()

class HistoryPageData {
  matches: VolleyCourt[] = []; //我创建的比赛
  joint_matches: VolleyCourt[] = []; //我参加过的比赛
  shared_matches: VolleyCourt[] = []; //来自他人分享的比赛
  last_court: VolleyCourt | null = null; //上次打开的比赛
  square_matches: VolleyCourt[] = []; //广场上的比赛
  globalData: GlobalData | null = null;
  isLoading: boolean = false; //节流阀，防止重复下拉
  openid: string = ""; //当前微信用户id
  editMode: boolean = false; //是否显示删除按钮
  tab: number = 1; //1-最近，2-我的，3-参加，4-收藏，5-大厅
  viewAll: boolean = false;
}

class HistoryPage extends BasePage {
  data: HistoryPageData = new HistoryPageData();
  repo: JointVolleyRepository = new JointVolleyRepository();

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad = function (this: HistoryPage) {
  }

  onShow = function (this: HistoryPage) {
    this.loadData();
  }

  loadByTab = function (this: HistoryPage) {
    if (this.data.tab == 1) {
      this.loadRecentTab();
    }
    else if (this.data.tab == 2) {
      this.loadMymatchTab();
    }
    else if (this.data.tab == 3) {
      this.loadParticipateTab();
    }
    else if (this.data.tab == 4) {
      // this.loadFavoriteTab();
    }
    else if (this.data.tab == 5) {
      this.loadSquareTab();
    }
  }

  loadRecentTab = function (this: HistoryPage) {
    //先加载local的2种比赛
    this.data.last_court = this.repo.loadFromLocal();
    let friendsRepo = new FriendsCourtRepo();
    this.data.shared_matches = friendsRepo.getCourts();
    this.setData(this.data);
    wx.hideLoading();
    this.data.isLoading = false;
    wx.stopPullDownRefresh();
  }

  loadMymatchTab = function (this: HistoryPage) {
    //加载云端的比赛
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        this.data.openid = user.openid;
        this.fetchMyMatches(user.openid);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '登陆失败',
          icon: 'error',
        })
        this.data.isLoading = false;
        wx.stopPullDownRefresh();
      }
    });
  }

  loadParticipateTab = function (this: HistoryPage) {
    //加载云端的比赛
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        this.data.openid = user.openid;
        this.fetchJointMatches(user.openid);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '登陆失败',
          icon: 'error',
        })
        this.data.isLoading = false;
        wx.stopPullDownRefresh();
      }
    });
  }

  loadFavoriteTab = function (this: HistoryPage) {
    let friendsRepo = new FriendsCourtRepo();
    this.data.shared_matches = friendsRepo.getCourts();
    this.setData(this.data);
    wx.hideLoading();
    this.data.isLoading = false;
    wx.stopPullDownRefresh();
  }

  loadSquareTab = function (this: HistoryPage) {
    //加载云端的比赛
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        this.data.openid = user.openid;
        this.fetchSquareMatches(user.openid);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '登陆失败',
          icon: 'error',
        })
        this.data.isLoading = false;
        wx.stopPullDownRefresh();
      }
    });
  }

  loadData = function (this: HistoryPage) {
    this.data.isLoading = true;

    wx.showLoading({
      title: '正在加载...',
    })

    this.loadByTab();
  }

  fetchMyMatches = function (this: HistoryPage, openid: string) {
    this.repo.fetchMatches(openid, 8, (matches: VolleyCourt[], success: boolean) => {
      if (success) {
        this.data.matches = matches;
        console.log("我上传的比赛:", matches)
      } else {
        wx.showToast({
          title: '加载我的比赛失败',
          icon: 'error'
        })
      }
      this.setData(this.data);
      wx.hideLoading();
      this.data.isLoading = false;
      wx.stopPullDownRefresh();
    })
  }

  fetchJointMatches = function (this: HistoryPage, openid: string) {
    this.repo.fetchJointMatches(openid, 8, (matches: VolleyCourt[], success: boolean) => {
      if (success) {
        this.data.joint_matches = matches;
      } else {
        wx.showToast({
          title: '加载我参加的比赛失败',
          icon: 'error'
        })
      }
      this.setData(this.data);
      wx.hideLoading();
      this.data.isLoading = false;
      wx.stopPullDownRefresh();
    })
  }

  fetchSquareMatches = function (this: HistoryPage, openid: string) {
    this.repo.fetchSquareMatches(openid, 8, (matches: VolleyCourt[], success: boolean) => {
      if (success) {
        this.data.square_matches = matches;
        console.log("他人比赛:", matches)
      } else {
        wx.showToast({
          title: '加载他人比赛失败',
          icon: 'error'
        })
      }
      this.setData(this.data);
      wx.hideLoading();
      this.data.isLoading = false;
      wx.stopPullDownRefresh();
    })
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
  onDeleteMatch = function (this: HistoryPage, e: any) {
    //console.log("delet match", e)
    let that = this
    wx.showModal({
      title: '确定删除?',
      content: '删除后资料不可恢复',
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          let _id: string = e.currentTarget.dataset.matchid;
          if (_id) {
            that.repo.deleteMatch(_id, (errorCode: number) => {
              if (errorCode == 0) {
                wx.showToast({ icon: "success", title: "删除成功" })
                that.fetchCloudMatches(getApp().globalData.openid);
              } else {
                wx.showToast({ icon: "error", title: "删除失败" })
              }
            })
          }
        } else if (res.cancel) { }
      }
    })
  }

  touchstart = function (this: HistoryPage, e: any) {
    //开始触摸时 重置所有删除
    let data = App.touch._touchstart(e, this.data.matches)
    //console.log("touchstart",data)
    this.setData({
      matches: data
    })
  }

  //滑动事件处理
  touchmove = function (this: HistoryPage, e: any) {
    let data = App.touch._touchmove(e, this.data.matches, '_id')

    this.setData({
      matches: data
    })
    //console.log("touchmaove", data, this.data.matches)
  }

  onPullDownRefresh = function (this: HistoryPage) {
    if (!this.data.isLoading) {
      this.loadData();
    }
  }

  onCreate = function (this: HistoryPage) {
    console.log("hhaahah")
    wx.navigateTo({
      url: "../score_board/score_board?createNew=true",
    })
  }

  showInitData = function (this: HistoryPage) {
    this.data.viewAll = false; //collapsed
    this.data.last_court = null;
    this.data.matches = [];
    this.setData(this.data);
  }

  onClickTab = function (this: HistoryPage, e: any) {
    let tab = e.currentTarget.dataset.tab;
    if (this.data.tab == tab) return;
    this.data.tab = tab;
    this.showInitData(); //refresh UI immediatly
    this.loadByTab();
  }
}

Page(new HistoryPage())