import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { VUser } from "../../bl/TeamRepo";
import { GameStatus, VolleyCourt, PlayerStatRecord } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

let globalData: GlobalData = getApp().globalData
let showLoading:boolean = false;

class StatPageData {
  /**  */
  court_index: number = 0; //目前被操作的court是哪一个
  courts: VolleyCourt[] = [];  //本场比赛关联的2个court。
  /** 当前用户是否是比赛的创建者 */
  isOwner: boolean = true;
  /** 当前用户是否是统计裁判, 1和2不能同时为true，3和4不能同时为true */
  isUmpire1: boolean = false;
  isUmpire2: boolean = false;
  isUmpire3: boolean = false;
  isUmpire4: boolean = false;
  /** 所有的统计员统计结束？，false-正在统计 true-统计结束，结束后，主裁判可以判分 */
  umpire_done: boolean = true;
  /** 统计按钮可以使用，根据当前用户的角色，以及其他角色的情况来判断 */
  can_umpire: boolean = false;
  /** 当前分数下，我方各个队员的技术统计情况，是在本页面合并了2个统计员的操作之后的结果 */
  stat_record: PlayerStatRecord = {};
  /** 当前分数下，对方各个队员的技术统计情况，是在本页面合并了2个统计员的操作之后的结果 */
  stat_record2: PlayerStatRecord = {};
  court: VolleyCourt | null = null; //目前被操作的court
  globalData: GlobalData = globalData;
  /** 哪个位置正在被技术统计, 在players中的下标, UI相关，后续要移除 */
  opPosition: number = -1;
  /** 选中的操作大项目是什么？为null则没有选中, UI相关，后续要移除 */
  opCat: object | null = null;
  /** 0: 我方球场，1: 对方球场, 2：双方球场 */
  showWhichCourt: number = 0;
  /** 上一次按统计按钮，是哪个统计员，0表示无， 1~4 表示4个统计员，用于后面撤销统计，如果lastStatUmpire不为0，则可以使用统计按钮
   */
  lastStatUmpire: number = 0;

  /** 对方场地，哪个位置正在被技术统计, 在players中的下标, UI相关，后续要移除 */
  opPosition2: number = -1;
  /** 对方场地，选中的操作大项目是什么？为null则没有选中, UI相关，后续要移除 */
  opCat2: object | null = null;
  /** 当前提示用户的文字 */
  tips_text: string = "";
  showTips: boolean = true;
}

class StatPage extends BasePage {
  _id: string | null = null;
  data: StatPageData = new StatPageData();
  repo: VolleyRepository | null = null;

  onCourtChange = function (this: StatPage, court: VolleyCourt, reason: Reason, status: Status, success: boolean): void {

    console.log("onCourtChange, reason:", reason, ", status:", status, ", court id:", court._id, ", court:", court, ", success:", success)

    //需在showToast之前调用，因为它会立即使toast消失
    if (showLoading) {
      wx.hideLoading();
      console.log("hide loading")
      showLoading = false;
    }
    

    if (!success) {
      wx.showToast({ 'title': '操作失败！', 'icon': 'error' })
      return;
    }

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

      this.data.stat_record = this.data.court.getUmpireStats();
    }

    if (this.data.court.stat2_umpire1 && this.data.court.stat2_umpire2) {
      this.data.isUmpire3 = this.data.court.stat2_umpire1.openid != "" ? (this.data.globalData.openid == this.data.court.stat2_umpire1.openid) : false;
      this.data.isUmpire4 = this.data.court.stat2_umpire2.openid != "" ? (this.data.globalData.openid == this.data.court.stat2_umpire2.openid) : false;

      //update umpire_done
      let umpire1_done: boolean = true;
      if (this.data.court.stat2_umpire1.openid != "") {
        umpire1_done = this.data.court.stat2_umpire1_done;
      }

      let umpire2_done: boolean = true;
      if (this.data.court.stat2_umpire2.openid != "") {
        umpire2_done = this.data.court.stat2_umpire2_done;
      }

      this.data.umpire_done = this.data.umpire_done && umpire1_done && umpire2_done;

      //update
      this.data.stat_record2 = this.data.court.getUmpireStats2();
    }

    {//判断该显示哪个场地
      if (this.data.isUmpire1 || this.data.isUmpire2) {
        this.data.showWhichCourt = 0;
      }
      if (this.data.isUmpire3 || this.data.isUmpire4) {
        this.data.showWhichCourt = 1;
      }
      if ((this.data.isUmpire1 || this.data.isUmpire2) && (this.data.isUmpire3 || this.data.isUmpire4)) {
        this.data.showWhichCourt = 2;
      }
    }

    {//update can_umpire
      this.data.can_umpire = ((this.data.isUmpire1 && !this.data.court.stat_umpire1_done) || (this.data.isUmpire2 && !this.data.court.stat_umpire2_done) ||
        (this.data.isUmpire3 && !this.data.court.stat2_umpire1_done) ||
        (this.data.isUmpire4 && !this.data.court.stat2_umpire2_done)) && (this.data.court.status != GameStatus.Ended);

      console.log("isUmpire1:", this.data.isUmpire1, "isUmpire2:", this.data.isUmpire2, "isUmpire3:", this.data.isUmpire3, "isUmpire4:", this.data.isUmpire4, "canUmpire:", this.data.can_umpire, ". 1,2,3,4=", this.data.court.stat_umpire1_done, this.data.court.stat_umpire2_done, this.data.court.stat2_umpire1_done, this.data.court.stat2_umpire2_done);
    }

    {//等待其他人提交
      let waitingForOthers: boolean = false;
      let pre_tip = this.data.tips_text;
      if (this.data.can_umpire) {
        this.data.tips_text = "请做技术统计，并提交"
      } else if (this.data.umpire_done) {
        if (!this.data.isOwner) {
          this.data.tips_text = "等待主裁判分..."
          waitingForOthers = true;
        } else {
          this.data.tips_text = "请判分"
        }
      } else {
        this.data.tips_text = "等待其他裁判提交技术统计..."
        waitingForOthers = true;
      }

      if (this.data.showTips && pre_tip != this.data.tips_text && this.data.tips_text != "") {
        console.log("show loading, show toast")
        wx.showToast({ title: this.data.tips_text, icon: "none"})
      }

      if (this.data.court.status == GameStatus.Ended) {
        waitingForOthers = false;
      }

      let isReadOnly = (!this.data.isOwner && !this.data.isUmpire1 && !this.data.isUmpire2 && !this.data.isUmpire3 && !this.data.isUmpire4)

      console.log("waiting for others, ", waitingForOthers)
      if (this.repo) {
        if (isReadOnly) {
          this.repo.startSync(5000, 5000);
        } else {
          if (waitingForOthers) {
            //如果等候其他人操作，则需告知Repo启动主动拉取云端数据
            this.repo.startSync(0, 2000);
          } else {
            this.repo.stopSync();
          }
        }
      }
    }

    //更新界面
    console.log(this.data)
    this.setData(this.data)

    if (reason != Reason.Init && reason != Reason.SyncUpdate) {
      wx.vibrateShort({ type: 'medium' });
    }

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

    if (options._id) {
      this._id = options._id;
    }

    this.data.globalData = getApp().globalData;
  }

  onShow = function (this: StatPage) {
    wx.showLoading({
      title: "加载中"
    })
    showLoading = true;
    console.log("show loading")

    //加载本地设置
    try {
      //FTUE
      let value: string = wx.getStorageSync("showTips");
      console.log("getStorageSync(showTips) = ", value, typeof(value))
      if (typeof(value) == "boolean") {
        this.data.showTips = value;
      } 
      this.setData({ showTips: this.data.showTips })
      console.log("showTips:", this.data.showTips)
    } catch (error) {
      console.error(error);
    }

    getApp().getCurrentUser((user: VUser, success: boolean) => {
      this.data.globalData = getApp().globalData;
      this.repo = new VolleyRepository(this.onCourtChange, user.openid, user, this._id, globalData.placeInfo, false, false);
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
    this.data.court!.stat_umpire1_done = false;
    this.data.court!.stat_umpire2_done = false;
    this.data.court!.stat2_umpire1_done = false;
    this.data.court!.stat2_umpire2_done = false;
    this.updateMatch()
  }

  //判分后，将各个裁判员的状态复位
  onTapLooseScore = function (this: StatPage) {
    this.data.court!.looseScoreRotate()
    this.data.court!.stat_umpire1_done = false;
    this.data.court!.stat_umpire2_done = false;
    this.data.court!.stat2_umpire1_done = false;
    this.data.court!.stat2_umpire2_done = false;
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
    let position = e.target.dataset.position;
    let item_index = e.target.dataset.play_item_index;
    let courtIndex = e.target.dataset.courtindex;
    if (courtIndex == 1) {
      this.data.opCat = null
      this.data.opPosition = -1
      if (this.data.isUmpire1) {
        this.data.lastStatUmpire = 1;
        this.data.court!.stateUmpire(1, position, item_index);
        this.updateMatchByUmpire(1);
      } else if (this.data.isUmpire2) {
        this.data.lastStatUmpire = 2;
        this.data.court!.stateUmpire(2, position, item_index);
        this.updateMatchByUmpire(2);
      }
    } else {
      this.data.opCat2 = null
      this.data.opPosition2 = -1
      if (this.data.isUmpire3) {
        this.data.lastStatUmpire = 3;
        this.data.court!.stateUmpire(3, position, item_index);
        this.updateMatchByUmpire(3);
      } else if (this.data.isUmpire4) {
        this.data.lastStatUmpire = 4
        this.data.court!.stateUmpire(4, position, item_index);
        this.updateMatchByUmpire(4);
      }
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
    let courtIndex = e.target.dataset.courtindex;
    if (courtIndex == 1) {
      this.data.opPosition = position;
      this.data.opCat = category;
    } else {
      this.data.opPosition2 = position;
      this.data.opCat2 = category;
    }
    console.log(position, category, courtIndex)
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
      showLoading = true;
      console.log("show loading")
    }
    this.repo!.updateMatch(this.data.court!)
  }

  updateMatchByUmpire = function (this: StatPage, which: number) {
    if (which == 1) {
      this._updateMatchByUmpire("umpire1")
    } else if (which == 2) {
      this._updateMatchByUmpire("umpire2")
    } else if (which == 3) {
      this._updateMatchByUmpire("umpire3")
    } else if (which == 4) {
      this._updateMatchByUmpire("umpire4")
    } else {
    }
  }

  _updateMatchByUmpire = function (this: StatPage, who: string) {
    if (!this.data.court) return;

    wx.showLoading({
      title: '正在加载',
    })
    showLoading = true;
    console.log("show loading")

    this.repo!.updateMatchByUmpire(who, this.data.globalData.openid, this.data.court!, (errorCode: number) => {
      if (showLoading) {
        wx.hideLoading()
        console.log("hide loading")
        showLoading = false;
      }
      
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
    this.data.opPosition = -1;
    this.data.opPosition2 = -1;
    this.data.lastStatUmpire = 0;

    if (this.data.isUmpire1) {
      this.data.court!.stat_umpire1_done = true;
      this.updateMatchByUmpire(1);
    }

    if (this.data.isUmpire2) {
      this.data.court!.stat_umpire2_done = true;
      this.updateMatchByUmpire(2);
    }

    if (this.data.isUmpire3) {
      this.data.court!.stat2_umpire1_done = true;
      this.updateMatchByUmpire(3);
    }

    if (this.data.isUmpire4) {
      this.data.court!.stat2_umpire2_done = true;
      this.updateMatchByUmpire(4);
    }
  }

  //撤销本轮统计
  onTapRevertStat = function (this: StatPage) {
    console.log(this.data.lastStatUmpire)
    if (this.data.court!.revertUmpireStat(this.data.lastStatUmpire)) {
      this.updateMatchByUmpire(this.data.lastStatUmpire);
    }
    this.data.lastStatUmpire = 0;
    this.setData({ lastStatUmpire: this.data.lastStatUmpire })
  }

  onTapMyTeam = function (this: StatPage) {
  }

  onTapYourTeam = function (this: StatPage) {
  }
}

Page(new StatPage())