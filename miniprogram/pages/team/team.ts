import { BasePage } from "../../bl/BasePage"
import { FavoriteTeamIdRepo } from "../../bl/FavoriteTeamIdRepo";
import { TeamRepo, VPlayer, VTeam, VUser } from "../../bl/TeamRepo"

class UsersPageData {
  team: VTeam | null = null;
  user: VUser = new VUser();
  canIUseGetUserProfile = false;
  isMyTeam: boolean = true; //当前打开的是否为自己的队伍
  loading: boolean = true;
  canJoin: boolean = false;
  isTeamMember: boolean = false; //当前打开的team是不是我加入过了
  temp: string = "";
  isFavorite: boolean = false; //是否添加为收藏
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

  updateUIdata = function (this: UsersPage) {
    if (this.data.team) {
      console.log("current user:", this.data.user.openid, ", team owner:", this.data.team.owner.openid)
      this.data.isMyTeam = (this.data.user.openid == this.data.team.owner.openid);
      if (this.data.isMyTeam) {
        this.data.canJoin = true;
      }

      //判断收藏状态
      this.data.isFavorite = new FavoriteTeamIdRepo().isFavorite(this.data.team._id);

      this.setData({ isMyTeam: this.data.isMyTeam, canJoin: this.data.canJoin, isFavorite: this.data.isFavorite });
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
        that.updateUIdata();
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

  onShareAppMessage = function (this: UsersPage, e:any) {
    console.log(e);
    let type = 1; //share
    if (e.target.dataset.msg == "invite") {
      type = 0; 
    } else {
      type = 1;
    }

    if (this.data.team && this.data.team._id && this.data.isMyTeam) {
      return this.gotoInvitePage(this.data.team, type);
    } else {
      return {};
    }
  }

  gotoInvitePage = function (this: UsersPage, team: VTeam, type:number) {
    let path = '/pages/team/team?teamId=' + team._id;
    if (type == 0) { //invite
      path += "&invite=true";
    } else if (type == 1) { //share
      path += "&share=true";
    }

    let title = "";
    if (type == 0) { //invite
      title += "邀请加入队伍";
    } else if (type == 1) { //share
      path += "分享队伍信息";
    }

    console.log("share path=" + path)
    return {
      title: title,
      path: path,
      fail: function (res: any) {
        wx.showToast({
          title: '分享失败',
        })
      }
    }
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

  onAddFavorite = function(this:UsersPage, e:any) {
    if (this.data.team) {
      new FavoriteTeamIdRepo().add(this.data.team._id);
      this.data.isFavorite = true;
      this.setData({isFavorite: this.data.isFavorite})
    }
  }

  onRemoveFavorite = function(this:UsersPage, e:any) {
    if (this.data.team) {
      new FavoriteTeamIdRepo().remove(this.data.team._id);
      this.data.isFavorite = false;
      this.setData({isFavorite: this.data.isFavorite})
    }
  }
}

Page(new UsersPage())