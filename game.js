'use strict';

class Vector {

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   *
   * @param vector смещение относительно размеров
   * @returns {Vector}
   */
  plus(vector) {
    if (vector instanceof Vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    }
    throw new Error("Можно прибавлять к вектору только вектор типа Vector");
  }

  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}

/**
 * Движущийся объект на игровом поле.
 */
class Actor {

  constructor(position, size, speed) {
    if (position == undefined) {
      this.pos = new Vector();
    } else if (position instanceof Vector) {
      this.pos = position;
    } else {
      throw new Error("Ошибка в первом аргументе");
    }

    if (size == undefined) {
      this.size = new Vector(1, 1);
    } else if (size instanceof Vector) {
      this.size = size;
    } else {
      throw new Error("Ошибка во втором аргументе");
    }

    if (speed == undefined) {
      this.speed = new Vector();
    } else if (speed instanceof Vector) {
      this.speed = speed;
    } else {
      throw new Error("Посмотрите на спидометр, шофер!");
    }

    Object.defineProperty(this, "type", {value: "actor", writable: false});

    this.left = this.pos.x;
    this.right = this.pos.x + this.size.x;
    this.top = this.pos.y;
    this.bottom = this.pos.y + this.size.y;
  }

  /**
   * Метод ничего не делает.
   */
  act() {
  }

  isIntersect(actor) {
    /**
     * Метод проверяет, пересекается ли текущий объект с переданным объектом, и если да, возвращает <code>true</code>,
     * иначе <code>false</code>.
     *Принимает один аргумент — движущийся объект типа Actor. Если передать аргумент другого типа или вызвать без аргументов, то метод бросает исключение.
     Если передать в качестве аргумента этот же объект, то всегда возвращает false. Объект не пересекается сам с собой.
     * Объекты, имеющие смежные границы, не пересекаются.
     * @param actor движущийся объект типа Actor.
     */
    if (actor instanceof Actor) {
      if (this === actor) return false;
      return ((actor.top < this.top && this.top < actor.bottom) || (this.top < actor.top && actor.top < this.bottom) &&
        (actor.left < this.left && this.left < actor.right) || (this.left < actor.left && actor.left < this.right));
    } else {
      throw new Error("Я не могу это сравнить!");
    }
  }
}


/**
 * Сетка уровня представляет собой координатное двумерное поле, представленное двумерным массивом.
 * Первый массив — строки игрового поля; индекс этого массива соответствует координате Y на игровом поле.
 * Вложенные массивы, расположенные в элементах массива строк, представляют ячейки поля.
 * Индекс этих массивов соответствует координате X.
 */
class Level {

  constructor(grid, actors) {

    /**
     * Сетка игрового поля. Двумерный массив строк.
     */
    this.grid = (grid === undefined) ? [] : grid;

    /**
     * Список движущихся объектов игрового поля, массив объектов Actor.
     */
    this.actors = actors;

    /**
     * Движущийся объект, тип которого — свойство type — равно player.
     * @type {Actor}
     */
    this.player = this.actors === undefined ? undefined : this.actors.find((element) => { return element.type === "player"; });

    /**
     * Высота игрового поля, равная числу строк в сетке из первого аргмента.
     */
    this.height = this.grid.length;

    /**
     * Ширина игрового поля, равная числу ячеек в строке сетки из первого аргумента.
     * При этом, если в разных строках разное число ячеек, то width будет равно максимальному количеству ячеек в строке.
     */
    Object.defineProperty(this, "width", {
      get: () => {
        if (this.grid.length == 0) return 0;
        let max = 0;
        for (let i = 0; i < grid.length; i++) {
          if (this.grid[i].length > max) max = this.grid[i].length;
        }
        return max;
      }
    });

    /**
     * Состояние прохождения уровня, равное null после создания.
     * @type {null}
     */
    this.status = null;

    /**
     * Таймаут после окончания игры, равен 1 после создания.
     * Необходим, чтобы после выигрыша или проигрыша игра не завершалась мгновенно.
     * @type {number} значение по умолчанию.
     */
    this.finishDelay = 1;

  }

  /**
   * Определяет, завершен ли уровень. Не принимает аргументов.
   * Возвращает true, если свойство status не равно null и finishDelay меньше нуля.
   * @returns {boolean}
   */
  isFinished() {
    return (this.status !== null && this.finishDelay < 0);
  }

  /**
   * Определяет, расположен ли какой-то другой движущийся объект в переданной позиции, и если да, вернёт этот объект.
   * Принимает один аргумент — движущийся объект, Actor. Если не передать аргумент или передать не объект Actor,
   * метод должен бросить исключение.
   * Возвращает undefined, если переданный движущийся объект не пересекается ни с одним объектом на игровом поле.
   * Возвращает объект Actor, если переданный объект пересекается с ним на игровом поле. Если пересекается с
   * несколькими объектами, вернет первый.
   * @param actor
   */
  actorAt(inputActor) {
    if (inputActor !== undefined && actor instanceof Actor) {
      for (let actor of actors) {
        return inputActor.isIntersect(actor) ? actor : undefined;
      }
    } else {
      throw new Error("Передан не Actor!");
    }
  }

  /**
   * Аналогично методу actorAt определяет, нет ли препятствия в указанном месте. Также этот метод контролирует
   * выход объекта за границы игрового поля.
   * Так как движущиеся объекты не могут двигаться сквозь стены, то метод принимает два аргумента: положение,
   * куда собираемся передвинуть объект, вектор Vector, и размер этого объекта, тоже вектор Vector.
   * Если первым и вторым аргументом передать не Vector, то метод бросает исключение.
   * Вернет строку, соответствующую препятствию из сетки игрового поля, пересекающему область, описанную двумя
   * переданными векторами, либо undefined, если в этой области препятствий нет.
   * Если описанная двумя векторами область выходит за пределы игрового поля, то метод вернет строку lava,
   * если область выступает снизу. И t wall в остальных случаях. Будем считать, что игровое поле слева,
   * сверху и справа огорожено стеной и снизу у него смертельная лава.
   */
  obstacleAt(destination, dims) {
    if (destination instanceof Vector && dims instanceof Vector) {
      //вычислить область, которая расположена в destinations с размером dims
      let area = new Actor(destination, dims);
      for (let actor of actors) {
        return area.isIntersect(actor) ? true : false;
      } //todo доделать
    } else {
      throw new Error("Что-то не является вектором!");
    }
  }

  /**
   * Метод удаляет переданный объект с игрового поля. Если такого объекта на игровом поле нет, не делает ничего.
   * Принимает один аргумент, объект Actor. Находит и удаляет его.
   */
  removeActor(actor) {
    //if (actor === undefined) return;
    for (let index = 0; index < this.actors.length; index++)
      if (this.actors[index] == actor) {
        this.actors.splice(index, 1);
        return;
      }
  }

  /**
   * Определяет, остались ли еще объекты переданного типа на игровом поле.
   * Принимает один аргумент — тип движущегося объекта, строка.
   * Возвращает true, если на игровом поле нет объектов этого типа (свойство type). Иначе возвращает false.
   */
  noMoreActors(type) {
    if (type == undefined) return true;
    for (let actor of this.actors) {
      if (actor.type == type) return false;
    }
    return true;
  }

  /**
   * Один из ключевых методов, определяющий логику игры. Меняет состояние игрового поля при касании игроком
   * каких-либо объектов или препятствий.
   * Если состояние игры уже отлично от null, то не делаем ничего, игра уже и так завершилась.
   * Принимает два аргумента. Тип препятствия или объекта, строка. Движущийся объект, которого коснулся
   * игрок, — объект типа Actor, необязательный аргумент.
   * Если первым аргументом передать строку lava или fireball, то меняем статус игры на lost (свойство status).
   * Игрок проигрывает при касании лавы или шаровой молнии.
   * Если первым аргументом передать строку coin, а вторым — объект монеты, то необходимо удалить эту монету
   * с игрового поля. Если при этом на игровом поле не осталось больше монет, то меняем статус игры на won.
   * Игрок побеждает, когда собирает все монеты на уровне. Отсюда вытекает факт, что уровень без монет пройти невозможно.
   */
  playerTouched(type, actor) {
    if (type == 'lava' || type == 'fireball') {
      this.status = 'lost';
    } else if (type == 'coin') {
      this.removeActor(actor);
    }
  }
}

class LevelParser {
  constructor(actors) {
    this.actors = actors;
  }

  actorFromSymbol(symbol) {
    return new Actor;
  }

  obstacleFromSymbol(symbol) {
    if (symbol === "x") {
      return "wall";
    } else if (symbol === "!") {
      return "lava";
    } else {
      return undefined;// есть ли смысл в этой строке???
    }
  }

  createGrid(arrayOfStrings) {
    for (let string of arrayOfStrings) {
      //разбиваем строку на ячейки массива
    }
  }

  createActors(arrayOfStrings) {

  }

  parse(arrayOfStrings) {

  }
}

const DictOfActors = Object.create(null);
DictOfActors["@"] = Actor;
DictOfActors["0"] = Coin;
DictOfActors["="] = HorisontalFireball;
DictOfActors["|"] = VerticalFireball;
DictOfActors["v"] = FireRain;

class Fireball {

  constructor(coords = new Vector(0, 0), speed = new Vector(0, 0)) {
    this.pos = coords;
    this.speed = speed;
    Object.defineProperty(this, "type", {value: "fireball", writable: false});
    this.size = new Vector(1, 1);
    this.prototype = Actor;
  }

  getNextPosition(time = 1) {
    return new Vector(coords.x + speed.x * time, coords.y + speed.y * time);
  }

  handleObstacle() {
    this.speed = new Vector(- this.speed.x, - this.speed.y);
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition) === undefined) this.pos = nextPosition;
  }
}

class HorizontalFireball {
  constructor(coords) {
    this.prototype = Fireball;
    this.pos = coords;
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball {
  constructor(coords) {
    this.prototype = Fireball;
    this.pos = coords;
    this.speed = new Vector(0, 2);
  }
}

class FireRun {
  constructor(coords) {
    this.prototype = Fireball;
    this.pos = coords;
    this.speed = new Vector(0, 3);
  }
}

class Coin {
  constructor(coords){
    this.prototype = Actor;
    this.pos = coords.plus(0.2,0.1);
    Object.defineProperty(this, "type", {value: "coin", writable: false});
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = 2 * Math.PI *Math.random();
  }

  updateSpring(time = 1) {
    this.spring =+ this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time) {
    this.spring =+this.updateSpring();
  }

  act(time) {
    this.getNextPosition(time);
  }
}