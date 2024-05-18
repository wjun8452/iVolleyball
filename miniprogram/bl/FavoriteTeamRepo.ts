import { FavoriteTeamIdRepo } from "./FavoriteTeamIdRepo";
import { VTeam } from "./TeamRepo";

const CLOUD_ENV: string = 'ilovevolleyball-d1813b'; //,test-705bde

//favorite are saved in local storage only
export class FavoriteTeamRepo {

  fetchFavoriteTeams(teamIdRepo: FavoriteTeamIdRepo, callback: (success: boolean, teams: VTeam[]) => void) {
    let teamIds: string[] = teamIdRepo.get();

    if (teamIds.length == 0) {
      console.log("no favorite team ids")
      callback(true, [])
      return;
    }

    const db = wx.cloud.database({
      env: CLOUD_ENV
    })

    const _ = db.command;

    let where_cmd = _.eq(teamIds[0])
    for (let i = 1; i < teamIds.length; i++) {
      where_cmd = where_cmd.or(_.eq(teamIds[i]))
    }

    db.collection("vteam").where({
      _id: where_cmd
    }).orderBy('update_time', 'desc').get({
      success: function (res) {
        console.log("db.vteam.get", teamIds)
        console.log(res)
        let teams: VTeam[] = res.data;
        console.log("fetch favorite team, size=", teams.length)
        callback(true, teams);
      },
      fail: function (res) {
        console.error("db.vteam.get", teamIds)
        callback(false, [])
      }
    })

  }


}