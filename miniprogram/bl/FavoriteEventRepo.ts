import { parseTime } from "../utils/Util";
import { UserEvent } from "./EventRepo";
import { FavoriteOpenIdRepo } from "./FavoriteOpenIdRepo";

const CLOUD_ENV: string = 'ilovevolleyball-d1813b'; //,test-705bde

//favorite are saved in local storage only

export class FavoriteEventRepo {

  fetchUserEvents(openIdRepo: FavoriteOpenIdRepo, callback: (success: boolean, userEvents: UserEvent[]) => void) {
    let openids: string[] = openIdRepo.get();

    if (openids.length == 0) {
      callback(true, [])
      return;
    }

    const db = wx.cloud.database({
      env: CLOUD_ENV
    })

    const _ = db.command;

    let where_cmd = _.eq(openids[0])
    for (let i = 1; i < openids.length; i++) {
      where_cmd = where_cmd.or(_.eq(openids[i]))
    }

    db.collection("vevent").where({
      _openid: where_cmd
    }).orderBy('update_time', 'desc').get({
      success: function (res) {
        console.log("db.vevent.get", openids)
        console.log(res)
        let userEvents: UserEvent[] = res.data;

        for (let k = 0; k < userEvents.length; k++) {
          let userEvent = userEvents[k];
          userEvent["isFavorite"] = true;
          for (let i = 0; i < userEvent.events.length; i++) {
            let event = userEvent.events[i];
            let t = event.create_time;
            if (typeof (t) === "object" && t instanceof Date) {
              event.create_time = parseTime(t);
            } else {
              event.create_time = ""
            }
          }
        }
        callback(true, userEvents);
      },
      fail: function (res) {
        console.error("db.vevent.get", openids)
        callback(false, [])
      }
    })

  }


}