import { Event, EventHelper, EventRepo, UserEvent } from "../../bl/EventRepo"
import { FavoriteTeamIdRepo } from "../../bl/FavoriteTeamIdRepo";
import { FavoriteTeamRepo } from "../../bl/FavoriteTeamRepo";
import { deDupTeams, TeamRepo, VTeam, VUser } from "../../bl/TeamRepo";
import { getUUID } from "../../utils/Util"

Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: new VUser(),
    event: new Event(0, "", new VUser(), 0, []),
    type: "new",
    openid: "",
    base_id: "",
    loaded: false,
    isOwner: false,
    pikerTeamIndex: -1, //UI data
    myteams: [], //球队
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadMyTeams(false); //开始加载球队信息，不block UI刷新

    for (let i = 0; i < 4; i++) {
      this.add();
    }

    console.log(options)
    if (options && options.type) { //new, insert, update
      this.data.type = options.type;
      if (options.base_id) {
        this.data.base_id = options.base_id;
      }

      if (options.openid) {
        this.data.openid = options.openid;
      }
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
    if (this.data.type == "update") {//不是首次创建，从云端拉取比赛信息
      wx.showLoading({ "title": "正在加载..." })

      const that = this;
      new EventRepo().fetchEvent(this.data.openid, this.data.base_id, (success: boolean, event: Event | null) => {
        wx.hideLoading();

        if (success && event) {
          that.data.event = event;
          console.log(that.data)
        } else {
          wx.showToast({ "title": "失败", "icon": "error" })
        }
        that.data.loaded = true;
        that.setData(that.data);
      })
    } else {
      this.data.loaded = true;
      this.setData(this.data);
    }
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
    let path = '/pages/events/events';
    return {
      title: '赛事组织',
      path: path,
    }
  },

  add() {
    if (this.data.event.teams.length >= 10) {
      wx.showToast({ "title": "最多10个队伍", "icon": "error" })
      return;
    }
    let team = new VTeam();
    team.name = "队伍" + (this.data.event.teams.length + 1);
    this.data.event.teams.push(team);
    new EventHelper().initTeamMatches(this.data.event);
    new EventHelper().updateTeamScore(this.data.event);

    this.setData(this.data)
  },

  deleteTeam(e: any) {
    if (this.data.event.teams.length <= 2) {
      wx.showToast({ "title": "至少2个队伍", "icon": "error" })
      return;
    }
    this.data.event.teams.splice(e.target.dataset.index, 1)
    this.data.event.team_matches[0].splice(e.target.dataset.index, 1)
    new EventHelper().initTeamMatches(this.data.event);
    new EventHelper().updateTeamScore(this.data.event);
    this.setData(this.data);
  },

  onImportTeam(e: any) {
    const index = e.target.dataset.index;
    console.log('被导入的队伍序号:', e.detail.value, ". 目标队伍序号: ", index)
    
    this.data.pikerTeamIndex = e.detail.value;
    this.setData({ pikerTeamIndex: this.data.pikerTeamIndex });
    if (this.data.pikerTeamIndex < 0) return;

    let team:VTeam = this.data.myteams[this.data.pikerTeamIndex];
    this.data.event.teams[index] = team;
    this.setData(this.data)
  },

  loadMyTeams(showError:boolean) {
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      let that = this
      let teamRepo = new TeamRepo();
      teamRepo.fetchByOwner(user.openid, (errorCode: number, teams: VTeam[] | null) => {
        if (teams != null) {
          that.data.myteams = teams;
          that.setData(that.data);
        }

        teamRepo.fetchJointTeams(user.openid, (errorCode: number, teams: VTeamp[]) => {
          if (teams != null) {
            that.data.myteams = that.data.myteams.concat(teams);
            that.setData(that.data);
          }

          new FavoriteTeamRepo().fetchFavoriteTeams(new FavoriteTeamIdRepo(), (success: boolean, teams: VTeam[]) => {
              if (teams != null) {
                that.data.myteams = that.data.myteams.concat(teams);
                that.setData(that.data);
              }
              deDupTeams(that.data.myteams)
              that.setData(that.data);
          })

        })
      })
    });
  },

  create() {
    console.log(this.data)
    let that = this;
    wx.showLoading({ title: "正在创建..." })
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        that.data.user = user;
        if (that.data.type == "new") {
          new EventRepo().createUserEvents(user.openid, that.data.user, that.data.event, (success: boolean) => {
            wx.hideLoading();
            if (success) {
              wx.showToast({
                "title": "创建成功！"
              })

              //此处不能使用微信的event channel来传递参数了
              wx.redirectTo({
                url: "board?openid=" + user.openid + "&base_id=0",
              })
            } else {
              wx.showToast({
                "title": "创建失败!",
                "icon": "error"
              })
            }
            that.setData(that.data);
          })
        } else if (that.data.type == "insert") {
          that.data.event.base_id = getUUID();
          new EventRepo().insertEvent(user.openid, that.data.event, (success: boolean) => {
            wx.hideLoading();
            if (success) {
              wx.showToast({
                "title": "创建成功！"
              })

              //此处不能使用微信的event channel来传递参数了
              wx.redirectTo({
                url: "board?openid=" + user.openid + "&base_id=" + that.data.event.base_id,
              })
            } else {
              wx.showToast({
                "title": "创建失败!",
                "icon": "error"
              })
            }
            that.setData(that.data);
          })
        } else {
          wx.showToast({ "title": "内部错误!", "icon": "error" })
        }
      } else {
        wx.showToast({
          "title": "未鉴权!",
          "icon": "error"
        })
      }
    })
  },

  onInput(e: any) {
    if (e.detail.value.length > 5) {
      wx.showToast({ "title": "最长5个汉字!", "icon": "error" })
      return;
    }
    this.data.event.teams[e.target.dataset.index].name = e.detail.value;
  },

  update() {
    let that = this;
    console.log("update", this.data.event)
    if (this.data.event.teams.length <= 2) {
      wx.showToast({ "title": "至少2个队伍", "icon": "error" })
      return;
    }
    new EventRepo().updateEvent(this.data.openid, this.data.event, (success: boolean) => {
      if (success) {
        wx.showToast({
          "title": "更新成功！"
        })

        //如果使用redirectTo，就不能使用微信的event channel来传递参数了
        wx.redirectTo({
          url: "board?openid=" + that.data.openid + "&base_id=" + that.data.base_id,
        })
      } else {
        wx.showToast({
          "title": "更新失败!"
        })
      }
    })
  },

  onEditName(e) {
    let name = e.detail.value
    name = name.replace(/^\s*|\s*$/g, "");
    if (name.length > 0) {
      this.data.event.name = name;
    } else {
      wx.showToast({
        title: '名称不能为空！',
        icon: "error"
      })
    }
  },

  onDeleteTail(e) {
    if (this.data.event.teams.length <= 2) {
      wx.showToast({ "title": "至少2个队伍", "icon": "error" })
      return;
    }
    this.data.event.teams.splice(this.data.event.teams.length - 1, 1)
    this.data.event.team_matches[0].splice(this.data.event.teams.length - 1, 1)
    new EventHelper().initTeamMatches(this.data.event);
    new EventHelper().updateTeamScore(this.data.event);
    this.setData(this.data);
  },

  deleteEvent() {
    console.log("delete", this.data.event)
    let that = this
    wx.showModal({
      title: '确定删除?',
      content: '删除后资料不可恢复',
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          new EventRepo().deleteEvent(that.data.openid, that.data.event, (success: boolean) => {
            if (success) {
              wx.showToast({
                "title": "删除成功！"
              })
              wx.navigateBack();
            } else {
              wx.showToast({
                "title": "删除失败!"
              })
            }
          })
        } else if (res.cancel) { }
      }
    })
  }
})