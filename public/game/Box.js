if (typeof module != 'undefined') {
	module.exports = Box;
}
function Box() {
	this.x = -1;
	this.y = -1;
	this.item = null:
	this.image = null;
	
	this.boxWithoutImage = boxWithoutImage;
}

function boxWithoutImage() {
	var b = new Box();
	b.x = this.x;
	b.y = this.y;
	b.item = this.item.itemWithoutImage();
	
	return b;
}