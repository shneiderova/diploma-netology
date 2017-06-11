'use strict';

class Vector {

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Принимает один аргумент — вектор, объект Vector.
   * Если передать аргумент другого типа, то бросает исключение Можно прибавлять к вектору только вектор типа Vector.
   * Создает и возвращает новый объект типа Vector, координаты которого будут суммой соответствующих координат
   * суммируемых векторов.
   * @param vector смещение относительно размеров
   * @returns {Vector}
   */
  plus(vector) {
    if (vector instanceof Vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    }
    throw new Error("Можно прибавлять к вектору только вектор типа Vector");
  }

  /**
   * Принимает один аргумент — множитель, число.
   * Создает и возвращает новый объект типа Vector, координаты которого будут равны соответствующим координатам
   * исходного вектора, умноженным на множитель.
   * @param factor
   * @returns {Vector}
   */
  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}

/**
 * Движущийся объект на игровом поле.
 */
class Actor {

  /**
   *
   * @param position
   * @param size
   * @param speed
   */
  constructor(position, size, speed) {
    if (position === undefined) {
      this.pos = new Vector();
    } else if (position instanceof Vector) {
      this.pos = position;
    } else {
      throw new Error("Ошибка в первом аргументе");
    }

    if (size === undefined) {
      this.size = new Vector(1, 1);
    } else if (size instanceof Vector) {
      this.size = size;
    } else {
      throw new Error("Ошибка во втором аргументе");
    }

    if (speed === undefined) {
      this.speed = new Vector();
    } else if (speed instanceof Vector) {
      this.speed = speed;
    } else {
      throw new Error("Посмотрите на спидометр, шофер!");
    }

    Object.defineProperty(this, "type", {configurable: true, get: function() { return "actor"; }});

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
      return ((actor.top < this.top && this.top < actor.bottom) || (this.top < actor.top && actor.top < this.bottom) ||
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
    this.player = this.actors === undefined ? undefined : this.actors.find((element) => {
      return element.type === "player";
    });

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
        if (this.grid.length === 0) return 0;
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
    //todo уточнить про класс Player, которого нет, а в тестах он есть
    if (!(actor instanceof Actor) || actor === undefined) throw new Error("Передан не Actor!");
    if (this.actors === undefined || this.actors.length < 2) return undefined;
    this.actors.forEach((current) => {
      if (actor.isIntersect(current)) return current;
    });
    return undefined;
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
    if (!destination instanceof Vector && !dims instanceof Vector) throw new Error("Что-то не является вектором!");
    //вычислить область, которая расположена в destinations с размером dims
    let area = new Actor(destination, dims);
    for (let actor of actors) {
      return area.isIntersect(actor);
    } //todo доделать
  }

  /**
   * Метод удаляет переданный объект с игрового поля. Если такого объекта на игровом поле нет, не делает ничего.
   * Принимает один аргумент, объект Actor. Находит и удаляет его.
   */
  removeActor(actor) {
    if (this.actors === undefined || actor === undefined) return;
    for (let index = 0; index < this.actors.length; index++)
      if (this.actors[index] === actor) {
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
    if (type === undefined) return true;
    for (let actor of this.actors) {
      if (actor.type === type) return false;
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

//todo удалить тестовый код
// const DictOfActors = Object.create(null);
// DictOfActors["@"] = Actor;
// DictOfActors["0"] = Coin;
// DictOfActors["="] = HorisontalFireball;
// DictOfActors["|"] = VerticalFireball;
// DictOfActors["v"] = FireRain;

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
    this.speed = new Vector(-this.speed.x, -this.speed.y);
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

/**
 * Класс Coin реализует поведение монетки на игровом поле. Чтобы привлекать к себе внимание, монетки должны
 * постоянно подпрыгивать в рамках своей ячейки. Класс должен наследовать весь функционал движущегося объекта Actor.
 */
class Coin extends Actor {

  /**
   * Принимает один аргумент — координаты положения на игровом поле, объект Vector.
   * Созданный объект должен иметь размер 0,6:0,6. А его реальные координаты должны отличаться от тех,
   * что переданы в конструктор, на вектор 0,2:0,1.
   * Свойство type созданного объекта должно иметь значение coin.
   * Также объект должен иметь следующие свойства:
   *   Скорость подпрыгивания, springSpeed, равная 8;
   *   Радиус подпрыгивания, springDist, равен 0.07;
   *   Фаза подпрыгивания, spring, случайное число от 0 до 2π.
   * @param position
   */
  constructor(position = new Vector()) {
    super(new Vector(position.x + 0.2, position.y + 0.1), new Vector(0.6, 0.6));
    Object.defineProperty(this, "type", { get : function () {return "coin"; }});
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = 2 * Math.PI * Math.random();
  }

  /**
   * Обновляет фазу подпрыгивания. Это функция времени.
   * Принимает один аргумент — время, число, по умолчанию 1.
   * Ничего не возвращает. Обновляет текущую фазу spring, увеличив её на скорость springSpeed, умноженную на время.
   * @param time
   */
  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  /**
   * Создает и возвращает вектор подпрыгивания. Не принимает аргументов.
   * Так как подпрыгивание происходит только по оси Y, то координата X вектора всегда равна нулю.
   * Координата Y вектора равна синусу текущей фазы, умноженному на радиус.
   * @returns {Vector}
   */
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  /**
   * Обновляет текущую фазу, создает и возвращает вектор новой позиции монетки.
   * Принимает один аргумент — время, число, по умолчанию 1.
   * Новый вектор равен базовому вектору положения, увеличенному на вектор подпрыгивания.
   * Увеличивать нужно именно базовый вектор положения, который получен в конструкторе, а не текущий.
   * @param time
   */
  getNextPosition(time) {
    this.updateSpring(time);
    return this.pos.plus(this.getSpringVector());
  }

  /**
   * Принимает один аргумент — время. Получает новую позицию объекта и задает её как текущую. Ничего не возвращает.
   * @param time
   */
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

/**
 * Класс Player содержит базовый функционал движущегося объекта, который представляет игрока на игровом поле.
 * Должен наследовать возможности Actor.
 */
class Player {
  /**
   * Принимает один аргумент — координаты положения на игровом поле, объект Vector.
   * Созданный объект, реальное положение которого отличается от того, что передано в конструктор, на вектор 0:-0,5.
   * Имеет размер 0,8:1,5. И скорость 0:0.
   * @param position
   */
  constructor(position) {
    this.prototype = Object.create(Actor.prototype);
    //Actor.apply(this, arguments);
    this.type = "player";
    this.pos = new Vector(position.x, position.y - 0.5);
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector();
  }
}

/**
 * Код для запуска уровня.
 * @type {[*]}
 */
// const grid = [
//   new Array(3),
//   ['wall', 'wall', 'lava']
// ];
// const level = new Level(grid);
// runLevel(level, DOMDisplay);