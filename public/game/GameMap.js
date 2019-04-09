if (typeof module != 'undefined') {
	module.exports = GameMap;
}
function GameMap(level) {
	switch (level) {
		case 1:
			this.map = map1;
			break;
		default:
			this.map = map1;
			break;
	}
	// this.map = new Array();
	
	this.convertToObject = convertToObject;
	this.getMap = getMap;
	// this.getLevel = getLevel;
}

function convertToObject(x, y) {
}

// function getLevel(l) {
	// switch(l) {
		// case 1:
			// return map1;
	// }
// }
function getMap() {
	return this.map;
}

/****************/
var map1 = [
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0, , , , , , , , , , , , , , , ,0],
[0, ,0, ,0,4,0, ,0, ,0, ,0, ,0, ,0],
[0, ,2, ,2,4, , , , , ,1, ,1, , ,0],
[0, ,0,2,0,4,0, ,0, ,0, ,0, ,0, ,0],
[0, ,2, , , ,1, , , , ,1, , , , ,0],
[0, ,0, ,0,1,0, ,0, ,0, ,0,1,0, ,0],
[0, , , , , , ,1, , , , , , , ,1,0],
[0, ,0, ,0, ,0, ,0,1,0, ,0, ,0, ,0],
[0, ,1, , , , , , ,1, , , , , , ,0],
[0, ,0, ,0,1,0, ,0,1,0, ,0,1,0, ,0],
[0, ,3,4, , ,1, , , ,1, , , , , ,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];