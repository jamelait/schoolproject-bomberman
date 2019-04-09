
var canvas;
var stage;
var background;
var bmpAnimation;
//var bmpAnimationExplosion;
var imgWall;
var imgBombUp;
var imgFireUp;
var imgSpeedUp;
var SQUARE_SIZE = 30;
var KEY_CODE_LEFT = 37;
var KEY_CODE_RIGHT = 39;
var KEY_CODE_UP = 38;
var KEY_CODE_DOWN = 40;
var KEY_CODE_SPACE = 32;
var KEY_CODE_ENTER = 13;
var lfHeld;
var rtHeld;
var upHeld;
var dwHeld;
var keyDn;

var spacePushed;
var enterPushed;

var array_dropped_bombs;
var array_dropped_bombs_time;
var array_boxes;
var array_wall;
var array_item; // objets apparus mais pas récupérés

var counter_bomb = 0;
var WALL_CODE = 0;
var BOX_CODE_WITH_NOTHING = 1;
var BOX_CODE_WITH_BOMB_UP = 2;
var BOX_CODE_WITH_SPEED_UP = 3;
var BOX_CODE_WITH_FIRE_UP = 4;

var gameMap = [
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0, , , , , , , ,0, , , , ,1, , ,0],
[0, ,0,2,0,4,0, ,0, ,0, ,0, ,0, ,0],
[0, ,2, ,2,4, , , , , ,1, ,1, , ,0],
[0, ,0, ,0,4,0, ,0, ,0, ,0, ,0, ,0],
[0, ,2, , , ,1, , , , ,1, , , , ,0],
[0, ,0, ,0,1,0, ,0, ,0, ,0,1,0, ,0],
[0, , , , , , ,1, , , , , , , ,1,0],
[0, ,0, ,0, ,0, ,0,1,0, ,0, ,0, ,0],
[0, ,1, , , , , , ,1, , , , , , ,0],
[0, ,0, ,0,1,0, ,0,1,0, ,0,1,0, ,0],
[0, ,3,4, , ,1, , , ,1, , , , , ,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];
var bomb_power = 1;
var bomb_limit = 1;
var bomb_dropped = 0;
var speed = 1;
var walkThroughWall = false;

var players = new Array();

var px = 15; // longueur d'un pas //2.5

//var imgSpriteExplosion;
var spriteSheetExplosion;

var leftPressed = false;

var images = new Object();
var resources = [
    "/images/wall.png",
	"/images/box.png",
	"/images/explosion_bomb_animation.png",
	"/images/player.png",
    "/images/speed_up.png",
    "/images/fire_up.png",
    "/images/bomb_up.png",
    "/images/bomb.png"
];

var socket;
var pseudo;
var gamename; // pas besoin ?
var gameFrameTime = 5; // on envoie des infos toutes les gameFrameTime, utilisé dans tick
var currentFrame = 0; // compteur
var gameStartedTimes = 0; // unkown bug

var counter_box = 0;
var counter_wall = 0;

function init() {
	log.toggle();//log.move();
	log.info('init()');	console.log('in init()');
	
	socket = io.connect('ws://localhost:3389');
	pseudo = document.getElementById('hidden-pseudo').innerHTML;
	gamename = document.getElementById('hidden-gamename').innerHTML;
	socket.emit('askAuthorizationToPlay', { pseudo: pseudo, gamename: gamename }); // demander l'autorisation de jouer
	
	// attendre qu'il nous réponde ok pour commencer à charger les ressources
	socket.on('askAuthorizationToPlay', function(data) {
		log.debug('received askAuthrizationToPlay');
		if (data.canPlay) {
			console.log('game loading');
			preLoad();			
		}
		else {
			console.log('you cannot play, reason : ' + data.reason);//console.log('you cannot play' + data.reason);
		}
	});
	
	socket.on('receiveGameState', function(data) {
		handleReceiveGameState(data)
	});
	
}


function preLoad() {
	// Push each item into our manifest
	manifest = resources;

	// Create a preloader. There is no manfest added to it up-front, we will add items on-demand.
	preload = new createjs.PreloadJS();
	preload.onFileLoad = handleFileLoad;
	preload.onProgress = handleOverallProgress;
	//preload.onFileProgress = handleFileProgress;
	preload.onError = handleFileError;
	preload.onComplete = handleOverallComplete;
	preload.setMaxConnections(5);
	
	while (manifest.length > 0) {
		// Get the next manifest item, and load it
		var item = manifest.shift();
		preload.loadFile(item);
	}
}

// File complete handler
function handleFileLoad(event) {
	var src = event.result.src;
	var idx = src.lastIndexOf('/');
	var name = src.substring(idx + 1, src.length);
	images[name] = src;
	// console.log('handleFileLoad : ' + event.result.src);
	// Get a reference to the loaded image (<img/>)
	var img = event.result;
}
/*
// File progress handler
function handleFileProgress(event) {
	console.log('handleFileProgress : ' + event.result);
}
*/
// Overall progress handler
function handleOverallProgress(event) {
	//console.log('TOTAL: '+ preload.progress);
	var perc = preload.progress*100;
	// console.log('handleOverallProgress : ' + perc);
	/*if (perc == 100) {
		for (var item in images) {
			console.log(images[item]);
		}
	}*/
}

// An error happened on a file
function handleFileError(event) {
	// console.log('handleFileError : ' + event);
}

function handleOverallComplete(event) {
	//for (var item in images) {
	//	console.log(images[item]);
	//}
	console.log('resources loaded');
	// if (!gameStarted)
	gameStartedTimes++; // bug : on entre deux fois dans cet event mais seul le deuxieme start() fonctionne correctement
	if (gameStartedTimes == 2)
		start();
}

function start() {
	// gameStarted = true;
	
	console.log('in start()');
	var fps = 60;
	var originalPosition = new Object(); originalPosition.x = 90; originalPosition.y = 90;
	array_dropped_bombs = new Object();
	array_dropped_bombs_time = new Object();
	array_boxes = new Object();
	array_wall = new Object();
    array_item = new Array();
	//counter_bomb = 0;

    
    //bomb_power = 3;
    //bomb_limit = 1;
    //bomb_dropped = 0;
    //speed = 1;
    //walkThroughWall = false;
	
	canvas = document.getElementById("game");
	canvas.width = SQUARE_SIZE * 17;
	canvas.height = SQUARE_SIZE * 13;
	
	stage = new Stage(canvas);
	
	imgWall = new Image();
	imgWall.src = images['wall.png'];//"wall.png";
   
	imgBombUp = new Image();
	imgBombUp.src = images['bomb_up.png'];//"bomb_up.png";
	
	imgFireUp = new Image();
	imgFireUp.src = images['fire_up.png'];//"fire_up.png";
	
	imgSpeedUp = new Image();
	imgSpeedUp.src = images['speed_up.png'];//"speed_up.png";
	
	// preparation de l'animation d'explosion
	var imgSpriteExplosion = new Image();
	imgSpriteExplosion.src = images['explosion_bomb_animation.png'];//"explosion_bomb_animation.png";
	spriteSheetExplosion = new SpriteSheet({
		images: [imgSpriteExplosion], 
		frames: {width: 30, height: 30, count: 2, regX: 0, regY: 0},
		animations: {    
			explodeCenter:  [0, 1, false, 1]
		}
	});
	
	// background vert
	var g = new Graphics();
	g.beginFill(Graphics.getRGB(108,158,75)); /* bomberman 0 117 0*/
	g.drawRect(0,0,canvas.width,canvas.height);
	var s = new Shape(g);
	s.x = 0;
	s.y = 0;
	stage.addChild(s);
	
   // BACKGROUND WALLS AND BOXES

	for(var y = 0; y < gameMap.length; y++) {
		for (var x = 0 ; x < gameMap[y].length ; x++) {
			switch(gameMap[y][x]) {
				case WALL_CODE:
					createWall(x, y);
					break;
				case BOX_CODE_WITH_NOTHING:
					createBox(x, y, BOX_CODE_WITH_NOTHING);
					break; 
				case BOX_CODE_WITH_BOMB_UP:
					createBox(x, y, BOX_CODE_WITH_BOMB_UP);
					break;
				case BOX_CODE_WITH_FIRE_UP:
					createBox(x, y, BOX_CODE_WITH_FIRE_UP);
					break;
				case BOX_CODE_WITH_SPEED_UP:
					createBox(x, y, BOX_CODE_WITH_SPEED_UP);
					break;
			}
		}
	}
	
	// bmpAnimation = createPlayerAnimation(playerName, x, y);
	console.log('avant createPlayer' + players);
	createPlayerAnimation(pseudo);
   
	Ticker.addListener(window);
	Ticker.useRAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || 
				window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
	Ticker.setInterval(fps);
	
	// KEY EVENTS
	keyDn = false;
	lfHeld = false;
	rtHeld = false;
	upHeld = false
	dwHeld = false;
	document.onkeydown=handleKeyDown;
	// document.documentElement.onkeydown = handleKeyDown;
	// document.body.focus();
	document.onkeyup=handleKeyUp;
	spacePushed = false;
	// canvas.focus();
	stage.update();
	console.log('fini');

	// load the resources
	// game = new Object();
	// game.gameName = gamename;
	// game.players = gameState.players
	// mettre la map sans les boites
	// use gameStage pour mettre les boites
	// use gameState pour positionner le joueur
	
}

function createWall(x, y) {
	var bWall = new Bitmap(imgWall);
	bWall.x = x * SQUARE_SIZE;
	bWall.y = y * SQUARE_SIZE;
	stage.addChild(bWall);
	bWall.name = "wall_" + counter_wall++;
	array_wall[bWall.name] = bWall;
}
function createBox(x, y, item) {
	var imgBox = new Image();
	imgBox.src = images['box.png'];//"box.png";
	var bBox = new Bitmap(imgBox);
	bBox.x = x * SQUARE_SIZE;
	bBox.y = y * SQUARE_SIZE;
	bBox.name = "box_" + counter_box++;
	array_boxes[bBox.name] = bBox;
	bBox.item = item;
	stage.addChild(bBox);		
}

function createPlayerAnimation(playerName) {
	
	var positions = [
	{x: 30, y: 30},
	{x: 450, y: 30},
	{x: 30, y: 330},
	{x: 450, y: 330}];
	var imgSprite = new Image();
	imgSprite.src = images['player.png'];//"player.png";

	var spriteSheet = new SpriteSheet({
		// image à utiliser et à découper
		images: [imgSprite], 
		// largeur, hauteur & point central de chacun des sprites
		frames: {width: 30, height: 30, count: 19, regX: 0, regY: 0},
		animations: {    
			walkWest: [0, 2],
			walkSouth: [3, 5],
			walkNorth: [6, 8],
			walkEast: [9, 11],
			die: [12, 18, false, 1]
		}
	});
	
	var bmpAnimationPlayer = new BitmapAnimation(spriteSheet);
	// On lance la séquence d’animation
	if (players.length % 2 == 0)
		bmpAnimationPlayer.gotoAndStop("walkEast");
	else
		bmpAnimationPlayer.gotoAndStop("walkWest");
	bmpAnimationPlayer.name = playerName;
	// bmpAnimationPlayer.direction = 90;
	bmpAnimationPlayer.vX = 1;
	bmpAnimationPlayer.x = positions[players.length].x//x;
	bmpAnimationPlayer.y = positions[players.length].y//y;
	
	console.log(players);
	console.log(players.length + ' position de ' + playerName + ' : ' + positions[players.length].x + ',' + positions[players.length].y);
	
	bmpAnimation = bmpAnimationPlayer;
	
	console.log(players.push(bmpAnimationPlayer));
	return stage.addChild(bmpAnimationPlayer);
}


function tick() {
	// COLLISION
	
	// var wall = new Object();
	// wall.x = 60; wall.y = 60;
	// wall.width = 30; wall.height = 30;
	
   // TODO utiliser thereIsAWall apres avoir ajuster la position ?
	//var willCollideOnRight = hasWallOnRight(bmpAnimation.x, bmpAnimation.y, wall.x, wall.y) && !walkThroughWall;
	//var willCollideOnLeft = hasWallOnLeft(bmpAnimation.x, bmpAnimation.y, wall.x, wall.y) && !walkThroughWall;
	//var willCollideOnBottom = hasWallOnBottom(bmpAnimation.x, bmpAnimation.y, wall.x, wall.y) && !walkThroughWall;
	//var willCollideOnTop = hasWallOnTop(bmpAnimation.x, bmpAnimation.y, wall.x, wall.y) && !walkThroughWall;
	//var willCollideOnRight = hasWallOnRight2(bmpAnimation.x, bmpAnimation.y);
	
	// MOVE

	/* // dans l'evenemeent deux variables sont mises à true : lfHeld et leftPressed
		if (leftPressed) {
			bmpAnimation.x -= 15; // a mettre dans player.moveLeft()
			if (bmpAnimation.x % 30 == 0 && !lfHeld) {
				leftPressed = false;bmpAnimation.gotoAndStop("walkWest");
				}
		}		
	*/
	///*
	if (lfHeld) {
		var willCollideOnLeft = thereIsAWall(bmpAnimation.x - 30, bmpAnimation.y) || thereIsABox(bmpAnimation.x - 30, bmpAnimation.y);
		if (bmpAnimation.x > imgWall.width && walkThroughWall || !willCollideOnLeft) {
			bmpAnimation.x -= px * bmpAnimation.vX;
		}
	} //*/
	else if (rtHeld) {
		var willCollideOnRight = thereIsAWall(bmpAnimation.x + 30, bmpAnimation.y) || thereIsABox(bmpAnimation.x + 30, bmpAnimation.y);
		//bmpAnimation.direction = -90;
		if (bmpAnimation.x < canvas.width - imgWall.width * 2 && walkThroughWall || !willCollideOnRight) {
			bmpAnimation.x += px * bmpAnimation.vX;
		}
	}
	else if (dwHeld) {
		var willCollideOnBottom = thereIsAWall(bmpAnimation.x, bmpAnimation.y + 30) || thereIsABox(bmpAnimation.x, bmpAnimation.y + 30);
		if (bmpAnimation.y < canvas.height - imgWall.height * 2 && walkThroughWall || !willCollideOnBottom) {
			bmpAnimation.y += px * bmpAnimation.vX;
		}
	}
	else if (upHeld) {
		var willCollideOnTop = thereIsAWall(bmpAnimation.x, bmpAnimation.y - 30) || thereIsABox(bmpAnimation.x, bmpAnimation.y - 30);
		if (bmpAnimation.y > imgWall.height && walkThroughWall || !willCollideOnTop) {
			bmpAnimation.y -= px * bmpAnimation.vX;
		}
	}
	
	// ?
	if(lfHeld && keyDn==false){
		bmpAnimation.gotoAndPlay("walkWest");
		keyDn=true;
	}
	if(rtHeld && keyDn==false){
		bmpAnimation.gotoAndPlay("walkEast");
		keyDn=true;
	}
	if (dwHeld && keyDn==false) {
		bmpAnimation.gotoAndPlay("walkSouth");
		keyDn=true;
	}
	if (upHeld && keyDn==false) {
		bmpAnimation.gotoAndPlay("walkNorth");
		keyDn=true;
	}
	
	// BOMBS
   
	if (spacePushed) {
		var canDropBomb = bomb_dropped < bomb_limit;
		if (canDropBomb) {
			bomb_dropped++;
			var imgBomb = new Image();
			imgBomb.src = images['bomb.png'];//"bomb.png";
			var bBomb = new Bitmap(imgBomb);
			bBomb.x = makeMultiple(bmpAnimation.x, 30, '+');
			bBomb.y = makeMultiple(bmpAnimation.y, 30, '-');
			bBomb.name = "bomb_" + counter_bomb++;
			array_dropped_bombs[bBomb.name] = bBomb;
			array_dropped_bombs_time[bBomb.name] = new Date().getTime();
			stage.addChild(bBomb);
			//stage.swapChildren(bBomb, bmpAnimation); // positionner le joueur au dessus de la bombe
		}
		spacePushed = false;
	}
   
	// faire disparaitre les bombes
	var loopArrayBomb = new Object();
	for (var key in array_dropped_bombs) {
		loopArrayBomb[key] = array_dropped_bombs[key];
	}
	var loopArrayBox = new Object();
	for (var keyBox in array_boxes) {
		loopArrayBox[keyBox] = array_boxes[keyBox];
	}
	
	for (var key in loopArrayBomb) {
			var bomb = array_dropped_bombs[key];
			//alert(key + " dropped at " + array_dropped_bombs_time[key]);
			var now = new Date().getTime();
			// Si la bombe a été posée suffisament longtemps
			if ((now - array_dropped_bombs_time[key]) >= 2000) { // 1s = 1000ms
            
				stage.removeChild(bomb);
				delete array_dropped_bombs[key];
				bomb_dropped--;
            
				// trouver la portée d'explosion de la bombe à droite
				var intRightBlast = 0;
				var intLeftBlast = 0;
				var intTopBlast = 0;
				var intBottomBlast = 0;
				
				// Il peut y avoir soit un mur soit une caisse
				// si'il y a une caisse on enregistre ses coordonées pour l'exploser
				var boxToBlastOnRight = new Object();
				for (var i = 1 ; i <= bomb_power ; i++) {
					if (thereIsAWall(bomb.x + 30 * i, bomb.y) || thereIsABox(bomb.x + 30 * i, bomb.y)) {
						if (thereIsABox(bomb.x + 30 * i, bomb.y)) {
							intRightBlast++;
							boxToBlastOnRight.x = bomb.x + 30 * i;
							boxToBlastOnRight.y = bomb.y;
						}
						
						break; // On sort de la boucle dès qu'on trouve un obstacle
					}
					else {
						intRightBlast++;
					}
				}
				
				// LEFT BOX TO BLAST
				var boxToBlastOnLeft = new Object();
				for (var i = 1 ; i <= bomb_power ; i++) {
					if (thereIsAWall(bomb.x - 30 * i, bomb.y) || thereIsABox(bomb.x - 30 * i, bomb.y)) {
						if (thereIsABox(bomb.x - 30 * i, bomb.y)) {
							intLeftBlast++;
							boxToBlastOnLeft.x = bomb.x - 30 * i;
							boxToBlastOnLeft.y = bomb.y;
						}
						break; // On sort de la boucle dès qu'on trouve un obstacle
					}
					else {
						intLeftBlast++;
					}
				}
				
				// TOP BOX TO BLAST
				var boxToBlastOnTop = new Object();
				for (var i = 1 ; i <= bomb_power ; i++) {
					if (thereIsAWall(bomb.x, bomb.y - 30 * i) || thereIsABox(bomb.x, bomb.y - 30 * i)) {
						if (thereIsABox(bomb.x, bomb.y - 30 * i)) {
							intTopBlast++;
							boxToBlastOnTop.x = bomb.x;
							boxToBlastOnTop.y = bomb.y - 30 * i;
						}
						break; // On sort de la boucle dès qu'on trouve un obstacle
					}
					else {
						intTopBlast++;
					}
				}
				
				// BOTTOM BOX TO BLAST
				var boxToBlastOnBottom = new Object();
				for (var i = 1 ; i <= bomb_power ; i++) {
					if (thereIsAWall(bomb.x, bomb.y + 30 * i) || thereIsABox(bomb.x, bomb.y + 30 * i)) {
						if (thereIsABox(bomb.x, bomb.y + 30 * i)) {
							intBottomBlast++;
							boxToBlastOnBottom.x = bomb.x;
							boxToBlastOnBottom.y = bomb.y + 30 * i;
						}
						break; // On sort de la boucle dès qu'on trouve un obstacle
					}
					else {
						intBottomBlast++;
					}
				}
				
				// Mort du joueur
				var bombermanInBlast = 
					bmpAnimation.x >= bomb.x && bmpAnimation.x < (bomb.x + 30) + 30 * intRightBlast || // right
					bmpAnimation.x < bomb.x && bmpAnimation.x >= (bomb.x - 0) - 30 * intLeftBlast ||
					false;
				/*
				// TODO mettre en place ces fonctions
				bombermanInBlast = isInLeftBlast(bmpAnimation.x, bmpAnimation.y, intLeftBlast);
				bombermanInBlast |= isInRightBlast(bmpAnimation.x, bmpAnimation.y, intRightBlast);
				bombermanInBlast |= isInTopBlast(bmpAnimation.x, bmpAnimation.y, intTopBlast);
				bombermanInBlast |= isInBottomtBlast(bmpAnimation.x, bmpAnimation.y, intBottomBlast);
				*/
				/*
				log.info('bombermanInBlast = ' + bombermanInBlast);
				if (bombermanInBlast)
					killPlayer();
				*/
				displayExplosion(bomb.x, bomb.y, intLeftBlast, intRightBlast, intTopBlast, intBottomBlast);
				
				var boxesToBlast = // true s'il y a au moins une boite a exploser
					boxToBlastOnRight.x != undefined ||
					boxToBlastOnLeft.x != undefined ||
					boxToBlastOnTop.x != undefined ||
					boxToBlastOnBottom.x != undefined
				;
				
				//log.error('boxToBlastOnRight.x = ' + boxToBlastOnRight.x);
				//log.info('boxesToBlast = ' + boxesToBlast);
				
				if (boxesToBlast) {
					for (var keyBox in loopArrayBox) {
						var box = array_boxes[keyBox];
						// trouver si la box se trouve dans l'explosion
						
						var blastBox = box.x == boxToBlastOnRight.x && box.y == boxToBlastOnRight.y;
						blastBox |= box.x == boxToBlastOnLeft.x && box.y == boxToBlastOnLeft.y;
						blastBox |= box.x == boxToBlastOnTop.x && box.y == boxToBlastOnTop.y;
						blastBox |= box.x == boxToBlastOnBottom.x && box.y == boxToBlastOnBottom.y;
						
						//alert("box.item = " + box.item);
						//alert("box.item = " + box.item + " blastBox = " + blastBox);
						//log.debug("blastBox = " + blastBox);
						if (blastBox) {
							// detruire les caisses aux alentours
							stage.removeChild(box);
							delete array_boxes[keyBox];
							// Retirer la box de gameMap
							var idX = getIndex(box.x);
							var idY = getIndex(box.y);
							gameMap[idY][idX] = undefined;
							
							// Remplacer la box par l'item
							var boxHoldsItem = box.item != BOX_CODE_WITH_NOTHING;
							if (boxHoldsItem) {
								var bItem;
								switch (box.item) {
								case BOX_CODE_WITH_BOMB_UP:
									bItem = new Bitmap(imgBombUp);
									break;
								case BOX_CODE_WITH_SPEED_UP:
									bItem = new Bitmap(imgSpeedUp);
									break;
								case BOX_CODE_WITH_FIRE_UP:
									bItem = new Bitmap(imgFireUp);
									break;
						    }
							bItem.x = box.x;
							bItem.y = box.y;
							bItem.name = box.item;
							stage.addChild(bItem);
							stage.swapChildren(bItem, bmpAnimation);
							array_item.push(bItem);
                       
							} // fin if box holds item
							
						} // fin if blast box
							   
					} // fin loop box
				} // fin if boxes to blast
				
			} // fin if explosion bombe
	} // fin boucle des bombes posées
   
   // Ramassage des item
   if (array_item.length > 0) {
      var i = 0;
      for (i = 0; i < array_item.length ; i++) {
        var item = array_item[i];
		if (item.x == bmpAnimation.x && item.y == bmpAnimation.y) { // joueur est sur l'item
			switch (item.name) {
				case BOX_CODE_WITH_BOMB_UP:
					bomb_limit++;
					log.debug('bomb_limit = ' + bomb_limit);
					break;
				case BOX_CODE_WITH_SPEED_UP:
					speed++;
					bmpAnimation.vX = speed;
					log.debug('speed = ' + speed);
					break;
				case BOX_CODE_WITH_FIRE_UP:
					bomb_power++;
					log.debug('bomb_power = ' + bomb_power);
					break;
			}
            stage.removeChild(item);
            break;
		} // end if player on item
      } // end loop
      
      array_item.splice(i, 1); // remove item
      
    } // end ramassage des item
	
	if (enterPushed) {
		//log.clear();
		enterPushed = false;
		log.info("position = " + bmpAnimation.x +',' + bmpAnimation.y);
		//log.info("there is a wall : " + thereIsAWall(bmpAnimation.x, bmpAnimation.y));
		//alert("there is a box : " + thereIsABox(bmpAnimation.x, bmpAnimation.y));
	}
	
	stage.update();
	currentFrame++;
	if (currentFrame == gameFrameTime) {
		sendGameState();
		currentFrame = 0
	}
}
/*****/
function getIndex(x) {
	if (x % 30 != 0)
		return null;
	else
		return x / 30;
}

/****/
function killPlayer() {
	bmpAnimation.gotoAndPlay("die");
	bmpAnimation.onAnimationEnd = handleEndKillPlayerAnimation;
}
/****/
function displayExplosion(x, y, leftBlast, rightBlast, topBlast, bottomBlast) {

	log.debug('x = ' + x + ', y = ' + y + ', leftBlast = ' + leftBlast + ', rightBlast = ' + rightBlast + ', topBlast = ' + topBlast + ', bottomBlast = ' + bottomBlast);
   
   // center blast
	bmpAnimationExplosion = new BitmapAnimation(spriteSheetExplosion);
	bmpAnimationExplosion.onAnimationEnd = handleEndBlastAnimation;
	bmpAnimationExplosion.x = x;
	bmpAnimationExplosion.y = y;
	bmpAnimationExplosion.gotoAndPlay("explodeCenter:");
	stage.addChild(bmpAnimationExplosion);
	  
   // right blast
   for (var i = 1; i <= rightBlast; i++) {
		bmpAnimationExplosion = new BitmapAnimation(spriteSheetExplosion);
		bmpAnimationExplosion.onAnimationEnd = handleEndBlastAnimation;
		bmpAnimationExplosion.x = x + 30 * i;
		bmpAnimationExplosion.y = y;
		bmpAnimationExplosion.gotoAndPlay("explodeCenter:");
		stage.addChild(bmpAnimationExplosion);
   }
   
   // left blast
   for (var i = 1; i <= leftBlast; i++) {
		bmpAnimationExplosion = new BitmapAnimation(spriteSheetExplosion);
		bmpAnimationExplosion.onAnimationEnd = handleEndBlastAnimation;
		bmpAnimationExplosion.x = x - 30 * i;
		bmpAnimationExplosion.y = y;
		bmpAnimationExplosion.gotoAndPlay("explodeCenter:");
		stage.addChild(bmpAnimationExplosion);
   }
   
   // top blast
   for (var i = 1; i <= topBlast; i++) {
		bmpAnimationExplosion = new BitmapAnimation(spriteSheetExplosion);
		bmpAnimationExplosion.onAnimationEnd = handleEndBlastAnimation;
		bmpAnimationExplosion.x = x;
		bmpAnimationExplosion.y = y - 30 * i;
		bmpAnimationExplosion.gotoAndPlay("explodeCenter:");
		stage.addChild(bmpAnimationExplosion);
   }
   
   // bottom blast
   for (var i = 1; i <= bottomBlast; i++) {
      bmpAnimationExplosion = new BitmapAnimation(spriteSheetExplosion);
      bmpAnimationExplosion.onAnimationEnd = handleEndBlastAnimation;
      bmpAnimationExplosion.x = x;
      bmpAnimationExplosion.y = y + 30 * i;
      bmpAnimationExplosion.gotoAndPlay("explodeCenter:");
      stage.addChild(bmpAnimationExplosion);
   }
}

function handleEndBlastAnimation(animation, name) {
   stage.removeChild(animation);
}

function handleEndKillPlayerAnimation(animation, name) {
	stage.removeChild(animation);
	test();
}

function makeMultiple(value, multipleOf, operator) {
   if (operator != '+' && operator != '-')
      operator = '-'; // default
   while (value % multipleOf != 0) {
      if (operator == '+')
         value++;
      else
         value--;
   }
   return value;
}

function hasWallOnRight2(leftX, leftY) {
	// get right immediate right walls
	var hasWall = false;
	/*
	for (var wall2 in arrayWall) {
	//log.error('call hasWallOnRight array');
		//log.info(wall2);
		if (hasWallOnRight(leftX, leftY, wall2.x, wall2.y)) {
			hasWall = true;
			break;
		}
	}
	*/
	return hasWall;
}
/****/
function hasWallOnRight(leftX, leftY, rightX, rightY) {
	var hasWall = leftX < rightX && leftX + 30 <= rightX;
		// le wall se trouve dans son axe horizontal droite
		// se trouve dans les environs
		hasWall &= leftX >= rightX - 30;
		// se trouve dans l'axe horizontal
		hasWall &= 
			leftY >= rightY && leftY < rightY + 30 ||
			leftY + 30 > rightY && leftY + 30 < rightY + 30
		;
	return hasWall;
}
/****/
function hasWallOnLeft(rightX, rightY, leftX, leftY) {
	var hasWall = rightX > leftX &&  // se trouve ? droite
	rightY + 30 > leftY && // se trouve ? droite
	rightX <= leftX + 30 && // se trouve dans l'axe vertical du mur
	rightY + 30 < leftY + 30 * 2;
	
	return hasWall;
}
/****/
function hasWallOnTop(bottomX, bottomY, topX, topY) {
	// se trouve en bas du wall
	var hasWall = bottomY >= topY + 30;
	// se trouve dans les environs
	hasWall &= bottomY + 30 <= topY + 30 * 2;
	hasWall &= 
		bottomX >= topX && bottomX < topX + 30 ||
		bottomX + 30 > topX && bottomX + 30 < topX + 30
		;
	return hasWall;
}
/****/
function hasWallOnBottom(topX, topY, bottomX, bottomY) {
	// Va percuter le mur si on continue d'aller en bas
	// se trouve  en haut du wall
	var hasWall = topY < bottomY;
	// se trouve dans les environs
	hasWall &= topY >= (bottomY - 30);
	// se trouve dans l'axe vertical
	hasWall &=
		topX >= bottomX && topX < bottomX + 30 ||
		topX + 30 > bottomX && topX + 30 < bottomX + 30
		;
	return hasWall;
}
/****/
function thereIsAWall(x, y) {
	var indexX = getIndex(x);//var indexX = x / 30;
	var indexY = getIndex(y);//var indexY = y / 30;
	if (indexX == undefined || indexY == undefined) {
		log.error('indexX = ' + indexX + ', indexY = ' + indexY);
		return false;
	}
	return gameMap[indexY][indexX] == WALL_CODE;
}
/****/

function thereIsABox(x, y) {
	var indexX = getIndex(x);//var indexX = x / 30;
	var indexY = getIndex(y);//var indexY = y / 30;

	if (indexX == undefined || indexY == undefined) {
		log.error('indexX = ' + indexX + ', indexY = ' + indexY);
		return false;
	}
	
    var code = gameMap[indexY][indexX];

    return code == BOX_CODE_WITH_NOTHING ||
      code == BOX_CODE_WITH_BOMB_UP || 
      code == BOX_CODE_WITH_SPEED_UP || 
      code == BOX_CODE_WITH_FIRE_UP
   ;
}

function thereIsABox_ori(x, y) {
	var indexX = x / 30;
	var indexY = y / 30;
    var code = gameMap[indexY][indexX];

    return code == BOX_CODE_WITH_NOTHING ||
      code == BOX_CODE_WITH_BOMB_UP || 
      code == BOX_CODE_WITH_SPEED_UP || 
      code == BOX_CODE_WITH_FIRE_UP
   ;
}
/****/
function getMapObject(x, y) {
	var indexX = x / 30;
	var indexY = y / 30;
	return gameMap[indexY][indexX];
}
/****/
function handleKeyDown(e) {
//log.info(e.which);
	if(!e){ var e = window.event; }
	prevent = false;
	switch(e.keyCode) {
		case KEY_CODE_LEFT:
			//bmpAnimation.gotoAndPlay("walkWest"); // a qqc a voir avec code mystere
			lfHeld = true;
			// leftPressed = true;
			prevent = true;
			break;
		case KEY_CODE_RIGHT:
			//bmpAnimation.gotoAndPlay("walkEast");
			rtHeld = true;
			prevent = true;
			break;
		case KEY_CODE_UP:
			//bmpAnimation.gotoAndPlay("walkNorth");
			upHeld = true;
			prevent = true;
			break;
		case KEY_CODE_DOWN:
			//bmpAnimation.gotoAndPlay("walkSouth");
			dwHeld = true;
			prevent = true;
			break;
	}
	prevent |= e.keyCode == KEY_CODE_SPACE; // pour empecher le scroll par les touches du clavier
	if (prevent) {
		e.preventDefault();
		return false;
	}
}
/****/
function handleKeyUp(e) {
//log.info(e.which);
	if(!e){ var e = window.event; }
	
	if (e.keyCode == KEY_CODE_SPACE) {
		spacePushed = true;
	}
	if (e.keyCode == KEY_CODE_ENTER) {
		enterPushed = true;
	}
	
	switch(e.keyCode) {
		case KEY_CODE_LEFT:
			bmpAnimation.gotoAndStop("walkWest");
			keyDn=false;
			lfHeld = false;
			break;
		case KEY_CODE_RIGHT:
			bmpAnimation.gotoAndStop("walkEast");
			keyDn=false;
			rtHeld = false;
			break;
		case KEY_CODE_UP:
			bmpAnimation.gotoAndStop("walkNorth");
			keyDn=false;
			upHeld = false;
			break;
		case KEY_CODE_DOWN:
			bmpAnimation.gotoAndStop("walkSouth");
			keyDn=false;
			dwHeld = false;
			break;
	}
}

function test() {
noty({
	text: 'Tu viens de mourir, recommencer ?',
	type: 'alert',
	layout: 'center',
	theme: 'default',
	timeout: false,
	modal: true,
	closeWith: ['click'],
	callback: {
		onShow: function() {},
		afterShow: function() {},
		onClose: function() {},
		afterClose: function() {} //window.location = "/list";
	},
	animation: {
		open: {height: 'toggle'},
		close: {height: 'toggle'},
		easing: 'swing',
		speed: 0 // opening & closing animation speed
	},
	buttons: [
		{
			addClass: 'btn btn-primary',
			text: 'Ok', 
			onClick: function($noty) {
					init();
					$noty.close();
					noty({dismissQueue: true, force: true, layout: layout, theme: 'default', text: 'You clicked "Ok" button', type: 'success'});
				}
		},
		{
			addClass: 'btn btn-danger',
			text: 'Cancel',
			onClick: function($noty) {
					$noty.close();
					noty({dismissQueue: true, force: true, layout: layout, theme: 'default', text: 'You clicked "Cancel" button', type: 'error'});
				}
		}
	]
  	});
}

function notifyNewPlayer(playerName) {
}

function notifyPrivateGame() {
}

function notifyInvitationSent(toPlayerName) {
}

function sendGameState() {
	// console.log('in sendGameState');
	var gameState = players[0].x + ',' + players[0].y
	if (typeof socket == 'undefined')
		console.log('socket undefined');
	else {
		socket.emit('sendGameState', gameState);
		// console.log('game state sent');
	}
}

function handleReceiveGameState(gameState) {
	console.log('game state received ' + gameState.players['Jamel'].name);
	// s'il y a des nouveaux joueurs, les ajouter
	
	// changer les attributs de tous les joueurs et de la gameMap
	// afficher une notification si un joueur vient de rejoindre la partie
}

