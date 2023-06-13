// miniprogram/pages/history.js

import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { VolleyCourt } from "../../bl/VolleyCourt";
import { FriendsCourtRepo, JointVolleyRepository } from "../../bl/VolleyRepository";

const App = getApp()

class HistoryPageData {
  matches: VolleyCourt[] = []; //我创建的比赛
  joint_matches: VolleyCourt[] = []; //我参加过的比赛
  shared_matches: VolleyCourt[] = []; //来自他人分享的比赛
  last_court: VolleyCourt | null = null; //上次打开的比赛
  globalData: GlobalData | null = null;
  isLoading: boolean = false; //节流阀，防止重复下拉
  openid: string = ""; //当前微信用户id
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

  loadData = function (this: HistoryPage) {
    this.data.isLoading = true;

    wx.showLoading({
      title: '正在加载...',
    })

    //先加载local的2种比赛
    this.data.last_court = this.repo.loadFromLocal();

    let friendsRepo = new FriendsCourtRepo();
    this.data.shared_matches = friendsRepo.getCourts();

    //加载云端的比赛
    getApp().getOpenId((openid: string, success: boolean) => {
      if (success) {
        this.data.openid = openid;
        this.fetchCloudMatches(openid);
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


  fetchCloudMatches = function (this: HistoryPage, openid: string) {
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
    let _id: string = e.currentTarget.dataset.matchid;
    if (_id) {
      this.repo.deleteMatch(_id, (errorCode: number) => {
        if (errorCode == 0) {
          wx.showToast({ icon: "success", title: "删除成功" })
          that.fetchCloudMatches(getApp().globalData.openid);
        } else {
          wx.showToast({ icon: "error", title: "删除失败" })
        }
      })
    }
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
}

Page(new HistoryPage())