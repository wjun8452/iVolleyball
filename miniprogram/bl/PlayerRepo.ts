export class PlayerRepo {
  private players: string[] = ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"];
  private cacheKey: string = "users";

  constructor() {
    this.loadPlayers();
  }

  loadPlayers() {
    let temp = wx.getStorageSync(this.cacheKey);
    if (temp) {
      this.players = temp;
    } 
    return this.players;
  }

  savePlayers() {
    wx.setStorageSync(this.cacheKey, this.players);
  }

  setPlayers(players: string[]) {
    this.players = players;
  }

  getPlayers() : string[] {
    return this.players;
  }
}