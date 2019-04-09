
if (typeof module != 'undefined') {
	module.exports = Wall;
}
function Wall(x, y) {
	this.x = x;
	this.y = y;
	
	this.image = null;
	
	this.wallWithoutImage = wallWithoutImage;
}

function wallWithoutImage() {
	return new Wall(this.x, this.y);
}