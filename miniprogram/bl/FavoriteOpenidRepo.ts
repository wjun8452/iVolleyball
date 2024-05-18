
export class FavoriteOpenIdRepo {
  openid_set: Set<string> = new Set<string> ();
  key: string = "favorite_openid";

  constructor() {
  }

  load() {
    let saved:string[] = wx.getStorageSync(this.key);
    if (saved) {
      for (let i = 0; i<saved.length; i++) {
          this.openid_set.add(saved[i])
      }
    } else {

    }
  }

  isFavorite(openid: string) : boolean {
    return this.openid_set.has(openid);
  }

  private _save() {
    let myArr = Array.from(this.openid_set);
    wx.setStorageSync(this.key, myArr);
  }

  add(openid: string) {
    this.openid_set.add(openid)
    this._save();
  }

  remove(openid: string) {
    this.openid_set.delete(openid);
    this._save();
  }

  get(): string[] {
    let  myArr = Array.from(this.openid_set);
    return myArr;
  }
}