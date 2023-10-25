import { VUser } from "../../bl/TeamRepo"
import { parseDate, parseTime } from "../../utils/Util"

// pages/myprofile/myprofile.ts
const app = getApp()

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'


Page({
  data: {
    theme: wx.getSystemInfoSync().theme,
    openid: "",
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: ""
    }
  },

  onLoad() {
    wx.onThemeChange((result) => {
      this.setData({
        theme: result.theme
      })
    })
  },

  onShow(e) {
    const that = this;
    app.getCurrentUser((user: VUser, success: boolean) =>  {
      that.data.openid = user.openid;
      that.data.userInfo = user.userInfo;
      that.setData(that.data);
      console.log("onshow", that.data)
    })
  },

  onChooseAvatar(e) {
    console.log(e)
    const that = this;
    this.data.userInfo.avatarUrl = e.detail.avatarUrl
    wx.showLoading({
      'title': '正在处理'
    })
    //todo: 限制文件大小
    wx.cloud.uploadFile({
      cloudPath: "users/" + this.data.openid + "/" + parseTime(new Date(), "Y-M-D-h-m-s"),
      filePath: this.data.userInfo.avatarUrl,
      config: {
        env: app.globalData.env,
      },
      success: res => {
        console.log(res.fileID)
        that.data.userInfo.avatarUrl = res.fileID
        //todo: URL后续会存在cache中，用户卸载小程序之后URL会清空。不过URL会被存在比赛vmatch，和vevent中，问题不大。
        that.setData(that.data);
        wx.hideLoading();
      },
      fail: err => {
        console.error(err);
        wx.hideLoading();
      }
    })
  },

  onEditName(e) {
    console.log("onEditName", e);
    this.data.userInfo.nickName = e.detail.value
  },

  onConfirm(e) {
    console.log("onConfirm")
    if (this.data.userInfo.avatarUrl == "") {
      wx.showToast({
        title: '头像不能为空！',
        icon: "error"
      })
      return;
    }

    this.data.userInfo.nickName = this.data.userInfo.nickName.replace(/^\s*|\s*$/g, "");
    if (this.data.userInfo.nickName == "") {
      wx.showToast({
        title: '昵称不能为空！',
        icon: "error"
      })
      return;
    }

    app.saveAvatarUrlAndNickName(this.data.userInfo.avatarUrl, this.data.userInfo.nickName);
    this.getOpenerEventChannel().emit('updateAvartar', this.data.userInfo);
    wx.navigateBack();
    console.log(app);
  }
})
