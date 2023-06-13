Page({

  /**
   * 页面的初始数据
   */
  data: {
    myTeam: "",
    yourTeam: "",
    place: "",
    myScore: "",
    yourScore: "",
    create_time: "",
    _id: "",
    target: "",
    which_umpire: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.data._id = options._id
    this.data.myTeam = options.myTeam
    this.data.yourTeam = options.yourTeam
    this.data.myScore = options.myScore
    this.data.yourScore = options.yourScore
    this.data.place = options.place
    this.data.create_time = options.create_time
    this.data.target = options.target
    this.data.which_umpire = options.which_umpire

    console.log(this.data);

    this.setData(this.data)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    if (this.data.target == "stat_setting") {
      if (this.data.which_umpire == "1") {
        return this.gotoInvitePage(this.data._id, "inviteAsUmpire1=true");
      } else if (this.data.which_umpire == "2") {
        return this.gotoInvitePage(this.data._id, "inviteAsUmpire2=true");
      }
    } else {
      var path = '/pages/score_board/score_board?_id=' + this.data._id
      console.log("share path=" + path)
      return {
        title: '实时查看比赛分数',
        path: path,
        fail: function (res) {
          wx.showToast({
            title: '分享失败',
          })
        }
      }
    }
  },

  gotoInvitePage: function (_id, inviteToken) {
    let path = '/pages/stat_setting/stat_setting?_id=' + _id + "&" + inviteToken;
    console.log("share path=" + path)
    return {
      title: '好友邀请你成为统计员',
      path: path,
      fail: function (res) {
        wx.showToast({
          title: '邀请失败',
        })
      }
    }
  }
})