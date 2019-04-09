// // public
// var name = '';
// var currentGame = '';
// var bomb_limit = 1;
// var bomb_power = 1;
// var speed = 1;
// var x = 0;
// var y = 0;

// private
// var bomb_dropped = 0;
// module.exports = Player;
// module.exports.Player = Player;
if (typeof module != 'undefined') {
	module.exports = Player;
}
function Player(playerName, playerX, playerY) {
	// public attributes
	this.name = playerName;
	//this.currentGame = currentGame;
	this.bomb_limit = 1;
	this.bomb_power = 1;
	this.speed = 1;
	this.bomb_dropped = 0;
	
	// utilisées seulement par le serveur
	this.x = playerX;
	this.y = playerY;
	
	this.lives = 1;
	this.color = '';
	this.animation = null;
	
	this.step = 5;
	
	this.facing = 'default'; // west, east, south, north
	this.moving = false; // west, east, south, north
	
	// public methods
	this.dropBomb = dropBomb;
	this.pickUpBomb = pickUpBomb;
	this.pickUpItem = pickUpItem;
	this.canDropBomb = canDropBomb;
	
	this.moveNorth = moveNorth;
	this.moveSouth = moveSouth;
	this.moveWest = moveWest;
	this.moveEast = moveEast;
	
	this.playerWithoutAnimation = playerWithoutAnimation;
	
	
	// this.setMoving = setMoving;
	this.setFacing = setFacing;
	
	// init
	// this.name = playerName;
}

function moveNorth() {
	this.animation.y -= this.step;
}
function moveSouth() {
	this.animation.y += this.step;
}
function moveWest() {
	this.animation.x -= this.step;
}
function moveEast() {
	this.animation.x += this.step;
}

function canDropBomb() {
	return this.bomb_dropped < this.bomb_limit;
}

function dropBomb() {
	this.bomb_dropped++;
}

function pickUpBomb() {
	this.bomb_dropped--;
}

function pickUpItem(item) {
	switch (item) {
		case 'bomb_up': // TODO utiliser constantes
			this.bomb_limit++;
			break;
		case 'bomb_down':
			if (this.bomb_limit > 1)
				this.bomb_limit--;
			break;
		case 'fire_up':
			this.bomb_power++;
			break;
		case 'fire_down':
			if (this.bomb_power > 1)
				this.bomb_power--;
			break;
		case 'speed_up':
			this.speed++;
			break;
		case 'speed_down':
			if (this.speed > 1)
				this.speed--;
			break;
	}
}

function playerWithoutAnimation() {
	p = new Player(this.name, this.animation.x, this.animation.y);
	p.bomb_limit = this.speed;
	p.bomb_power = this.bomb_power;
	p.speed = this.speed;
	p.facing = this.facing; // TODO utiliser walkEast, walkWest ? -comme bmpAnimation-
	p.moving = this.moving;
	return p;
}

// function setMoving(m) {
	// if (m == false) {
		// this.moving = false;
	// }
	// else {
		// console.log('setMoving(m) m=' + m);
		// this.moving = m;
		// this.facing = m;
	// }
// }

function setFacing(f) {
	this.facing = f;
}

function die() {
	this.lives--;
}

function isAlive() {
	return this.lives > 0;
}
