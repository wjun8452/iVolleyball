// pages/stat_setting/stat_setting.js

import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { TeamRepo, VTeam, VUser } from "../../bl/TeamRepo";
import { StatCat, VolleyCourt } from "../../bl/VolleyCourt";
import { Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

let globalData: GlobalData = getApp().globalData

class SettingPageData {
  _id: string | null = null;
  total_scores: number[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  edit_pos: number = -1;
  court: VolleyCourt | null = null;
  globalData: GlobalData = globalData;
  myteams: VTeam[] = [];
  pikerTeamIndex: number = -1;

  /** 被邀请统计 */
  inviteAsUmpire1: boolean = false;
  inviteAsUmpire2: boolean = false;

  /** 当前用户是否是比赛的创建者 */
  isOwner: boolean = true;

  /** 用户信息 */
  user: VUser = new VUser();
  hasUserInfo = false;
  canIUseGetUserProfile = false;

  /** 分享了哪一个统计员 */
  temp_which_umpire: string = "";

  /** 当前用户是否是统计裁判, 一个用户不能同时担任两个统计员 */
  isUmpire1: boolean = false;
  isUmpire2: boolean = false;
}

class SettingPage extends BasePage {
  data: SettingPageData = new SettingPageData();
  repo: VolleyRepository | null = null;


  onDataChanged = function (this: SettingPage, court: VolleyCourt, reason: Reason, status: Status) {
    console.log("[Setting] onCourtChange Begins, reason:", reason, "status:", status, "court id:", court._id, "court:", court)

    this.data.court = court;

    this.data.isOwner = this.data.court._id ? this.data.globalData.openid == this.data.court._openid : true;

    if (this.data.court.stat_umpire1 && this.data.court.stat_umpire2) {
      this.data.isUmpire1 = this.data.court.stat_umpire1.openid != "" ? (this.data.globalData.openid == this.data.court.stat_umpire1.openid) : false;
      this.data.isUmpire2 = this.data.court.stat_umpire2.openid != "" ? (this.data.globalData.openid == this.data.court.stat_umpire2.openid) : false;
    }

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
        this.setData({ inviteAsUmpire1: this.data.inviteAsUmpire1 });
      }

      if (options.inviteAsUmpire2 == "true") {
        this.data.inviteAsUmpire2 = true;
        this.setData({ inviteAsUmpire2: this.data.inviteAsUmpire2 });
      }
    }

    const newLocal = wx.getUserProfile;
    if (newLocal) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }

    console.log(options)

    this.loadUserInfo();
  }

  onShow = function (this: SettingPage) {
    wx.showLoading({
      title: '加载中',
    })

    getApp().getOpenId((openid: string, success: boolean) => {
      this.data.globalData = getApp().globalData;
      this.data.user.openid = openid;
      this.repo = new VolleyRepository(this.onDataChanged, openid, this.data._id, getApp().globalData.placeInfo);
    })

    console.log("[onShow] data:", this.data)
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

  onFrontBackMode = function (this: SettingPage, e: any) {
    let mode = e.detail.value; //0: front_back, 1: normal
    if (mode == "0") {
      this.data.court!.front_back_mode = true;
    } else {
      this.data.court!.front_back_mode = false;
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
      if (this.data.court!.who_serve == -1) {
        this.data.court!.who_serve = 0; //默认1号位发球
      }
    } else {
      this.data.court!.serve = false;
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

  rotate = function (this: SettingPage) {
    this.data.court!.rotate();
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

  bindSetterChange = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.setter = e.detail.value;
    this.updateMatch();
  }


  bindLiberoChange = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.libero = e.detail.value;
    this.updateMatch();
  }

  liberoEnabled = function (this: SettingPage, e: any) {
    let values = e.detail.value;
    this.data.court!.is_libero_enabled = values.length > 0;
    this.updateMatch();
  }

  bindLiberoReplacement1 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    this.data.court!.libero_replacement1 = e.detail.value;
    this.updateMatch();
  }

  bindLiberoReplacement2 = function (this: SettingPage, e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.data.court!.libero_replacement2 = e.detail.value;
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

    getApp().getOpenId((openid: string, success: boolean) => {
      let that = this
      let teamRepo = new TeamRepo();
      teamRepo.fetchByOwner(openid, (errorCode: number, teams: VTeam[] | null) => {
        wx.hideLoading();
        if (errorCode == 2) {
          if (showError) {
            wx.showToast({
              icon: "error",
              title: "加载失败！"
            })
          }
        } else if (errorCode == 1) {
          wx.showModal({
            title: "没有球队",
            content: "现在创建一个球队?",
            success(res) {
              if (res.confirm) {
                wx.navigateTo({
                  url: "../team/team"
                })
              } else if (res.cancel) {
              }
            }
          })
        } else if (teams != null) {
          console.log("load teams:", teams)
          that.data.myteams = teams;
          that.setData({ myteams: teams })
        } else {
          if (showError) {
            wx.showToast({
              icon: "error",
              title: "加载失败！"
            })
          }
        }
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

  setMyselfUmpire1 = function (this: SettingPage, e: any) {
    this._setMyselfUmpire("umpire1", this.data.user);
  }

  setMyselfUmpire2 = function (this: SettingPage, e: any) {
    this._setMyselfUmpire("umpire2", this.data.user);
  }

  _setMyselfUmpire = function (this: SettingPage, who: string, user: VUser) {
    if (!this.data.court) return;

    if (!this.data.court?._id) {
      if (who === "umpire1") {
        if (user.openid != "" && this.data.court.stat_umpire2.openid == user.openid) {
          wx.showToast({
            icon: 'error',
            title: "不能担任2个"
          })
          return;
        } else {
          this.data.court.stat_umpire1 = user;
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
        }

      }
      this.repo?.updateMatch(this.data.court)
    } else {
      console.log("------haha------3")
      if (!this.data.globalData?.openid) {
        wx.showToast({
          icon: 'error',
          title: '请先登录！'
        })
        return;
      }

      wx.showLoading({
        title: "正在处理"
      })

      this.repo!.setUmpire(this.data.court?._id, who, user, (errorCode: number) => {
        wx.hideLoading()
        if (errorCode == 0) {
          wx.showToast({
            title: "操作成功"
          })
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

  getUserProfile = function (this: SettingPage, e: any) {
    console.log("getUserProfile", e);
    let umpire = e.target.dataset.umpire;
    const that = this;

    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用于完善统计员信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log("getUserProfile success")
        that.data.user.userInfo = res.userInfo
        that.data.hasUserInfo = true;
        getApp().globalData.user.userInfo = that.data.user.userInfo;
        if (that.data.isOwner) {
          if (that.data.court) {
            that.data.court.setChiefUmpire(that.data.user);
            that.repo?.updateMatch(that.data.court)
          }
        }

        //更新头像
        if (that.data.isUmpire1) {
          that.setMyselfUmpire1(that);
        }
        if (that.data.isUmpire2) {
          that.setMyselfUmpire2(that);
        }

        //可能被设置成另一个umpire
        if (umpire == "1" && !that.data.isUmpire1) {
          that.setMyselfUmpire1(that);
        } else if (umpire == "2" && !that.data.isUmpire2) {
          that.setMyselfUmpire2(that);
        }

        that.setData(that.data)
        that.saveUserInfo();
      }
    })
  }

  getUserInfo = function (this: SettingPage, e: any) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    wx.showToast({
      title:"getUserInfo"
    })

    console.log("getUserInfo", e);
    let umpire = e.target.dataset.umpire;
    this.data.user.userInfo = e.detail.userInfo;
    this.data.hasUserInfo = true;
    getApp().globalData.user.userInfo = this.data.user.userInfo;

    if (this.data.isOwner) {
      if (this.data.court) {
        this.data.court.setChiefUmpire(this.data.user);
        this.repo?.updateMatch(this.data.court)
      }
    }

    if (this.data.isUmpire1) {
      this.setMyselfUmpire1(this);
    }

    if (this.data.isUmpire2) {
      this.setMyselfUmpire2(this);
    }

    if (umpire == "1" || !this.data.isUmpire1) {
      this.setMyselfUmpire1(this);
    } else if (umpire == "2" || !this.data.isUmpire2) {
      this.setMyselfUmpire2(this);
    }

    this.setData(this.data);
    this.saveUserInfo();
  }

  saveUserInfo = function (this: SettingPage) {
    wx.setStorageSync("user", this.data.user)
  }

  loadUserInfo = function (this: SettingPage) {
    let tmp = wx.getStorageSync("user")
    if (tmp) {
      this.data.user = tmp
      if (this.data.user.userInfo) {
        this.data.hasUserInfo = true
        if (this.data.court) {
          this.data.court.setChiefUmpire(this.data.user);
          this.repo?.updateMatch(this.data.court)
        }
      }
      this.setData({ user: tmp, hasUserInfo: this.data.hasUserInfo })
    }
  }
}


Page(new SettingPage())