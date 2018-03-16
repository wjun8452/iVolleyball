/*
  data:
  {
    "myScore": 0,
    "yourScore": 0,
    "all_players": ["1号", "2号", "3号", "4号", "5号", "6号"],
    "players": ["接应", "二传", "副攻1", "主攻1", "主攻2", "副攻2"], //index: 场上显示位置, 0:1号位置, value: 姓名
    "positions": [5, 2, 3, 4, 1, 6], //index: 场上显示位置, value: 转位位置
    "play_items": [[], [], [], [], [], []], //items avaialbe for the player
    "stat_items": [], //stat items in history
    "serves": [false, false, false, false, false, false], //index: 场上显示位置, value: 是否发球
    "front_back_mode": true,
    "serve": false //发球权在手
  },
*/

function addScore (data) {
  data.myScore = 1 + data.myScore;
  data.stat_items.push(_createStatItem("", "", 1));
  
  if (!data.serve) {
    data.serve = true;
    nextPosition(data);
    updatePlayItems(data);
  }
}

function looseScore(data) {
  data.yourScore = 1 + data.yourScore;
  data.stat_items.push(_createStatItem("", "", -1));
  if (data.serve) {
    data.serve = false;
    updatePlayItems(data);
  }
}

function nextPosition (data) { //only called when we win the score
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



function updatePlayItems (data) {
  var serve = data.serve;
  var serves = data.serves;
  var positions = data.positions;
  var m_play_items = data.play_items;

  for (var index in m_play_items) {
    m_play_items[index] = [];
    var play_items = m_play_items[index];

    play_items.push(_createPlayItem("进攻", 1));

    if (serve && serves[index]) {
      play_items.push(_createPlayItem("发球", 1));
    }

    if (positions[index] >= 2 && positions[index] <= 4) {
      play_items.push(_createPlayItem("拦网", 1));
    }

    //--------- negative
    play_items.push(_createPlayItem("进攻", -1));
    play_items.push(_createPlayItem("串联", -1));
    if (serve && serves[index]) {
      play_items.push(_createPlayItem("发球", -1));
    }

    if (!serve) {
      play_items.push(_createPlayItem("一传", -1));
    }

    if (positions[index] >= 2 && positions[index] <= 4) {
      play_items.push(_createPlayItem("拦网", -1));
    }
  }
}

function addPlayItem(data, position, item_index) {

  var player = data.players[position];
  var item = data.play_items[position][item_index];

  data.stat_items.push(_createStatItem(player, item.name, item.score));

  if (item.score == 1) {
    data.myScore = data.myScore + 1;

    //next position
    if (!data.serve) {
      data.serve = true;
      nextPosition(data);
      updatePlayItems(data);
    }

  } else if (item.score == -1) {
    data.yourScore = data.yourScore + 1;
    if (data.serve) {
      data.serve = false;
      updatePlayItems(data);
    }
  }
}

function _createStatItem (player, item, score) {
  var obj = new Object();
  obj.player = player
  obj.item = item;
  obj.score = score;
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
module.exports.nextPosition = nextPosition;
module.exports.addPlayItem = addPlayItem;
module.exports.updatePlayItems = updatePlayItems;