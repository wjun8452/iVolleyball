// pages/help.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
  onUnload: function () {

  },

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

  gotoQRCode: function() {
    wx.previewImage({
      urls: ["cloud://ilovevolleyball-d1813b.696c-ilovevolleyball-d1813b-1253572757/mywxcode.jpg"],
    })
  },

  onComment: function() {
    var plugin = requirePlugin("wxacommentplugin");
    plugin.openComment({
      success: (res)=>{
        console.log('plugin.openComment success', res)
      },
      fail: (res) =>{
        console.log('plugin.openComment fail', res)
      }
    })
  }
})