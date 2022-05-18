import { PlaceInfo } from "../bl/PlaceInfo";
import { parseTime } from "../utils/Util";
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
}

export enum Status {
  Local,
  Cloud
}

export interface CourtDataChanged {
  (courtData: VolleyCourt, reason: Reason, status: Status): void
}

export class VolleyRepository {
  private callback: CourtDataChanged;
  private matchID: string | null = null;
  private userID: string;
  private watcher: any = null;
  private cacheKey: string = "stats17";
  private env: string = 'ilovevolleyball-d1813b'; //,test-705bde
  private placeInfo: PlaceInfo | null = null;

  /**
   * 除非用户指定比赛的ID，为了自动还原用户上次保存的对象，本类将首先从本地缓存中重构对象，如果发现缓存中的对象来自云端，则会从云端更新该对象
   * 调用者需要使用 updateMatch(), reset() 等方法将对象的状态保存到本地缓存或云端。每次存储动作都会触发 callback 调用以通知使用者，
   * @param callback 接收变化通知的回调方法
   * @param matchID 除非用户指定比赛的ID，为了自动还原用户上次保存的对象，本类将首先从本地缓存中重构对象，如果发现缓存中的对象来自云端，则会从云端更新该对象
   */
  constructor(callback: CourtDataChanged, userID: string, matchID?: string | null, placeInfo?: PlaceInfo) {
    this.callback = callback;
    this.userID = userID;
    if (matchID) {
      this.matchID = matchID;
    }
    if (placeInfo) {
      this.placeInfo = placeInfo;
    }
    this.watchMatch();
  }

  /** todo: 这个地方要改 */
  private watchMatch() {
    //如果指定了比赛的ID，则直接打开这个比赛，不管它是否在本地缓存内
    if (this.matchID) {
      this.watchOnlineMatch(false, false);
    }
    //否则会从本地缓存中加载上次存储的比赛
    else {
      let court = this.loadFromLocal();
      //如果本地缓存的是自己的进行中的比赛，则打开它
      if (court._openid === this.userID && court.status == GameStatus.OnGoing) {
        if (court._id) {
          this.matchID = court._id;
          this.watchOnlineMatch(false, false);
        }
        else {
          this.watchLocalMatch(court);
        }
      } else {
        this.watchLocalMatch(this.newLocalCourt());
      }
    }
  }


  private watchOnlineMatch(localToCloud: boolean, endMatch: boolean) {
    const that = this
    const db = wx.cloud.database({
      env: this.env
    })

    console.log("[Repository] watcher created.")
    this.watcher = db.collection('vmatch').where({
      _id: this.matchID
    })
      .watch({
        onChange: function (snapshot) {
          console.log('[db.vmatch.onChange]', that.matchID, snapshot.type, snapshot)
          let data = snapshot.docs[0]
          if (data) {
            let court: VolleyCourt = new VolleyCourt(that.userID);
            Object.assign(court, data);

            let t = data.create_time
            if (typeof(t) === "string") {
              court.create_time = t;
            }
            else if (typeof(t) === "object" && t instanceof Date) {
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

            if (that.userID != court._openid) {
              let repo = new FriendsCourtRepo();
              repo.saveCourt(court);
            }

            wx.setStorageSync(that.cacheKey, court);
            if (snapshot.type === 'init') {
              if (endMatch) {
                that.callback(court, endMatch ? Reason.Ended : Reason.Init, Status.Cloud)
              } else {
                that.callback(court, localToCloud ? Reason.LocalToCloud : Reason.Init, Status.Cloud)
              }
            } else {
              that.callback(court, endMatch ? Reason.Ended : Reason.Update, Status.Cloud)
            }
          } else {
            console.error("snapshot is empty, matchid:", that.matchID)
          }
        },
        onError: function (err) {
          console.error(err)
        }
      })
  }

  private loadFromLocal(): VolleyCourt {
    let court = new VolleyCourt(this.userID);
    let saved = wx.getStorageSync(this.cacheKey);
    Object.assign(court, saved);
    return court;
  }

  private watchLocalMatch(court: VolleyCourt) {
    wx.setStorageSync(this.cacheKey, court);
    this.callback(court, Reason.Init, Status.Local);
  }

  updateMatch(court: VolleyCourt) {
    court.updateStatSettings();
    this._updateMatch(court, false);
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
          //that.callback(fcourt);
        },
        fail: function (res) {
          console.error("[db.vmatch.update]", res);
        }
      })
    } else {
      wx.setStorageSync(this.cacheKey, court);
      this.callback(court, endMatch ? Reason.Ended : Reason.Update, Status.Local);
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

      that.close(); //停止监听，少一次更新事件
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
    let court = this.placeInfo ? new VolleyCourt(this.userID, this.placeInfo) : new VolleyCourt(this.userID);
    return court;
  }

  private resetAsNewLocal() {
    this.matchID = null;
    let court: VolleyCourt = this.newLocalCourt();
    wx.setStorageSync(this.cacheKey, court);
    this.callback(court, Reason.Reset, Status.Local);
  }

  /** 释放资源 */
  close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log("[Repository] watcher closed.")
    }
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
        that.watchOnlineMatch(true, endMatch);
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
}

export interface onMatchesFeched {
  (courts: VolleyCourt[]): void
}


export class VolleyRepository2 {
  fetchJointMatches(openid: string, maxcount: number, callback: onMatchesFeched) {
    let matches: VolleyCourt[] = [];
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
    }).orderBy('create_time', 'desc')
      .limit(maxcount)
      .get({
        success(res) {
          console.log("[db.vmatch.get] players_id: ", openid, "res:", res)
          for (let i in res.data) {
            let t: Date = <Date><unknown>(res.data[i].create_time)

            if (typeof(t) === "string") {
              res.data[i].create_time = t;
            }
            else if (typeof(t) === "object" && t instanceof Date) {
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
          callback(matches)
        },
        fail(res) {
          console.log(res)
          callback(matches);
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

  fetchMatches(openid: string, maxcount: number, callback: onMatchesFeched) {
    let matches: VolleyCourt[] = [];
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
    }).orderBy('create_time', 'desc')
      .limit(maxcount)
      .get({
        success(res) {
          console.log("[db.vmatch.get] openid", openid, "res:", res)
          for (let i in res.data) {
            let t: Date = <Date><unknown>(res.data[i].create_time)
            if (typeof(t) === "string") {
              res.data[i].create_time = t;
            }
            else if (typeof(t) === "object" && t instanceof Date) {
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
          callback(matches)
        },
        fail(res) {
          console.log(res)
          callback(matches);
        }
      })
  }
}


export class FriendsCourtRepo {
  private cacheKey: string = "fromFriends";
  private courts: VolleyCourt[] = [];

  constructor() {
    this.loadFriendsMatch();
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
    this.courts.push(court)
    wx.setStorageSync(this.cacheKey, this.courts);
  }

  getCourts(): VolleyCourt[] {
    return this.courts;
  }

}
