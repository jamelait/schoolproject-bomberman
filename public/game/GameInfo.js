var space = 30;
var horizontalSpace = 30;
var verticalSpace = 10;

function GameInfo(canvas) {
	// this.backgroundColor = backgroundColor;
	this.stage = new Stage(canvas);
	this.canvas = canvas;
	var s; // background Shape
	this.arrItem = new Object();
	this.arrValue = new Object();
	this.txtHeight = 18;
	this.itemHeight = 30;
	
	// Public methods
	this.addText = addText;
	this.addItem = addItem;
	this.setItemValue = setItemValue;
	this.update = update;
	this.setBackgroundColor = setBackgroundColor;
	this.getItemCount = getItemCount;
	this.setWidth = setWidth;
	this.removeItem = removeItem;
	
	this.createText = createText;
}

function addText(value) {
	// var txt = new Text(value, this.txtHeight +"px Arial", "#FFF");
	// txt.x = 0;
	// txt.y = (this.itemHeight * this.getItemCount());
	// txt.rotation = 0;
	var txt = this.createText(value);
	this.stage.addChild(txt);
}

function createText(value) {
	var txt = new Text(value, this.txtHeight +"px Arial", "#FFF");
	txt.x = 10;
	txt.y = (this.itemHeight * this.getItemCount());
	txt.rotation = 0;
	return txt;
}

function setBackgroundColor(r, g, b) {
	var g = new Graphics();
	g.beginFill(Graphics.getRGB(r,r,r));
	g.drawRect(0,0,this.canvas.width,this.canvas.height);
	s = new Shape(g);
	s.x = 0;
	s.y = 0;
	s.name = 'bg';
	
	if (typeof this.stage.getChildAt(0) != 'undefined' && this.stage.getChildAt(0).name == 'bg')
		this.stage.removeChildAt(0);
	this.stage.addChildAt(s, 0);
}

function addItem(item, bmp, width) {
	bmp.x = 10;
	bmp.y = (this.itemHeight * this.getItemCount()) ;
	this.stage.addChild(bmp);
	this.arrItem[item] = bmp;
	if (typeof width == 'undefined')
		width = bmp.image.width
	this.setWidth(item, width);
}

function removeItem(item) {
	this.stage.removeChild(this.arrItem[item]);
	this.stage.removeChild(this.arrValue[item]);
	delete this.arrItem[item];
	delete this.arrValue[item];
}

function setWidth(item, width) {
	if (typeof this.arrItem[item] == 'undefined')
		return;
	this.arrItem[item].width = width;
}

function setItemValue(item, value) {
	if (typeof this.arrItem[item] == 'undefined')
		return;
		
	// Vérifier si l'item a une valeur
	if (typeof this.arrValue[item] != 'undefined') {
		// S'il a une valeur, la changer
		this.arrValue[item].text = value;
	}
	else {
		// Sinon l'ajouter
		txt = new Text(value, this.txtHeight +"px Arial", "#FFF");
		// txt.x = this.arrItem[item].x + this.arrItem[item].image.width + 10;
		txt.x = this.arrItem[item].x + this.arrItem[item].width + 10;
		txt.y = this.arrItem[item].y + this.txtHeight;// Récuperer le x de item
		txt.rotation = 0;
		this.arrValue[item] = txt;
		this.stage.addChild(txt);
	}
}

function update() {
	this.stage.update();
}

// function createItem(item) {
	// return { item: item, bmp: new Array() };
// }

// function getY() {

// }

function getItemCount() {
	// var count = 0;
	// for (var item in this.arrItem) {
		// count++;
	// }
	// return count;
	return this.stage.getNumChildren();
}