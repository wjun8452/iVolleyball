import { FavoriteTeamIdRepo } from "../../bl/FavoriteTeamIdRepo";
import { FavoriteTeamRepo } from "../../bl/FavoriteTeamRepo";
import { TeamRepo, VTeam, VUser } from "../../bl/TeamRepo";

const App = getApp()

// pages/teams/teams.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    myteams: [],
    jointTeams: [],
    favoriteTeams: [],
    user: new VUser(),
    canIUseGetUserProfile: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const newLocal = wx.getUserProfile;
    if (newLocal) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  onClickCreateNewTeam(e: any) {
    if (!this.data.user.userInfo) {
      wx.showToast({ icon: "error", title: "请先登录" });
      return;
    }

    let teamRepo = new TeamRepo();
    if (this.data.myteams && this.data.myteams!.length >= 5) {
      wx.showToast({ icon: "error", title: "最多5只队伍" });
    } else {
      wx.showLoading({ title: "正在加载" });
      teamRepo.createTeam(this.data.user, (teamId: string | null) => {
        wx.navigateTo({
          url: "../team/team?teamId=" + teamId
        })
      })
    }
  },

  gotoMyprofile(e: any) {
    const that = this;
    wx.navigateTo({
      url: "../myprofile/myprofile",
      events: {
        updateAvartar: (result) => {
          console.log("updateAvartar event received: ", result)
          const userInfo: VUser = result;
          that.data.user = userInfo;
          that.setData(that.data)
        },
        success: function (res) {
        },
        fail: function (res) {
        }
      }
    })
  },

  onDeleteTeam(e: any) {
    if (!this.data.user.userInfo) {
      wx.showToast({ icon: "error", title: "请先登录" });
      return;
    }

    let that = this
    wx.showModal({
      title: '确定删除?',
      content: '删除后资料不可恢复',
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          let teamId = e.target.dataset.teamid;
          wx.showLoading({ title: "正在加载" })
          new TeamRepo().deleteTeamByOwner(teamId, (errorCode: number) => {
            wx.hideLoading();
            if (errorCode == 0) {
              console.log(that.data.user.openid)
              new TeamRepo().fetchByOwner(that.data.user.openid, (errorCode: number, teams: VTeam[] | null) => {
                that.data.myteams = teams;
                that.setData({ myteams: teams })
              });
            } else {
              wx.showToast({ icon: "error", title: "删除失败" })
            }
          })
        } else if (res.cancel) { }
      }
    })
  },

  onClickEditTeam(e: any) {
    let teamId = e.currentTarget.dataset.teamid;
    console.log(teamId)
    wx.navigateTo({
      url: "../team/team?teamId=" + teamId
    })
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
    wx.showLoading({
      title: "正在加载"
    })

    const that2 = this;
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        that2.data.user = user;
        that2.setData({ user: user })
        let teamRepo = new TeamRepo();
        console.log("load teams by owner: ", this.data.user.openid)
        const that = that2;
        teamRepo.fetchByOwner(user.openid, (errorCode: number, teams: VTeam[] | null) => {
          if (errorCode == 0) {
            that.data.myteams = teams;
            that.setData({ myteams: teams })
          } else {
            wx.showToast({ 'title': '加载失败!', 'icon': 'error' })
          }
          wx.hideLoading();
        });


        teamRepo.fetchJointTeams(user.openid, ((errorCode: number, teams: VTeam[]) => {
          if (errorCode == 0) {
            that.data.jointTeams = teams;
            that.setData({ jointTeams: teams })
          } else {
            wx.showToast({ 'title': '加载失败!', 'icon': 'error' })
          }
          wx.hideLoading();
        }));

        new FavoriteTeamRepo().fetchFavoriteTeams(new FavoriteTeamIdRepo(), (success: boolean, teams: VTeam[]) => {
          console.log("favorite team callback: success=" + success, ", teams=", teams);
          if (success) {
            that.data.favoriteTeams = teams;
            that.setData({ favoriteTeams: teams })
          } else {
            wx.showToast({ 'title': '加载失败!', 'icon': 'error' })
          }
          wx.hideLoading();
        }
        )

      } else {
        wx.showToast({ 'title': '错误', 'icon': 'error' })
        wx.hideLoading();
      }
    });
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

  touchstart(e) {
    //开始触摸时 重置所有删除
    let data = App.touch._touchstart(e, this.data.myteams)
    this.setData({
      myteams: data
    })
  },

  //滑动事件处理
  touchmove(e) {
    let data = App.touch._touchmove(e, this.data.myteams, '_id')
    this.setData({
      myteams: data
    })
  },

})