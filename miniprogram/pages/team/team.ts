import { BasePage } from "../../bl/BasePage"
import { TeamRepo, VPlayer, VTeam, VUser } from "../../bl/TeamRepo"

class UsersPageData {
  team: VTeam | null = null;
  user: VUser = new VUser();
  hasUserInfo = false;
  canIUseGetUserProfile = false;
  isMyTeam: boolean = true; //当前打开的是否为自己的队伍
  loading: boolean = true;
}


class UsersPage extends BasePage {
  data: UsersPageData = new UsersPageData();
  invitedTeamId: string | null = null;

  onLoad = function (this: UsersPage, options: any) {
    wx.setNavigationBarTitle({
      title: '球队成员',
    })

    this.loadUserInfo();

    if (options.action === "invite" && options.teamId) {
      this.invitedTeamId = options.teamId;
      this.loadTeamById(options.teamId)
    } else {
      this.loadTeamByOwner();
    }

    const newLocal = wx.getUserProfile;
    if (newLocal) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  }

  updateIsMyTeam = function (this: UsersPage) {
    if (this.data.team) {
      this.data.isMyTeam = (this.data.user.openid == this.data.team.owner.openid);
      this.setData({ isMyTeam: this.data.isMyTeam });
    }
  }

  loadTeamById = function (this: UsersPage, teamId: string) {
    wx.showLoading({
      title: "正在加载"
    })
    new TeamRepo().loadTeamByID(teamId, (team: VTeam | null) => {
      this.data.loading = false;
      this.setData({ loading: false })
      wx.hideLoading();
      if (team != null) {
        this.data.team = team;
        this.updateIsMyTeam();
        this.setData({ team: team })
      }
    })
  }

  loadTeamByOwner = function (this: UsersPage) {
    wx.showLoading({
      title: "正在加载"
    })

    getApp().getOpenId((openid: string) => {
      this.data.user.openid = openid;
      new TeamRepo().fetchByOwner(openid, (errorCode: number, team: VTeam | null) => {
        this.data.loading = false;
        this.setData({ loading: false })

        if (team != null) {
          this.data.team = team;
          this.updateIsMyTeam();
          this.setData({ team: this.data.team })
        }
        wx.hideLoading();

      });
    })
  }


  onAddPlayer = function (this: UsersPage, e: any) {
    if (!this.data.team) return;

    let player = e.detail.value.player;
    player = player.replace(/^\s*|\s*$/g, "");
    if (player.length > 0) {
      wx.showLoading({
        title: "正在加载"
      })

      let newPlayer = new VPlayer(player);

      new TeamRepo().joinTeam(this.data.team._id, newPlayer, (errorCode: number) => {
        wx.hideLoading()
        if (errorCode == 0) {
          if (this.data.team) {
            this.data.team.players.push(newPlayer);
            this.setData({ team: this.data.team })
          }
          wx.showToast({
            title: "加入成功！"
          })
        } else if (errorCode == 1) {
          wx.showToast({
            icon: 'error',
            title: "不可重复加入!"
          })
        } else {
          wx.showToast({
            icon: 'error',
            title: "加入失败！"
          })
        }
      })
    } else {
      wx.showToast({
        icon: "error",
        title: "不能为空！"
      })
    }
  }


  onDeletePlayer = function (this: UsersPage, e: any) {
    let playerIndex = e.target.dataset.player_index;
    wx.showLoading({
      title: "正在加载"
    })

    if (this.data.team) {
      this.data.team.players.splice(playerIndex, 1);
      new TeamRepo().updateTeam(this.data.team, (success: boolean) => {
        wx.hideLoading();
        if (success) {
          this.setData({ team: this.data.team });
        } else {
          wx.showToast({
            icon: 'error',
            title: '失败！'
          })
        }
      });
    }
  }

  onShareAppMessage = function (this: UsersPage) {
    if (this.data.team && this.data.team._id) {
      return this.gotoInvitePage(this.data.team);
    } else {
      return {};
    }
  }

  gotoInvitePage = function (this: UsersPage, team: VTeam) {
    let path = '/pages/team/team?teamId=' + team._id + "&action=invite";
    console.log("share path=" + path)
    return {
      title: '好友邀请你加入队伍',
      path: path,
      fail: function (res: any) {
        wx.showToast({
          title: '邀请失败',
        })
      }
    }
  }

  getUserProfile = function (this: UsersPage, e: any) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用于完善球队的信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.data.user.userInfo = res.userInfo
        this.data.hasUserInfo = true;
        this.setData(this.data)
        this.saveUserInfo();
      }
    })
  }

  getUserInfo = function (this: UsersPage, e: any) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    this.data.user.userInfo = e.detail.userInfo
    this.data.user.userInfo = e.detail.userInfo,
      this.data.hasUserInfo = true
    this.setData(this.data)
    this.saveUserInfo();
  }

  saveUserInfo = function (this: UsersPage) {
    wx.setStorageSync("user", this.data.user)
  }

  loadUserInfo = function (this: UsersPage) {
    let tmp = wx.getStorageSync("user")
    if (tmp) {
      this.data.user = tmp
      if (this.data.user.userInfo) {
        this.data.hasUserInfo = true
      }
      this.setData({ user: tmp, hasUserInfo: this.data.hasUserInfo })
    }
  }

  onPullDownRefresh = function (this: UsersPage) {
    if (this.invitedTeamId) {
      this.loadTeamById(this.invitedTeamId)
    } else {
      this.loadTeamByOwner();
    }
  }

  onEditTeamName = function (this: UsersPage, e: any) {
    let teamName = e.detail.value
    teamName = teamName.replace(/^\s*|\s*$/g, "");
    if (teamName.length > 0) {
      wx.showLoading({
        title: "正在加载"
      })

      if(this.data.team) {
        this.data.team.name = teamName;
        new TeamRepo().updateTeam(this.data.team, (success: boolean) => {
          wx.hideLoading();
          if (success) {
            this.setData({ team: this.data.team });
          } else {
            wx.showToast({
              icon: 'error',
              title: '失败！'
            })
          }
        });
      }
    } else {
      wx.showToast({
        icon: "error",
        title: "不能为空！"
      })
    }
  }

  onAddMySelf = function (this: UsersPage, e: any) {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        icon: 'error',
        title: '请先登录！'
      })
      return;
    }

    wx.showLoading({
      title: "正在加入"
    })

    let newPlayer = new VPlayer(this.data.user.userInfo.nickName);
    newPlayer.user = this.data.user;

    if (this.data.team) {
      new TeamRepo().joinTeam(this.data.team._id, newPlayer, (errorCode: number) => {
        wx.hideLoading()
        if (errorCode == 0) {
          this.data.team!.players.push(newPlayer);
          this.setData({ team: this.data.team })
          wx.showToast({
            title: "加入成功！"
          })
        } else if (errorCode == 1) {
          wx.showToast({
            icon: 'error',
            title: "不可重复加入!"
          })
        } else {
          wx.showToast({
            icon: 'error',
            title: "加入失败！"
          })
        }
      })
    }
  }

  onCreateTeam = function (this: UsersPage, e: any) {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        icon: 'error',
        title: '请先登录！'
      })
      return;
    }

    wx.showLoading({
      title: "正在创建"
    })

    let team = new VTeam();
    team.owner = this.data.user;
    new TeamRepo().createTeam(team, (team: VTeam | null) => {
      wx.hideLoading();
      if (team) {
        this.data.team = team;
        this.updateIsMyTeam();
        this.setData({ team: this.data.team })
      } else {
        wx.showToast({
          icon: 'error',
          title: "创建失败！"
        });
      }
    })
  }
}


Page(new UsersPage())