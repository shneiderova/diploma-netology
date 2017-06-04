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
      throw new Error("Фигня в первом аргументе, батенька");
    }

    if (size == undefined) {
      this.size = new Vector(1, 1);
    } else if (size instanceof Vector) {
      this.size = size;
    } else {
      throw new Error("Фигня во втором аргументе, батенька");
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

  /**
   * Метод проверяет, пересекается ли текущий объект с переданным объектом, и если да, возвращает <code>true</code>,
   * иначе <code>false</code>.
   *Принимает один аргумент — движущийся объект типа Actor. Если передать аргумент другого типа или вызвать без аргументов, то метод бросает исключение.
   Если передать в качестве аргумента этот же объект, то всегда возвращает false. Объект не пересекается сам с собой.
   * Объекты, имеющие смежные границы, не пересекаются.
   * @param actor движущийся объект типа Actor.
   */
  isIntersect(actor) {
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
  actorAt(actor) {
    if (actor !== undefined && actor instanceof Actor) {

    } else {
      throw new Error("Дядя Боря передал нам не Actor!");
    }
  }

  obstacleAt() {

  }

  removeActor() {

  }

  noMoreActors() {

  }

  playerTouched() {

  }
}
