import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { VolleyCourt } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

let globalData: GlobalData = getApp().globalData

class StatPageData {
  /** 当前用户是否是比赛的创建者 */
  isOwner: boolean = true;
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
    getApp().getOpenId((openid: string, success:boolean) => {
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
    this.updateMatch()
  }

  onTapLooseScore = function (this: StatPage) {
    this.data.court!.looseScoreRotate()
    this.updateMatch()
  }

  onTapSetting = function (this: StatPage) {
    wx.navigateTo({
      url: '../stat_setting/stat_setting',
    })
  }

  onTapPlayItem = function (this: StatPage, e: any) {
    this.data.opCat = null
    this.data.opPosition = -1
    let position = e.target.dataset.position;
    let item_index = e.target.dataset.play_item_index;
    this.data.court!.stateRotate(position, item_index);
    this.updateMatch()
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

}

Page(new StatPage())