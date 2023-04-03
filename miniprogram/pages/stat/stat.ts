import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { GameStatus, VolleyCourt, PlayerStatRecord } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

let globalData: GlobalData = getApp().globalData

class StatPageData {
  /** 当前用户是否是比赛的创建者 */
  isOwner: boolean = true;
  /** 当前用户是否是统计裁判, 一个用户不能同时担任两个统计员 */
  isUmpire1: boolean = false;
  isUmpire2: boolean = false;
  /** 本轮统计阶段，false-正在统计 true-统计结束 */
  umpire_done: boolean = true;
  /** 统计按钮可以使用 */
  can_umpire: boolean = false;
  /** 是否显示撤销统计的按钮 */
  canRevertUmpire: boolean = false;
  /** 如果分配了两名统计员，则显示状态 */
  hasTwoUmpire: boolean = false;
  /** 当前分数下，各个队员的技术统计情况 */
  stat_record: PlayerStatRecord = {};


  court: VolleyCourt | null = null;
  globalData: GlobalData = globalData;
  /** 哪个位置正在被技术统计, 在players中的下标, UI相关，后续要移除 */
  opPosition: number = -1;
  /** 选中的操作大项目是什么？为null则没有选中, UI相关，后续要移除 */
  opCat: object | null = null;
}

class StatPage extends BasePage {
  _id: string | null = null;
  data: StatPageData = new StatPageData();
  repo: VolleyRepository | null = null;

  onCourtChange = function (this: StatPage, court: VolleyCourt, reason: Reason, status: Status): void {

    console.log("[Stat] onCourtChange Begins, reason:", reason, "status:", status, "court id:", court._id, "court:", court)

    /** 更新核心数据 */
    this.data.court = court;
    this.data.isOwner = this.data.court._id ? this.data.globalData.openid == this.data.court._openid : true;

    /** 以下增加了统计员后的处理，旧版本没有统计员属性，访问会出null */
    if (this.data.court.stat_umpire1 && this.data.court.stat_umpire2) {
      this.data.isUmpire1 = this.data.court.stat_umpire1.openid != "" ? (this.data.globalData.openid == this.data.court.stat_umpire1.openid) : false;
      this.data.isUmpire2 = this.data.court.stat_umpire2.openid != "" ? (this.data.globalData.openid == this.data.court.stat_umpire2.openid) : false;

      //update umpire_done
      let umpire1_done: boolean = true;
      if (this.data.court.stat_umpire1.openid != "") {
        umpire1_done = this.data.court.stat_umpire1_done;
      }

      let umpire2_done: boolean = true;
      if (this.data.court.stat_umpire2.openid != "") {
        umpire2_done = this.data.court.stat_umpire2_done;
      }

      this.data.umpire_done = umpire1_done && umpire2_done;

      //update cannot_umpire
      this.data.can_umpire = ((this.data.isUmpire1 && !this.data.court.stat_umpire1_done) || (this.data.isUmpire2 && !this.data.court.stat_umpire2_done)) && (this.data.court.status != GameStatus.Ended);

      console.log("isUmpire1:", this.data.isUmpire1, "isUmpire2:", this.data.isUmpire2, "umpire_done:", this.data.umpire_done, "canUmpire:", this.data.can_umpire);

      //update hasTwoUmpire
      this.data.hasTwoUmpire = this.data.court.stat_umpire1.openid != "" && this.data.court.stat_umpire2.openid != "";

      //update
      this.data.stat_record = this.data.court.getUmpireStats();

      //update canRevertUmpire
      this.data.canRevertUmpire = this.data.isUmpire1 ? this.data.court.canRevertUmpireStat(1) : this.data.isUmpire2 ? this.data.court.canRevertUmpireStat(2) : false;
    }


    //更新界面
    this.setData(this.data)

    if (reason != Reason.Init) {
      wx.vibrateShort({ type: 'medium' });
    }

    wx.hideLoading();

    //判断并提示比赛是否结束，并可能走到重置流程
    if (reason == Reason.Update && this.data.court!.isMatchOver()) {
      this.onReset();
    }

    if (reason == Reason.Ended) {
      wx.navigateTo({
        url: '../report/report?_id=' + court._id
      })
    }

    console.log("[Stat] onCourtChange ends, this:", this)
  }

  onLoad = function (this: StatPage, options: any) {
    wx.setNavigationBarTitle({
      title: '技术统计'
    })

    if (options._id) {
      this._id = options._id;
    }

    this.data.globalData = getApp().globalData;
  }

  onShow = function (this: StatPage) {
    wx.showLoading({
      title: "加载中"
    })
    getApp().getOpenId((openid: string, success: boolean) => {
      this.data.globalData = getApp().globalData;
      this.repo = new VolleyRepository(this.onCourtChange, openid, this._id, globalData.placeInfo);
    });
  }

  onHide = function (this: StatPage) {
    if (this.repo) {
      this.repo.close();
    }
  }

  onUnload = function (this: StatPage) {
    this.onHide() //sometimes only onUnload called, onHide is not called
  }

  onTapAddScore = function (this: StatPage) {
    this.data.court!.addScoreRotate()
    this.data.court!.stat_umpire2_done = false;
    this.data.court!.stat_umpire1_done = false;
    this.updateMatch()
  }

  onTapLooseScore = function (this: StatPage) {
    this.data.court!.looseScoreRotate()
    this.data.court!.stat_umpire2_done = false;
    this.data.court!.stat_umpire1_done = false;
    this.updateMatch()
  }

  onTapSetting = function (this: StatPage) {
    if (this.data.court?._id) {
      wx.navigateTo({
        url: '../stat_setting/stat_setting?_id=' + this.data.court._id
      })
    } else {
      wx.navigateTo({
        url: '../stat_setting/stat_setting',
      })
    }
  }

  onTapPlayItem = function (this: StatPage, e: any) {
    this.data.opCat = null
    this.data.opPosition = -1
    let position = e.target.dataset.position;
    let item_index = e.target.dataset.play_item_index;
    if (this.data.isUmpire1) {
      this.data.court!.stateUmpire1(position, item_index);
      this.updateMatchByUmpire1();
    } else if (this.data.isUmpire2) {
      this.data.court!.stateUmpire2(position, item_index);
      this.updateMatchByUmpire2();
    }
    else {
      //no possible
    }
  }

  onTapRevert = function (this: StatPage) {
    this.data.court!.popStatItem();
    this.updateMatch();
  }

  onTapScore = function (this: StatPage) {
    let mid = this.data.court!._id ? this.data.court!._id : "";
    wx.navigateTo({
      url: '../score_board/score_board?_id=' + mid,
    })
  }

  onTapCat = function (this: StatPage, e: any) {
    let position = e.target.dataset.position;
    let category = e.target.dataset.cat;
    this.data.opPosition = position;
    this.data.opCat = category;
    this.setData(this.data);
  }

  onTapBoard = function (this: StatPage) {
    this.data.opCat = null
    this.data.opPosition = -1
    this.setData(this.data)
  }

  onShare = function (this: StatPage) {
    if (this.data.court!._id) {
      wx.navigateTo({
        url: '../share/share',
      })
    } else {
      this.repo?.uploadMatch(this.data.court!);
    }
  }

  /**
 * 结束当前比赛，如果之前是在线模式，则保存比赛结果并退回到本地模式初始化的状态。
 * @param 
 */
  onReset = function (this: StatPage) {
    var that = this
    wx.showModal({
      title: '比赛结束?',
      content: '将上传技术统计数据，并跳转到统计报告',
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          that.repo?.uploadAndEndMatch(that.data.court!);
        } else if (res.cancel) { }
      }
    })
  }

  updateMatch = function (this: StatPage) {
    if (this.repo?.isOnlineMode()) {
      wx.showLoading({
        title: '正在加载',
      })
    }
    this.repo!.updateMatch(this.data.court!)
  }

  updateMatchByUmpire1 = function (this: StatPage) {
    this._updateMatchByUmpire("umpire1")
  }

  updateMatchByUmpire2 = function (this: StatPage) {
    this._updateMatchByUmpire("umpire2")
  }

  _updateMatchByUmpire = function (this: StatPage, who: string) {
    if (!this.data.court) return;

    wx.showLoading({
      title: '正在加载',
    })

    this.repo!.updateMatchByUmpire(who, this.data.globalData.openid, this.data.court!, (errorCode: number) => {
      wx.hideLoading()
      if (errorCode == 0) {
        // wx.showToast({
        //   title: "写入成功"
        // })
      } else if (errorCode == 1) {
        wx.showToast({
          icon: 'error',
          title: "参数错误"
        })
      } else if (errorCode == 2) {
        wx.showToast({
          icon: 'error',
          title: "写入未授权"
        })
      } else {
        wx.showToast({
          icon: 'error',
          title: "写入失败"
        })
      }
    })
  }

  onTapReport = function (this: StatPage) {
    if (this.data.court!._id) {
      wx.navigateTo({
        url: "../report/report?_id=" + this.data.court!._id
      })
    } else {
      wx.navigateTo({
        url: "../report/report"
      })
    }
  }

  onTapStatHistory = function (this: StatPage) {
    if (this.data.court!._id) {
      wx.navigateTo({
        url: "../stat_history/stat_history?_id=" + this.data.court!._id
      })
    } else {
      wx.navigateTo({
        url: "../stat_history/stat_history"
      })
    }
  }

  onTapSubmit = function (this: StatPage) {
    if (this.data.isUmpire1) {
      this.data.court!.stat_umpire1_done = true;
      this.updateMatchByUmpire1();
    }

    if (this.data.isUmpire2) {
      this.data.court!.stat_umpire2_done = true;
      this.updateMatchByUmpire2();
    }

    // wx.showToast({
    //   title: "等待主裁判分"
    // })
  }

  //撤销本轮统计
  onTapRevertStat = function (this: StatPage) {
    if (this.data.isUmpire1) {
      if (this.data.court!.revertUmpireStat(1)) {
        this.updateMatchByUmpire1();
      }
    }

    if (this.data.isUmpire2) {
      if (this.data.court!.revertUmpireStat(2)) {
        this.updateMatchByUmpire2();
      }
    }
  }
}

Page(new StatPage())