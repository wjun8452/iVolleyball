var StatKey = {
  ServeNormal: "发球一般",
  ServeWin: "发球得分",
  ServeLost: "发球失误",
  ReceptionBad: "一传不到位",
  ReceptionGood: "一传半到位",
  ReceptionPerfect: "一传到位",
  ReceptionLost: "一传失误",
  AttackNormal: "进攻一般",
  AttackBlk: "进攻拦死",
  AttackWin: "进攻得分",
  AttackLost: "进攻失误",
  BlockWin: "拦网得分",

};

function addScore(data) {
  data.myScore = 1 + data.myScore;
}

function addScoreRotate(data) {
  var serve = data.serve
  data.myScore = 1 + data.myScore;
  data.stat_items.push(createStatItem("", "", 1, !serve));

  if (!serve) {
    data.serve = true;
    rotate(data);
    updateAvailableItems(data);
  }
}

function looseScoreRotate(data) {
  var serve = data.serve;
  data.yourScore = 1 + data.yourScore;
  data.stat_items.push(createStatItem("", "", -1, serve));
  if (serve) {
    data.serve = false;
    updateAvailableItems(data);
  }
}

function rotate(data) { //only called when we win the score or for adjust court
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
  }
  else {
    var player = players[5];
    players[5] = players[0];
    players[0] = players[1];
    players[1] = players[2];
    players[2] = players[3];
    players[3] = players[4];
    players[4] = player;
  }
}


function updateAvailableItems(data) {
  var who_serve = data.who_serve;
  var items = data.play_items;
  var serve = data.serve;

  for (var i in items) {
    items[i] = [];
    var item = items[i];

    item.push(_createPlayItem(StatKey.AttackWin, 1));
    //item.push(_createPlayItem(StatKey.AttackBlk, -1));
    //item.push(_createPlayItem(StatKey.AttackNormal, 0));
    item.push(_createPlayItem(StatKey.AttackLost, -1));

    if (serve && i==who_serve) {
      item.push(_createPlayItem(StatKey.ServeWin, 1));
      item.push(_createPlayItem(StatKey.ServeLost, -1));
      //item.push(_createPlayItem(StatKey.ServeNormal, 0));
    }

    if (i >= 1 && i <= 3) {
      item.push(_createPlayItem(StatKey.BlockWin, 1));
    }

    if (!serve) {
      //item.push(_createPlayItem(StatKey.ReceptionBad, 0));
      //item.push(_createPlayItem(StatKey.ReceptionGood, 0));
      //item.push(_createPlayItem(StatKey.ReceptionPerfect, 0));
      item.push(_createPlayItem(StatKey.ReceptionLost, -1));
    }
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

  data.stat_items.push(createStatItem(player, item.name, item.score, swap));

  if (item.score == 1) {
    data.myScore = data.myScore + 1;

    //next position
    if (!serve) {
      data.serve = true;
      rotate(data);
      updateAvailableItems(data);
    }

  } else if (item.score == -1) {
    data.yourScore = data.yourScore + 1;
    if (serve) {
      data.serve = false;
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

function getTopItem(data) {
  if (data.stat_items.length > 0) {
    return data.stat_items[data.stat_items.length-1]
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

  if (stat.swapServe && stat.score > 0) {//刚刚得分获得发球权
    data.serve = false;

    if (data.front_back_mode) {
      if (who_serve == 0) { //二传发球
        data.who_serve = 4;//主攻发球
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

function createStatItem(player, item, score, swap) {
  var obj = new Object();
  obj.player = player
  obj.item = item;
  obj.score = score;
  obj.swapServe = swap;
  return obj;
}

function _swap(p1, p2, array) {
  var obj = array[p1];
  array[p1] = array[p2];
  array[p2] = obj;
}

function _createPlayItem(name, score) {
  var obj = new Object();
  obj.name = name;
  obj.score = score;
  return obj;
}

function reset(data) {
  data.myScore = 0;
  data.yourScore = 0;
  data.stat_items = [];
  data.serve = false;
  data.front_back_mode = true;
  data.who_serve = 4 //下一次是二传发球
}

module.exports.addScoreRotate = addScoreRotate;
module.exports.looseScoreRotate = looseScoreRotate;
module.exports.stateRotate = stateRotate;
module.exports.updateAvailableItems = updateAvailableItems;
module.exports.popStatItem = popStatItem;
module.exports.createStatItem = createStatItem;
module.exports.StatKey = StatKey;
module.exports.rotate = rotate;
module.exports.getTopItem = getTopItem;
module.exports.reset = reset;


// data:
// {
//   myScore: 0,
//     yourScore: 0,
//       all_players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"],
//         players: ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"], //index: 显示位置, 0: 后排最右即1号区域, 1: 2号区域,  value: 姓名
//           play_items: [[], [], [], [], [], []], //items avaialbe for the player
//             stat_items: [], //stat items in history
//               who_serve: -1, //发球球员的index
//                 serve: false,  //true: 我发发球， false: 我方接发球
//                   front_back_mode: true, //true: 1号和2号轮换，3号与6号轮换，4号与5号轮换， false: 正常转位，6->5->4->3->2->1->6
// }
