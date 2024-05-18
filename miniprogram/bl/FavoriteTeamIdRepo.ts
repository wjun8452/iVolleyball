export class FavoriteTeamIdRepo {
  teamid_set: Set<string> = new Set<string> ();
  key: string = "favorite_teamid";

  constructor() {
    this._load()
  }

  _load() {
    let saved:string[] = wx.getStorageSync(this.key);
    if (saved) {
      for (let i = 0; i<saved.length; i++) {
          this.teamid_set.add(saved[i])
      }
    } else {

    }
  }

  isFavorite(teamid: string) : boolean {
    return this.teamid_set.has(teamid);
  }

  private _save() {
    let myArr = Array.from(this.teamid_set);
    wx.setStorageSync(this.key, myArr);
  }

  add(teamid: string) {
    this.teamid_set.add(teamid)
    this._save();
  }

  remove(teamid: string) {
    this.teamid_set.delete(teamid);
    this._save();
  }

  get(): string[] {
    let  myArr = Array.from(this.teamid_set);
    return myArr;
  }
}