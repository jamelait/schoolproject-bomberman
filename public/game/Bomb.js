
if (typeof module != 'undefined') {
	module.exports = Bomb;
}
// function Bomb(id, by, power, time, x, y) {
function Bomb(id, power, time, x, y) {
	this.id = id;
	
	this.power = power;
	this.time = time;
	this.x = x;
	this.y = y;
	
	this.by = '';
	this.image = null;
	
	this.bombWithoutImage = bombWithoutImage;
}

function bombWithoutImage() {
	b = new Bomb(this.id, this.power, this.time, this.x, this.y);
	b.by = this.by;
	return b;
}