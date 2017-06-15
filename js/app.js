'use strict';

function loadLevels() {
  return new Promise((done, fail) => {
    const xhr = new XMLHttpRequest();
    let url = './levels.json';
    if (location.hostname !== 'localhost') {
      url = 'https://netology-fbb-store-api.herokuapp.com/game-levels/';
    }
    xhr.open('GET', url);
    xhr.addEventListener('error', e => fail(xhr));
    xhr.addEventListener('load', e => {
      if (xhr.status !== 200) {
        fail(xhr);
      }
      done(xhr.responseText);
    });
    xhr.send();
  });
}

const scale = 30;
const maxStep = 0.05;
const wobbleSpeed = 8, wobbleDist = 0.07;
const playerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;

function elt(name, className) {
  let elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

class DOMDisplay {
  constructor(parent, level) {
    this.wrap = parent.appendChild(elt("div", "game"));
    this.wrap.setAttribute('autofocus', true);
    this.level = level;
    this.actorMap = new Map();
    this.wrap.appendChild(this.drawBackground());
    this.wrap.appendChild(this.drawActors());
    this.drawFrame();
  }

  /** Отрисовка сетки игрового уровня. */
  drawBackground() {
    // Создание html-тега со стилем.
    let table = elt("table", "background");
    table.style.width = this.level.width * scale + "px";
    // Отрисовка каждой ячейки.
    this.level.grid.forEach(row => {
      let rowElt = table.appendChild(elt("tr"));
      rowElt.style.height = scale + "px";
      row.forEach(type => rowElt.appendChild(elt("td", type)));
    });
    return table;
  }

  /** Отрисовка объекта. */
  drawActor(actor) {
    return elt('div', `actor ${actor.type}`);
  }

  /** Обновление объекта. */
  updateActor(actor, rect) {
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  }

  /** Отрисовка объектов. */
  drawActors() {
    let wrap = elt('div');
    this.level.actors.forEach(actor => {
      const rect = wrap.appendChild(this.drawActor(actor));
      this.actorMap.set(actor, rect);
    });
    return wrap;
  }

  /** Обновление объектов. */
  updateActors() {
    for (const [actor, rect] of this.actorMap) {
      if (this.level.actors.includes(actor)) this.updateActor(actor, rect);
      else {
          this.actorMap.delete(actor);
          rect.parentElement.removeChild(rect);
      }
    }
  }

  /** Отрисовка игры. */
  drawFrame() {
    this.updateActors();
    this.wrap.className = "game " + (this.level.status || "");
    this.scrollPlayerIntoView();
  }

  scrollPlayerIntoView() {
    let width = this.wrap.clientWidth;
    let height = this.wrap.clientHeight;
    let margin = width / 3;
    // The viewport
    let left = this.wrap.scrollLeft, right = left + width;
    let top = this.wrap.scrollTop, bottom = top + height;
    let player = this.level.player;
    if (!player) return;
    let center = player.pos.plus(player.size.times(0.5)).times(scale);
    if (center.x < left + margin)
      this.wrap.scrollLeft = center.x - margin;
    else if (center.x > right - margin)
      this.wrap.scrollLeft = center.x + margin - width;
    if (center.y < top + margin)
      this.wrap.scrollTop = center.y - margin;
    else if (center.y > bottom - margin)
      this.wrap.scrollTop = center.y + margin - height;
  }

  clear() {
    this.wrap.parentNode.removeChild(this.wrap);
  }
}

var arrowCodes = {37: "left", 38: "up", 39: "right"};

function trackKeys(codes) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop) {
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);
}

/**
 * Инициализирует процесс регулярной отрисовки текущего состояния игрового поля и обработку событий клавиатуры.
 * Принимает два аргумента: уровень, объект класса Level и конструктор объекта, отвечающего за отрисовку.
 * В случае реализации игры в браузере вторым аргументом необходимо использовать класс DOMDisplay.
 * Функция возвращает промис, который разрешится статусом завершения игры, строка.
 * С учетом реализации класса Level он может принимать значения won и lost.
 */
function runLevel(level, Display) {
  initGameObjects();
  return new Promise(done => {
    var arrows = trackKeys(arrowCodes);
    var display = new Display(document.body, level);
    runAnimation(step => {
      level.act(step, arrows);
      display.drawFrame(step);
      if (level.isFinished()) {
        //todo убрать комментарий
        //display.clear();
        done(level.status);
        return false;
      }
    });
  });
}

function initGameObjects() {
  if (initGameObjects.isInit) {
    return;
  }

  initGameObjects.isInit = true;

  Level.prototype.act = function(step, keys) {
    if (this.status !== null) {
      this.finishDelay -= step;
    }

    while (step > 0) {
      var thisStep = Math.min(step, maxStep);
      this.actors.forEach(actor => {
        actor.act(thisStep, this, keys);
      });

      if (this.status === 'lost') {
        this.player.pos.y += thisStep;
        this.player.size.y -= thisStep;
      }

      step -= thisStep;
    }
  };

  /**
   *
   */
  Player.prototype.handleObstacle = function (obstacle) {
    if (this.wontJump) {
      this.speed.y = -jumpSpeed;
    } else {
      this.speed.y = 0;
    }
  };

  /**
   *
   */
  Player.prototype.move = function (motion, level) {
    let newPos = this.pos.plus(motion);
    let obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle) {
      // this.speed.y = 0;
      level.playerTouched(obstacle);
      this.handleObstacle(obstacle);
    } else {
      this.pos = newPos;
    }
  };

  /**
   * Движение вдоль оси Х
   */
  Player.prototype.moveX = function (step, level, keys) {
    this.speed.x = 0;
    if (keys.left) this.speed.x -= playerXSpeed;
    if (keys.right) this.speed.x += playerXSpeed;
    let motion = new Vector(this.speed.x, 0).times(step);
    this.move(motion, level);
  };

  /**
   * Движение вдоль оси Y
   */
  Player.prototype.moveY = function (step, level, keys) {
    this.speed.y += step * gravity;
    this.wontJump = keys.up && this.speed.y > 0;
    let motion = new Vector(0, this.speed.y).times(step);
    this.move(motion, level);
  };

  /**
   * Действия игрока.
   */
  Player.prototype.act = function (step, level, keys) {
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);
    // Получение объекта, с которым пересекается игрок.
    let actor = level.actorAt(this);
    // if (actor) debugger;
    // Вызов изменения действий, если с ним пересекся игрок.
    if (actor) level.playerTouched(actor.type, actor);
  };
}

function runGame(plans, Parser, Display) {
  return new Promise(done => {
    function startLevel(n) {
      runLevel(Parser.parse(plans[n]), Display)
        .then(status => {
          if (status === "lost") {
            startLevel(n);
          } else if (n < plans.length - 1) {
            startLevel(n + 1);
          } else {
            done();
          }
        });
    }
    startLevel(0);
  });
}

function rand(max = 10, min = 0) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
