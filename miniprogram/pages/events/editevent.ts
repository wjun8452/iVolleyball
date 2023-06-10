import { Event, EventHelper, EventRepo, UserEvent } from "../../bl/EventRepo"
import { VTeam, VUser } from "../../bl/TeamRepo";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    hasUserInfo: false,
    user: new VUser(),
    event: new Event(0, "", new VUser(), 0, []),
    type: "new",
    openid: "",
    base_id: -1,
    loaded: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo();

    if (this.data.hasUserInfo) {
      this.data.event = new Event(0, "", this.data.user, 0, []);
    }

    for (let i = 0; i < 4; i++) {
      this.add();
    }

    console.log(options)
    if (options && options.type) { //new, insert, update
      this.data.type = options.type;
      if (options.base_id) {
        this.data.base_id = Number.parseInt(options.base_id);
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

  },

  add() {
    let team = new VTeam();
    team.name = "队伍" + (this.data.event.teams.length + 1);
    this.data.event.teams.push(team);
    new EventHelper().initTeamMatches(this.data.event);
    new EventHelper().updateTeamScore(this.data.event);

    this.setData(this.data)
  },

  delete(e: any) {
    this.data.event.teams.splice(e.target.dataset.index, 1)
    this.data.event.team_matches[0].splice(e.target.dataset.index, 1)
    new EventHelper().initTeamMatches(this.data.event);
    new EventHelper().updateTeamScore(this.data.event);
    this.setData(this.data);
  },

  create() {
    console.log(this.data)
    let that = this;
    wx.showLoading({ title: "正在创建..." })
    getApp().getOpenId((openid: string, success: boolean) => {
      if (success) {
        if (that.data.type == "new") {
          new EventRepo().createUserEvents(openid, that.data.user, that.data.event, (success: boolean) => {
            wx.hideLoading();
            if (success) {
              wx.showToast({
                "title": "创建成功！"
              })

              //此处不能使用微信的event channel来传递参数了
              wx.redirectTo({
                url: "board?openid=" + openid + "&base_id=0",
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
          that.data.event.base_id = that.data.base_id;
          new EventRepo().insertEvent(openid, that.data.event, (success: boolean) => {
            wx.hideLoading();
            if (success) {
              wx.showToast({
                "title": "创建成功！"
              })

              //此处不能使用微信的event channel来传递参数了
              wx.redirectTo({
                url: "board?openid=" + openid + "&base_id=" + that.data.event.base_id,
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
    this.data.event.teams[e.target.dataset.index].name = e.detail.value;
  },

  update() {
    let that = this;
    console.log("update", this.data.event)
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

  onEditName (e) {
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

  onClearTeams(e) {
    for (let i = 0; i < this.data.event.teams.length; i++) {
      this.data.event.teams[i].name = "";
    }
    this.setData(this.data);
  }
})