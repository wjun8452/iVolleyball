import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { VPlayer } from "../../bl/TeamRepo";
import { StatItem, StatName, VolleyCourt } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

let videoAd:any = null;

type StatSumRecord = Record<string, number>
type PlayerStatRecord = Record<string, StatSumRecord>

type SubReportRecord = Record<string, number|string>
type CatReportRecord = Record<string, SubReportRecord>
type PlayerReportRecord = Record<string, CatReportRecord>;

class ReportData {
  matchID: string | null = null;
  court: VolleyCourt | null = null;
  summary:PlayerReportRecord = {};
  globalData: GlobalData | null = null;
}


class ReportPage extends BasePage {
  data: ReportData = new ReportData();
  repo: VolleyRepository | null = null;

  onCourtChange = function (this: ReportPage, court: VolleyCourt, reason: Reason, status: Status): void {

    console.log("[Report] onCourtChange Begins, reason:", reason, "status:", status, "court id:", court._id, "court:", court)

    /** 更新核心数据 */
    this.data.court = court;

    this.createStaticAndSummary(this.data.court);
    
    //更新界面
    this.setData(this.data)

    wx.hideLoading();

    console.log("[Report] onCourtChange ends, this:", this)
  }

  onLoad = function(this: ReportPage, options:any) {
    wx.setNavigationBarTitle({
      title: '统计报告'
    })

    wx.showLoading({
      title: '加载中',
    })

    this.data.matchID = options._id;

    this.data.globalData = getApp().globalData;

    this.repo = new VolleyRepository(this.onCourtChange, this.data.globalData?.openid!, this.data.matchID, this.data.globalData!.placeInfo);

    //页面加载量小，广告收益又低，暂时屏蔽该广告
    // 在页面onLoad回调事件中创建激励视频广告实例
    // if (wx.createRewardedVideoAd) {
    //   videoAd = wx.createRewardedVideoAd({
    //     adUnitId: 'adunit-9739e065af4592d2'
    //   })
    //   videoAd.onLoad(() => {
    //     console.log("jstj ad loaded.")
    //   })
    //   videoAd.onError((err) => {
    //     console.log("jstj ad load error.")
    //   })
    //   videoAd.onClose((res) => {
    //     // 用户点击了【关闭广告】按钮
    //     if (res && res.isEnded) {
    //       // 正常播放结束，可以下发游戏奖励
    //     } else {
    //       // 播放中途退出，回退到之前的页面
    //       wx.navigateBack({
    //         delta: 0,
    //       })
    //     }
    //     console.log("jstj ad closed.")
    //   })
    // }
  }

  getAllPlayers = function(data:VolleyCourt) : string[] {
    //data.all_players, this.data.players, this.data.libero, this.data.libero_replacement1, this.data.libero_replacement2
    if (data.is_libero_enabled) {
      let players:string[] = []
      players = players.concat(data.players);

      if (players.indexOf(data.all_players[data.libero]) == -1) {
        players.push(data.all_players[data.libero]);
      }

      if (players.indexOf(data.all_players[data.libero_replacement1]) == -1) {
        players.push(data.all_players[data.libero_replacement1])
      }

      if (players.indexOf(data.all_players[data.libero_replacement2]) == -1) {
        players.push(data.all_players[data.libero_replacement2])
      }

      return players;
      
    } else {
      return data.players;
    }
  }

  createStaticAndSummary = function(this:ReportPage, data:VolleyCourt) {
      //create summary
      let statistics:PlayerStatRecord = this.createStatistics(data.stat_items)
      let players:string[] = this.getAllPlayers(data)
      this.createSummary(this.data.summary, players, statistics);
  }

  onShow = function() {
    // 用户触发广告后，显示激励视频广告
    if (videoAd) {
      videoAd.show().catch(() => {
        // 失败重试
        videoAd.load()
          .then(() => videoAd.show())
          .catch((err: any) => {
            console.error('激励视频 广告显示失败', err)
          })
      })
    }
  }

  onUnload = function(this:ReportPage) {
    if (this.repo) {
      this.repo.close();
    }
  }

  onShareAppMessage = function(this:ReportPage) {
    let path = '/pages/report/report?_id=' + this.data.matchID;
    console.log("share path=" + path)
    return {
      title: '分享赛况',
      path: path,
      fail: function(res: any) {
        console.error(res);
        wx.showToast({
          title: '分享失败',
        })
      }
    }
  }

  //将项目次数按人头汇总
  createStatistics = function(this:ReportPage, stats: StatItem[]) : PlayerStatRecord {
    /** player: {statNem, core} */
    let statistics:PlayerStatRecord = {}
    for (let index in stats) {
      let stat = stats[index];

      let player = stat.player;
      if (player.length == 0) {
        continue;
      }

      if (statistics.hasOwnProperty(player)) {
        console.log("add new stat")
        let it = statistics[player]
        this._addStatistic(it, stat.item)

      } else {
        console.log("create new stat")
        let it = this._createNewStatistic(stat.item);
        statistics[player] = it;

      }
    }

    return statistics;
  }

  _addStatistic = function(this:ReportPage, stat:Record<StatName, number>, stat_name:StatName) {
    if (stat.hasOwnProperty(stat_name)) {
      stat[stat_name] = stat[stat_name] + 1
    } else {
      stat[stat_name] = 1;
    }
  }


  _createNewStatistic = function(this:ReportPage, stat_name:StatName) : StatSumRecord {
    let record:StatSumRecord = {};
    record[stat_name] = 1;
    return record;
  }

  createSummary = function(this:ReportPage, summary:PlayerReportRecord, players:string[], statistics:PlayerStatRecord) {
    summary["标题"] = this.createSummaryForPlayer()
    for (let index in players) {
      let player = players[index]
      let statRecord = statistics[player]
      summary[player] = this.createSummaryForPlayer(statRecord)
    }
  }

  createSummaryForPlayer = function(this:ReportPage, statSumRecord?:StatSumRecord) : CatReportRecord {
    let summary: CatReportRecord =  { 
        "得分": {
            "总得分": "",
            "发球防反阶段得分": "",
            "净得分": ""
          },
          "发球": {
            "总数": "",
            "失误": "",
            "直接得分": "",
            "效率": ""
          },
          "一传": {
            "总数": "",
            "失误": "",
            "到位率": "",
            "完美到位率": "",
            "到位效率": ""
          },
          "进攻": {
            "总数": "",
            "失误": "",
            "被拦死": "",
            "得分": "",
            "成功率": "",
            "成功效率": ""
          },
          "拦网": {
            "总数": "",
            "得分": "",
            "有效撑起": "",
            "拦回": "",
            "破坏性拦网": "",
            "失误": ""
          },
          "防反起球": {
            "总数": "",
            "失误": "",
            "有效防起": "",
            "防起无攻": "", 
            "到位率": "",
            "到位效率": ""
          },
          "传球": {
            "总数": "",
            "到位": "",
            "不到位": "",
            "失误": "",
            "到位率": "",
            "到位效率": ""
          }
        };

    if (!statSumRecord) {
      return summary;
    }

    //得分
    let win:number = 0;
    let win_items = [StatName.ServeWin, StatName.AttackWin, StatName.BlockWin];

    for (let index in win_items) {
      let item = win_items[index]
      if (statSumRecord.hasOwnProperty(item)) {
        win += statSumRecord[item]
      }
    }

    summary["得分"]["总得分"] = win;

    //净得分
    let lost:number = 0;
    let lost_items = [StatName.ServeLost, StatName.ErChuanLost, StatName.ReceptionLost, StatName.AttackLost, StatName.DefendLost]

    for (let index in lost_items) {
      let item = lost_items[index]
      if (statSumRecord.hasOwnProperty(item)) {
        lost += statSumRecord[item]
      }
    }

    let net:number = win - lost
    summary["得分"]["净得分"] = net

    //发球
    let total:number = 0
    lost = 0
    win = 0

    //StatName.ServeLost, StatName.ServeNormal, StatName.ServeWin

    if (statSumRecord.hasOwnProperty(StatName.ServeLost)) {
      lost += statSumRecord[StatName.ServeLost]
      total += statSumRecord[StatName.ServeLost]
    }

    if (statSumRecord.hasOwnProperty(StatName.ServeNormal)) {
      total += statSumRecord[StatName.ServeNormal]
    }

    if (statSumRecord.hasOwnProperty(StatName.ServeWin)) {
      win += statSumRecord[StatName.ServeWin]
      total += statSumRecord[StatName.ServeWin]
    }

    summary["发球"]["总数"] = total
    summary["发球"]["失误"] = lost
    summary["发球"]["直接得分"] = win
    summary["发球"]["效率"] = (total == 0) ? "0" : ((win - lost) / total * 100).toFixed(0) + '%'

    //一传
    total = 0
    lost = 0 //不到位
    win = 0 //完美到位
    let normal = 0 //半到位
    // ReceptionBad: "一传不到位",
    // ReceptionGood: "一传半到位",
    //   ReceptionPerfect: "一传到位",
    //     ReceptionLost: "一传失误",

    if (statSumRecord.hasOwnProperty(StatName.ReceptionLost)) {
      lost += statSumRecord[StatName.ReceptionLost]
      total += statSumRecord[StatName.ReceptionLost]
    }

    if (statSumRecord.hasOwnProperty(StatName.ReceptionGood)) {
      normal += statSumRecord[StatName.ReceptionGood]
      total += statSumRecord[StatName.ReceptionGood]
    }

    if (statSumRecord.hasOwnProperty(StatName.ReceptionPerfect)) {
      win += statSumRecord[StatName.ReceptionPerfect]
      total += statSumRecord[StatName.ReceptionPerfect]
    }

    summary["一传"]["总数"] = total
    summary["一传"]["失误"] = lost
    summary["一传"]["到位率"] = total == 0 ? "0" : ((win + normal) / total * 100).toFixed(0) + "%"
    summary["一传"]["完美到位率"] = total == 0 ? "0": (win / total * 100).toFixed(0) + "%"
    summary["一传"]["到位效率"] = total == 0 ? "0" : ((win + normal - lost) / total * 100).toFixed(0) + "%"

    //AttackNormal: "进攻一般",
    // AttackBlk: "进攻拦死",
    //   AttackWin: "进攻得分",
    //     AttackLost: "进攻失误",
    total = 0
    lost = 0
    win = 0
    let block = 0

    if (statSumRecord.hasOwnProperty(StatName.AttackLost)) {
      lost += statSumRecord[StatName.AttackLost]
      total += statSumRecord[StatName.AttackLost]
    }

    if (statSumRecord.hasOwnProperty(StatName.AttackBlk)) {
      block += statSumRecord[StatName.AttackBlk]
      total += statSumRecord[StatName.AttackBlk]
    }

    if (statSumRecord.hasOwnProperty(StatName.AttackWin)) {
      win += statSumRecord[StatName.AttackWin]
      total += statSumRecord[StatName.AttackWin]
    }

    if (statSumRecord.hasOwnProperty(StatName.AttackNormal)) {
      total += statSumRecord[StatName.AttackNormal]
    }

    summary["进攻"]["总数"] = total
    summary["进攻"]["失误"] = lost
    summary["进攻"]["被拦死"] = block
    summary["进攻"]["得分"] = win
    summary["进攻"]["成功率"] = total == 0 ? "0" : (win / total * 100).toFixed(0)+ "%"
    summary["进攻"]["成功效率"] = total == 0 ? "0" : ((win - lost - block) / total * 100).toFixed(0) + "%"


    //BlockWin: "拦网得分",
    // BlockLost: "拦网失误",

    total = 0
    lost = 0
    win = 0
    let plus = 0
    let minus = 0
    let half = 0

    if (statSumRecord.hasOwnProperty(StatName.BlockLost)) {
      lost += statSumRecord[StatName.BlockLost]
      total += statSumRecord[StatName.BlockLost]
    }
    if (statSumRecord.hasOwnProperty(StatName.BlockWin)) {
      win += statSumRecord[StatName.BlockWin]
      total += statSumRecord[StatName.BlockWin]
    }
    if (statSumRecord.hasOwnProperty(StatName.BlockPlus)) {
      plus += statSumRecord[StatName.BlockPlus]
      total += statSumRecord[StatName.BlockPlus]
    }
    if (statSumRecord.hasOwnProperty(StatName.BlockMinus)) {
      minus += statSumRecord[StatName.BlockMinus]
      total += statSumRecord[StatName.BlockMinus]
    }
    if (statSumRecord.hasOwnProperty(StatName.BlockHalf)) {
      half += statSumRecord[StatName.BlockHalf]
      total += statSumRecord[StatName.BlockHalf]
    }

    summary["拦网"]["总数"] = total
    summary["拦网"]["失误"] = lost
    summary["拦网"]["得分"] = win
    summary["拦网"]["有效撑起"] = plus
    summary["拦网"]["拦回"] = minus 
    summary["拦网"]["破坏性拦网"] = half

    //   DefendLost: "防守失误",
    //     DefendGood: "防守到位",
    //       DefendNormal: "防守一般",
    total = 0
    lost = 0
    win = 0
    normal = 0

    if (statSumRecord.hasOwnProperty(StatName.DefendLost)) {
      lost += statSumRecord[StatName.DefendLost]
      total += statSumRecord[StatName.DefendLost]
    }

    if (statSumRecord.hasOwnProperty(StatName.DefendNormal)) {
      normal += statSumRecord[StatName.DefendNormal]
      total += statSumRecord[StatName.DefendNormal]
    }

    if (statSumRecord.hasOwnProperty(StatName.DefendGood)) {
      win += statSumRecord[StatName.DefendGood]
      total += statSumRecord[StatName.DefendGood]
    }

    summary["防反起球"]["总数"] = total
    summary["防反起球"]["失误"] = lost
    summary["防反起球"]["有效防起"] = win
    summary["防反起球"]["到位率"] = total == 0 ? "0" : (win / total * 100).toFixed(0) + "%"
    summary["防反起球"]["到位效率"] = total == 0 ? "0" : ((win - lost) / total * 100).toFixed(0) + "%"

    //   ErChuanGood: "二传到位",
    //     ErChuanBad: "二传不到位",
    //       ErChuanLost: "二传失误",
    total = 0
    lost = 0
    win = 0
    normal = 0


    if (statSumRecord.hasOwnProperty(StatName.ErChuanLost)) {
      lost += statSumRecord[StatName.ErChuanLost]
      total += statSumRecord[StatName.ErChuanLost]
    }

    if (statSumRecord.hasOwnProperty(StatName.ErChuanGood)) {
      win += statSumRecord[StatName.ErChuanGood]
      total += statSumRecord[StatName.ErChuanGood]
    }

    if (statSumRecord.hasOwnProperty(StatName.ErChuanBad)) {
      normal += statSumRecord[StatName.ErChuanBad]
      total += statSumRecord[StatName.ErChuanBad]
    }

    summary["传球"]["总数"] = total
    summary["传球"]["失误"] = lost
    summary["传球"]["到位"] = win
    summary["传球"]["不到位"] = normal
    summary["传球"]["到位率"] = total == 0 ? "0" : (win / total * 100).toFixed(0)  + "%"
    summary["传球"]["到位效率"] = total == 0 ? "0" : ((win - lost) / total * 100).toFixed(0) + "%"

    return summary
  }

  gotoHome = function() { 
    wx.navigateTo({ 
      url: '../index/index', 
    }) 
  }
}

Page(new ReportPage())