// pages/stat_setting/stat_setting.js

import { BasePage } from "../../bl/BasePage";
import { GlobalData } from "../../bl/GlobalData";
import { PlayerRepo } from "../../bl/PlayerRepo";
import { VolleyCourt } from "../../bl/VolleyCourt";
import { FriendsCourtRepo, Reason, Status, VolleyRepository } from "../../bl/VolleyRepository";

class SettingPageData {
  _id: string | null = null;
  total_scores: number[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  edit_pos: number = -1;
  court: VolleyCourt | null = null;
  globalData: GlobalData | null = null;
}

class SettingPage extends BasePage {
  data: SettingPageData = new SettingPageData();
  repo: VolleyRepository | null = null;

  onDataChanged = function (this: SettingPage, court: VolleyCourt, reason: Reason, status: Status) {
    console.log("[Setting] onCourtChange Begins, reason:", reason, "status:", status, "court id:", court._id, "court:", court)
    this.data.court = court;
    this.setData(this.data);
    wx.hideLoading();
  }

  onLoad = function (this: SettingPage, options: any) {
    wx.setNavigationBarTitle({
      title: '场上设置'
    })

    if (options._id) { //from url
      this.data._id = options._id
    }

    wx.showLoading({
      title: '加载中',
    })

    this.repo = new VolleyRepository(this.onDataChanged, getApp().globalData.openid, options._id, getApp().globalData.placeInfo);

    console.log("[onLoad] data:", this.data)
  }


  onUnload = function (this: SettingPage) {
    if (this.repo) {
      this.repo.close();
    }
  }

  onReset = function (this: SettingPage) {
    this.data.court!.myScore = 0;
    this.data.court!.yourScore = 0;
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
    let player = e.target.dataset.player;
    let pos = e.target.dataset.position;
    let newPlayer:boolean = true;

    //如果是交换位置，譬如选择了一位已经在场上的队员
    for (let i in players) {
      if (players[i] == player) { //选择的是场上的另一位队员
        players[i] = this.data.court!.players[pos]; //另一位队员就换成目标位置原来所在的人
        newPlayer = false; //只是交换而已，不是添加新队员
      }
    }
    
    //如果添加了新人到场上，默认是允许统计
    if (newPlayer && this.data.court?.player_allowed.indexOf(player) == -1) {
      this.data.court.player_allowed.push(player)
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

  onTapMode = function (this: SettingPage, e: any) {
    let mode = e.detail.value; //0: front_back, 1: normal
    if (mode == "0") {
      this.data.court!.front_back_mode = true;
    } else {
      this.data.court!.front_back_mode = false;
    }

    this.updateMatch();
  }

  onTapServe = function (this: SettingPage, e: any) {
    let serve = e.detail.value; //0: 我方发球, 1: 对方发球
    if (serve == 0) {
      this.data.court!.serve = true;
      if (this.data.court!.who_serve == -1) {
        this.data.court!.who_serve = 0;
      }
    } else {
      this.data.court!.serve = false;
      //this.data.who_serve = -1; //must not change who_serve, 记录上次我方是谁在发球，如果复位，则会丢失状态
    }

    this.updateMatch();
  }

  onClickPlayer = function (this: SettingPage, e: any) {
    let position = e.target.dataset.position;
    if (position == this.data.edit_pos) {
      this.data.edit_pos = -1
    } else {
      this.data.edit_pos = position;
    }

    this.setData(this.data);
  }

  onAddPlayer = function (this: SettingPage, e: any) {
    let position = e.target.dataset.position;
    let player = e.detail.value;
    if (player != null) {
      player = player.replace(/^\s*|\s*$/g, "");
      if (player.length > 4) {
        wx.showToast({
          title: '名称不能超过4个字符或汉字!',
          icon: 'none'
        })
      } else if (player.length == 0) {
        wx.showToast({
          title: '名称不能为空',
          icon: 'none'
        })
      } else if (this.data.court!.all_players.indexOf(player) == -1) {
        this.data.court!.all_players.push(player);
        this.data.court!.players[position] = player;
        this.data.court!.player_allowed.push(player);
        this.data.edit_pos = -1
        this.updateMatch();

        let playerRepo = new PlayerRepo();
        playerRepo.setPlayers(this.data.court!.all_players);
        playerRepo.savePlayers();
      } else {
        wx.showToast({
          title: '球员已存在',
        })
      }
    }
  }

  onDeletePlayer = function (this: SettingPage, e: any) {
    let position = e.target.dataset.position;
    let player = this.data.court!.players[position];

    this.data.edit_pos = -1

    if (player != "??") {
      this.data.court!.players[position] = "??"
    }

    let index_all = this.data.court!.all_players.indexOf(player)
    if (index_all != -1) {
      this.data.court!.all_players.splice(index_all, 1);
      wx.showToast({
        title: '成功删除',
      })
    }

    this.updateMatch();
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

  onCheckAllowedStatItem = function (this: SettingPage, e: any) {
    let cat_allowed = e.detail.value;
    this.data.court!.updateStatSettings(cat_allowed);
    this.updateMatch();
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
    if (name.length > 4) {
      wx.showToast({
        title: '名称不能超过4个字符或汉字!',
        icon: 'none'
      })
    } else if (name.length > 0) {
      if (dataset.obj === "myTeam") {
        this.data.court!.myTeam = name;
      } else {
        this.data.court!.yourTeam = name;
      }
      this.updateMatch();
    } else {
      wx.showToast({
        title: '名称不能为空！',
        icon: 'none'
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
}


Page(new SettingPage())