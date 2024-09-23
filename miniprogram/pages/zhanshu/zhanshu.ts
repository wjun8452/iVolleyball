import { FavoriteTeamIdRepo } from "../../bl/FavoriteTeamIdRepo";
import { FavoriteTeamRepo } from "../../bl/FavoriteTeamRepo";
import { GlobalData } from "../../bl/GlobalData";
import { deDupTeams, TeamRepo, VPlayer, VTeam, VUser } from "../../bl/TeamRepo";

type MovablePlayer = VPlayer & {
  x: number,
  y: number,
}

// pages/zhanshu/zhanshu.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    myteams: [] as VTeam[], //可供选择的队伍
    players: [[], [], []] as MovablePlayer[][], //二维数组
    avatarWidth: 40 as number,
    team2posy: 700 as number,
    avatarPadding: 10 as number,
    screen_width: 0 as number,
    screen_height: 0 as number,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

    let globalData: GlobalData = getApp().globalData;
    this.data.screen_height = globalData.sysInfo.windowHeight;
    this.data.screen_width = globalData.sysInfo.windowWidth;

    this.data.players[2] = this._create_movable_players(this._create_default_players(16));
    console.log(this.data.players[2], this._create_default_players(16))
    this._reset_postion(this.data.players[2], 2);
    console.log(this.data.players[2])
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
    this._loadMyTeam(false);
    this.setData(this.data); //must have
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

  _loadMyTeam(showError: boolean) {
    wx.showLoading({
      title: '正在加载',
    });

    getApp().getCurrentUser((user: VUser, success: boolean) => {
      let that = this
      let teamRepo = new TeamRepo();
      teamRepo.fetchByOwner(user.openid, (errorCode: number, teams: VTeam[] | null) => {
        if (teams != null) {
          that.data.myteams = teams;
        }

        teamRepo.fetchJointTeams(user.openid, (errorCode: number, teams: VTeamp[]) => {
          if (teams != null) {
            that.data.myteams = that.data.myteams.concat(teams);
          }

          new FavoriteTeamRepo().fetchFavoriteTeams(new FavoriteTeamIdRepo(), (success: boolean, teams: VTeam[]) => {
            if (teams != null) {
              that.data.myteams = that.data.myteams.concat(teams);
            }
            that.data.myteams = deDupTeams(that.data.myteams)
            wx.hideLoading();
            that.setData(that.data);
          })
        })
      })
    });
  },

  onImportTeam(e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    let which = e.target.dataset.which; //0, 1
    let players = this.data.players;
    let source = this.data.myteams[e.detail.value].players;
    players[which] = this._create_movable_players(source);
    this._reset_postion(players[which], which)
    console.log("haha", players[which])
    this.setData({ players: this.data.players });
  },

  moving(e: any) {
    //console.log(e)
    if (e.detail.source == "") {
      return;
    }

    let index = e.currentTarget.dataset.moveid;
    let which = e.currentTarget.dataset.which;
    let players = this.data.players[which]
    players[index].x = e.detail.x;
    players[index].y = e.detail.y;
    this.setData({ players: this.data.players })
  },

  moved(e: any) {
    // console.log("moved:", e)
    let index = e.currentTarget.dataset.moveid;
    let which = e.currentTarget.dataset.which;
    let players = this.data.players[which]
    console.log("click: ",players[index].name);
  },

  reset(e: any) {
    this.data.players.forEach((players, index) => {
      this._reset_postion(players, index)
    });
    this.setData({ players: this.data.players })
  },

  _create_default_players(count: number): VPlayer[] {
    let players = [];
    for (let i = count; i >0; i--) {
      players.push({
        user: new VUser(),
        name: "",
        number: i.toString(),
      })
    }
    return players;
  },

  //从VPlayer创建出MovalblePlayer, 坐标默认
  _create_movable_players(source: VPlayer[]) : MovablePlayer[] {
    let output : MovablePlayer[] = [];
    source.forEach((player, index) => {
      let newObj: MovablePlayer = {
        user: player.user,
        name: player.name,
        number: !player.number ? (index+1).toString() : (player.number=="" ? (index+1).toString() : player.number),
        x: 0,
        y: 0,
      }
      output.push(newObj)
    });
    return output;
  },

  //重新计算坐标, pos=0 排在左边, 1 右边， 2 上中重叠
  _reset_postion(output: MovablePlayer[], pos: number) {
    output.forEach((player, index) => {
      
      player.x = pos == 0 ? this.data.avatarPadding : pos == 1 ? this.data.screen_width - this.data.avatarPadding - this.data.avatarWidth : this.data.screen_width / 2 - this.data.avatarWidth / 2;

      player.y = pos == 0 || pos == 1 ? (this.data.avatarPadding + this.data.avatarWidth) * (index+1) : this.data.avatarPadding;

    });
  }

})