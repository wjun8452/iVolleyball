import { BasePage } from "../../bl/BasePage"
import { PlayerRepo } from "../../bl/PlayerRepo"

class UsersPageData {
  all_players: string[] = [];
  temp_player_name: string = "";
}


class UsersPage extends BasePage {
  data: UsersPageData = new UsersPageData();
  playerRepo: PlayerRepo = new PlayerRepo();

  onLoad = function (this: UsersPage, options: any) {
    wx.setNavigationBarTitle({
      title: '球队成员',
    })

    this.playerRepo.loadPlayers();
    this.data.all_players = this.playerRepo.getPlayers();
    this.setData(this.data);
  }


  onUnload = function (this: UsersPage,) {
    this.playerRepo.savePlayers();
  }

  onAddPlayer = function (this: UsersPage, e: any) {
    var player = e.detail.value.player;
    player = player.replace(/^\s*|\s*$/g, "");
    if (player.length > 4) {
      wx.showToast({
        title: '名称不能超过4个字符或汉字!',
        icon: 'none'
      })
    }
    else if (player.length > 0) {
      this.data.all_players.unshift(player);
      this.data.temp_player_name = ""
      this.playerRepo.setPlayers(this.data.all_players);
      this.setData(this.data)
    }
  }


  onDeletePlayer = function (this: UsersPage, e: any) {
    var player_index = e.target.dataset.player_index;
    this.data.all_players.splice(player_index, 1);
    this.playerRepo.setPlayers(this.data.all_players);
    this.setData(this.data)
  }
}


Page(new UsersPage())