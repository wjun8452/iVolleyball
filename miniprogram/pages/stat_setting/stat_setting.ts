// pages/stat_setting/stat_setting.js

import { BasePage } from "../../bl/BasePage";
import { FavoriteTeamIdRepo } from "../../bl/FavoriteTeamIdRepo";
import { FavoriteTeamRepo } from "../../bl/FavoriteTeamRepo";
import { GlobalData } from "../../bl/GlobalData";
import { deDupTeams, TeamRepo, VTeam, VUser } from "../../bl/TeamRepo";
import { StatCat, VolleyCourt } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

let globalData: GlobalData = getApp().globalData

class SettingPageData {
  _id: string | null = null;
  total_scores: number[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  edit_pos: number = -1;
  edit_pos2: number = -1;
  court: VolleyCourt | null = null;
  globalData: GlobalData = globalData;
  myteams: VTeam[] = [];
  pikerTeamIndex: number = -1;

  /** 被邀请统计 */
  inviteAsUmpire1: boolean = false;
  inviteAsUmpire2: boolean = false;
  inviteAsUmpire3: boolean = false;
  inviteAsUmpire4: boolean = false;

  /** 当前用户是否是比赛的创建者 */
  isOwner: boolean = true;

  /** 用户信息 */
  user: VUser = new VUser();
  canIUseGetUserProfile = false;

  /** 分享了哪一个统计员 */
  temp_which_umpire: string = "";

  /** 当前用户是否是统计裁判, 1和2不能同时为true，3和4不能同时为true */
  isUmpire1: boolean = false;
  isUmpire2: boolean = false;
  isUmpire3: boolean = false;
  isUmpire4: boolean = false;

  /** 分页 1:基础 2:我方 3:对方 4:界面 */
  tab:number = 1;

  /** 用户UI偏好设置 */
  showTips: boolean = true;  //显示帮助文字
}

class SettingPage extends BasePage {
  data: SettingPageData = new SettingPageData();
  repo: VolleyRepository | null = null;


  onDataChanged = function (this: SettingPage, court: VolleyCourt, reason: Reason, status: Status, success: boolean) {
    console.log("[Setting] onCourtChange Begins, reason:", reason, ", status:", status, ", court id:", court._id, ", court:", court, ", success:", success)

    if (!success) {
      wx.showToast({ 'title': '操作失败！', 'icon': 'error' })
      return;
    }

    this.data.court = court;

    this.updateUIData();

    this.setData(this.data);

    if (reason == Reason.Init) {
      this.loadMyTeam(false);
    }

    if (reason == Reason.LocalToCloud) {
      let url: string = '../share/share?target=stat_setting&which_umpire=' + this.data.temp_which_umpire + '&_id=' + this.data.court!._id + "&myTeam=" + this.data.court?.myTeam + "&yourTeam=" + this.data.court?.yourTeam
        + "&myScore=" + this.data.court?.myScore + "&yourScore=" + this.data.court?.yourScore
        + "&place=" + this.data.court?.place + "&create_time=" + this.data.court?.create_time;

      wx.navigateTo({
        url: url
      })
    }

    wx.hideLoading();
  }

  onLoad = function (this: SettingPage, options: any) {

    if (options._id) { //from url
      this.data._id = options._id
      if (options.inviteAsUmpire1 == "true") {
        this.data.inviteAsUmpire1 = true;
        this.data.tab = 2;
        this.setData({ inviteAsUmpire1: this.data.inviteAsUmpire1, tab: this.data.tab });
      }

      if (options.inviteAsUmpire2 == "true") {
        this.data.inviteAsUmpire2 = true;
        this.data.tab = 2;
        this.setData({ inviteAsUmpire2: this.data.inviteAsUmpire2, tab: this.data.tab  });
      }

      if (options.inviteAsUmpire3 == "true") {
        this.data.inviteAsUmpire3 = true;
        this.data.tab = 3;
        this.setData({ inviteAsUmpire3: this.data.inviteAsUmpire3, tab: this.data.tab  });
      }

      if (options.inviteAsUmpire4 == "true") {
        this.data.inviteAsUmpire4 = true;
        this.data.tab = 3;
        this.setData({ inviteAsUmpire4: this.data.inviteAsUmpire4, tab: this.data.tab  });
      }
    }

    const newLocal = wx.getUserProfile;
    if (newLocal) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  }

  onShow = function (this: SettingPage) {
    wx.showLoading({
      title: '加载中',
    })
    //加载偏好设置
    try {
      //FTUE
      let value: string = wx.getStorageSync("showTips");
      console.log("getStorageSync(showTips) = ", value, typeof(value))
      if (typeof(value) == "boolean") {
        this.data.showTips = value;
      }
      this.setData({showTips: this.data.showTips})
      console.log("this.data.showTips:", this.data.showTips)
    } catch (error) {
      console.error(error);
    }

    getApp().getCurrentUser((user: VUser, success: boolean) => {
      wx.hideLoading();

      if (success) {
        wx.showLoading({
          title: '加载中',
        })

        this.data.globalData = getApp().globalData;
        this.data.user = user;
        this.repo = new VolleyRepository(this.onDataChanged, user.openid, user, this.data._id, getApp().globalData.placeInfo, false, false);

      } else {
        wx.showToast({ 'title': 'id错误', 'icon': 'error' })
      }

      console.log("[onShow] data:", this.data)
    })
  }


  onHide = function (this: SettingPage) {
    if (this.repo) {
      this.repo.close();
    }
  }

  onReset = function (this: SettingPage) {
    if (this.data.court) {
      this.data.court.resetScore();
    }
    this.updateMatch();
  }

  onChangeMyScore = function (this: SettingPage, e: any) {
    this.data.court!.myScore = parseInt(e.detail.value);
    this.updateMatch();
  }

  onChangeYourScore = function (this: SettingPage, e: any) {
    this.data.court!.yourScore = parseInt(e.detail.value);
    this.updateMatch();
  }

  onChoosePlayer = function (this: SettingPage, e: any) {
    let players = this.data.court!.players;
    let player = e.currentTarget.dataset.player; //被选球员, VPlayer
    let pos = e.currentTarget.dataset.position;  //被编辑的位置
    let newPlayer: boolean = true;

    //如果是交换位置，譬如选择了一位已经在场上的队员
    for (let i in players) {
      if (players[i] == player) { //选择的是场上的另一位队员
        players[i] = this.data.court!.players[pos]; //另一位队员就换成目标位置原来所在的人
        newPlayer = false; //只是交换而已，不是添加新队员
      }
    }

    //如果添加了新人到场上，默认是允许统计
    if (newPlayer && this.data.court!.player_allowed.indexOf(player) == -1) {
      this.data.court!.player_allowed.push(player)
    }

    // console.log(newPlayer, this.data.court?.player_allowed, player)

    this.data.court!.players[pos] = player; //被操作的位置换成新的人

    this.data.edit_pos = -1;

    this.updateMatch();
  }

  onChoosePlayer2 = function (this: SettingPage, e: any) {
    let players = this.data.court!.players2;
    let player = e.currentTarget.dataset.player; //被选球员, VPlayer
    let pos = e.currentTarget.dataset.position;  //被编辑的位置
    let newPlayer: boolean = true;

    //如果是交换位置，譬如选择了一位已经在场上的队员
    for (let i in players) {
      if (players[i] == player) { //选择的是场上的另一位队员
        players[i] = this.data.court!.players2[pos]; //另一位队员就换成目标位置原来所在的人
        newPlayer = false; //只是交换而已，不是添加新队员
      }
    }

    //如果添加了新人到场上，默认是允许统计
    if (newPlayer && this.data.court!.player_allowed2.indexOf(player) == -1) {
      this.data.court!.player_allowed2.push(player)
    }

    // console.log(newPlayer, this.data.court?.player_allowed, player)

    this.data.court!.players2[pos] = player; //被操作的位置换成新的人

    this.data.edit_pos2 = -1;

    this.updateMatch();
  }

  onCheckWhoServe = function (this: SettingPage, e: any) {
    let position = e.target.dataset.position;
    let checked = e.detail.value.length == 1;

    if (checked) {
      this.data.court!.who_serve = position;
    } else {
      this.data.court!.serve = false;
    }

    this.updateMatch();
  }

  onCheckWhoServe2 = function (this: SettingPage, e: any) {
    let position = e.target.dataset.position;
    let checked = e.detail.value.length == 1;

    if (checked) {
      this.data.court!.who_serve2 = position;
    } else {
      this.data.court!.serve2 = false;
    }

    this.updateMatch();
  }

  onFrontBackMode = function (this: SettingPage, e: any) {
    let mode = e.detail.value; //0: front_back, 1: normal
    if (mode == "0") {
      this.data.court!.front_back_mode = true;
    } else {
      this.data.court!.front_back_mode = false;
    }
    this.updateMatch();
  }

  onFrontBackMode2 = function (this: SettingPage, e: any) {
    let mode = e.detail.value; //0: front_back, 1: normal
    if (mode == "0") {
      this.data.court!.front_back_mode2 = true;
    } else {
      this.data.court!.front_back_mode2 = false;
    }
    this.updateMatch();
  }

  onTapMatchMode = function (this: SettingPage, e: any) {
    let mode = e.detail.value;
    if (mode == "0") {
      this.data.court!.setMode(0);
    } else if (mode == "1") {
      this.data.court!.setMode(1);
    } else {
      this.data.court!.setMode(2);
    }
    this.repo?.setUserPreferenceCourtMode(this.data.court!.mode);
    this.updateMatch();
  }

  onTapServe = function (this: SettingPage, e: any) {
    let serve = e.detail.value; //0: 我方发球, 1: 对方发球
    if (serve == 0) {
      this.data.court!.serve = true;
      this.data.court!.serve2 = false;
      if (this.data.court!.who_serve == -1) {
        this.data.court!.who_serve = 0; //默认1号位发球
      }
    } else {
      this.data.court!.serve = false;
      this.data.court!.serve2 = true;
      if (this.data.court!.who_serve2 == -1) {
        this.data.court!.who_serve2 = 0; //默认1号位发球
      }
      //this.data.who_serve = -1; //must not change who_serve, 记录上次我方是谁在发球，如果复位，则会丢失状态
    }

    this.updateMatch();
  }

  onTapServe2 = function (this: SettingPage, e: any) {
    let serve = e.detail.value; //0: 我方发球, 1: 对方发球
    if (serve == 0) {
      this.data.court!.serve2 = true;
      this.data.court!.serve = false;
      if (this.data.court!.who_serve2 == -1) {
        this.data.court!.who_serve2 = 0; //默认1号位发球
      }
    } else {
      this.data.court!.serve2 = false;
      this.data.court!.serve = true;
      if (this.data.court!.who_serve == -1) {
        this.data.court!.who_serve = 0; //默认1号位发球
      }
      //this.data.who_serve = -1; //must not change who_serve, 记录上次我方是谁在发球，如果复位，则会丢失状态
    }

    this.updateMatch();
  }

  onClickPlayer = function (this: SettingPage, e: any) {
    let position = e.currentTarget.dataset.position;
    console.log("click ", position)
    if (position == this.data.edit_pos) {
      this.data.edit_pos = -1
    } else {
      this.data.edit_pos = position;
    }
    //加载
    this.setData(this.data);
  }

  onClickPlayer2 = function (this: SettingPage, e: any) {
    let position = e.currentTarget.dataset.position;
    console.log("click ", position)
    if (position == this.data.edit_pos2) {
      this.data.edit_pos2 = -1
    } else {
      this.data.edit_pos2 = position;
    }
    //加载
    this.setData(this.data);
  }

  rotate = function (this: SettingPage) {
    this.data.court!.rotate();
    this.updateMatch();
  }

  rotate2 = function (this: SettingPage) {
    this.data.court!.rotate2();
    this.updateMatch();
  }

  onAddMyScore = function (this: SettingPage) {
    this.changeMyScore(1);
  }

  onReduceMyScore = function (this: SettingPage) {
    this.changeMyScore(-1);
  }

  onAddYourScore = function (this: SettingPage) {
    this.changeYourScore(1);
  }

  onReduceYourScore = function (this: SettingPage) {
    this.changeYourScore(-1);
  }

  changeMyScore = function (this: SettingPage, delta: number) {
    let s = this.data.court!.myScore + delta;
    if (s >= 0) {
      this.data.court!.myScore = s;
      this.updateMatch();
    }
  }

  changeYourScore = function (this: SettingPage, delta: number) {
    let s = this.data.court!.yourScore + delta;
    if (s >= 0) {
      this.data.court!.yourScore = s;
      this.updateMatch();
    }
  }

  _checkDuplicated = function (this: SettingPage, array1: StatCat[], array2: StatCat[]): boolean {
    let set1 = new Set(array1);
    let set2 = new Set(array2);
    let intersectionSet = new Set([...set1].filter(x => set2.has(x)));
    console.log(intersectionSet);
    return intersectionSet.size > 0;
  }

  onCheckAllowedStatCatUmpire1 = function (this: SettingPage, e: any) {
    if (!this.data.court) return;

    let cat_allowed = e.detail.value;
    console.log(cat_allowed)
    if (!this._checkDuplicated(cat_allowed, this.data.court?.cat_allowed_umpire2)) {
      this.data.court!.updateCatAllowdUmpire1(cat_allowed);
      this.updateMatch();
    } else {
      wx.showToast({
        icon: "error",
        title: "与统计员2冲突"
      })
      this.setData(this.data)
    }
  }

  onCheckAllowedStatCatUmpire3 = function (this: SettingPage, e: any) {
    if (!this.data.court) return;

    let cat_allowed = e.detail.value;
    console.log(cat_allowed)
    if (!this._checkDuplicated(cat_allowed, this.data.court?.cat_allowed2_umpire2)) {
      this.data.court!.updateCatAllowdUmpire3(cat_allowed);
      this.updateMatch();
    } else {
      wx.showToast({
        icon: "error",
        title: "与统计员2冲突"
      })
      this.setData(this.data)
    }
  }

  onCheckAllowedStatCatUmpire2 = function (this: SettingPage, e: any) {
    if (!this.data.court) return;
    let cat_allowed = e.detail.value;
    console.log(cat_allowed)
    if (!this._checkDuplicated(cat_allowed, this.data.court?.cat_allowed_umpire1)) {
      this.data.court!.updateCatAllowdUmpire2(cat_allowed);
      this.updateMatch();
    } else {
      wx.showToast({
        icon: "error",
        title: "与统计员1冲突"
      })
      this.setData(this.data)
    }
  }

  onCheckAllowedStatCatUmpire4 = function (this: SettingPage, e: any) {
    if (!this.data.court) return;
    let cat_allowed = e.detail.value;
    console.log(cat_allowed)
    if (!this._checkDuplicated(cat_allowed, this.data.court?.cat_allowed2_umpire1)) {
      this.data.court!.updateCatAllowdUmpire4(cat_allowed);
      this.updateMatch();
    } else {
      wx.showToast({
        icon: "error",
        title: "与统计员1冲突"
      })
      this.setData(this.data)
    }
  }

  onCheckAllowedPlayer = function (this: SettingPage, e: any) {
    let player_allowed = e.detail.value;

    //循环查看场上球员是否被勾选
    for (let i = 0; i < this.data.court!.players.length; i++) {
      let player = this.data.court!.players[i];
      let index = player_allowed.indexOf(player);
      if (index == -1) { //该球员未被勾选
        let index2 = this.data.court!.player_allowed.indexOf(player);
        if (index2 != -1) {
          this.data.court!.player_allowed.splice(index2);
        }
      } else {
        let index2 = this.data.court!.player_allowed.indexOf(player);
        if (index2 == -1) {
          this.data.court!.player_allowed.push(player);
        }
      }
    }
    this.data.court!.updateStatSettings(undefined, player_allowed);
    this.updateMatch();
  }

  onCheckAllowedPlayer2 = function (this: SettingPage, e: any) {
    let player_allowed = e.detail.value;

    //循环查看场上球员是否被勾选
    for (let i = 0; i < this.data.court!.players2.length; i++) {
      let player = this.data.court!.players2[i];
      let index = player_allowed.indexOf(player);
      if (index == -1) { //该球员未被勾选
        let index2 = this.data.court!.player_allowed2.indexOf(player);
        if (index2 != -1) {
          this.data.court!.player_allowed2.splice(index2);
        }
      } else {
        let index2 = this.data.court!.player_allowed2.indexOf(player);
        if (index2 == -1) {
          this.data.court!.player_allowed2.push(player);
        }
      }
    }
    this.data.court!.updateStatSettings2(undefined, player_allowed);
    this.updateMatch();
  }

  onEditTeam = function (this: SettingPage, e: any) {
    let dataset = e.currentTarget.dataset
    let name = e.detail.value

    name = name.replace(/^\s*|\s*$/g, "");
    if (name.length > 0) {
      if (dataset.obj === "myTeam") {
        this.data.court!.myTeam = name;
      } else {
        this.data.court!.yourTeam = name;
      }
      this.updateMatch();
    } else {
      wx.showToast({
        title: '名称不能为空！',
        icon: "error"
      })
    }
  }

  bindTotalScoreChange = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.data.court!.total_score = this.data.total_scores[e.detail.value]
    this.updateMatch();
  }


  setterEnabled = function (this: SettingPage, e: any) {
    const values = e.detail.value;
    this.data.court!.is_setter_enabled = values.length > 0;
    this.updateMatch();
  }

  setterEnabled2 = function (this: SettingPage, e: any) {
    const values = e.detail.value;
    this.data.court!.is_setter_enabled2 = values.length > 0;
    this.updateMatch();
  }

  bindSetterChange = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.setter = e.detail.value;
    this.updateMatch();
  }

  bindSetterChange2 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.setter2 = e.detail.value;
    this.updateMatch();
  }

  bindLiberoChange = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.libero = e.detail.value;
    this.updateMatch();
  }

  bindLiberoChange2 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.libero2 = e.detail.value;
    this.updateMatch();
  }

  liberoEnabled = function (this: SettingPage, e: any) {
    let values = e.detail.value;
    this.data.court!.is_libero_enabled = values.length > 0;
    this.updateMatch();
  }

  liberoEnabled2 = function (this: SettingPage, e: any) {
    let values = e.detail.value;
    this.data.court!.is_libero_enabled2 = values.length > 0;
    this.updateMatch();
  }

  bindLiberoReplacement1 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.libero_replacement1 = e.detail.value;
    this.updateMatch();
  }

  bindLibero2Replacement1 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.libero2_replacement1 = e.detail.value;
    this.updateMatch();
  }

  bindLiberoReplacement2 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.data.court!.libero_replacement2 = e.detail.value;
    this.updateMatch();
  }

  bindLibero2Replacement2 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.data.court!.libero2_replacement2 = e.detail.value;
    this.updateMatch();
  }

  updateMatch = function (this: SettingPage) {
    if (this.repo?.isOnlineMode()) {
      wx.showLoading({
        title: '正在加载',
      })
    }
    this.repo!.updateMatch(this.data.court!)
  }

  loadMyTeam = function (this: SettingPage, showError: boolean) {
    wx.showLoading({
      title: '正在加载',
    });

    getApp().getCurrentUser((user: VUser, success: boolean) => {
      let that = this
      let teamRepo = new TeamRepo();
      teamRepo.fetchByOwner(user.openid, (errorCode: number, teams: VTeam[] | null) => {
        if (teams != null) {
          that.data.myteams = teams;
        }

        teamRepo.fetchJointTeams(user.openid, (errorCode: number, teams: VTeamp[]) => {
          if (teams != null) {
            that.data.myteams = that.data.myteams.concat(teams);
          }

          new FavoriteTeamRepo().fetchFavoriteTeams(new FavoriteTeamIdRepo(), (success: boolean, teams: VTeam[]) => {
            if (teams != null) {
              that.data.myteams = that.data.myteams.concat(teams);
            }
            that.data.myteams = deDupTeams(that.data.myteams)
            wx.hideLoading();
            that.setData(that.data);
          })
        })
      })
    });
  }

  onImportTeam = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)

    this.data.pikerTeamIndex = e.detail.value;
    this.setData({ pikerTeamIndex: this.data.pikerTeamIndex });
    if (this.data.pikerTeamIndex < 0) return;

    let index = this.data.pikerTeamIndex;
    let team = this.data.myteams[index];

    if (e.currentTarget.dataset.obj === "myTeam") {
      this.data.court!.all_players = new Array();
      this.data.court!.players = ["", "", "", "", "", ""];
      for (let index = 0; index < team.players.length; index++) {
        this.data.court!.all_players.push(team.players[index].name);
        this.data.court!.players_map[team.players[index].name] = team.players[index];
        if (team.players[index].user.openid != "") {
          this.data.court!.players_id.push(team.players[index].user.openid);
        }
      }
      console.log(this.data.court!.players_map)
      this.data.court!.setter = -1;
      this.data.court!.libero = -1;
      this.data.court!.libero_replacement1 = -1;
      this.data.court!.libero_replacement2 = -1;
      this.data.court!.myTeam = team.name;
      this.data.court!.myteamId = team._id;
    } else {
      this.data.court!.all_players2 = new Array();
      this.data.court!.players2 = ["", "", "", "", "", ""];
      for (let index = 0; index < team.players.length; index++) {
        this.data.court!.all_players2.push(team.players[index].name);
        this.data.court!.players_map2[team.players[index].name] = team.players[index];
        if (team.players[index].user.openid != "") {
          this.data.court!.players_id2.push(team.players[index].user.openid);
        }
      }
      console.log(this.data.court!.players_map2)
      this.data.court!.setter2 = -1;
      this.data.court!.libero2 = -1;
      this.data.court!.libero2_replacement1 = -1;
      this.data.court!.libero2_replacement2 = -1;
      this.data.court!.yourTeam = team.name;
      this.data.court!.yourteamId = team._id;
    }
    this.updateMatch();
  }

  gotoTeams = function (this: SettingPage) {
    wx.navigateTo({
      url: "../teams/teams"
    })
  }

  onChooseLocation = function (this: SettingPage) {
    let that = this
    wx.chooseLocation({
      success: function (res) {
        that.data.court!.place = res.name;
        that.data.court!.latlon.latitude = res.latitude;
        that.data.court!.latlon.longitude = res.longitude;
        that.data.court!.address = res.address;
        that.updateMatch()
        console.log(res);
      },
      fail: function (res) {
        console.log(res);
      }
    });
  }

  onShare = function (this: SettingPage, e: any) {
    if (!this.data.court) return;

    let which_umpire = e.target.dataset.umpire;
    this.data.temp_which_umpire = which_umpire;

    if (this.data.court._id) {
      let url: string = '../share/share?target=stat_setting&which_umpire=' + which_umpire + '&_id=' + this.data.court._id + "&myTeam=" + this.data.court?.myTeam + "&yourTeam=" + this.data.court.yourTeam
        + "&myScore=" + this.data.court?.myScore + "&yourScore=" + this.data.court.yourScore
        + "&place=" + this.data.court?.place + "&create_time=" + this.data.court.create_time;

      console.log(url);

      wx.navigateTo({
        url: url
      })
    } else {
      wx.showLoading({
        title: '正在加载...',
      })
      this.repo?.uploadMatch(this.data.court);
    }
  }

  clearUmpire1 = function (this: SettingPage) {
    this._setMyselfUmpire("umpire1", {
      openid: "", userInfo: {
        avatarUrl: "", city: "", country: "", gender: 0, language: 'zh_CN', nickName: "", province: ""
      }
    });
  }

  clearUmpire2 = function (this: SettingPage) {
    this._setMyselfUmpire("umpire2", {
      openid: "", userInfo: {
        avatarUrl: "", city: "", country: "", gender: 0, language: 'zh_CN', nickName: "", province: ""
      }
    });
  }

  clearUmpire3 = function (this: SettingPage) {
    this._setMyselfUmpire("umpire3", {
      openid: "", userInfo: {
        avatarUrl: "", city: "", country: "", gender: 0, language: 'zh_CN', nickName: "", province: ""
      }
    });
  }

  clearUmpire4 = function (this: SettingPage) {
    this._setMyselfUmpire("umpire4", {
      openid: "", userInfo: {
        avatarUrl: "", city: "", country: "", gender: 0, language: 'zh_CN', nickName: "", province: ""
      }
    });
  }

  setMyselfUmpire1 = function (this: SettingPage, e: any) {
    this._setMyselfUmpire("umpire1", this.data.user);
  }

  setMyselfUmpire2 = function (this: SettingPage, e: any) {
    this._setMyselfUmpire("umpire2", this.data.user);
  }

  setMyselfUmpire3 = function (this: SettingPage, e: any) {
    this._setMyselfUmpire("umpire3", this.data.user);
  }

  setMyselfUmpire4 = function (this: SettingPage, e: any) {
    this._setMyselfUmpire("umpire4", this.data.user);
  }

  //user就是当前用户
  //user为空，就相当于clear
  _setMyselfUmpire = function (this: SettingPage, who: string, user: VUser) {
    if (!this.data.court) return;

    //if (user.openid == "")  //user为空，就相当于clear

    if (!this.data.court._id) { //更新本地缓存
      if (who === "umpire1") {
        if (user.openid != "" && this.data.court.stat_umpire2.openid == user.openid) {
          wx.showToast({
            icon: 'error',
            title: "不能担任2个"
          })
          return;
        } else {
          this.data.court.stat_umpire1 = user;
          this.data.court.stat_umpire1_done = false;
          if (user.openid == "") {//删除统计员
            this.data.court.cat_allowed_umpire1 = [];
          }
        }
      } else if (who == "umpire2") {
        if (user.openid != "" && this.data.court.stat_umpire1.openid == user.openid) {
          wx.showToast({
            icon: 'error',
            title: "不能担任2个"
          })
          return;
        } else {
          this.data.court.stat_umpire2 = user;
          this.data.court.stat_umpire2_done = false;
          if (user.openid == "") {//删除统计员
            this.data.court.cat_allowed_umpire2 = [];
          }
        }
      } else if (who == "umpire3") {
        if (user.openid != "" && this.data.court.stat2_umpire2.openid == user.openid) {
          wx.showToast({
            icon: 'error',
            title: "不能担任2个"
          })
          return;
        } else {
          this.data.court.stat2_umpire1 = user;
          this.data.court.stat2_umpire1_done = false;
          if (user.openid == "") {//删除统计员
            this.data.court.cat_allowed2_umpire1 = [];
          }
        }
      } else if (who == "umpire4") {
        if (user.openid != "" && this.data.court.stat2_umpire1.openid == user.openid) {
          wx.showToast({
            icon: 'error',
            title: "不能担任2个"
          })
          return;
        } else {
          this.data.court.stat2_umpire2 = user;
          this.data.court.stat2_umpire2_done = false;
          if (user.openid == "") {//删除统计员
            this.data.court.cat_allowed2_umpire2 = [];
          }
        }
      }
      this.repo?.updateMatch(this.data.court)
    } else {//更新云端
      wx.showLoading({
        title: "正在处理"
      })

      const that = this;
      this.repo!.setUmpire(this.data.court?._id, who, user, (errorCode: number) => {
        wx.hideLoading()
        if (errorCode == 0) {
          wx.showToast({
            title: "操作成功"
          })
          if (that.data.court) {
            if (who === "umpire1") {
              that.data.court.stat_umpire1 = user;
              that.data.court.stat_umpire1_done = false;
              if (user.openid == "") {//删除统计员
                that.data.court.cat_allowed_umpire1 = [];
              }
            } else if (who == "umpire2") {
              that.data.court.stat_umpire2 = user;
              that.data.court.stat_umpire2_done = false;
              if (user.openid == "") {//删除统计员
                that.data.court.cat_allowed_umpire2 = [];
              }
            } else if (who == "umpire3") {
              that.data.court.stat2_umpire1 = user;
              that.data.court.stat2_umpire1_done = false;
              if (user.openid == "") {//删除统计员
                that.data.court.cat_allowed2_umpire1 = [];
              }
            } else if (who == "umpire4") {
              that.data.court.stat2_umpire2 = user;
              that.data.court.stat2_umpire2_done = false;
              if (user.openid == "") {//删除统计员
                that.data.court.cat_allowed2_umpire2 = [];
              }
            }
            that.updateUIData();
            that.setData(that.data);
          }
        } else if (errorCode == 1) {
          wx.showToast({
            icon: 'error',
            title: "参数错误"
          })
        } else if (errorCode == 2) {
          wx.showToast({
            icon: 'error',
            title: "未授权"
          })
        } else if (errorCode == 4) {
          wx.showToast({
            icon: 'error',
            title: "不能担任2个"
          })
        } else {
          wx.showToast({
            icon: 'error',
            title: "操作失败"
          })
        }
      })
    }
  }



  onStat = function (this: SettingPage) {
    if (!this.data.court) return;
    wx.navigateTo({
      url: "../stat/stat?_id=" + this.data.court._id
    })
  }

  setOwnerAsChiefUmpire = function (this: SettingPage) {
    if (this.data.isOwner) {
      if (this.data.court) {
        this.data.court.setChiefUmpire(this.data.user);
        this.repo?.updateMatch(this.data.court)
      }
    }
  }

  updateUIData = function (this: SettingPage) {
    if (this.data.court) {
      this.data.isOwner = this.data.court._id ? this.data.globalData.openid == this.data.court._openid : true;

      if (this.data.court.stat_umpire1 && this.data.court.stat_umpire2) {
        this.data.isUmpire1 = this.data.court.stat_umpire1.openid != "" ? (this.data.globalData.openid == this.data.court.stat_umpire1.openid) : false;
        this.data.isUmpire2 = this.data.court.stat_umpire2.openid != "" ? (this.data.globalData.openid == this.data.court.stat_umpire2.openid) : false;
      }

      //stat_umpire3 和 stat_umpire4 是在某次数据表升级中一起增加的
      if (this.data.court.stat2_umpire1 && this.data.court.stat2_umpire2) {
        this.data.isUmpire3 = this.data.court.stat2_umpire1.openid != "" ? (this.data.globalData.openid == this.data.court.stat2_umpire1.openid) : false;
        this.data.isUmpire4 = this.data.court.stat2_umpire2.openid != "" ? (this.data.globalData.openid == this.data.court.stat2_umpire2.openid) : false;
      }
    }
  }

  onClickTab = function (this: SettingPage, e: any)  {
    let tab = e.currentTarget.dataset.tab;
    if (this.data.tab == tab) return;
    this.data.tab = tab;
    this.setData(this.data);
  }

  gotoMyprofile = function (this: SettingPage, e: any) {
    const that = this;
    wx.navigateTo({
      url: "../myprofile/myprofile",
      events: {
        updateAvartarEvent: (result) => {
          console.log("updateAvartar event received: ", result)
          const user: VUser = result;
          if (that.data.court) {
            that.data.court?.updateAvartar(user);
            that.repo?.updateMatch(that.data.court);
            console.log("gotoMyprofile, court:", that.data.court)
          }
        },
        success: function (res) {
        },
        fail: function (res) {
        }
      }
    })
  }

  onShowTips = function(this: SettingPage, e:any) {
    const values = e.detail.value;
    this.data.showTips = values.length > 0;
    wx.setStorageSync("showTips", this.data.showTips)
    this.setData(this.data);
    console.log("this.data.showTips:", this.data.showTips)
  }
}


Page(new SettingPage())