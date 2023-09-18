// pages/score_board/setting.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    titleLeft: true,
    pan: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if(options && options.titleLeft) {
      if (options.titleLeft == "true") {
        this.data.titleLeft = true;
      } else {
        this.data.titleLeft = false;
      }
      this.setData(this.data);
    }

    if(options && options.pan) {
      if (options.pan == "true") {
        this.data.pan = true;
      } else {
        this.data.pan = false;
      }
      this.setData(this.data);
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

  onRotate(e) {
    let titleLeft = e.detail.value=="true"; 
    this.data.titleLeft = titleLeft;
    this.setData({titleLeft: this.data.titleLeft})
    this.getOpenerEventChannel().emit('settingUpdated', {titleLeft: this.data.titleLeft});
  },

  onPan(e) {
    let pan = e.detail.value=="true"; 
    this.data.pan = pan;
    this.setData({pan: this.data.pan})
    this.getOpenerEventChannel().emit('panUpdated', {pan: this.data.pan});
  }
})