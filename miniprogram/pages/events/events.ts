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
    hasUserInfo: false,
    canIUseGetUserProfile: false,
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

    this.loadUserInfo();
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
    this.loadByTab();
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

  },

  createEvents() {
    if (this.data.hasUserInfo) {
      if (this.data.userEvents.length == 0) { //首次创建
        wx.navigateTo({
          url: "editevent?type=new"
        })
      } else {
        wx.navigateTo({ //在给定位置添加
          url: "editevent?type=insert&base_id="+ (this.data.userEvents[0].base_id+1),
        })
      } 
    } else {
      wx.showToast({
        icon: 'error',
        title: '点击头像登录',
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
    getApp().getOpenId((openid: string, success: boolean) => {
      if (success) {
        new EventRepo().fetchAllUserEvents(that._callback, this.favoriteOpenidRepo);
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
    } else {
      wx.showToast({ title: "加载失败！" })
    }
    wx.stopPullDownRefresh();
  },


  loadEventsTab4() {
    wx.showLoading({ "title": "正在加载..." })
    const that = this;
    getApp().getOpenId((openid: string, success: boolean) => {
      if (success) {
        new EventRepo().fetchUserEvents(openid, that._callback);
      } else {
        wx.showToast({ title: "获取openid失败！" })
        wx.stopPullDownRefresh();
      }
    });
  },

  loadEventsTab3() {
    wx.showLoading({ "title": "正在加载..." })
    const that = this;
    getApp().getOpenId((openid: string, success: boolean) => {
      if (success) {
        new FavoriteEventRepo().fetchUserEvents(that.favoriteOpenidRepo, that._callback);
      } else {
        wx.showToast({ title: "获取openid失败！" })
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

  getUserProfile(e: any) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    let that = this;
    wx.getUserProfile({
      desc: '用于完善球队的信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log("getUserProfile success")
        that.data.user.userInfo = res.userInfo
        that.data.hasUserInfo = true;
        that.setData(that.data)
        that.saveUserInfo();
      }
    })
  },

  getUserInfo(e: any) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log("getUserInfo clicked")
    this.data.user.userInfo = e.detail.userInfo;
    this.data.hasUserInfo = true;
    this.setData(this.data);
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

  showInitData() {
    this.data.viewAll = false; //collapsed
    this.data.userEvents = [];
    this.setData(this.data);
  }
})