import { BasePage } from "../../bl/BasePage"
import { TeamRepo, VPlayer, VTeam, VUser } from "../../bl/TeamRepo"

class UsersPageData {
  team: VTeam | null = null;
  user: VUser = new VUser();
  canIUseGetUserProfile = false;
  isMyTeam: boolean = true; //当前打开的是否为自己的队伍
  loading: boolean = true;
  canJoin: boolean = false;
  temp: string = "";
}


class UsersPage extends BasePage {
  data: UsersPageData = new UsersPageData();
  optionTeamId: string | null = null;
  teamRepo = new TeamRepo();

  onLoad = function (this: UsersPage, options: any) {
    if (options.teamId) {
      if (options.invite == "true") {
        this.data.canJoin = true;
        this.setData({ canJoin: this.data.canJoin });
      }
      this.optionTeamId = options.teamId;
    }

    const newLocal = wx.getUserProfile;
    if (newLocal) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  }

  onShow = function (this: UsersPage, options: any) {
    wx.showLoading({
      title: "正在加载"
    })

    const that = this;
    getApp().getCurrentUser((user:VUser, success: boolean) => {
      wx.hideLoading();
      if (success) {
        that.data.user = user;
        that.setData({user: user})
        that.loadTeamById(that.optionTeamId);
      } else {
        wx.showToast({ 'title': '用户id错误', 'icon': 'error' })
        wx.hideLoading();
      }
    });
  }

  onUnload = function (this: UsersPage) {
    if (this.teamRepo) {
      this.teamRepo.close();
    }
  }

  updateIsMyTeam = function (this: UsersPage) {
    if (this.data.team) {
      console.log("current user:", this.data.user.openid, ", team owner:", this.data.team.owner.openid)
      this.data.isMyTeam = (this.data.user.openid == this.data.team.owner.openid);
      if (this.data.isMyTeam) {
        this.data.canJoin = true;
      }
      this.setData({ isMyTeam: this.data.isMyTeam, canJoin: this.data.canJoin });
    }
  }

  loadTeamById = function (this: UsersPage, teamId: string) {
    console.log("loadTeamById:", teamId)
    wx.showLoading({
      title: "正在加载"
    })
    const that = this;
    this.teamRepo.loadTeamByID(teamId, (team: VTeam | null) => {
      that.data.loading = false;
      that.setData({ loading: false })
      wx.hideLoading();
      if (team != null) {
        that.data.team = team;
        that.updateIsMyTeam();
        that.setData({ team: team })
      }
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
      const that = this;

      new TeamRepo().joinTeam(this.data.team._id, newPlayer, (errorCode: number) => {
        wx.hideLoading()
        if (errorCode == 0) {
          wx.showToast({
            title: "加入成功！"
          })
          that.data.team?.players.push(newPlayer);
          that.setData({temp: ""});
          that.setData(that.data);
        } else if (errorCode == 1) {
          that.setData({temp: ""});
          wx.showToast({
            icon: 'error',
            title: "不可重复加入!"
          })
        } else {
          that.setData({temp: ""});
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

    const that = this;

    if (this.data.team) {
      this.data.team.players.splice(playerIndex, 1);
      new TeamRepo().updateTeam(this.data.team, (success: boolean) => {
        wx.hideLoading();
        if (success) {
          wx.showToast({
            icon: 'success',
            title: '删除成功!'
          })
          that.setData({ team: that.data.team });
        } else {
          wx.showToast({
            icon: 'error',
            title: '删除失败！'
          })
        }
      });
    }
  }

  onShareAppMessage = function (this: UsersPage) {
    if (this.data.team && this.data.team._id && this.data.isMyTeam) {
      return this.gotoInvitePage(this.data.team);
    } else {
      return {};
    }
  }

  gotoInvitePage = function (this: UsersPage, team: VTeam) {
    let path = '/pages/team/team?teamId=' + team._id + "&invite=true";
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
        console.log("getUserProfile success")
        this.data.user.userInfo = res.userInfo
        getApp().saveUserInfo(this.data.user);
        if (this.data.team && this.data.isMyTeam) {
          this.data.team.owner.userInfo = this.data.user.userInfo;
          const that = this;
          new TeamRepo().updateTeam(this.data.team, (success: boolean) => {
            if (success) {
              that.setData({ team: that.data.team })
            } else {
              wx.showToast({
                icon: 'error',
                title: '操作失败！'
              })
            }
          })
        }
        this.setData(this.data)
      }
    })
  }

  getUserInfo = function (this: UsersPage, e: any) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log("getUserInfo clicked")
    this.data.user.userInfo = e.detail.userInfo;
    this.setData(this.data);
    getApp().saveUserInfo(this.data.user);
  }

  onEditTeamName = function (this: UsersPage, e: any) {
    let teamName = e.detail.value
    teamName = teamName.replace(/^\s*|\s*$/g, "");
    if (teamName.length > 0) {
      wx.showLoading({
        title: "正在加载"
      })

      if (this.data.team) {
        this.data.team.name = teamName;
        const that = this;
        new TeamRepo().updateTeam(this.data.team, (success: boolean) => {
          wx.hideLoading();
          if (success) {
            that.setData({ team: that.data.team });
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
    if (!this.data.user.userInfo) {
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
      const that = this;
      new TeamRepo().joinTeam(this.data.team._id, newPlayer, (errorCode: number) => {
        wx.hideLoading()
        if (errorCode == 0) {
          wx.showToast({
            title: "加入成功！"
          })
          that.data.team?.players.push(newPlayer);
          that.setData({ team: that.data.team });
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

  onPullDownRefresh = function( this:UsersPage, e:any) {
    this.onShow(null);
  }
}

Page(new UsersPage())