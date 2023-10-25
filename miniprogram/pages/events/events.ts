// pages/matches/matches.ts
import { Event, EventRepo, UserEvent } from "../../bl/EventRepo"
import { FavoriteEventRepo } from "../../bl/FavoriteEventRepo";
import { FavoriteOpenidRepo } from "../../bl/FavoriteOpenidRepo";
import { VUser } from "../../bl/TeamRepo";

Page({
  favoriteOpenidRepo: new FavoriteOpenidRepo(),

  /**
   * 页面的初始数据
   */
  data: {
    viewAll: false,
    tab: 4, //0-搜索，1-最近，2-大厅，3-收藏，4-管理
    userEvents: [], //multiple Events of mulitple owners
    user: new VUser(),
    canIUseGetUserProfile: false,
    keyword: "", //搜索关键词
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.favoriteOpenidRepo.load();

    const newLocal = wx.getUserProfile;
    if (newLocal) {
      this.setData({
        canIUseGetUserProfile: true
      })
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
    const that = this;
    wx.showLoading({
      'title': '正在加载'
    })
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        that.data.user = user;
        if (user.userInfo.avatarUrl != "" && user.userInfo.nickName != "") {
          //如果Event的Owner更新了Profile，就更新Event数据库
          new EventRepo().fetchOwnerAvatar(user.openid, (success: boolean, owner: VUser) => {
            if (success) {
              if (owner.userInfo.avatarUrl != user.userInfo.avatarUrl || owner.userInfo.nickName != user.userInfo.nickName) {
                new EventRepo().updateAvatar(user.openid, user, (success: boolean) => {
                  if (success) {
                    wx.hideLoading();
                    that.loadByTab();
                  }
                  else {
                    wx.hideLoading();
                    that.loadByTab();
                  }
                })
              } else {
                wx.hideLoading();
                that.loadByTab();
              }
            } else {
              wx.hideLoading();
              that.loadByTab();
            }
          })
        } else {
          wx.hideLoading();
          that.loadByTab();
        }

      } else {
        wx.hideLoading();
        that.loadByTab();
      }
    })
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
    this.loadByTab();
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

  createEvents() {
    if (this.data.user.userInfo.avatarUrl != "") {
      if (this.data.userEvents.length == 0) { //首次创建
        wx.navigateTo({
          url: "editevent?type=new"
        })
      } else {
        wx.navigateTo({ //数组尾部添加一个新的
          url: "editevent?type=insert&base_id=" + (this.data.userEvents[0].base_id + 1),
        })
      }
    } else {
      wx.showToast({
        icon: 'error',
        title: '完善资料后才能创建',
        duration: 2000,
        complete: function () {
          //不延时的话，Toast很快就消失了
          setTimeout ( function () {
            wx.navigateTo({
              url: "../myprofile/myprofile"
            })
          }, 1500)
        }
      })
    }
  },

  viewEvent(e) {
    const base_id = e.currentTarget.dataset.base_id;
    const openid = e.currentTarget.dataset.openid;
    wx.navigateTo({
      url: "board?base_id=" + base_id + "&openid=" + openid,
    })
  },

  editEvent(e) {
    const base_id = e.currentTarget.dataset.base_id;
    const openid = e.currentTarget.dataset.openid;
    wx.navigateTo({
      url: "editevent?type=update&base_id=" + base_id + "&openid=" + openid,
    })
  },

  onClickTab(e) {
    let tab = e.currentTarget.dataset.tab;
    if (this.data.tab == tab) return;
    this.data.tab = tab;
    this.showInitData(); //refresh UI immediatly
    this.loadByTab();
  },

  loadByTab() {
    if (this.data.tab == 4) { //管理
      this.loadEventsTab4();
    } else if (this.data.tab == 3) {//收藏
      this.loadEventsTab3();
    } else if (this.data.tab == 2) {//大厅
      this.loadEventsTab2();
    }
  },

  loadEventsTab2() {
    wx.showLoading({ "title": "正在加载..." })
    const that = this;
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        that.data.user = user;
        new EventRepo().fetchAllUserEvents(that._callback, that.favoriteOpenidRepo);
      } else {
        wx.showToast({ title: "获取openid失败！" })
        wx.stopPullDownRefresh();
      }
    });
  },

  _callback(success: boolean, userEvents: UserEvent[] | null) {
    wx.hideLoading();
    if (success && userEvents) {
      this.data.userEvents = userEvents;
      this.setData(this.data);
      if (this.data.userEvents.length == 0) {
        wx.showToast({ 'title': '没有结果', 'icon': 'none' })
      }
    } else {
      wx.showToast({ title: "加载失败！", icon: "error" })
    }
    wx.stopPullDownRefresh();
  },


  loadEventsTab4() {
    wx.showLoading({ "title": "正在加载..." })
    const that = this;
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        that.data.user = user;
        new EventRepo().fetchUserEvents(user.openid, that._callback);
      } else {
        wx.showToast({ title: "获取openid失败！", icon: "error" })
        wx.stopPullDownRefresh();
      }
    });
  },

  loadEventsTab3() {
    wx.showLoading({ "title": "正在加载..." })
    const that = this;
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        that.data.user = user;
        new FavoriteEventRepo().fetchUserEvents(that.favoriteOpenidRepo, that._callback);
      } else {
        wx.showToast({ title: "获取openid失败！", icon: "error" })
        wx.stopPullDownRefresh();
      }
    });
  },

  loadEventsTab0() {
    wx.showLoading({ "title": "正在加载..." })
    const that = this;
    getApp().getCurrentUser((user: VUser, success: boolean) => {
      if (success) {
        that.data.user = user;
        new EventRepo().fetchUserEventsByName(that.data.keyword, that._callback, that.favoriteOpenidRepo);
      } else {
        wx.showToast({ title: "获取openid失败！", icon: "error" })
        wx.stopPullDownRefresh();
      }
    });
  },

  viewAll() {
    this.data.viewAll = true;
    this.setData(this.data);
  },

  addFavorite(e) {
    let openid = e.currentTarget.dataset.openid;
    const values = e.detail.value;
    if (values.length > 0) {
      this.favoriteOpenidRepo.add(openid)
    } else {
      this.favoriteOpenidRepo.remove(openid);
      if (this.data.tab == 3) {
        this.loadByTab();
      }
    }
  },

  showInitData() {
    this.data.viewAll = false; //collapsed
    this.data.userEvents = [];
    this.setData(this.data);
  },

  onInputName(e) {
    this.data.keyword = e.detail.value;
    console.log(this.data.keyword);
  },

  searchEvent(e) {
    if (this.data.keyword == "") {
      wx.showToast({ 'title': '名称不能为空', 'icon': 'error' })
      return;
    }
    this.loadEventsTab0();
  }

})