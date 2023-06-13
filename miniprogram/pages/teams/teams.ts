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
    user: new VUser(),
    hasUserInfo: false,
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
    if (!this.data.hasUserInfo) {
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

  getUserProfile() {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用于完善球队的信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.data.user.userInfo = res.userInfo
        this.data.hasUserInfo = true;
        this.setData(this.data)
        this.saveUserInfo();
      }
    })
  },

  getUserInfo(e: any) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    this.data.user.userInfo = e.detail.userInfo
    this.data.user.userInfo = e.detail.userInfo,
      this.data.hasUserInfo = true
    this.setData(this.data)
    this.saveUserInfo();
  },

  saveUserInfo() {
    wx.setStorageSync("user", this.data.user)
  },

  loadUserInfo() {
    let tmp = wx.getStorageSync("user")
    if (tmp) {
      this.data.user = tmp
      if (this.data.user.userInfo) {
        this.data.hasUserInfo = true
      }
      this.setData({ user: tmp, hasUserInfo: this.data.hasUserInfo })
    }
  },

  onDeleteTeam(e: any) {
    if (!this.data.hasUserInfo) {
      wx.showToast({ icon: "error", title: "请先登录" });
      return;
    }

    let that = this
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

    getApp().getOpenId((openid: string, success: boolean) => {
      this.data.user.openid = openid;

      this.loadUserInfo();

      let teamRepo = new TeamRepo();

      console.log("load teams by owner: ", openid)

      teamRepo.fetchByOwner(openid, (errorCode: number, teams: VTeam[] | null) => {
        this.data.myteams = teams;
        this.setData({ myteams: teams })
      });


      teamRepo.fetchJointTeams(openid, ((errorCode: number, teams: VTeam[]) => {
        wx.hideLoading();
        this.data.jointTeams = teams;
        this.setData({ jointTeams: teams })
      }));

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