import { PlaceInfo } from "../bl/PlaceInfo";
import { parseTime } from "../utils/Util";
import { VPlayer } from "./TeamRepo";

export enum StatCat {
  Serve = "发球",
  Reception = "一传",
  ErChuan = "二传",
  Attack = "进攻",
  Block = "拦网",
  Defend = "防守",
  Null = "无类别"
}

export enum StatName {
  NormalWin = "得分",
  NormalLost = "失分",
  ServeNormal = "发球一般", //统计总数时需要
  ServeWin = "发球得分",
  ServeLost = "发球失误",
  ErChuanGood = "二传到位",
  ErChuanBad = "二传不到位",
  ErChuanLost = "二传失误",
  ReceptionBad = "一传不到位",
  ReceptionGood = "一传半到位",
  ReceptionPerfect = "一传到位",
  ReceptionLost = "一传失误",
  AttackNormal = "进攻一般",
  AttackBlk = "进攻拦死",
  AttackWin = "进攻得分",
  AttackLost = "进攻失误",
  BlockWin = "拦网得分",
  BlockPlus = "有效撑起",
  BlockMinus = "拦回",
  BlockHalf = "破坏性拦网",
  BlockLost = "拦网失误",
  DefendLost = "防守失误",
  DefendGood = "有效防起",
  DefendNormal = "防守无攻",
}

/** 技术统计小项 */
export interface PlayItem {
  /** 所属分类 */
  category: StatCat,
  /** 技术统计的名称，如进攻得分 */
  name: StatName,
  /** 本项统计得失分 */
  score: number,
}

export interface StatItem {
  /** 该技术统计针对的队员名称 */
  player: string,
  /** 该技术统计所属分类 */
  category: StatCat,
  /** 该技术统计的名称 */
  item: StatName,
  /** 该技术统计涉及的分数 */
  score: number,
  /** 该统计是否会导致换发球？ */
  swapServe: boolean,
  /** 统计时的比分情况 */
  myscore: number,
  /** 统计时的比分情况 */
  yourscore: number
}

export enum GameStatus {
  OnGoing = 1,
  Ended = 0
}


type PlayerRecord = Record<string, VPlayer>; //队员姓名 --> 头像等信息

export class VolleyCourt {
  /** 我方得分 */
  myScore: number = 0;
  /** 对方得分 */
  yourScore: number = 0;
  /** 所有队员，包括不在场上的 */
  all_players: string[] = ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2", "自由人"];
  /** 用于快速索引的成员id */
  players_id: string[] = [];
  /** 名字关联的成员详细信息 */
  players_map: PlayerRecord = { "接应" : new VPlayer("接应"), "二传" : new VPlayer("二传"), "副攻1": new VPlayer("副攻1"), "主攻1": new VPlayer("主攻1"), "主攻2": new VPlayer("主攻2"), "副攻2": new VPlayer("副攻2"), "自由人": new VPlayer("自由人")};
  /** 是否启用自由人 */
  is_libero_enabled: boolean = false;
  /** 自由人在all_players中的序号 */
  libero: number = -1;
  /** 自由人第一替换对象在all_players中的序号  */
  libero_replacement1: number = -1;
  /** 自由人第二替换对象在all_players中的序号, 两个序号可以一样 */
  libero_replacement2: number = -1;
  /** 是否固定二传  */
  is_setter_enabled: boolean = false;
  /** 二传在all_players中的序号 */
  setter: number = -1;
  /** 场上队员表，表下标是球场的位置，0: 后排最右即1号位(发球位置), 1: 2号位,  表中字符串是队员的名字 */
  players: [string, string, string, string, string, string] = ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"];
  /** 场上6个队员当前可以统计的项目的数组，表下标是球场的位置（含义同players），每个元素表示一个队员，每个队员也有多个可用的统计项 */
  play_items: [PlayItem[], PlayItem[], PlayItem[], PlayItem[], PlayItem[], PlayItem[]] = [[], [], [], [], [], []];
  /** 场上队员可以统计的项目的分类， category for items available for the player */
  play_item_cats: [StatCat[], StatCat[], StatCat[], StatCat[], StatCat[], StatCat[]] = [[], [], [], [], [], []];
  /** 全部的统计项目  */
  cat_all: StatCat[] = [StatCat.Serve, StatCat.Attack, StatCat.Block, StatCat.Defend, StatCat.ErChuan, StatCat.Reception];
  /** 用户设置的，允许被统计的目标球员 */
  player_allowed: string[] = ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"];
  /** 用户设置的，允许被统计项目 */
  cat_allowed: StatCat[] = [StatCat.Serve, StatCat.Attack, StatCat.Block, StatCat.Defend, StatCat.ErChuan, StatCat.Reception];
  /** 场上队员的统计项目历史 */
  stat_items: StatItem[] = [];
  /** 发球球员在players中的index */
  who_serve: number = -1;
  /** true: 我发发球， false: 我方接发球 */
  serve: boolean = false;
  /** true: 1号和2号轮换，3号与6号轮换，4号与5号轮换， false: 正常转位，6->5->4->3->2->1->6 */
  front_back_mode: boolean = true;
  /** 我方队伍名称 */
  myTeam: string = "我方";
  /** 对方队伍名称 */
  yourTeam: string = "对方";
  /** 创建比赛的用户openid */
  _openid: string | null = null; //owner's open id
  /** 比赛在数据库中的存储id */
  _id: string | null = null; //match's id
  /** 1 比赛进行中, 0 比赛结束了 */
  status: GameStatus = GameStatus.OnGoing;
  /** 局分上限 */
  total_score: number = 25; //唐朝 〟咖啡®🏝 建议增加每局的总分设置，现在一局必须要打到25分才可以, 2020-06-04 18:28:58 联系方式: 17717693609
  /** 比赛创建的时间 */
  create_time: string = "";
  /** 比赛发生的城市 */
  city: string = "";
  /** 比赛发生的经纬度和地址等 */
  latlon: any = { latitude: 0, longitude: 0 };
  place: string = "";
  address: string = "";
  
  update_time: string = "";
  /** 比赛双方球队的id */
  myteamId:string = ""; //我方的teamId
  yourteamId:string = ""; //对方的teamId

  constructor(userID: string, placeInfo?: PlaceInfo) {
    this._openid = userID

    if (placeInfo) {
      Object.assign(this, placeInfo);
    }

    this.create_time = parseTime(new Date())
    this.update_time = parseTime(new Date())
    this.updateAvailableItems();
  }

  _createPlayItem(category: StatCat, name: StatName, score: number): PlayItem {
    let item: PlayItem = {
      category: category,
      name: name,
      score: score
    }
    return item;
  }

  _createItems(categories: StatCat[], items: PlayItem[], cat_allowed: StatCat[], category: StatCat, arr2: [StatName, number][]) {
    if (-1 != cat_allowed.indexOf(category)) {
      for (var i in arr2) {
        var name = arr2[i][0]
        var score = arr2[i][1]
        items.push(this._createPlayItem(category, name, score));
      }
      categories.push(category)
    }
  }

  createStatItem(player: string, item_cat: StatCat, item_name: StatName, item_score: number, swap: boolean, myScore:number, yourScore:number): StatItem {
    let obj:StatItem = {
      player: player,
      category: item_cat,
      item: item_name,
      score: item_score,
      swapServe: swap,
      myscore: myScore,
      yourscore: yourScore,
    }
    return obj;
  }

  _swap(p1: number, p2: number, array: [string, string, string, string, string, string]) {
    var obj = array[p1];
    array[p1] = array[p2];
    array[p2] = obj;
  }

  isMatchOver(): boolean {
    let score1: number = this.myScore;
    let score2: number = this.yourScore;
    let totalScore: number = this.total_score;
    return (score1 >= totalScore || score2 >= totalScore) && (score1 - score2 >= 2 || score2 - score1 >= 2);
  }

  //返回球员是否在场上
  private isPlayerOnCourt(name: string, players: string[]): boolean {
    for (var i = 0; i < players.length; i++) {
      if (players[i] == name) {
        return true;
      }
    }
    return false;
  }

  private _checkLibero() {
    var serve = this.serve;
    var who_serve = this.who_serve;

    if (!this.is_libero_enabled) return;
    if (this.libero==-1) return;
    if (this.libero_replacement1==-1 && this.libero_replacement2==-1) return;

    //如果自由人转到前排，则必须被换下
    for (var i = 1; i <= 3; i++) {
      if (this.all_players[this.libero] == this.players[i]) { //自由人在前排了
        if (!this.isPlayerOnCourt(this.all_players[this.libero_replacement1], this.players)) { //第一替换人不在场上
          this.players[i] = this.all_players[this.libero_replacement1]; //上场
        } else if (this.libero_replacement2 != -1 && !this.isPlayerOnCourt(this.all_players[this.libero_replacement2], this.players)) { //第二替换人不在场上
          this.players[i] = this.all_players[this.libero_replacement2]; //上场
        }
        break;
      }
    }

    //自由人上场替换后排
    let done = false;
    if (this.isPlayerOnCourt(this.all_players[this.libero], this.players)) {
      done = true;
    }

    if (!done) {
      for (var i = 4; i <= 6; i++) { //先替换第一对象
        var j = i % 6;
        if (this.all_players[this.libero_replacement1] == this.players[j] &&
          (!(serve && who_serve == j))) { //自由人不发球哦
          this.players[j] = this.all_players[this.libero];
          done = true;
          break;
        }
      }
    }

    if (!done) {
      for (var i = 4; i <= 6; i++) { //再替换第二对象
        var j = i % 6;
        if (this.all_players[this.libero_replacement2] == this.players[j] &&
          (!(serve && who_serve == j))) { //自由人不发球哦
          this.players[j] = this.all_players[this.libero];
          break;
        }
      }
    }
  }

  /** 我方增加1分 */
  addScore() {
    this.myScore = this.myScore + 1;
    console.log("--- add 1 score ----")
  }

  private _rotate() { //only called when we win the score or for adjust court
    var players = this.players;
    var who_serve = this.who_serve;

    //update serves
    if (this.front_back_mode) {
      if (who_serve == -1) {
        this.who_serve = 0;
      }

      if (who_serve == 0) { //二传发球
        this.who_serve = 5; //副攻发球 
      }

      if (who_serve == 5) { //副攻
        this.who_serve = 4;
      }

      if (who_serve == 4) { //主攻
        this.who_serve = 0;
      }
    } else {
      //始终是1号位发球，无需更改
      this.who_serve = 0;
    }

    //update players
    who_serve = this.who_serve;
    if (this.front_back_mode) {
      if (who_serve == 0) {
        this._swap(0, 1, players);
      }

      if (who_serve == 5) {
        this._swap(5, 2, players);
      }

      if (who_serve == 4) {
        this._swap(4, 3, players);
      }
    } else {
      var player = players[5];
      players[5] = players[0];
      players[0] = players[1];
      players[1] = players[2];
      players[2] = players[3];
      players[3] = players[4];
      players[4] = player;
    }
  }

  public updateStatSettings(catsAllowed?: StatCat[], playersAllowed?: string[]) {
    if (catsAllowed) {
      this.cat_allowed = catsAllowed;
    }

    if (playersAllowed) {
      this.player_allowed = playersAllowed;
    }

    this.updateAvailableItems();
  }

  private updateAvailableItems() {
    let who_serve = this.who_serve;
    let items = this.play_items;
    let serve = this.serve;
    let cats = this.play_item_cats;
    let players = this.players
    let libero = this.players.indexOf(this.all_players[this.libero]);
    let cat_allowed =  this.cat_allowed;
    let player_allowed = this.player_allowed;

    let i: number = 0;
    for (i = 0; i < items.length; i++) {
      //console.log(libero, i);

      items[i] = [];
      var item = items[i];

      cats[i] = [];
      var cat = cats[i];

      if (player_allowed != null && player_allowed != undefined && -1 == player_allowed.indexOf(players[i])) {
        continue; //该队员不做统计
      }

      //添加顺序影响UI显示
      if (serve && i == who_serve) {
        this._createItems(cat, item, cat_allowed, StatCat.Serve, [
          [StatName.ServeWin, 1],
          [StatName.ServeNormal, 0],
          [StatName.ServeLost, -1]
        ]);
      }

      if (!serve) {
        this._createItems(cat, item, cat_allowed, StatCat.Reception, [
          [StatName.ReceptionPerfect, 0],
          [StatName.ReceptionGood, 0],
          [StatName.ReceptionBad, 0],
          [StatName.ReceptionLost, -1]
        ])
      }

      if (!this.is_setter_enabled || (this.is_setter_enabled && this.all_players[this.setter] == players[i])) {
        this._createItems(cat, item, cat_allowed, StatCat.ErChuan, [
          [StatName.ErChuanGood, 0],
          [StatName.ErChuanBad, 0],
          [StatName.ErChuanLost, -1]
        ])
      }

      if (i != libero) {
        this._createItems(cat, item, cat_allowed, StatCat.Attack, [
          [StatName.AttackWin, 1],
          [StatName.AttackNormal, 0],
          [StatName.AttackBlk, -1],
          [StatName.AttackLost, -1]
        ])
      }

      if (i >= 1 && i <= 3) {
        this._createItems(cat, item, cat_allowed, StatCat.Block, [
          [StatName.BlockWin, 1],
          [StatName.BlockPlus, 0],
          [StatName.BlockMinus, 0],
          [StatName.BlockHalf, -1],
          [StatName.BlockLost, -1]
        ])
      }

      this._createItems(cat, item, cat_allowed, StatCat.Defend, [
        [StatName.DefendGood, 0],
        [StatName.DefendNormal, 0],
        [StatName.DefendLost, -1]
      ])
    }
  }

  addScoreRotate() {
    var serve = this.serve
    this.myScore = 1 + this.myScore;
    this.stat_items.push(this.createStatItem("", StatCat.Null, StatName.NormalWin, 1, !serve, this.myScore, this.yourScore));

    if (!serve) {
      this.serve = true;
      this._rotate();
      this._checkLibero();
      this.updateAvailableItems();
    }
  }

  looseScoreRotate() {
    var serve = this.serve;
    this.yourScore = 1 + this.yourScore;
    this.stat_items.push(this.createStatItem("", StatCat.Null, StatName.NormalLost, -1, serve, this.myScore, this.yourScore));
    if (serve) {
      this.serve = false;
      this._checkLibero();
      this.updateAvailableItems();
    }
  }

  stateRotate(position: number, i: number) {
    var player = this.players[position];
    var item = this.play_items[position][i];
    var serve = this.serve;

    var swap = false;

    if (item.score == 1 && !serve) {
      swap = true;
    }

    if (item.score == -1 && serve) {
      swap = true;
    }

    if (item.score == 1) {
      this.myScore = this.myScore + 1;
    }

    if (item.score == -1) {
      this.yourScore = this.yourScore + 1;
    }

    //createStatItem and _createPlayItem需要统一。。。
    this.stat_items.push(this.createStatItem(player, item.category, item.name, item.score, swap, this.myScore, this.yourScore));

    if (item.score == 1) {
      //next position
      if (!serve) {
        this.serve = true;
        this._rotate();
        this._checkLibero();
        this.updateAvailableItems();
      }

    } else if (item.score == -1) {
      if (serve) {
        this.serve = false;
        this._checkLibero();
        this.updateAvailableItems();
      }
    }
  }

  private _prevPosition(stat: StatItem) { //called when pop stat
    var players = this.players;
    var who_serve = this.who_serve;

    //现在谁发球，说明刚刚从前排换到后排
    if (stat.swapServe && stat.score > 0) {
      if (this.front_back_mode) {
        if (who_serve == 0) {
          this._swap(0, 1, players);
        }

        if (who_serve == 5) {
          this._swap(5, 2, players);
        }

        if (who_serve == 4) {
          this._swap(4, 3, players);
        }
      } else {
        var player = players[5];
        players[5] = players[4];
        players[4] = players[3];
        players[3] = players[2];
        players[2] = players[1];
        players[1] = players[0];
        players[0] = player;
      }
    }

    if (stat.swapServe && stat.score > 0) { //刚刚得分获得发球权
      this.serve = false;

      if (this.front_back_mode) {
        if (who_serve == 0) { //二传发球
          this.who_serve = 4; //主攻发球
        }

        if (who_serve == 5) { //副攻
          this.who_serve = 0;
        }

        if (who_serve == 4) { //主攻
          this.who_serve = 5 //副攻
        }
      }
    }

    if (stat.swapServe && stat.score < 0) { //刚刚失分失去发球权
      this.serve = true;
    }
  }

  popStatItem() {
    var stat = this.stat_items.pop();
    if (!stat) return;

    if (stat.score > 0) {
      this.myScore = this.myScore - stat?.score;
    } else if (stat.score < 0) {
      this.yourScore = this.yourScore + stat.score;
    }
    this._prevPosition(stat);
    this.updateAvailableItems();
  }

  //mine: true: revert my score, false: revert your score
  revertScore(mine: boolean) {
    for (var i = this.stat_items.length - 1; i >= 0; i--) {
      if (mine && this.stat_items[i].score > 0) {
        this.stat_items.splice(i, 1)
        this.myScore = this.myScore - 1
        break
      }

      if (!mine && this.stat_items[i].score < 0) {
        this.stat_items.splice(i, 1)
        this.yourScore = this.yourScore - 1;
        break
      }
    }
  }

  getTopItem(): StatItem | null {
    if (this.stat_items.length > 0) {
      return this.stat_items[this.stat_items.length - 1]
    } else {
      return null
    }
  }


  rotate() {
    this._rotate();
    this._checkLibero();
  }

  resetScore() {
    this.myScore = 0;
    this.yourScore = 0;
    this.stat_items = [];
  }
}