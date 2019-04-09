if (typeof module != 'undefined') {
	module.exports = GameState;
}
function GameState() {
	this.sender = '';
	this.players = new Object();
	this.bombs = new Array();
	this.boxes = new Object();
	this.pickedUpItems = new Array(); // TODO Le serveur doit etre autoritaire
	this.deads = new Array(); // TODO Le serveur doit etre autoritaire
}