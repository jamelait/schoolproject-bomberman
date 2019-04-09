
if (typeof module != 'undefined') {
	module.exports = Item;
}
function Item(name, x, y) {
	this.name = name;
	this.x = x;
	this.y = y;
	
	this.image = null;
	
	this.itemWithoutImage = itemWithoutImage;
}

function itemWithoutImage() {
	return new Item(this.name, this.x, this.y);
}