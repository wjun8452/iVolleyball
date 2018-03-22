
function addScore(data) {
  var serve = anyOneServe(data.serves);
  data.myScore = 1 + data.myScore;
  data.stat_items.push(_createStatItem("", "", 1, !serve));

  if (!serve) {
    _nextPosition(data);
    updatePlayItems(data);
  }
}

function looseScore(data) {
  var serve = anyOneServe(data.serves);
  data.yourScore = 1 + data.yourScore;
  data.stat_items.push(_createStatItem("", "", -1, serve));
  if (serve) {
    for (var i in data.serves) {
      data.serves[i] = false;
    }
    updatePlayItems(data);
  }
}

function _nextPosition(data) { //only called when we win the score
  var players = data.players;
  var serves = data.serves;
  var positions = data.positions;

  if (data.front_back_mode) {
    for (var i in positions) {
      if (positions[i] == 1) {
        positions[i] = 6;
      } else {
        positions[i] = positions[i] - 1;
      }
    }
  } else {
    for (var i in positions) {
      positions[i] = parseInt(i) + 1;
    }
  }

  //update serves
  for (var i in positions) {
    if (positions[i] == 1) {
      serves[i] = true;
    } else {
      serves[i] = false;
    }
  }

  //update players
  if (data.front_back_mode) {
    if (serves[0] || serves[1]) {
      _swap(0, 1, players);
      _swap(0, 1, positions);
      _swap(0, 1, serves);
    }

    if (serves[2] || serves[5]) {
      _swap(2, 5, players);
      _swap(2, 5, positions);
      _swap(2, 5, serves);
    }

    if (serves[3] || serves[4]) {
      _swap(3, 4, players);
      _swap(3, 4, positions);
      _swap(3, 4, serves);
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

function anyOneServe(serves) {
  for (var i in serves) {
    if (serves[i]) {
      return true;
    }
  }
  return false;
}

function updatePlayItems(data) {
  var serves = data.serves;
  var positions = data.positions;
  var items = data.play_items;
  var serve = anyOneServe(serves);

  for (var i in items) {
    items[i] = [];
    var item = items[i];

    item.push(_createPlayItem("进攻", 1));

    if (serves[i]) {
      item.push(_createPlayItem("发球", 1));
    }

    if (positions[i] >= 2 && positions[i] <= 4) {
      item.push(_createPlayItem("拦网", 1));
    }

    //--------- negative
    item.push(_createPlayItem("进攻", -1));
    item.push(_createPlayItem("串联", -1));
    if (serves[i]) {
      item.push(_createPlayItem("发球", -1));
    }

    if (!serve) {
      item.push(_createPlayItem("一传", -1));
    }

    if (positions[i] >= 2 && positions[i] <= 4) {
      item.push(_createPlayItem("拦网", -1));
    }
  }
}

function addPlayItem(data, position, i) {
  var player = data.players[position];
  var item = data.play_items[position][i];
  var serve = anyOneServe(data.serves);

  var swap = false;

  if (item.score == 1 && !serve) {
    swap = true;
  }

  if (item.score == -1 && serve) {
    swap = true;
  }

  data.stat_items.push(_createStatItem(player, item.name, item.score, swap));

  if (item.score == 1) {
    data.myScore = data.myScore + 1;

    //next position
    if (!serve) {
      _nextPosition(data);
      updatePlayItems(data);
    }

  } else if (item.score == -1) {
    data.yourScore = data.yourScore + 1;
    if (serve) {
      for(var i in data.serves) {
        data.serves[i] = false;
      }
      updatePlayItems(data);
    }
  }
}

function popStatItem(data) {
  var stat = data.stat_items.pop();
  _prevPosition(data, stat);
  if (stat.score > 0) {
    data.myScore = data.myScore - stat.score;
  } else if (stat.score < 0) {
    data.yourScore = data.yourScore + stat.score;
  }
  updatePlayItems(data);
}

function _prevPosition(data, stat) { //called when pop stat
  var players = data.players;
  var serves = data.serves;
  var positions = data.positions;

  if (stat.swapServe && stat.score > 0) {//刚刚得分获得发球权
    if (data.front_back_mode) {
      for (var i in positions) {
        if (positions[i] == 6) {
          positions[i] = 1;
        } else {
          positions[i] = positions[i] + 1;
        }
      }
    } else {
      for (var i in positions) {
        positions[i] = parseInt(i) - 1;
      }
    }
  }

  //现在谁发球，说明刚刚从前排换到后排
  if (stat.swapServe && stat.score > 0) {
    if (data.front_back_mode) {
      if (serves[0] || serves[1]) {
        _swap(0, 1, players);
        _swap(0, 1, positions);
      }

      if (serves[2] || serves[5]) {
        _swap(2, 5, players);
        _swap(2, 5, positions);
      }

      if (serves[3] || serves[4]) {
        _swap(3, 4, players);
        _swap(3, 4, positions);
      }

      for (var i in serves) {
        serves[i] = false;
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


  if (stat.swapServe && stat.score < 0) { //刚刚失分失去发球权
    for (var i in positions) {
      if (positions[i] == 1) {
        serves[i] = true;
      } else {
        serves[i] = false;
      }
    }
  }
}

function _createStatItem(player, item, score, swap) {
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