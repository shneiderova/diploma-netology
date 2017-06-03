'use strict';

//мой первый комент
class Vector {

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;    
  }

  plus(vector) {
    if (vector instanceof Vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    } else {
    	throw "Можно прибавлять к вектору только вектор типа Vector";//бросить исключение
    }
  }
  
  times(factor) {
  	return new Vector(this.x * factor, this.y * factor);
  }
}

class Actor {
  
  constructor() {
  	this.pos = new Vector();
  	this.size = new Vector(1, 1);
  	this.speed = new Vector();
  	this.type = 'actor';
  	//границы объекта
  	this.left = this.pos.x;
  	this.right = this.pos.plus(this.size).x;
  	this.top = this.pos.plus(this.size).y;
  	this.bottom = this.pos.y;
  }

  act() {
//ничего не делает
  }

  isIntersect(vector) {
    if (vector instanceof Vector) {
//если пересекаются true, если совпадают, рядом или далеко, то false
    } else {
    	throw new Error();
    }
  }
}

class Level {

  constructor(grid, actors) {
    this.grid = grid;
    this.actors = actors;
    this.player = new Actor();
    this.height;
    this.widht;
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
    	return true;
    }
  }

  actorAt(actor) {
    if (actor instanceof Actor) {

    } else {
    	throw new Error();
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
