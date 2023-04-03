import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { StatCat, StatName, VolleyCourt } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

let globalData: GlobalData = getApp().globalData

class StatHistoryPageData {
  isOwner: boolean = true;
  court: VolleyCourt | null = null;
  globalData: GlobalData = globalData;
}

class StatHistoryPage extends BasePage {
  _id: string | null = null;
  data: StatHistoryPageData = new StatHistoryPageData();
  repo: VolleyRepository | null = null;

  onCourtChange = function (this: StatHistoryPage, court: VolleyCourt, reason: Reason, status: Status): void {

    console.log("[StatHistory] onCourtChange Begins, reason:", reason, "status:", status, "court id:", court._id, "court:", court)

    /** 更新核心数据 */
    this.data.court = court;
    this.data.isOwner = this.data.court._id ? this.data.globalData.openid == this.data.court._openid : true;

    //test
    this.data.court.stat_umpire1 = this.data.globalData.openid

    //更新界面
    this.setData(this.data)

    if (reason != Reason.Init) {
      wx.vibrateShort({ type: 'medium' });
    }

    wx.hideLoading();

    //判断并提示比赛是否结束，并可能走到重置流程
    if (reason == Reason.Update && this.data.court!.isMatchOver()) {
    }

    if (reason == Reason.Ended) {
    }

    console.log("[StatHistory] onCourtChange ends, this:", this)
  }

  onLoad = function (this: StatHistoryPage, options: any) {
    wx.setNavigationBarTitle({
      title: '技术统计信息'
    })

    if (options._id) {
      this._id = options._id;
    }

    this.data.globalData = getApp().globalData;
  }

  onShow = function (this: StatHistoryPage) {
    wx.showLoading({
      title: "加载中"
    })
    getApp().getOpenId((openid: string, success:boolean) => {
      this.data.globalData = getApp().globalData;
      this.repo = new VolleyRepository(this.onCourtChange, openid, this._id, globalData.placeInfo);
    });
  }

  onHide = function (this: StatHistoryPage) {
    if (this.repo) {
      this.repo.close();
    }
  }

  onUnload = function (this: StatHistoryPage) {
    this.onHide() //sometimes only onUnload called, onHide is not called
  }
}

Page(new StatHistoryPage())
