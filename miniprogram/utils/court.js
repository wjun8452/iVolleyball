var StatCat = {
  Serve: "发球",
  Reception: "一传",
  ErChuan: "二传",
  Attack: "进攻",
  Block: "拦网",
  Defend: "防守"
}

//这是一个map
var StatName = {
  ServeNormal: "发球一般", //统计总数时需要
  ServeWin: "发球得分",
  ServeLost: "发球失误",
  ErChuanGood: "二传到位",
  ErChuanBad: "二传不到位",
  ErChuanLost: "二传失误",
  ReceptionBad: "一传不到位",
  ReceptionGood: "一传半到位",
  ReceptionPerfect: "一传到位",
  ReceptionLost: "一传失误",
  AttackNormal: "进攻一般",
  AttackBlk: "进攻拦死",
  AttackWin: "进攻得分",
  AttackLost: "进攻失误",
  BlockWin: "拦网得分",
  BlockPlus: "有效撑起",
  BlockMinus: "拦回",
  BlockHalf: "破坏性拦网",
  BlockLost: "拦网失误",
  DefendLost: "防守失误",
  DefendGood: "有效防起",
  DefendNormal: "防守无攻",
};

var all_items = [{
    cat: StatCat.Serve,
    stats: [StatName.ServeNormal, StatName.ServeWin, StatName.ServeLost]
  },
  {
    cat: StatCat.ErChuan,
    stats: [StatName.ErChuanGood, StatName.ErChuanBad, StatName.ErChuanLost]
  },
  {
    cat: StatCat.Reception,
    stats: [StatName.ReceptionBad, StatName.ReceptionGood, StatName.ReceptionPerfect, StatName.ReceptionLost]
  },
  {
    cat: StatCat.Attack,
    stats: [StatName.AttackNormal, StatName.AttackBlk, StatName.AttackWin, StatName.AttackLost]
  },
  {
    cat: StatCat.Block,
    stats: [StatName.BlockWin, StatName.BlockPlus, StatName.BlockMinus, StatName.BlockHalf, StatName.BlockLost]
  },
  {
    cat: StatCat.Defend,
    stats: [StatName.DefendLost, StatName.DefendGood, StatName.DefendNormal]
  }
]


function _initAllowedItems(all_stat_items) {
  var allowed = []
  for (var i in all_stat_items) {
    var item = all_stat_items[i]
    for (var j in item.stats) {
      allowed.push(item.stats[j])
    }
  }
  return allowed
}

var default_data = {
  myScore: 0,
  yourScore: 0,
  all_players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2", "自由人"], //legacy
  is_libero_enabled: false,
  libero: -1, //在all_players中的序号
  libero_replacement1: -1, //自由人第一替换对象在all_players中的序号
  libero_replacement2: -1, //自由人第二替换对象在all_players中的序号, 两个序号可以一样
  players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"], //index: 显示位置, 0: 后排最右即1号位, 1: 2号位,  value: 姓名
  play_items: [
    [],
    [],
    [],
    [],
    [],
    []
  ], //items avaialbe for the player
  play_item_cats: [
    [],
    [],
    [],
    [],
    [],
    []
  ], //category for items available for the player
  stat_items: [], //stat items in history
  who_serve: -1, //发球球员的index
  serve: false, //true: 我发发球， false: 我方接发球
  front_back_mode: true, //true: 1号和2号轮换，3号与6号轮换，4号与5号轮换， false: 正常转位，6->5->4->3->2->1->6
  opPosition: -1, //哪个位置正在被技术统计
  opCat: null, //选中的操作大项目是什么？为null则没有选中
  player_allowed: null, //统计目标
  cat_allowed: [StatCat.Serve, StatCat.Attack, StatCat.Block, StatCat.Defend, StatCat.ErChuan, StatCat.Reception],
  cat_all: [StatCat.Serve, StatCat.Attack, StatCat.Block, StatCat.Defend, StatCat.ErChuan, StatCat.Reception],
  myTeam: "我方",
  yourTeam: "对方",
  _openid: null, //owner's open id
  _id: null, //match's id
  isOwner: true, //temparary data, only for rendering this page, not saving to db.
  status: 1, //1 - on going, 0 - ended
  total_score: 25, //唐朝 〟咖啡®🏝 建议增加每局的总分设置，现在一局必须要打到25分才可以, 2020-06-04 18:28:58 联系方式: 17717693609
}

function addScore(data) {
  data.myScore = 1 + data.myScore;
}

function addScoreRotate(data) {
  var serve = data.serve
  data.myScore = 1 + data.myScore;
  data.stat_items.push(createStatItem("", "无类别", "得分", 1, !serve, data.myScore, data.yourScore));

  if (!serve) {
    data.serve = true;
    _rotate(data);
    _checkLibero(data);
    updateAvailableItems(data);
  }
}

function looseScoreRotate(data) {
  var serve = data.serve;
  data.yourScore = 1 + data.yourScore;
  data.stat_items.push(createStatItem("", "无类别", "失误", -1, serve, data.myScore, data.yourScore));
  if (serve) {
    data.serve = false;
    _checkLibero(data);
    updateAvailableItems(data);
  }
}

function _rotate(data) { //only called when we win the score or for adjust court
  var serve = data.serve;
  var players = data.players;
  var who_serve = data.who_serve;

  //update serves
  if (data.front_back_mode) {
    if (who_serve == -1) {
      data.who_serve = 0;
    }

    if (who_serve == 0) { //二传发球
      data.who_serve = 5; //副攻发球 
    }

    if (who_serve == 5) { //副攻
      data.who_serve = 4;
    }

    if (who_serve == 4) { //主攻
      data.who_serve = 0;
    }
  } else {
    //始终是1号位发球，无需更改
    data.who_serve = 0;
  }

  //update players
  who_serve = data.who_serve;
  if (data.front_back_mode) {
    if (who_serve == 0) {
      _swap(0, 1, players);
    }

    if (who_serve == 5) {
      _swap(5, 2, players);
    }

    if (who_serve == 4) {
      _swap(4, 3, players);
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

//返回球员是否在场上
function isPlayerOnCourt(name, players) {
  for (var i = 0; i < players.length; i++) {
    if (players[i] == name) {
      return true;
    }
  }
  return false;
}

function _checkLibero(data) {
  var serve = data.serve;
  var players = data.players;
  var who_serve = data.who_serve;

  console.log(serve, who_serve)

  if (data.is_libero_enabled) {
    //如果自由人转到前排，则必须被换下
    for (var i = 1; i <= 3; i++) {
      if (data.all_players[data.libero] == data.players[i]) { //自由人在前排了
        if (!isPlayerOnCourt(data.all_players[data.libero_replacement1], data.players)) { //第一替换人不在场上
          data.players[i] = data.all_players[data.libero_replacement1]; //上场
        } else if (data.libero_replacement2 != -1 && !isPlayerOnCourt(data.all_players[data.libero_replacement2], data.players)) { //第二替换人不在场上
          data.players[i] = data.all_players[data.libero_replacement2]; //上场
        }
        break;
      }
    }

    //自由人上场替换后排
    var done = false;
    if (isPlayerOnCourt(data.all_players[data.libero], data.players)) {
      done = true;
    }

    if (!done) {
      for (var i = 4; i <= 6; i++) { //先替换第一对象
        var j = i % 6;
        if (data.all_players[data.libero_replacement1] == data.players[j] &&
          (!(serve && who_serve == j))) { //自由人不发球哦
          data.players[j] = data.all_players[data.libero];
          done = true;
          break;
        }
      }
    }
  }

  if (!done) {
    for (var i = 4; i <= 6; i++) { //再替换第二对象
      var j = i % 6;
      if (data.all_players[data.libero_replacement2] == data.players[j] &&
        (!(serve && who_serve == j))) { //自由人不发球哦
        data.players[j] = data.all_players[data.libero];
        break;
      }
    }
  }
}
//categories: output
//items: output
function _createItems(categories, items, cat_allowed, category, arr2) {
  if (-1 != cat_allowed.indexOf(category)) {
    for (var i in arr2) {
      var name = arr2[i][0]
      var score = arr2[i][1]
      items.push(_createPlayItem(category, name, score));

    }
    categories.push(category)
  }
}


function updateAvailableItems(data) {
  var who_serve = data.who_serve;
  var items = data.play_items;
  var serve = data.serve;
  var cats = data.play_item_cats;
  var cat_allowed = data.cat_allowed
  var player_allowed = data.player_allowed
  var players = data.players
  var libero = data.players.indexOf(data.all_players[data.libero]);

  for (var i in items) {
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
      _createItems(cat, item, cat_allowed, StatCat.Serve, [
        [StatName.ServeWin, 1],
        [StatName.ServeNormal, 0],
        [StatName.ServeLost, -1]
      ]);
    }

    if (!serve) {
      _createItems(cat, item, cat_allowed, StatCat.Reception, [
        [StatName.ReceptionPerfect, 0],
        [StatName.ReceptionGood, 0],
        [StatName.ReceptionBad, 0],
        [StatName.ReceptionLost, -1]
      ])
    }

    _createItems(cat, item, cat_allowed, StatCat.ErChuan, [
      [StatName.ErChuanGood, 0],
      [StatName.ErChuanBad, 0],
      [StatName.ErChuanLost, -1]
    ])

    if (i != libero) {
      _createItems(cat, item, cat_allowed, StatCat.Attack, [
        [StatName.AttackWin, 1],
        [StatName.AttackNormal, 0],
        [StatName.AttackBlk, -1],
        [StatName.AttackLost, -1]
      ])
    }

    if (i >= 1 && i <= 3) {
      _createItems(cat, item, cat_allowed, StatCat.Block, [
        [StatName.BlockWin, 1],
        [StatName.BlockPlus, 0],
        [StatName.BlockMinus, 0],
        [StatName.BlockHalf, -1],
        [StatName.BlockLost, -1]
      ])
    }

    _createItems(cat, item, cat_allowed, StatCat.Defend, [
      [StatName.DefendGood, 0],
      [StatName.DefendNormal, 0],
      [StatName.DefendLost, -1]
    ])
  }
}

function stateRotate(data, position, i) {
  var player = data.players[position];
  var item = data.play_items[position][i];
  var serve = data.serve;

  var swap = false;

  if (item.score == 1 && !serve) {
    swap = true;
  }

  if (item.score == -1 && serve) {
    swap = true;
  }

  if (item.score == 1) {
    data.myScore = data.myScore + 1;
  }

  if (item.score == -1) {
    data.yourScore = data.yourScore + 1;
  }

  //createStatItem and _createPlayItem需要统一。。。
  data.stat_items.push(createStatItem(player, item.category, item.name, item.score, swap, data.myScore, data.yourScore));

  if (item.score == 1) {
    //next position
    if (!serve) {
      data.serve = true;
      _rotate(data);
      _checkLibero(data);
      updateAvailableItems(data);
    }

  } else if (item.score == -1) {
    if (serve) {
      data.serve = false;
      _checkLibero(data);
      updateAvailableItems(data);
    }
  }
}

function popStatItem(data) {
  var stat = data.stat_items.pop();
  if (stat.score > 0) {
    data.myScore = data.myScore - stat.score;
  } else if (stat.score < 0) {
    data.yourScore = data.yourScore + stat.score;
  }
  _prevPosition(data, stat);
  updateAvailableItems(data);
}

//mine: true: revert my score, false: revert your score
function revertScore(data, mine) {
  for (var j in data.stat_items) {
    var i = data.stat_items.length - j - 1
    if (mine && data.stat_items[i].score > 0) {
      data.stat_items.splice(i, 1)
      data.myScore = data.myScore - 1
      break
    }

    if (!mine && data.stat_items[i].score < 0) {
      data.stat_items.splice(i, 1)
      data.yourScore = data.yourScore - 1;
      break
    }
  }
}

function getTopItem(data) {
  if (data.stat_items.length > 0) {
    return data.stat_items[data.stat_items.length - 1]
  } else {
    return null
  }
}

function _prevPosition(data, stat) { //called when pop stat
  var players = data.players;
  var serve = data.serve;
  var who_serve = data.who_serve;

  //现在谁发球，说明刚刚从前排换到后排
  if (stat.swapServe && stat.score > 0) {
    if (data.front_back_mode) {
      if (who_serve == 0) {
        _swap(0, 1, players);
      }

      if (who_serve == 5) {
        _swap(5, 2, players);
      }

      if (who_serve == 4) {
        _swap(4, 3, players);
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
    data.serve = false;

    if (data.front_back_mode) {
      if (who_serve == 0) { //二传发球
        data.who_serve = 4; //主攻发球
      }

      if (who_serve == 5) { //副攻
        data.who_serve = 0;
      }

      if (who_serve == 4) { //主攻
        data.who_serve = 5 //副攻
      }
    }
  }

  if (stat.swapServe && stat.score < 0) { //刚刚失分失去发球权
    data.serve = true;
  }
}

function createStatItem(player, item_cat, item_name, item_score, swap, myscore, yourscore) {
  var obj = new Object();
  obj.player = player
  obj.category = item_cat
  obj.item = item_name;
  obj.score = item_score
  obj.swapServe = swap;
  obj.myscore = myscore;
  obj.yourscore = yourscore;
  return obj;
}

function rotate(data) {
  _rotate(data);
  _checkLibero(data);
}


function _swap(p1, p2, array) {
  var obj = array[p1];
  array[p1] = array[p2];
  array[p2] = obj;
}

function _createPlayItem(category, name, score) {
  var obj = new Object();
  obj.category = category;
  obj.name = name;
  obj.score = score;
  return obj;
}


module.exports.addScoreRotate = addScoreRotate;
module.exports.looseScoreRotate = looseScoreRotate;
module.exports.stateRotate = stateRotate;
module.exports.updateAvailableItems = updateAvailableItems;
module.exports.popStatItem = popStatItem;
module.exports.createStatItem = createStatItem;
module.exports.StatName = StatName;
module.exports.StatCat = StatCat;
module.exports.default_data = default_data;
module.exports.rotate = rotate;
module.exports.getTopItem = getTopItem;
module.exports.revertScore = revertScore;