import { PlaceInfo } from "../bl/PlaceInfo";
import { parseTime } from "../utils/Util";
import { VUser } from "./TeamRepo";
import { GameStatus, VolleyCourt } from "./VolleyCourt";

export enum Reason {
  /** caused by VoleyRepository.constructor() */
  Init,
  /** caused by updateMatch() */
  Update,
  /** caused by uploadMatch() */
  LocalToCloud,
  /**  cased by endAndUploadMatch() */
  Ended,
  /**  caused by reset() */
  Reset,

  /** sync update */
  SyncUpdate,
}

export enum Status {
  Local,
  Cloud
}

export interface CourtDataChanged {
  (courtData: VolleyCourt, reason: Reason, status: Status, success:boolean): void
}

export interface CourtRepo {

}

export class VolleyRepository implements CourtRepo {
  private callback: CourtDataChanged;
  private matchID: string | null = null;
  private userID: string; //当前用户的 openid
  private watcher: any = null;
  private cacheKey: string = "stats17";
  private env: string = 'ilovevolleyball-d1813b'; //,test-705bde
  private placeInfo: PlaceInfo | null = null;
  private useWatcher: boolean = false;
  private timmerID: number = -1;
  private userInfo : VUser = new VUser; // 当前用户的完整信息

  /**
   * 除非用户指定比赛的ID，为了自动还原用户上次保存的对象，本类将首先从本地缓存中重构对象，如果发现缓存中的对象来自云端，则会从云端更新该对象
   * 调用者需要使用 updateMatch(), reset() 等方法将对象的状态保存到本地缓存或云端。每次存储动作都会触发 callback 调用以通知使用者，
   * @param callback 接收变化通知的回调方法
   * @param matchID 除非用户指定比赛的ID，为了自动还原用户上次保存的对象，本类将首先从本地缓存中重构对象，如果发现缓存中的对象来自云端，则会从云端更新该对象
   * @param createNew 是否强制创建一个新的本地比赛，发生场景：在历史页面用户点击"new"按钮
   * @param useWatcher 是否使用腾讯云数据库的watcher技术，useWatcher==false时，使用拉取的方式获取最新数据
   */
  constructor(callback: CourtDataChanged, userID: string, userInfo?: VUser, matchID?: string | null, placeInfo?: PlaceInfo, createNew?: boolean, useWatcher?: boolean) {
    console.log("new VolleyRepo", userID, userInfo, matchID, placeInfo, createNew, useWatcher)
    this.callback = callback;
    this.userID = userID;

    if (userInfo) {
      if (userID != userInfo?.openid) {
        console.error("ID not match", userID, userInfo?.openid) 
      } else {
        this.userInfo = userInfo;
      }
    }

    if (matchID) {
      this.matchID = matchID;
    }

    if (placeInfo) {
      this.placeInfo = placeInfo;
    }

    if (useWatcher) {
      this.useWatcher = useWatcher
    }

    if (createNew) {
      this.watchMatch(true);
    } else {
      this.watchMatch(false);
    }
  }

  private fetchOnlineMatch(init: boolean, localToCloud: boolean, endMatch: boolean, startSync:boolean, frequency:number) {
    console.log("fetchOnlineMatch, _id:", this.matchID)
    const db = wx.cloud.database({
      env: this.env
    })

    const that = this;

    if (this.matchID) {
      db.collection("vmatch").doc(this.matchID).get(
        {
          success: function (res) {
            console.log(res)
            if (res.data) {
              let court: VolleyCourt = that.newCourtFromCloud(res.data);
              if (that.userID != court._openid) {
                let repo = new FriendsCourtRepo();
                repo.saveCourt(court);
              }

              wx.setStorageSync(that.cacheKey, court);
              if (init) {
                if (endMatch) {
                  that.callback(court, endMatch ? Reason.Ended : Reason.Init, Status.Cloud, true)
                } else {
                  that.callback(court, localToCloud ? Reason.LocalToCloud : Reason.Init, Status.Cloud, true)
                }
              } else {
                that.callback(court, endMatch ? Reason.Ended : (that.timmerID==-1? Reason.Update:Reason.SyncUpdate), Status.Cloud, true)
              }
            } else {
              that.watchLocalMatch(that.newLocalCourt())
            }

            if (startSync && that.timmerID != -1) {
              that.timmerID = setTimeout(()=> {
                that.fetchOnlineMatch(false, false, false, true, frequency);
              }, frequency);
            }
          },
          fail: function(res) {
            console.error(res);
            if (startSync && that.timmerID != -1) {
              that.timmerID = setTimeout(()=> {
                that.fetchOnlineMatch(false, false, false, true, frequency);
              }, frequency);
            } else {
              that.watchLocalMatch(that.newLocalCourt())
            }
          },
        }
      );
    } else {

    }
  }

  /** todo: 这个地方要改 */
  private watchMatch(createNew: boolean) {
    if (createNew) {
      this.watchLocalMatch(this.newLocalCourt());
    } else {
      //如果指定了比赛的ID，则直接打开这个比赛，不管它是否在本地缓存内
      if (this.matchID) {
        if (this.useWatcher) {
          this.watchOnlineMatch(false, false)
        } else {
          this.fetchOnlineMatch(true, false, false, false, 0);
        }
      }
      //否则会从本地缓存中加载上次存储的比赛
      else {
        let court = this.loadFromLocal();
        //如果本地缓存的是自己的进行中的比赛，则打开它
        if (court._openid === this.userID && court.status == GameStatus.OnGoing) {
          if (court._id) { //打开一个网络比赛
            this.matchID = court._id;
            if (this.useWatcher) {
              this.watchOnlineMatch(false, false);
            } else {
              this.fetchOnlineMatch(true, false, false, false, 0);
            }
          }
          else { //不是网络比赛，那么就继续在本地操作
            this.watchLocalMatch(court);
          }
        } else {
          this.watchLocalMatch(this.newLocalCourt());
        }
      }
    }
  }

  private newCourtFromCloud(data: Object): VolleyCourt {
    let court: VolleyCourt = new VolleyCourt(this.userID, this.userInfo);

    //cloud对象覆盖本地
    Object.assign(court, data);

    //todo: 是否需要根据当前用户授权的情况，更新cloud数据呢？譬如头像和昵称
    // if (court._openid == this.userID) {
    //   court.updateOwnerAvartar(this.userInfo);
    // }

    court.updateAvailableItems()
    court.updateAvailableItems2();

    let t = data.create_time
    if (typeof (t) === "string") {
      court.create_time = t;
    }
    else if (typeof (t) === "object" && t instanceof Date) {
      court.create_time = parseTime(t);
    } else {
      court.create_time = ""
    }

    if (data.update_time) {
      if (data.update_time instanceof Date) {
        let t2: Date = <Date><unknown>(data.update_time)
        court.update_time = parseTime(t2);
      }
    } else {
      court.update_time = court.create_time;
    }
    return court;
  }

  private watchOnlineMatch(localToCloud: boolean, endMatch: boolean) {
    const that = this
    const db = wx.cloud.database({
      env: this.env
    })

    console.log("[Repository] watcher created.", this.matchID)
    this.watcher = db.collection('vmatch').where({
      _id: this.matchID
    })
      .watch({
        onChange: function (snapshot) {
          console.log('[db.vmatch.onChange]', that.matchID, snapshot.type, snapshot)
          let data = snapshot.docs[0]
          if (data) {
            let court: VolleyCourt = that.newCourtFromCloud(data);

            if (that.userID != court._openid) {
              let repo = new FriendsCourtRepo();
              repo.saveCourt(court);
            }

            wx.setStorageSync(that.cacheKey, court);
            if (snapshot.type === 'init') {
              if (endMatch) {
                that.callback(court, endMatch ? Reason.Ended : Reason.Init, Status.Cloud, true)
              } else {
                that.callback(court, localToCloud ? Reason.LocalToCloud : Reason.Init, Status.Cloud, true)
              }
            } else {
              that.callback(court, endMatch ? Reason.Ended : Reason.Update, Status.Cloud, true)
            }
          } else {
            console.error("snapshot is empty, matchid:", that.matchID)
            that.watchLocalMatch(that.newLocalCourt())
          }
        },
        onError: function (err) {
          console.error(err)
          that.watchLocalMatch(that.newLocalCourt())
        }
      })
  }

  private loadFromLocal(): VolleyCourt {
    let court = new VolleyCourt(this.userID, this.userInfo);
    let saved = wx.getStorageSync(this.cacheKey);
    //缓存对象覆盖
    Object.assign(court, saved);
    return court;
  }

  private watchLocalMatch(court: VolleyCourt) {
    wx.setStorageSync(this.cacheKey, court);
    this.callback(court, Reason.Init, Status.Local, true);
  }

  updateMatch(court: VolleyCourt) {
    court.updateStatSettings();
    court.updateStatSettings2();
    this._updateMatch(court, false);
  }

  /** 指派统计员 */
  /**
   * 
   * @param matchId 
   * @param who umpire1, umpire2
   * @param who_id 
   * @param avatarUrl 
   * @param nickName 
   * @param callback 
   */
  setUmpire(matchId: string, who: string, user: VUser, callback: (success: number) => void) {
    wx.cloud.callFunction({
      name: 'vmatch',
      data: {
        action: 'handleSetUmpire',
        matchId: matchId,
        who: who,
        user: user,
      },
      success: (res: any) => {
        console.log('[wx.cloud.vmatch.handleSetUmpire]', res)
        if (res.result.errMsg.indexOf('ok') >= 0) {
          callback(0)
        } else if (res.result.errMsg.indexOf('invalid param, the user is already a umpire') >= 0) {
          callback(4)
        }
        else if (res.result.errMsg.indexOf('invalid param') >= 0) {
          callback(1)
        } else if (res.result.errMsg.indexOf('not authorized') >= 0) {
          callback(2)
        } else {
          callback(3)
        }
      },
      fail: err => {
        console.error('[wx.cloud.vmatch.handleSetUmpire] failed!', err)
        callback(3)
      }
    })
  }

  /**
   * @param who, "umpire1" or "umpire2"
   * @param who_id the open id of the umpire
   * @param court the match to update
   * @param callback callback function
   */
  updateMatchByUmpire(who: string, who_id: string, court: VolleyCourt, callback: (success: number) => void) {
    let matchId = court._id;

    if (!matchId) {
      callback(0);
      this._updateMatch(court, false);
    } else {
      if (who == "umpire1") {
        let data = {
          play_items_umpire1: court.play_items_umpire1,
          play_item_cats_umpire1: court.play_item_cats_umpire1,
          stat_items_umpire1: court.stat_items_umpire1,
          stat_umpire1_done: court.stat_umpire1_done
        }
        this._updateMatchByOthers(who, matchId, data, who_id, court, callback);
      } else if (who == "umpire2") {
        let data = {
          play_items_umpire2: court.play_items_umpire2,
          play_item_cats_umpire2: court.play_item_cats_umpire2,
          stat_items_umpire2: court.stat_items_umpire2,
          stat_umpire2_done: court.stat_umpire2_done
        }
        this._updateMatchByOthers(who, matchId, data, who_id, court, callback);
      } else if (who == "umpire3") {
        let data = {
          play_items2_umpire1: court.play_items2_umpire1,
          play_item2_cats_umpire1: court.play_item_cats2_umpire1,
          stat_items2_umpire1: court.stat_items2_umpire1,
          stat2_umpire1_done: court.stat2_umpire1_done
        }
        this._updateMatchByOthers(who, matchId, data, who_id, court, callback);
      } else if (who == "umpire4") {
        let data = {
          play_items2_umpire2: court.play_items2_umpire2,
          play_item2_cats_umpire2: court.play_item_cats2_umpire2,
          stat_items2_umpire2: court.stat_items2_umpire2,
          stat2_umpire2_done: court.stat2_umpire2_done
        }
        this._updateMatchByOthers(who, matchId, data, who_id, court, callback);
      } else {
        callback(3)
      }
    }
  }

  /**
   * @param who who is updating the match
   * @param matchId _id of the match
   * @param matchData json data of the update part
   * @param who_id the who_id's open id, cloud would check the authority of this id
   * @param callback 0:ok, 1:invalid param, 2:who_id is not authorized, 3: failed
   */
  private _updateMatchByOthers(who: string, matchId: string | null, matchData: any, who_id: string, court:VolleyCourt,  callback: (success: number) => void) {
    const that = this;
    wx.cloud.callFunction({
      name: 'vmatch',
      data: {
        who: who,
        action: 'handleUmpireStats',
        matchId: matchId,
        matchData: matchData,
        who_id: who_id
      },
      success: (res: any) => {
        console.log('[wx.cloud.vmatch.handleUmpireStats]', res)
        if (res.result.errMsg.indexOf('ok') >= 0) {
          callback(0)
          if (!that.useWatcher) {
            that.callback(court, Reason.Update, Status.Cloud, true);
          }
        } else if (res.result.errMsg.indexOf('invalid param') >= 0) {
          callback(1)
        } else if (res.result.errMsg.indexOf('not authorized') >= 0) {
          callback(2)
        } else {
          callback(3)
        }
      },
      fail: err => {
        console.error('[wx.cloud.vmatch.handleUmpireStats] failed!', err)
        callback(3)
      }
    })
  }

  private _updateMatch(court: VolleyCourt, endMatch: boolean) {
    if (this.matchID && this.matchID != court._id) {
      console.error("[volleyball] try to update a different court which I am not wathing ?")
    } else if (this.matchID && this.matchID == court._id) {
      var that = this
      const db = wx.cloud.database({
        env: this.env
      })

      let tempData: any = this.updateTempCourt(court, db.serverDate());

      db.collection('vmatch').doc(this.matchID).update({
        data: tempData,
        success: function (res) {
          console.log("[db.vmatch.update]", that.matchID, res);
          if (!that.useWatcher) {
            that.callback(court, endMatch ? Reason.Ended : Reason.Update, Status.Cloud, true)
          } else { //使用了微信云数据库的watch方法，微信框架会进行回调

          }
        },
        fail: function (res) {
          console.error("[db.vmatch.update]", res);
          that.callback(court, endMatch ? Reason.Ended : Reason.Update, Status.Cloud, false)
        }
      })
    } else {
      console.log("update a local match", court)
      wx.setStorageSync(this.cacheKey, court);
      this.callback(court, endMatch ? Reason.Ended : Reason.Update, Status.Local, true);
    }
  }

  /**
   * 重置比赛数据，网络模式下会被保存到云端，后清零并退回到本地模式，本地模式下会被清零。
   */
  reset(court: VolleyCourt) {
    if (this.matchID && this.matchID != court._id) {
      console.error("[volleyball] try to reset a different court which I am not wathing ?")
    } else if (this.matchID && this.matchID == court._id) {
      var that = this
      const db = wx.cloud.database({
        env: this.env
      })

      court.status = 0;
      let tempData: any = this.updateTempCourt(court, db.serverDate());

      if(that.useWatcher) {
        that.close(); //停止监听，少一次更新事件
      }

      db.collection('vmatch').doc(this.matchID).update({
        data: tempData,
        success: function (res) {
          console.log("[db.vmatch.update]", that.matchID, res);
          that.resetAsNewLocal();
        },
        fail: function (res) {
          console.error("[db.vmatch.update]", res);
        }
      })
    } else {
      this.resetAsNewLocal();
    }
  }

  private newTempCourt(court: VolleyCourt, createTime: DB.ServerDate): VolleyCourt {
    let tempData: any = {};
    Object.assign(tempData, court);
    delete tempData._openid;
    delete tempData._id;

    tempData.update_time = createTime;
    tempData.create_time = createTime;
    return tempData;
  }

  private updateTempCourt(court: VolleyCourt, updateTime: DB.ServerDate): VolleyCourt {
    let tempData: any = {};
    Object.assign(tempData, court);
    delete tempData._openid;
    delete tempData._id;
    delete tempData.create_time;

    tempData.update_time = updateTime;
    return tempData;
  }


  private newLocalCourt(): VolleyCourt {
    let mode = this.getUserPreferenceCourtMode();
    let court = this.placeInfo ? new VolleyCourt(this.userID,this.userInfo, mode, this.placeInfo) : new VolleyCourt(this.userID, this.userInfo, mode);
    return court;
  }

  private resetAsNewLocal() {
    this.matchID = null;
    let court: VolleyCourt = this.newLocalCourt();
    wx.setStorageSync(this.cacheKey, court);
    this.callback(court, Reason.Reset, Status.Local, true);
  }

  /** 释放资源 */
  close() {
    if (this.watcher && this.useWatcher) {
      this.watcher.close();
      this.watcher = null;
      console.log("[Repository] watcher closed.")
    } 

    this.stopSync();
  }

  private _uploadMatch(court: VolleyCourt, endMatch: boolean) {
    if (this.isOnlineMode()) {
      console.error("记录已存在，不能克隆！");
      return;
    }

    const db = wx.cloud.database({
      env: this.env
    })

    var that = this

    let tempData: any = this.newTempCourt(court, db.serverDate());

    db.collection('vmatch').add({
      data: tempData,
      success: function (res) {
        console.log("[db.vmatch.create]", res)
        that.matchID = res._id;
        court._id = res._id;
        //假设云端采取同样的策略
        court._openid = that.userID;
        //同时要存储到本
        wx.setStorageSync(that.cacheKey, court);
        if (that.useWatcher) {
          that.watchOnlineMatch(true, endMatch)
        } else {
          that.fetchOnlineMatch(true, true, endMatch, false, 0);
        }
      },
      fail: function (res) {
        console.error("[db.vmatch.create]", res);
      }
    })
  }

  /** 将本地的比赛数据上传到网络，上传成功之后会通知调用者新的id，切换的网络模式 */
  uploadMatch(court: VolleyCourt) {
    this._uploadMatch(court, false);
  }

  isOnlineMode(): boolean {
    return this.matchID != null;
  }

  uploadAndEndMatch(court: VolleyCourt) {
    court.status = GameStatus.Ended
    if (this.isOnlineMode()) {
      this.updateMatch(court);
    } else {
      this._uploadMatch(court, true);
    }
  }

  setUserPreferenceCourtMode(mode: number) {
    wx.setStorageSync("mode", mode);
  }

  getUserPreferenceCourtMode(): number {
    let mode = wx.getStorageSync("mode")
    console.log("load mode=", mode, typeof (mode))
    if (typeof (mode) == "number") {
      return mode;
    } else {
      return 0;
    }
  }

  /**
   * 
   * @param frequency miniseconds
   */
  startSync(delay:number, frequency: number) {
    const that = this;
    if (!this.useWatcher && this.timmerID == -1) {
      this.timmerID = setTimeout(()=> {
        that.fetchOnlineMatch(false, false, false, true, frequency);
      }, delay);
    }
  }

  stopSync() {
    if (this.timmerID != -1) {
      clearTimeout(this.timmerID);
      this.timmerID = -1;
    }
  }
}

export interface onMatchesFeched {
  (courts: VolleyCourt[]): void
}


export class JointVolleyRepository {
  fetchJointMatches(openid: string, maxcount: number, callback: (matches: VolleyCourt[], success: boolean) => void) {

    const db = wx.cloud.database({
      env: this.env
    })

    db.collection('vmatch').where({
      "players_id": openid
    }).field({
      _id: true,
      myScore: true,
      yourScore: true,
      create_time: true,
      update_time: true,
      myTeam: true,
      yourTeam: true,
      place: true,
      _openid: true,
      status: true,
      mode: true,
      chief_umpire: true,
      stat_umpire1: true,
      stat_umpire2: true
    }).orderBy('create_time', 'desc')
      .limit(maxcount)
      .get({
        success(res) {
          console.log("[db.vmatch.get] players_id: ", openid, "res:", res)
          let matches: VolleyCourt[] = [];
          for (let i in res.data) {
            let t: Date = <Date><unknown>(res.data[i].create_time)

            if (typeof (t) === "string") {
              res.data[i].create_time = t;
            }
            else if (typeof (t) === "object" && t instanceof Date) {
              res.data[i].create_time = parseTime(t);
            } else {
              res.data[i].create_time = ""
            }

            if (res.data[i].update_time) {
              if (res.data[i].update_time instanceof Date) {
                let t2: Date = <Date><unknown>(res.data[i].update_time)
                res.data[i].update_time = parseTime(t2);
              }
            } else {
              res.data[i].update_time = res.data[i].create_time;
            }
            matches.push(res.data[i])
          }
          callback(matches, true)
        },
        fail(res) {
          console.log(res)
          callback([], false);
        }
      })
  }


  deleteMatch(_id: string, callback: (errorCode: number) => void) {
    const db = wx.cloud.database({
      env: this.env
    })

    db.collection('vmatch').doc(_id).remove({
      success(res) {
        callback(0);
      },
      fail(res) {
        callback(1);
      }
    });
  }
  private env: string = 'ilovevolleyball-d1813b'; //,test-705bde
  private cacheKey: string = "stats17";

  loadFromLocal(): VolleyCourt | null {
    let saved = wx.getStorageSync(this.cacheKey);
    return saved;
  }

  fetchMatches(openid: string, maxcount: number, callback: (matches: VolleyCourt[], success: boolean) => void) {

    const that = this;

    const db = wx.cloud.database({
      env: this.env
    })

    db.collection('vmatch').where({
      _openid: openid
    }).field({
      _id: true,
      myScore: true,
      yourScore: true,
      create_time: true,
      update_time: true,
      myTeam: true,
      yourTeam: true,
      place: true,
      _openid: true,
      status: true,
      mode: true,
      chief_umpire: true,
      stat_umpire1: true,
      stat_umpire2: true
    }).orderBy('create_time', 'desc')
      .limit(maxcount)
      .get({
        success(res) {
          console.log("[db.vmatch.get] openid", openid, "res:", res)
          let matches: VolleyCourt[] = [];
          for (let i in res.data) {
            let t: Date = <Date><unknown>(res.data[i].create_time)
            if (typeof (t) === "string") {
              res.data[i].create_time = t;
            }
            else if (typeof (t) === "object" && t instanceof Date) {
              res.data[i].create_time = parseTime(t);
            } else {
              res.data[i].create_time = ""
            }

            if (res.data[i].update_time) {
              if (res.data[i].update_time instanceof Date) {
                let t2: Date = <Date><unknown>(res.data[i].update_time)
                res.data[i].update_time = parseTime(t2);
              }
            } else {
              res.data[i].update_time = res.data[i].create_time;
            }
            //todo: 当前用户avatar可能比历史存储的更新，是否要用用户最新的头像更新？
            matches.push(res.data[i])
          }
          callback(matches, true)
        },
        fail(res) {
          console.log(res)
          callback([], false);
        }
      })
  }

  fetchSquareMatches(openid: string, maxcount: number, callback: (matches: VolleyCourt[], success: boolean) => void) {

    const that = this;

    const db = wx.cloud.database({
      env: this.env
    })

    const _ = db.command

    db.collection('vmatch').where({
      _openid: _.neq(openid)
    }).field({
      _id: true,
      myScore: true,
      yourScore: true,
      create_time: true,
      update_time: true,
      myTeam: true,
      yourTeam: true,
      place: true,
      _openid: true,
      status: true,
      mode: true,
      chief_umpire: true,
      stat_umpire1: true,
      stat_umpire2: true
    }).orderBy('create_time', 'desc')
      .limit(maxcount)
      .get({
        success(res) {
          console.log("[db.vmatch.get] openid", openid, "res:", res)
          let matches: VolleyCourt[] = [];
          for (let i in res.data) {
            let t: Date = <Date><unknown>(res.data[i].create_time)
            if (typeof (t) === "string") {
              res.data[i].create_time = t;
            }
            else if (typeof (t) === "object" && t instanceof Date) {
              res.data[i].create_time = parseTime(t);
            } else {
              res.data[i].create_time = ""
            }

            if (res.data[i].update_time) {
              if (res.data[i].update_time instanceof Date) {
                let t2: Date = <Date><unknown>(res.data[i].update_time)
                res.data[i].update_time = parseTime(t2);
              }
            } else {
              res.data[i].update_time = res.data[i].create_time;
            }
            //todo: 当前用户avatar可能比历史存储的更新，是否要用用户最新的头像更新？
            matches.push(res.data[i])
          }
          callback(matches, true)
        },
        fail(res) {
          console.log(res)
          callback([], false);
        }
      })
  }

}


export class FriendsCourtRepo {
  private cacheKey: string = "fromFriends";
  private courts: VolleyCourt[] = [];

  constructor() {
    this.loadFriendsMatch();
    this.sortMatch();
  }

  private compareMatch(match1: VolleyCourt, match2: VolleyCourt): number {
    let dateT1 = new Date(match1.create_time);
    let dateT2 = new Date(match2.create_time);
    return dateT1 == dateT2 ? 0 : dateT1 > dateT2 ? -1 : 1;
  }

  //按创建时间降序排序
  private sortMatch() {
    this.courts.sort(this.compareMatch);
  }

  private loadFriendsMatch() {
    let saved = wx.getStorageSync(this.cacheKey);
    if (saved) {
      Object.assign(this.courts, saved);
      return saved;
    } else {
      return [];
    }
  }

  saveCourt(court: VolleyCourt) {
    for (let index in this.courts) {
      if (court._id == this.courts[index]._id) {
        return;
      }
    }
    this.courts.unshift(court)
    if (this.courts.length > 8) {
      this.courts = this.courts.slice(0, 8)
    }
    wx.setStorageSync(this.cacheKey, this.courts);
  }

  getCourts(): VolleyCourt[] {
    return this.courts;
  }
}
