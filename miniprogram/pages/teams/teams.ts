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

  getUserProfile() {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用于完善球队的信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.data.user.userInfo = res.userInfo
        this.setData(this.data)
        getApp().saveUserInfo(this.data.user);
      }
    })
  },

  getUserInfo(e: any) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    this.data.user.userInfo = e.detail.userInfo
    this.setData(this.data)
    getApp().saveUserInfo(this.data.user);
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
    getApp().getCurrentUser((user:VUser, success: boolean) => {
      if (success) {
        that2.data.user = user;
        that2.setData({user:user})
        let teamRepo = new TeamRepo();
        console.log("load teams by owner: ", this.data.user.openid)
        const that = that2;
        teamRepo.fetchByOwner(user.openid, (errorCode: number, teams: VTeam[] | null) => {
          if (errorCode == 0) {
            that.data.myteams = teams;
            that.setData({ myteams: teams })
          } else {
            wx.showToast({'title':'加载失败!', 'icon':'error'})
          }
          wx.hideLoading();
        });
  
  
        teamRepo.fetchJointTeams(user.openid, ((errorCode: number, teams: VTeam[]) => {
          if (errorCode == 0) {
            that.data.jointTeams = teams;
            that.setData({ jointTeams: teams })
          } else {
            wx.showToast({'title':'加载失败!', 'icon':'error'})
          }
          wx.hideLoading();
        }));
      } else {
        wx.showToast({'title': '错误', 'icon':'error'})
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