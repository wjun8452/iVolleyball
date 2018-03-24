
function addScore(data) {
  var serve = data.serve
  data.myScore = 1 + data.myScore;
  data.stat_items.push(createStatItem("", "", 1, !serve));

  if (!serve) {
    data.serve = true;
    _nextPosition(data);
    updatePlayItems(data);
  }
}

function looseScore(data) {
  var serve = data.serve;
  data.yourScore = 1 + data.yourScore;
  data.stat_items.push(createStatItem("", "", -1, serve));
  if (serve) {
    data.serve = false;
    updatePlayItems(data);
  }
}

function _nextPosition(data) { //only called when we win the score
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

function updatePlayItems(data) {
  var who_serve = data.who_serve;
  var items = data.play_items;
  var serve = data.serve;

  for (var i in items) {
    items[i] = [];
    var item = items[i];

    item.push(_createPlayItem("进攻", 1));

    if (serve && i==who_serve) {
      item.push(_createPlayItem("发球", 1));
    }

    if (i >= 1 && i <= 3) {
      item.push(_createPlayItem("拦网", 1));
    }

    //--------- negative
    item.push(_createPlayItem("进攻", -1));
    item.push(_createPlayItem("串联", -1));
    if (serve && who_serve==i) {
      item.push(_createPlayItem("发球", -1));
    }

    if (!serve) {
      item.push(_createPlayItem("一传", -1));
    }

    if (i >= 1 && i <= 3) {
      item.push(_createPlayItem("拦网", -1));
    }
  }
}

function addPlayItem(data, position, i) {
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
      _nextPosition(data);
      updatePlayItems(data);
    }

  } else if (item.score == -1) {
    data.yourScore = data.yourScore + 1;
    if (serve) {
      data.serve = false;
      updatePlayItems(data);
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
  updatePlayItems(data);
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



module.exports.addScore = addScore;
module.exports.looseScore = looseScore;
module.exports.addPlayItem = addPlayItem;
module.exports.updatePlayItems = updatePlayItems;
module.exports.popStatItem = popStatItem;
module.exports.createStatItem = createStatItem;