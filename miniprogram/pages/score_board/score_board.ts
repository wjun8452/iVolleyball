// pages/score_board/score_board.js

import { GlobalData } from "../../bl/GlobalData";
import { BasePage } from '../../bl/BasePage';
import { VolleyCourt } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository"


let globalData: GlobalData = getApp().globalData

class ScoreBoardPageData {
  /** 标题在屏幕左边 */
  titleLeft: boolean = false;
  /** 屏幕能显示的最多的分数个数，显示太多，会影响工具栏 */
  maxStatItem: number = 16;
  /** true：人面对屏幕，屏幕左边显示我方得分。team_name[0]是我方，冗余变量，跟team_name的顺序始终保持一致, 技术统计页面只统计我方的得分情况，记分牌要考虑两队相对左右方位，因此引入此变量  */
  leftMode: boolean = true; //
  /** team_name[0]将始终显示在左边，显示用 */
  team_name: [string, string] = ["对方", "我方"];
  /** 第一次使用会显示帮助动画 */
  firstTimeUse: boolean = true;
  /** 当前用户是否是比赛的创建者 */
  isOwner: boolean = true;
  /** 注意必须在onLoad之后从外部创建并传递进来，此处new MyVolleyCourt()，Page()会移除court的方法 */
  court: VolleyCourt | null = null;
  globalData: GlobalData = globalData;
}


class ScoreBoardPage extends BasePage {
  start_x_1: number = 0;
  start_y_1: number = 0;
  start_x_2: number = 0;
  start_y_2: number = 0;
  data: ScoreBoardPageData = new ScoreBoardPageData();
  repo: VolleyRepository | null = null;

  option_matchID: string | null = null;
  option_createNew: boolean = false; //不管是否有缓存，强制创建一个新的比赛

  constructor() {
    super()
  }

  onCourtChange = function (this: ScoreBoardPage, court: VolleyCourt, reason: Reason, status: Status): void {

    console.log("[ScoreBoard] onCourtChange Begins, reason:", reason, "status:", status, "court id:", court._id, "court:", court)

    /** 更新核心数据 */
    this.data.court = court;

    /** 更新其他连带属性 */
    this.data.maxStatItem = this.data.globalData.sysInfo.windowHeight > 600 ? 16 : 10;
    this.data.team_name[0] = this.data.leftMode ? this.data.court.myTeam : this.data.court.yourTeam
    this.data.team_name[1] = this.data.leftMode ? this.data.court.yourTeam : this.data.court.myTeam
    this.data.isOwner = this.data.court._id ? this.data.globalData.openid === this.data.court._openid : true;
    

    //更新界面
    this.setData(this.data)
    wx.hideLoading();

    if (reason != Reason.Init) {
      wx.vibrateShort({ type: 'medium' });
    }

    //判断并提示比赛是否结束，并可能走到重置流程
    if (reason == Reason.Update && this.data.court!.isMatchOver()) {
      this.onReset();
    }

    if (reason == Reason.LocalToCloud) {
      let url: string = '../share/share?_id=' + this.data.court!._id + "&myTeam=" + this.data.court?.myTeam + "&yourTeam=" + this.data.court?.yourTeam
        + "&myScore=" + this.data.court?.myScore + "&yourScore=" + this.data.court?.yourScore
        + "&place=" + this.data.court?.place + "&create_time=" + this.data.court?.create_time;

      wx.navigateTo({
        url: url
      })
    }

    console.log("[ScoreBoard] onCourtChange ends, this:", this)
  }

  onLoad = function (this: ScoreBoardPage, options: any) {
    console.log("[score board] onload, options:", options, "this:", this)

    wx.setNavigationBarTitle({
      title: '大记分牌'
    })

    if (options && options._id) {
      this.option_matchID = options._id;
    }

    if (options && options.createNew == "true") {
      this.option_createNew = true;
    }

    //加载本地设置
    try {
      //FTUE
      let value: string = wx.getStorageSync("scoreBoard.firstTimeUse")
      if (value === "false") {
        this.data.firstTimeUse = false;
      }

      value = wx.getStorageSync("scoreBoard.titleLeft")
      console.log("scoreBoard.titleLeft", value)
      if (value === "false") {
        this.data.titleLeft = false;
      } else {
        this.data.titleLeft = true;
      }

      this.setData({firstTimeUse: this.data.firstTimeUse, titleLeft: this.data.titleLeft})
    } catch (e) {
      console.error(e)
    }
  }

  onShow = function (this:ScoreBoardPage ) {
    wx.showLoading({
      title: "正在加载"
    })
    getApp().getOpenId((openid: string, success: boolean) => {
      if (success) {
        this.data.globalData = getApp().globalData;
        this.repo = new VolleyRepository(this.onCourtChange, openid, this.option_matchID, this.data.globalData.placeInfo, this.option_createNew)
        this.option_createNew = false;
      } else {
        wx.hideLoading()
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "getOpenId",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 1,
          "wxdata_perf_error_msg": "登录失败",
          "wxdata_perf_cost_time": 0,
        })
        wx.showToast({
          title: "登陆失败",
          icon: "error",
        })
      }
    })
  }

  onHide = function(this:ScoreBoardPage) {
    if (this.repo) {
      this.repo.close();
    }
  }

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload = function (this: ScoreBoardPage) {
    if (this.repo) {
      this.repo.close();
    }
  }

  /**
   * 结束当前比赛，如果之前是在线模式，则保存比赛结果并退回到本地模式初始化的状态。
   * @param 
   */
  onReset = function (this: ScoreBoardPage) {
    console.log("onReset")
    if (!this.data.isOwner || this.data.court!.status == 0) {
      wx.showToast({
        title: '无法操作',
      })
      return;
    }

    let content = this.data.court!._id ? "将保存本次比赛，回到本地模式，重新开始记分" : "将清零分数，重新开始记分";

    var that = this
    wx.showModal({
      title: '比赛结束?',
      content: content,
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          that.repo?.reset(that.data.court!);
        } else if (res.cancel) { }
      }
    })
  }

  updateMatch = function (this: ScoreBoardPage) {
    if (this.repo?.isOnlineMode()) {
      wx.showLoading({
        title: '正在加载',
      })
    }
    this.repo!.updateMatch(this.data.court!)
  }

  touch_end = function (this: ScoreBoardPage, mine: boolean, start_x: number, start_y: number, end_x: number, end_y: number) {
    var changeX = end_x - start_x;
    var changeY = end_y - start_y;

    var change_x_abs = Math.abs(changeX);
    var change_y_abs = Math.abs(changeY);

    if (change_x_abs < 50 && change_y_abs < 50) return;

    if (!this.data.isOwner || this.data.court!.status == 0) {
      wx.showToast({
        title: '无法操作',
      })
      return;
    }

    if (change_y_abs < change_x_abs) { //上下滑动幅度大于左右   
      if ((this.data.titleLeft && changeX < 0) || (!this.data.titleLeft && changeX > 0) ) { //加分
        mine ? this.data.court!.addScoreRotate() : this.data.court!.looseScoreRotate();
      } else { //减分
        var item = this.data.court!.getTopItem()
        if (item != null && mine && item.score > 0) {
          this.data.court!.popStatItem();
        } else if (item != null && (!mine) && item.score < 0) {
          this.data.court!.popStatItem();
        } else { //revert score and remove stat item
          this.data.court!.revertScore(mine)
        }
      }
      this.updateMatch();
    } else if (change_y_abs > this.data.globalData.sysInfo.windowHeight * 2 / 3) { //从左滑到右
      this.onReset();
    }
  }

  touchStart1 = function (this: ScoreBoardPage, e: any) {
    this.start_x_1 = e.changedTouches[0].pageX;
    this.start_y_1 = e.changedTouches[0].pageY;
  }

  touchEnd1 = function (this: ScoreBoardPage, e: any) {
    var end_x = e.changedTouches[0].pageX;
    var end_y = e.changedTouches[0].pageY;
    this.touch_end(this.data.leftMode, this.start_x_1, this.start_y_1, end_x, end_y);
  }

  touchStart2 = function (this: ScoreBoardPage, e: any) {
    this.start_x_2 = e.changedTouches[0].pageX;
    this.start_y_2 = e.changedTouches[0].pageY;
  }

  touchEnd2 = function (this: ScoreBoardPage, e: any) {
    var end_x = e.changedTouches[0].pageX;
    var end_y = e.changedTouches[0].pageY;
    this.touch_end(!this.data.leftMode, this.start_x_2, this.start_y_2, end_x, end_y);
  }

  stopPageScroll = function () {
  }

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady = function (this: ScoreBoardPage) {
    if (!this.data.firstTimeUse) return;

    this.animate("#score_board", [
      { opacity: 0.1 },
      { opacity: 1 }
    ], 4000, function (this: ScoreBoardPage) {
      this.clearAnimation("#score_board", function () {
        console.log("清除了#score_board")
      })
    }.bind(this))

    this.animate("#fresh_guide", [
      { opacity: 1 },
      { opacity: 1, ease: 'ease', translateY: -this.data.globalData.sysInfo.windowWidth / 5 * 2 }],
      4000, function (this: ScoreBoardPage) {
        this.clearAnimation("#fresh_guide", function () {
          console.log("清除了#fresh_guide")
        })
        wx.setStorageSync("scoreBoard.firstTimeUse", "false")
      }.bind(this))
  }

  swapTeam = function (this: ScoreBoardPage) {
    this.data.leftMode = !this.data.leftMode;
    var temp = this.data.team_name[0];
    this.data.team_name[0] = this.data.team_name[1];
    this.data.team_name[1] = temp;
    this.setData(this.data);
  }

  onShare = function (this: ScoreBoardPage) {
    if (this.data.court!._id) {
      let url: string = '../share/share?_id=' + this.data.court!._id + "&myTeam=" + this.data.court?.myTeam + "&yourTeam=" + this.data.court?.yourTeam
        + "&myScore=" + this.data.court?.myScore + "&yourScore=" + this.data.court?.yourScore
        + "&place=" + this.data.court?.place + "&create_time=" + this.data.court?.create_time;

      console.log(url);

      wx.navigateTo({
        url: url
      })
    } else {
      wx.showLoading({
        title: '正在加载...',
      })
      this.repo?.uploadMatch(this.data.court!);
    }
  }

  onStat = function (this: ScoreBoardPage) {
    if (this.data.court!._id) {
      wx.navigateTo({
        url: '../stat/stat?_id=' + this.data.court!._id
      })
    } else {
      wx.navigateTo({
        url: '../stat/stat'
      })
    }
  }

  onRotate = function (this: ScoreBoardPage) {
    this.data.titleLeft = !this.data.titleLeft;
    this.setData({titleLeft: this.data.titleLeft})
    wx.setStorageSync("scoreBoard.titleLeft", this.data.titleLeft.toString())
    console.log("save", this.data.titleLeft.toString())
  }

  onShareAppMessage = function (this: ScoreBoardPage) {
    let path: string = '/pages/score_board/score_board';

    if (this.data.court && this.data.court!._id) {
      path = '/pages/score_board/score_board?_id=' + this.data.court?._id;
    }

    return {
      title: '分享赛况',
      path: path,
      fail: function (res: any) {
        console.error(res);
        wx.showToast({
          title: '分享失败',
        })
      }
    }
  }
}

Page(new ScoreBoardPage())

