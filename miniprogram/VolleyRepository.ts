import { PlaceInfo } from "./PlaceInfo";
import { VolleyCourt } from "./VolleyCourt";

export enum Reason {
  Init,
  Update,
  LocalToCloud,
  /** Reset = Update + Init */
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
  constructor(callback: CourtDataChanged, userID:string, matchID?: string|null, placeInfo?: PlaceInfo) {
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
    if (this.matchID) {
      this.watchOnlineMatch(false);
    } else {
      let court = this.loadFromLocal();
      //如果本地缓存的是一个云端的他人的比赛，则强制从头来
      if (court._id && court._openid === this.userID) {
        this.matchID = court._id;
        this.watchOnlineMatch(false);
      } else if (court._id && this.userID != court._id) {
        this.watchLocalMatch(this.newLocalCourt());
      } else {
        this.watchLocalMatch(court);
      }
    }
  }

  private watchOnlineMatch(localToCloud:boolean) {
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
            let court: VolleyCourt = new VolleyCourt()
            Object.assign(court, data)
            court.create_time = data.create_time.toLocaleString()
            if (snapshot.type === 'init') {
              that.callback(court, localToCloud ? Reason.LocalToCloud : Reason.Init, Status.Cloud)
            } else {
              that.callback(court, Reason.Update, Status.Cloud)
            }
          }
        },
        onError: function (err) {
          console.error(err)
        }
      })
  }

  private loadFromLocal(): VolleyCourt {
    let saved = wx.getStorageSync(this.cacheKey);
    let court: VolleyCourt = this.newLocalCourt();
    Object.assign(court, saved);
    return court;
  }

  private watchLocalMatch(court: VolleyCourt) {
    this.callback(court, Reason.Init, Status.Local);
  }

  updateMatch(court: VolleyCourt) {
    if (this.matchID && this.matchID != court._id) {
      console.error("[volleyball] try to update a different court which I am not wathing ?")
    } else if (this.matchID && this.matchID == court._id) {
      var that = this
      const db = wx.cloud.database({
        env: this.env
      })

      let tempData: any = {};
      Object.assign(tempData, court);
      delete tempData._openid;
      delete tempData._id;

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
      this.callback(court, Reason.Update, Status.Local);
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
      let tempData: any = this.newTempCourt(court, db.serverDate());

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

    tempData.create_time = createTime;
    return tempData;
  }


  private newLocalCourt() : VolleyCourt {
    return this.placeInfo ? new VolleyCourt(this.placeInfo) : new VolleyCourt();
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
      console.log("[Repository] watcher closed.")
    }
  }

  /** 将本地的比赛数据上传到网络，上传成功之后会通知调用者新的id，切换的网络模式 */
  uploadMatch(court: VolleyCourt) {
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
        court._openid = res._openid;
        //同时要存储到本
        wx.setStorageSync(that.cacheKey, court);
        that.watchOnlineMatch(true);
      },
      fail: function (res) {
        console.error("[db.vmatch.create]", res);
      }
    })
  }

  isOnlineMode(): boolean {
    return this.matchID != null;
  }
}
