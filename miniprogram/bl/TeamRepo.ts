export class VUser {
  openid: String; //用户的微信openid
  userInfo: WechatMiniprogram.UserInfo; //用户的微信用户信息

  constructor() {
    this.openid = "";
    this.userInfo = {
      avatarUrl: "",
      city: "",
      country: "",
      gender: 0,
      language: 'zh_CN',
      nickName: "",
      province: ""
    }
  }
}

export class VPlayer {
  user: VUser = new VUser(); //绑定的微信账号信息
  name: string = ""; //球员名称，若未指定，则同微信昵称，相当于微信的备注
  number: string = ""; //秋衣号码
  constructor(name: string) {
    this.name = name;
  }
}

const DEFAULT_PLAYERS: string[] = ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"]; //不再使用


export class VTeam {
  _openid: string; //team owner, reserved by DB
  _id: string; //team id, reserved by DB
  name: string; //team name
  players: VPlayer[] = new Array();
  owner: VUser = new VUser();
  constructor(owner?: VUser) {
    this._openid = "";
    this._id = "";
    this.name = "我的队伍";
    this.owner = owner ? owner : new VUser();
    for (let i = 0; i < DEFAULT_PLAYERS.length; i++) {
      let player = new VPlayer(DEFAULT_PLAYERS[i]);
      this.players.push(player);
    }
  }
}


export class TeamRepo {
  fetchJointTeams(openid: string, arg1: (errorCode: number, teams: any[]) => void) {
    throw new Error("Method not implemented.");
  }

  private createTmpTeam(team:VTeam) : VTeam {
    let tempData: any = {};
    Object.assign(tempData, team);
    delete tempData._openid;
    delete tempData._id;
    delete tempData.create_time;
    return tempData;
  }

  updateTeam(team:VTeam, callback: (success: boolean) => void) {
    const db = wx.cloud.database({
      env: this.env
    })

    let tempTeam = this.createTmpTeam(team);

    db.collection('vteam').doc(team._id).update({
      data: tempTeam,
      success: function (res) {
        console.log("[db.vteam.update]", res);
        callback(true);
      },
      fail: function (res) {
        console.error("[db.vteam.update]", res);
        callback(false);
      }
    })
  }

  joinTeam(teamId: string, player: VPlayer, callback: (success: number) => void) {
    wx.cloud.callFunction({
      name: 'vteam',
      data: {
        action: 'joinTeam',
        teamId: teamId,
        applicantId: player.user.openid,
        avatarUrl: player.user.userInfo.avatarUrl,
        nickName: player.user.userInfo.nickName,
        applicantName: player.name
      },
      success: (res: any) => {
        console.log('[wx.cloud.vteam]', res)
        if (res.result.errMsg.indexOf('ok') >= 0) {
          callback(0)
        } else if (res.result.errMsg.indexOf('exists') >= 0) {
          callback(1)
        } else {
          callback(2)
        }
      },
      fail: err => {
        console.error('[wx.cloud.vteam] failed!', err)
        callback(2)
      }
    })
  }

  createTeam(team: VTeam, callback: (team: VTeam | null) => void) {
    const db = wx.cloud.database({
      env: this.env
    })

    delete team._id;
    delete team._openid;

    db.collection('vteam').add({
      data: team,
      success: function (res) {
        console.log("[db.vteam.create]", res)
        team._id = res._id
        callback(team)
      },
      fail: function (res) {
        console.error("[db.vteam.create]", res);
        callback(null)
      }
    })
  }

  private env: string = 'ilovevolleyball-d1813b'; //,test-705bde

  loadTeamByID(teamId: string, callback: (team: VTeam | null) => void) {
    const db = wx.cloud.database({
      env: this.env
    })

    db.collection('vteam').where({
      _id: teamId
    }).get({
      success(res) {
        console.log("[db.vteam.get] res:", res)
        let team: VTeam = res.data[0];
        callback(team)
      },
      fail(res) {
        console.log(res)
        callback(null);
      }
    })
  }

  fetchByOwner(ownerId:string, callback: (errorCode:number, team: VTeam | null) => void) {
    const db = wx.cloud.database({
      env: this.env
    })

    db.collection('vteam').where({
      _openid: ownerId
    }).get({
      success(res) {
        console.log("[db.vteam.get] res:", res)
        if (res.data.length == 0) {
          callback(1, null);
        } else {
          let team: VTeam = res.data[0];
          callback(0, team)
        }
      },
      fail(res) {
        console.log(res)
        callback(2, null);
      }
    })
  }

  loadOrCreateTeamByOwner(ownerId: string, callback: (team: VTeam | null) => void) {
    this.fetchByOwner(ownerId, (errorCode:number, team: VTeam | null) => {
      if (team == null) {
        let newUser = new VUser();
        newUser.openid = ownerId;
        this.createTeam(new VTeam(newUser), (team: VTeam | null) => {
          callback(team);
        })
      } else {
        callback(team);
      }
    });
  }
}