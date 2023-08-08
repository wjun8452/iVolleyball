import { parseDate, parseTime } from "../utils/Util";
import { FavoriteOpenidRepo } from "./FavoriteOpenidRepo";
import { VUser, VTeam, TeamRepo } from "./TeamRepo"

const CLOUD_ENV: string = 'ilovevolleyball-d1813b'; //,test-705bde

export class SetScore {
  myScore: number = 0;
  yourScore: number = 0;
  score_str: string = "-:-";

  constructor(myScore: number, yourScore: number) {
    this.myScore = myScore;
    this.yourScore = yourScore;
    this.score_str = "" + myScore + ":" + yourScore;
  }
}

export class SetScoreHelper {
  getMirrorSetScore(setScore: SetScore): SetScore {
    let mirror = new SetScore(setScore.yourScore, setScore.myScore)
    return mirror;
  }
}

export class MatchScore {
  setScores: SetScore[];
  winSets: number = 0;
  looseSets: number = 0;
  winset_str: string = "-:-";
  constructor(sets_num: number) {
    this.setScores = new Array(sets_num);
    for (let i = 0; i < this.setScores.length; i++) {
      this.setScores[i] = new SetScore(0, 0);
    }
    new MatchScoreHelper().update(this);
  }
}

export class MatchScoreHelper {
  update(matchScore: MatchScore) {
    matchScore.winSets = 0;
    matchScore.looseSets = 0;
    for (let i = 0; i < matchScore.setScores.length; i++) {
      let setScore = matchScore.setScores[i];
      if (setScore.myScore > setScore.yourScore) {
        matchScore.winSets++;
      } else if (setScore.myScore < setScore.yourScore) {
        matchScore.looseSets++;
      } else {

      }
    }
    matchScore.winset_str = "" + matchScore.winSets + ":" + matchScore.looseSets;
  }

  getMirrorMatchScore(matchScore: MatchScore): MatchScore {
    let mirror = new MatchScore(matchScore.setScores.length);
    for (let i = 0; i < matchScore.setScores.length; i++) {
      mirror.setScores[i] = new SetScoreHelper().getMirrorSetScore(matchScore.setScores[i]);
    }
    new MatchScoreHelper().update(mirror);
    return mirror;
  }

}


//每个用户创建的所有赛事，全部放在一起，作为一条记录存储在云数据库中
export class UserEvent {
  _id: string;
  _openid: string;
  owner: VUser;
  events: Event[];
  update_time: DB.ServerDate;
  create_time: DB.ServerDate;
  base_id: number; //自增的基础id，后续新增的event就用这个base_id

  constructor() {
    this._id = "";
    this._openid = "";
    this.owner = new VUser();
    this.events = new Array();
    this.base_id = 0;
  }
}

export class Event {
  base_id: number; //自增的id
  name: string;
  mode: number; //0 循环赛
  win3of5: number; //0：5局3胜，1：3局2胜
  equal_times: number; //表示最多通过比较了几个变量（胜场、积分、局分、小分）决定了排名
  teams: VTeam[];
  team_matches: any[][][]; //数组外层是几个小组，里头是每个小组的循环赛对阵情况string，
  create_time: string;

  public constructor(base_id: number, name: string, owner: VUser, mode: number, teams: VTeam[], win3of5?: number | null) {
    this.name = name;
    this.mode = mode;
    this.teams = teams;
    this.base_id = base_id;

    if (win3of5) {
      this.win3of5 = win3of5;
    } else {
      this.win3of5 = 1;
    }

    if (this.name == "") {
      this.name = parseDate(new Date()) + " " + owner.userInfo.nickName + " 创建的比赛"
    }

    this.team_matches = new EventHelper().initTeamMatches(this);

    new EventHelper().updateTeamScore(this);

    this.create_time = "";
  }
}

//为啥要搞个helper呢，因为Event的对象作为Page的data时，调用其方法时会报错: xxx is not a function.
export class EventHelper {
  // 贝格尔编排算法
  //6个队伍，5轮
  //1-6 6-4 2-6 6-5 3-6
  //2-5 5-3 3-1 1-4 4-2
  //3-4 1-2 4-5 2-3 5-1
  //7支队伍, 7轮
  //第一轮 第二轮 第三轮 第四轮 第五轮 第六轮 第七轮
  //1－0 0－5 2－0 0－6 3－0 0－7 4－0
  //2－7 6－4 3－1 7－5 4－2 1－6 5－3
  //3－6 7－3 4－7 1－4 5－1 2－5 6－2
  //4－5 1－2 5－6 2－3 6－7 3－4 7－1
  private _bergerMethod(queNum: number): any[][] {
    // 轮次
    let turnNum = queNum + (queNum % 2 - 1);
    // 赛制编排表
    let matches = [];
    // 初始轮
    matches[0] = [];
    for (let i = 0; i < queNum; i++) {
      matches[0].push(i + 1);
    }
    if (turnNum == queNum) {
      matches[0].push(0);
    }

    // 左下角的下标
    let left_bottom = Math.floor(turnNum / 2);
    let max_number = (queNum % 2 == 0) ? queNum : 0;
    let valid_max_number = (queNum % 2 == 0) ? (queNum - 1) : queNum;
    for (let j = 1; j < turnNum; j++) {
      let is_max_left = (j % 2 == 1);
      let max_pos_this = is_max_left ? 0 : turnNum;
      let max_f2f_pos_last = max_pos_this;
      let max_f2f_last = matches[j - 1][max_f2f_pos_last];

      matches[j] = new Array(turnNum + 1);
      matches[j][left_bottom] = max_f2f_last; //左下角的数字
      matches[j][max_pos_this] = max_f2f_last;
      for (let k = left_bottom + 1; k < turnNum + 1; k++) {
        if (k == turnNum && (!is_max_left)) {
          matches[j][k] = max_number;
        } else {
          let v = max_f2f_last + k - left_bottom
          matches[j][k] = (v > valid_max_number) ? v - valid_max_number : v;
        }
      }

      if (is_max_left) {
        matches[j][0] = max_number;
        for (let k = 1; k < left_bottom; k++) {
          let v = matches[j][turnNum] + k
          matches[j][k] = (v > valid_max_number) ? v - valid_max_number : v;
        }
      } else {
        for (let k = 0; k < left_bottom; k++) {
          let v = matches[j][turnNum - 1] + k + 1
          matches[j][k] = (v > valid_max_number) ? v - valid_max_number : v;
        }
      }

    }
    return matches;
  }

  //init match rounds
  public initTeamMatches(event: Event): any[][][] {
    event.team_matches = new Array(1);
    event.team_matches[0] = new Array(event.teams.length);
    for (let i = 0; i < event.team_matches[0].length; i++) {
      event.team_matches[0][i] = new Array(event.teams.length);
    }
    let group = event.team_matches[0];
    let team_num = event.teams.length;
    let beiger = this._bergerMethod(team_num);

    console.log("initMatchRounds", group, team_num, beiger)
    for (let i = 0; i < team_num; i++) {
      for (let j = 0; j < team_num; j++) {
        if (i == j) {
          group[i][j] = "N/A";
        }

        if (i > j) {
          group[i][j] = "";
        }

        if (i < j) {
          for (let k = 0; k < beiger.length; k++) {
            let round = beiger[k];
            for (let m = 0; m < round.length / 2; m++) {
              let n = round.length - 1 - m;
              if ((round[m] == i + 1 && round[n] == j + 1) || (round[m] == j + 1 && round[n] == i + 1)) {
                group[i][j] = "第" + (k + 1) + "轮"
              }
            }
          }
        }
      }
    }
    return event.team_matches;
  }

  public updateTeamScore(event: Event) {
    for (let m = 0; m < event.teams.length; m++) {
      let net_score = 0;
      let win_times = 0; //胜场
      let win_games = 0;  //胜局数，用于计算局分=胜局数/负局数
      let loose_games = 0; //负局数，用于计算局分=胜局数/负局数
      let raw_win_score = 0; //总得分，用于计算小分=总得分/总负分
      let raw_loose_score = 0; //总失分，用于计算小分=总得分/总负分

      for (let k = 0; k < event.teams.length; k++) {
        if (k == m) continue;
        let td = event.team_matches[0][m][k];
        if (td.setScores) {
          win_games += td.winSets;
          loose_games += td.looseSets;
          win_times += (td.winSets > td.looseSets ? 1 : 0)
          for (let x = 0; x < td.setScores.length; x++) {
            raw_win_score += td.setScores[x].myScore;
            raw_loose_score += td.setScores[x].yourScore;
          }

          if (td.winSets - td.looseSets >= 2) { //五局三胜（3:0 or 3:1） or 三局两胜 （2：0） 
            net_score += 3;
          } else if (td.winSets - td.looseSets >= 1) { // 五局三胜（3:2） or 三局两胜 （2：1）
            net_score += 2;
          } else if (td.winSets - td.looseSets >= -1) { // 五局三胜（2:3）or 三局两胜 （1：2）
            net_score += 1;
          } else {
            net_score += 0;
          }
        }
      }
      event.teams[m].index = m;
      event.teams[m].net_score = net_score; //积分
      event.teams[m].win_times = win_times; //胜场
      event.teams[m].win_games = win_games / loose_games; //局分
      event.teams[m].raw_score = raw_win_score / raw_loose_score; //小分
    }

    //
    event.teams.sort(function (a, b) {
      if (a.win_times == b.win_times) { //胜场
        if (b.net_score == a.net_score) { //积分
          if (b.win_games == a.win_games) { //胜局数
            return b.raw_score == a.raw_score; //小分
          } else {
            return b.win_games - a.win_games;
          }
        } else {
          return b.net_score - a.net_score;
        }
      } else {
        return b.win_times - a.win_times;
      }
    })
    for (let i = 0; i < event.teams.length; i++) {
      event.teams[i].rank = i + 1;
    }

    let equal_times = 1;
    for (let m = 0; m < event.teams.length - 1; m++) {
      let n = m + 1;
      let e1 = event.teams[m];
      let e2 = event.teams[n];
      if (e1.win_times == e2.win_times && e1.net_score == e2.net_score &&
        e1.win_games.toFixed(5) == e2.win_games.toFixed(5)) {
        if (equal_times < 4) {
          equal_times = 4;
        }
      }

      if (e1.win_times == e2.win_times && e1.net_score == e2.net_score) {
        if (equal_times < 3) {
          equal_times = 3;
        }
      }

      if (e1.win_times == e2.win_times) {
        if (equal_times < 2) {
          equal_times = 2;
        }
      }

      console.log("m=",m, "  equal_times=", equal_times, " win_times:", e1.win_times, e2.win_times, " net_score:", e1.net_score, e2.net_score, " win_games:", e1.win_games.toFixed(5), e2.win_games.toFixed(5))
    }

    event.teams.sort(function (a, b) {
      return a.index - b.index;
    })

    event.equal_times = equal_times;
    console.log("event.equal_times: ", event.equal_times)
  }
}



export class EventRepo {

  //假设该用户第一次创建赛事
  createUserEvents(_openid: string, owner: VUser, event: Event, callback: (success: boolean) => void) {
    const db = wx.cloud.database({
      env: CLOUD_ENV
    })

    let userEvent: UserEvent = new UserEvent();
    userEvent.base_id = 0;
    userEvent.owner = owner;
    userEvent.events.push(event);

    let tempEvent = this.createTmpEvents(userEvent, db.serverDate());

    db.collection('vevent').add({
      data: tempEvent,
      success: function (res) {
        console.log("[db.vevent.create]", res)
        callback(true);
      },
      fail: function (res) {
        console.error("[db.vevent.create]", res);
        callback(false)
      }
    })
  };

  //在已有的UserEvent上插入一个event
  insertEvent(_openid: string, event: Event, callback: (sucess: boolean) => void) {
    wx.cloud.callFunction({
      name: 'vevent',
      data: {
        action: 'insert',
        _openid: _openid,
        event: event,
      },
      success: (res: any) => {
        console.log('[wx.cloud.event.insert]', res)
        if (res.result.errMsg.indexOf('ok') >= 0) {
          callback(true)
        } else {
          callback(false)
        }
      },
      fail: err => {
        console.error('[wx.cloud.event.insert] failed!', err)
        callback(false)
      }
    })
  }

  private createTmpEvents(events: UserEvent, createTime?: DB.ServerDate): Event {
    let tempData: any = {};
    Object.assign(tempData, events);

    if (createTime != undefined) {
      tempData.create_time = createTime;
      tempData.update_time = createTime;
    }

    delete tempData._openid;
    delete tempData._id;

    if (createTime == undefined) {
      delete tempData.create_time;
      delete tempData.update_time;
    }

    return tempData;
  }

  updateEvent(_openid: string, event: Event, callback: (success: boolean) => void) {
    wx.cloud.callFunction({
      name: 'vevent',
      data: {
        action: 'update',
        _openid: _openid,
        event: event,
      },
      success: (res: any) => {
        console.log('[wx.cloud.event.update]', res)
        if (res.result.errMsg.indexOf('ok') >= 0) {
          callback(true)
        } else {
          callback(false)
        }
      },
      fail: err => {
        console.error('[wx.cloud.event.update] failed!', err)
        callback(false)
      }
    })
  };

  fetchAllUserEvents(callback: (success: boolean, events: UserEvent[] | null) => void, favoriteOpenidRepo?: FavoriteOpenidRepo) {
    const db = wx.cloud.database({
      env: CLOUD_ENV
    })
    return this._fetchUserEvents({}, db, callback, favoriteOpenidRepo);
  }

  fetchUserEvents(openid: string, callback: (success: boolean, events: UserEvent[] | null) => void, favoriteOpenidRepo?: FavoriteOpenidRepo) {
    const db = wx.cloud.database({
      env: CLOUD_ENV
    })
    return this._fetchUserEvents({ _openid: openid }, db, callback, favoriteOpenidRepo);
  }

  fetchUserEventsByName(keyword: string, callback: (success: boolean, events: UserEvent[] | null) => void, favoriteOpenidRepo?: FavoriteOpenidRepo) {
    const db = wx.cloud.database({
      env: CLOUD_ENV
    })
    let where_clause = {
      'events.name': db.RegExp({
        regexp: '.*' + keyword,
        options: 'i',
      })
    }
    return this._fetchUserEvents(where_clause, db, callback, favoriteOpenidRepo);
  }

  private _fetchUserEvents(where_clause: {}, db: DB.Database, callback: (success: boolean, events: UserEvent[] | null) => void, favoriteOpenidRepo?: FavoriteOpenidRepo) {
    db.collection("vevent").where(where_clause).orderBy('update_time', 'desc').get({
      success(res) {
        console.log("db.vevent.get", where_clause)
        console.log(res)
        let userEvents: UserEvent[] = res.data;

        for (let k = 0; k < userEvents.length; k++) {
          let userEvent = userEvents[k];

          if (favoriteOpenidRepo) {
            if (favoriteOpenidRepo.isFavorite(userEvent._openid)) {
              userEvent["isFavorite"] = true;
            } else {
              userEvent["isFavorite"] = false;
            }
          }

          for (let i = 0; i < userEvent.events.length; i++) {
            let event = userEvent.events[i];
            let t = event.create_time;
            if (typeof (t) === "object" && t instanceof Date) {
              event.create_time = parseTime(t);
            } else {
              event.create_time = ""
            }
          }
        }
        callback(true, userEvents);
      },
      fail(res) {
        console.error("db.vevent.get", where_clause)
        callback(false, null);
      }
    })
  };

  fetchEvent(_openid: string, base_id: number, callback: (success: boolean, event: Event | null) => void) {
    const db = wx.cloud.database({
      env: CLOUD_ENV
    })

    let where_clause = {
      _openid: _openid
    }

    db.collection("vevent").where(where_clause).get({
      success(res) {
        console.log("db.vevent.get", where_clause)
        console.log(res)
        let userEvents: UserEvent[] = res.data; //应该只有一个记录
        let target_event: Event | null = null;

        for (let k = 0; k < userEvents.length; k++) {
          let userEvent = userEvents[k];
          for (let i = 0; i < userEvent.events.length; i++) {
            let event = userEvent.events[i];
            if (!event.hasOwnProperty("win3of5")) { //小程序升级新增了字段，兼容服务器旧数据
              event["win3of5"] = 1;
            }
            if (event.base_id == base_id) {
              target_event = event;
              let t = event.create_time;
              if (typeof (t) === "object" && t instanceof Date) {
                event.create_time = parseTime(t);
              } else {
                event.create_time = ""
              }
              break;
            }
          }
        }
        callback(true, target_event);
      },
      fail(res) {
        console.error("db.vevent.get", where_clause)
        callback(false, null);
      }
    })
  }
}