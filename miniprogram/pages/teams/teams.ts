import { TeamRepo } from "../../bl/TeamRepo";

// pages/teams/teams.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    myteam: null,
    jointTeams: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    getApp().getOpenId((openid: string) => {
      let teamRepo = new TeamRepo();
      
      teamRepo.fetchByOwner(openid, (errorCode:number, team:VTeam | null) => {
        this.data.myteam = team;
        this.setData({myteam: team})
      });


      teamRepo.fetchJointTeams(openid, ((errorCode:number, teams:VTeam[]) => {
        this.data.jointTeams = teams;
        this.setData({jointTeams: teams})
      }));

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

  }
})