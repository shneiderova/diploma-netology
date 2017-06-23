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
    Object.defineProperty(this, "type", {configurable: true, value: "actor", writable: false});
    this.startPos = new Vector(this.pos.x, this.pos.y);
    Object.defineProperty(this, "left", {configurable: true, get: () => this.pos.x});
    Object.defineProperty(this, "right", {configurable: true, get: () => this.pos.x + this.size.x});
    Object.defineProperty(this, "top", {configurable: true, get: () => this.pos.y});
    Object.defineProperty(this, "bottom", {configurable: true, get: () => this.pos.y + this.size.y});
   
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
      // Случай, когда объекты полностью совпадают.
      let equal = actor.top === this.top && actor.bottom === this.bottom && actor.left === this.left && actor.right === this.right;
      let intersectY = (actor.top < this.top && this.top < actor.bottom) || (this.top < actor.top && actor.top < this.bottom);
      let intersectX = (actor.left < this.left && this.left < actor.right) || (this.left < actor.left && actor.left < this.right);
      return equal || (intersectX && intersectY);
    } else {
      throw new Error("Я не могу это сравнить!");
    }
  }
}

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

    Object.defineProperty(this, "player", {get: function () {
        let player = undefined;
        if (this.actors !== undefined)
          for (let actor of this.actors)
            if (actor.type === "player") player = actor;
        return player;
    }});

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
    if (!(actor instanceof Actor) || actor === undefined) throw new Error("Передан не Actor!");
    if (this.actors === undefined || this.actors.length < 2) return undefined;
    for (let act of this.actors) if (actor.isIntersect(act)) return act;
    return undefined;
  }

  /**
   * Аналогично методу actorAt определяет, нет ли препятствия в указанном месте. Также этот метод контролирует
   * выход объекта за границы игрового поля.
   */
  obstacleAt(destination, dims) {
    if (!(destination instanceof Vector) && !(dims instanceof Vector)) throw new Error("Что-то не является вектором!");
    let actor = new Actor(destination, dims);
    let level = new Actor(new Vector(), new Vector(this.width, this.height));
    if (actor.bottom > level.bottom) return "lava";
    if (actor.left < level.left || actor.right > level.right || actor.top < level.top) return "wall";
    for (let row = Math.floor(actor.top); row < Math.ceil(actor.bottom); row++)
      for (let col = Math.floor(actor.left); col < Math.ceil(actor.right); col++) {
        if (this.grid[row][col] === undefined) continue;
        if (this.grid[row][col] === "lava") return "lava";
        if (this.grid[row][col] === "wall") return "wall";
      }
    return undefined;
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
    if (type === undefined || this.actors === undefined) return true;
    for (let actor of this.actors) {
      if (actor.type === type) return false;
    }
    return true;
  }

  /**
   * Один из ключевых методов, определяющий логику игры. Меняет состояние игрового поля при касании игроком
   * каких-либо объектов или препятствий.
   * Игрок побеждает, когда собирает все монеты на уровне.
   */
  playerTouched(type, actor) {
    if (this.status !== null) return;
    if (type === "lava" || type === "fireball") {
      this.status = "lost";
    }
    if (type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors("coin")) this.status = "won";
    }
  }
}

/**
 * Объект класса LevelParser позволяет создать игровое поле Level из массива строк по следующему принципу:
 *  * Каждый элемент массива соответствует строке в сетке уровня.
 *  * Каждый символ строки соответствует ячейке в сетке уровня.
 *  * Символ определяет тип объекта или препятствия.
 *  * Индекс строки и индекс символа определяют исходные координаты объекта или координаты препятствия.
 */
class LevelParser {

  /**
   * Принимает один аргумент — словарь движущихся объектов игрового поля, объект,
   * ключами которого являются символы из текстового представления уровня, а значениями — конструкторы,
   * с помощью которых можно создать новый объект.
   * @param dictionary
   */
  constructor(dictionary) {
    this.dictionary = dictionary;
  }

  /**
   * Принимает символ, строка. Возвращает конструктор объекта по его символу, используя словарь.
   * Если в словаре не нашлось ключа с таким символом, вернет undefined
   * @param symbol
   * @returns {Actor}
   */
  actorFromSymbol(symbol) {
    if (symbol === undefined) return undefined;
    return this.dictionary[symbol];
  }

  /**
   * Аналогично принимает символ, строка. Возвращает строку, соответствующую символу препятствия.
   * @param symbol
   * @returns {*}
   */
  obstacleFromSymbol(symbol) {
    if (symbol === "x") { return "wall"; }
    else if (symbol === "!") { return "lava"; }
  }

  /**
   * Принимает массив строк и преобразует его в массив массивов, в ячейках которого хранится либо строка,
   * соответствующая препятствию, либо undefined.
   * Движущиеся объекты не должны присутствовать на сетке.
   * @param strings
   */
  createGrid(strings) {
    if (strings.length < 1) return [];
    let grid = [], row;
    for (let string of strings) {
      row = [];
      for (let char of string)
        row.push(this.obstacleFromSymbol(char));
      grid.push(row);
    }
    return grid;
  }

  /**
   * Принимает массив строк и преобразует его в массив движущихся объектов, используя для их создания конструкторы из словаря.
   * @param strings
   */
  createActors(strings) {
    let actor, actors = [], char, func;
    for (let index = 0; index < strings.length; index++) {
      for (let jndex = 0; jndex < strings[index].length; jndex++) {
        char = strings[index][jndex];
        try {
          func = this.actorFromSymbol(char);
          actor = new func(new Vector(jndex, index));
          if (actor instanceof Actor) actors.push(actor);
        } catch (exception) {}
      }
    }
    return actors;
  }

  /**
   * Принимает массив строк, создает и возвращает игровое поле, заполненное препятствиями и движущимися объектами,
   * полученными на основе символов и словаря.
   * @param strings
   */
  parse(strings) {
    let grid = this.createGrid(strings);
    let actors = this.createActors(strings);
    return new Level(grid, actors);
  }
}

/**
 * Класс Fireball станет прототипом для движущихся опасностей на игровом поле. Он должен наследовать весь функционал
 * движущегося объекта Actor.
 */
class Fireball extends Actor {

  /**
   * Принимает два аргумента: координаты, объект Vector и скорость, тоже объект Vector. Оба аргумента необязательные.
   * По умолчанию создается объект с координатами 0:0 и скоростью 0:0.
   * Созданный объект должен иметь свойство type со значением fireball. Это свойство только для чтения.
   * Также должен иметь размер 1:1 в свойстве size, объект Vector.
   * @param position
   * @param speed
   */
  constructor(position = new Vector(), speed = new Vector()) {
    super(position, new Vector(1, 1), speed);
    Object.defineProperty(this, "type", {configurable: true, value: "fireball", writable: false});
  }

  /**
   * Создает и возвращает вектор Vector следующей позиции шаровой молнии. Это функция времени.
   * И как в школьной задаче, новая позиция — это текущая позиция плюс скорость, умноженная на время.
   * И так по каждой из осей.
   * Принимает один аргумент, время, число. Аргумент необязательный, по умолчанию равен 1.
   * @param time
   * @returns {Vector}
   */
  getNextPosition(time = 1) {
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }

  /**
   * Обрабатывает столкновение молнии с препятствием. Не принимает аргументов. Ничего не возвращает.
   * Меняет вектор скорости на противоположный. Если он был 5:5, то после должен стать -5:-5.
   */
  handleObstacle() {
    this.speed = new Vector(-this.speed.x, -this.speed.y);
  }

  /**
   * Обновляет состояние движущегося объекта.
   * @param time
   * @param level
   */
  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size))
      this.handleObstacle();
    else
      this.pos = nextPosition;
  }
}

/**
 * Он будет представлять собой объект, который движется по горизонтали со скоростью 2 и при столкновении
 * с препятствием движется в обратную сторону.
 * Конструктор должен принимать один аргумент — координаты текущего положения, объект Vector.
 * И создавать объект размером 1:1 и скоростью, равной 2 по оси X.
 */
class HorizontalFireball extends Fireball {
  constructor(position = new Vector(), speed = new Vector(2, 0)) {
    super(position, speed);
  }
}

/**
 * Он будет представлять собой объект, который движется по вертикали со скоростью 2 и при столкновении
 * с препятствием движется в обратную сторону.
 * Конструктор должен принимать один аргумент: координаты текущего положения, объект Vector.
 * И создавать объект размером 1:1 и скоростью, равной 2 по оси Y.
 */
class VerticalFireball extends Fireball {
  constructor(position = new Vector(), speed = new Vector(0, 2)) {
    super(position, speed);
  }
}

/**
 * Он будет представлять собой объект, который движется по вертикали со скоростью 3 и при столкновении
 * с препятствием начинает движение в том же направлении из исходного положения, которое задано при создании.
 * Конструктор должен принимать один аргумент — координаты текущего положения, объект Vector.
 * И создавать объект размером 1:1 и скоростью, равной 3 по оси Y.
 */
class FireRain extends Fireball {
  constructor(position = new Vector(), speed = new Vector(0, 3)) {
    super(position, speed);
  }

  handleObstacle() {
    this.pos = new Vector(this.startPos.x, this.startPos.y);
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
    Object.defineProperty(this, "type", {configurable: true, value: "coin", writable: false});
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
class Player extends Actor {
  /**
   * Принимает один аргумент — координаты положения на игровом поле, объект Vector.
   * Созданный объект, реальное положение которого отличается от того, что передано в конструктор, на вектор 0:-0,5.
   * Имеет размер 0,8:1,5. И скорость 0:0.
   * @param position
   */
  constructor(position = new Vector()) {
    super(new Vector(position.x, position.y - 0.5), new Vector(0.8, 1.5));
    Object.defineProperty(this, "type", {configurable: true, value: "player", writable: false});
  }
}

/**
 * Реализация самой игры.
 */
let levels = [
    [
      // "     v                 ",
      "                       ",
      "                       ",
      "                       ",
      "                       ",
      "  |xxx       w         ",
      "  o                 o  ",
      "  x               = x  ",
      "  x          o o    x  ",
      "  x  @    *  xxxxx  x  ",
      "  xxxxx             x  ",
      "      x!!!!!!!!!!!!!x  ",
      "      xxxxxxxxxxxxxxx  ",
      "                       "
    ],
    [
      // "     v                 ",
      "                       ",
      "                       ",
      "                       ",
      "                       ",
      "  |                    ",
      "  o                 o  ",
      "  x               = x  ",
      "  x          o o    x  ",
      "  x  @       xxxxx  x  ",
      "  xxxxx             x  ",
      "      x!!!!!!!!!!!!!x  ",
      "      xxxxxxxxxxxxxxx  ",
      "                       "
    ],
    [
      "        |           |  ",
      "                       ",
      "                       ",
      "                       ",
      "                       ",
      "                       ",
      "                       ",
      "                       ",
      "                       ",
      "     |                 ",
      "                       ",
      "         =      |      ",
      " @ |  o            o   ",
      "xxxxxxxxx!!!!!!!xxxxxxx",
      "                       "
    ],
    [
      "                       ",
      "                       ",
      "                       ",
      "    o                  ",
      "    x      | x!!x=     ",
      "         x             ",
      "                      x",
      "                       ",
      "                       ",
      "                       ",
      "               xxx     ",
      "                       ",
      "                       ",
      "       xxx  |          ",
      "                       ",
      " @                     ",
      "xxx                    ",
      "                       "
    ], [
    "   v         v",
    "              ",
    "         !o!  ",
    "              ",
    "              ",
    "              ",
    "              ",
    "         xxx  ",
    "          o   ",
    "        =     ",
    "  @           ",
    "  xxxx        ",
    "  |           ",
    "      xxx    x",
    "              ",
    "          !   ",
    "              ",
    "              ",
    " o       x    ",
    " x      x     ",
    "       x      ",
    "      x       ",
    "   xx         ",
    "              "
  ]
];
const actorDict = {
  '@': Player,
  '=': HorizontalFireball,
  'v': FireRain,
  '|': VerticalFireball,
  'o': Coin
};
const parser = new LevelParser(actorDict);
runGame(levels, parser, DOMDisplay)
  .then(() => alert('Вы выиграли приз!'));

