var SQUARE_SIZE = 30;
var KEY_CODE_LEFT = 37;
var KEY_CODE_RIGHT = 39;
var KEY_CODE_UP = 38;
var KEY_CODE_DOWN = 40;
var KEY_CODE_SPACE = 32;
var KEY_CODE_ENTER = 13;

var canvas;
var stage;
var gameInfo; // score et liste des joueurs

var me; // joueur courant
var imgWall;
var imgBombUp;
var imgFireUp;
var imgSpeedUp;
var imgBomb;

var lfHeld;
var rtHeld;
var upHeld;
var dwHeld;
var keyDn;
var spacePushed;
var enterPushed;

var array_dropped_bombs_img;
var array_dropped_bombs_time;
var new_dropped_bombs; // nouvelles bombes posées, à envoyer au serveur
var bombs_from_server; // nouvelles bombes posées, reçu du serveur
var array_boxes;
var array_wall;
var array_item; // objets apparus mais pas récupérés
var array_bombs; // objets apparus mais pas récupérés
var array_deads; //joueurs morts

var counter_bomb = 0;
var WALL_CODE = 0;
var BOX_CODE_WITH_NOTHING = 1;
var BOX_CODE_WITH_BOMB_UP = 2;
var BOX_CODE_WITH_SPEED_UP = 3;
var BOX_CODE_WITH_FIRE_UP = 4;

var gameMap = [];
var walkThroughWall = false;

var playersAnimation = new Object(); // tableau de BitmapAnimation

var px = 5;//15; // longueur d'un pas //2.5

//var imgSpriteExplosion;
var spriteSheetExplosion;

var leftPressed = false;

var images = new Object();
var resources = [
    "/images/wall.png",
	"/images/box.png",
	"/images/explosion_bomb_animation.png",
	"/images/player_blue.png",
	"/images/player_green.png",
	"/images/player_red.png",
	"/images/player_yellow.png",
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
var fps = 60;
var tickerStarted = false;

var quadtree;

function init() {
	// log.toggle();//log.move();
	log.info('init()');	//console.log('in init()');
	
	btnInvitation = document.getElementById('btnInvitation');
	if (btnInvitation != null)
		btnInvitation.onclick = handleSendInvitation;
	
	socket = io.connect('ws://localhost:3389');
	pseudo = document.getElementById('hidden-pseudo').innerHTML;
	gamename = document.getElementById('hidden-gamename').innerHTML;
	socket.emit('askAuthorizationToPlay', { pseudo: pseudo, gamename: gamename }); // demander l'autorisation de jouer
	
	// Attendre qu'il nous réponde ok pour commencer à charger les ressources
	socket.on('askAuthorizationToPlay', function(data) {
		log.debug('received askAuthorizationToPlay');
		if (data.canPlay) {
			gameMap = data.gameMap;
			preLoad();			
		}
		else {
			// console.log('you cannot play, reason : ' + data.reason);
			notyRedirect('Cette partie est privee et tu n\'est pas invite.', 'Retour a la liste', '/list');
		}
	});
	
	// La partie n'existe plus sur le serveur
	socket.on('error_gameRemoved', function(data) {
		console.log(data.message);
	});
	
	// Arrivée d'une invitation
	socket.on('srv_send_invitation', function(data) {
		notyInvitation(data);
	});
	
	// Résultat d'une invitation envoyée
	socket.on('srv_result_send_invitation', function(data) {
		if (data.success)
			notyInvitationSentSuccess(data.playerName);
		else
			notyInvitationSentError(data.playerName, data.reason);
	});
	
}

function handleSendInvitation() {
	invitePseudo = document.getElementById('invitePseudo').value;
	gamename = document.getElementById('hidden-gamename').innerHTML;
	socket.emit('clt_send_invitation', { to: invitePseudo, gameName: gamename });
}

function initGameInfo() {
	gameInfo = new GameInfo(document.getElementById("info"));
	gameInfo.setBackgroundColor(45, 45, 45);
	
	var rect = new Rectangle(90,0,30,30); // pour prendre juste la partie qui nous intéresse de l'image
	
	var bmpPlayerBlue = new Bitmap(images['player_blue.png']);
	bmpPlayerBlue.sourceRect = rect;
	var bmpPlayerRed = new Bitmap(images['player_red.png']);
	bmpPlayerRed.sourceRect = rect;
	var bmpPlayerGreen = new Bitmap(images['player_green.png']);
	bmpPlayerGreen.sourceRect = rect;
	var bmpPlayerYellow = new Bitmap(images['player_yellow.png']);
	bmpPlayerYellow.sourceRect = rect;
	
	gameInfo.addText('Joueurs');
	gameInfo.addItem('player_blue', bmpPlayerBlue, 30);
	gameInfo.addItem('player_red', bmpPlayerRed, 30);
	gameInfo.addItem('player_green', bmpPlayerGreen, 30);
	gameInfo.addItem('player_yellow', bmpPlayerYellow, 30);
	
	gameInfo.addText('');
	gameInfo.addText('Pouvoirs');
	gameInfo.addItem('bomb_limit', new Bitmap(images['bomb_up.png']), 30);
	gameInfo.addItem('bomb_power', new Bitmap(images['fire_up.png']), 30);
	gameInfo.addItem('speed', new Bitmap(images['speed_up.png']), 30);
	
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
	// console.log('resources loaded');
	// if (!gameStarted)
	gameStartedTimes++; // bug : on entre deux fois dans cet event mais seul le deuxieme start() fonctionne correctement
	if (gameStartedTimes == 2)
		start();
}

function start() {
	initGameInfo();
	// gameStarted = true;
	console.log('in start()');
	
	var originalPosition = new Object(); originalPosition.x = 90; originalPosition.y = 90;
	array_dropped_bombs_img = new Object();
	array_dropped_bombs_time = new Object();
	array_boxes = new Object();
	array_wall = new Object();
    array_item = new Array();
	new_dropped_bombs = new Array(); // bombes à envoyer au serveur
	bombs_from_server = new Array(); // bombes récupérées du serveur
	array_bombs = new Array(); // toutes les bombes
	array_deads = new Array(); // les noms des joueurs qui se trouveront dans le blast
	
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
	
	imgBomb = new Image();
	imgBomb.src = images['bomb.png'];
	
	// preparation de l'animation d'explosion
	var imgSpriteExplosion = new Image();
	imgSpriteExplosion.src = images['explosion_bomb_animation.png'];//"explosion_bomb_animation.png";
	spriteSheetExplosion = new SpriteSheet({
		images: [imgSpriteExplosion], 
		frames: {width: 30, height: 30, count: 5, regX: 0, regY: 0},
		animations: {    
			explodeCenter:  [0, 4, false, 1]
		}
	});
	
	// background vert
	var g = new Graphics();
	// g.beginFill(Graphics.getRGB(108,158,75)); /* bomberman 0 117 0*/
	g.beginFill(Graphics.getRGB(147,190,118)); /* bomberman 0 117 0*/
	g.drawRect(0,0,canvas.width,canvas.height);
	var s = new Shape(g);
	s.x = 0;
	s.y = 0;
	stage.addChild(s);
	
	// QUADTREE
	
	bounds = {
		x: 0,
		y: 0,
		width: canvas.width,
		height: canvas.height
	};
	quadtree = new QuadTree(bounds, false, 4, 4);
	
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
	console.log('start fini');

	// load the resources
	// game = new Object();
	// game.gameName = gamename;
	// game.players = gameState.players
	// mettre la map sans les boites
	// use gameStage pour mettre les boites
	// use gameState pour positionner le joueur
	
	socket.on('srv_set_gameState', function(data) {
		handleReceiveGameState(data)
	});
}

function createWall(x, y) {
	var bWall = new Bitmap(imgWall);
	bWall.x = x * SQUARE_SIZE;
	bWall.y = y * SQUARE_SIZE;
	stage.addChild(bWall);
	bWall.name = "wall_" + counter_wall++;
	array_wall[bWall.name] = bWall;
	if (bWall.x != 0 && bWall.y != 0 && bWall.x != 480 && bWall.y != 360) {
		quadtree.insert(bWall);
	}
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

function createPlayerAnimation(player) {
	// log.debug('createPlayerAnimation ' + player.name);
	var imgSprite = new Image();
	var src = 'player_' + player.color + '.png';
	imgSprite.src = images[src];//"player.png";
	gameInfo.setItemValue('player_' + player.color, player.name);
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

	bmpAnimationPlayer.name = player.name;
	// bmpAnimationPlayer.direction = 90;
	bmpAnimationPlayer.vX = 1;
	bmpAnimationPlayer.x = player.x;
	bmpAnimationPlayer.y = player.y;
	// On lance la séquence d’animation
	if (_.size(playersAnimation) % 2 == 0)
		bmpAnimationPlayer.gotoAndStop("walkEast");
	else
		bmpAnimationPlayer.gotoAndStop("walkWest");
	
	if (player.name == pseudo) {
		// Si c'est nous
		me = new Player(player.name, player.x, player.y);
		me.animation = bmpAnimationPlayer;
		gameInfo.setItemValue('bomb_limit', me.bomb_limit);
		gameInfo.setItemValue('bomb_power', me.bomb_power);
		gameInfo.setItemValue('speed', me.speed);
	}
	
	// ajouter l'animation du nouveau joueur au tableau des animations
	playersAnimation[player.name] = bmpAnimationPlayer;
	
	// player.animation = bmpAnimationPlayer;

	startTicker();
	return stage.addChild(bmpAnimationPlayer);
}

function startTicker() {
	if (tickerStarted) return;
	
	Ticker.addListener(window);
	Ticker.useRAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
	Ticker.setInterval(fps);
	
	tickerStarted = true;
}

function tick() {
	tick_moveMe();
	tick_moveOthers();
	tick_dropBombs();
	tick_removeBombs();
	tick_pickUpItems();
	
	stage.update();
	gameInfo.update();
	
	currentFrame++;
	if (currentFrame == gameFrameTime) {
		sendGameState();
		currentFrame = 0
	}
	
	if (gameIsOver()) {
		endGame();
	}
	
	if (enterPushed) {
		//log.clear();
		enterPushed = false;
		log.info("position = " + me.animation.x +',' + me.animation.y);
	}
	
	// console.log('ticked');
}

function tick_pickUpItems() {
	// var allPlayers = [];
	// _.each(playersAnimation, function(pa) {
		// allPlayers.push(pa);
	// });
	// allPlayers.push(me.animation);
	var array_remove_item_index = new Array();
	// Ramassage des item
   if (array_item.length > 0) {
      var i = 0;
      for (i = 0; i < array_item.length ; i++) {
	  
        var item = array_item[i];
			_.each(playersAnimation, function(p) {
				if (item.x == p.x && item.y == p.y) { // joueur est sur l'item
				array_remove_item_index.push(i);
				switch (item.name) {
					case BOX_CODE_WITH_BOMB_UP:
						if (p.name == me.name) me.pickUpItem('bomb_up'); 
						gameInfo.setItemValue('bomb_limit', me.bomb_limit); // bug ? doit etre dans le if aussi ?
						break;
					case BOX_CODE_WITH_SPEED_UP:
						me.animation.vX = me.speed;
						if (p.name == me.name) me.pickUpItem('speed_up');
						gameInfo.setItemValue('speed', me.speed);
						break;
					case BOX_CODE_WITH_FIRE_UP:
						if (p.name == me.name) me.pickUpItem('fire_up');
						gameInfo.setItemValue('bomb_power', me.bomb_power);
						break;
					}
					stage.removeChild(item);
				}
			});
      } // end loop
      
	_.each(array_remove_item_index, function(index) {
		array_item.splice(index, 1); // remove item
	});
      
      
    } // end ramassage des item
}

function tick_dropBombs() {
	// BOMBS FROM ME
	if (spacePushed && me.canDropBomb()) {
		me.dropBomb();
		var bBomb = new Bitmap(imgBomb);
		bBomb.x = makeMultiple(me.animation.x, 30, '+');
		bBomb.y = makeMultiple(me.animation.y, 30, '-');
		bBomb.name = me.name + "_bomb_" + counter_bomb++;
		// Ajout de la bombe pour l'envoi au serveur
		b = new Bomb(bBomb.name, me.bomb_power, new Date().getTime(), bBomb.x, bBomb.y);
		b.image = bBomb;
		b.by = me.name;
		new_dropped_bombs.push(b); // pour le serveur
		
		// array_dropped_bombs_img[bBomb.name] = bBomb;
		// array_dropped_bombs_time[bBomb.name] = new Date().getTime();
		array_bombs.push(b); // toutes les bombes
		stage.addChild(bBomb);
		//stage.swapChildren(bBomb, me.animation); // positionner le joueur au dessus de la bombe
	}
	spacePushed = false;
	
	// BOMBS FROM SERVER
	_.each(bombs_from_server, function(b) {
		if (b.by != me.name) {
			var bBomb = new Bitmap(imgBomb);
			bBomb.x = b.x;
			bBomb.y = b.y
			bBomb.name = b.id;
			stage.addChild(bBomb);
			b.image = bBomb;
			array_bombs.push(b);
		}
	});
	bombs_from_server = new Array();
}

function tick_removeBombs() {
	var array_remove_bomb_index = new Array(); // tableau des id des bombes à retirer de array_bombs
	var loopArrayBox = new Object();
	for (var keyBox in array_boxes) {
		loopArrayBox[keyBox] = array_boxes[keyBox];
	}
	
	_.each(array_bombs, function(b) { // pour chaque bombe qui a été posée par me ou par les autres
		var now = new Date().getTime();
		if ((now - b.time) >= 2000) { // Si la bombe a été posée suffisament longtemps
		log.debug('tick_removeBombs bomb by : ' + b.by);
			if (b.by == me.name)
				me.pickUpBomb(); // on récupère la bombe si c'est nous qui l'avons poser
			// Retrait des images
			stage.removeChild(b.image); // on retire l'image du jeu
			array_remove_bomb_index.push(array_bombs.indexOf(b)); // il faudra retirer cette bombe du tableau des bombes posées
			// Trouver la portée d'explosion
			var blast = getBlast(b);
			// Animation explosion
			displayExplosion(b.x, b.y, blast.left, blast.right, blast.top, blast.bottom);
			
			killPlayers(b, blast);
			
			// Retrait des images
			var boxToBlastOnRight = blast.boxToBlastOnRight;
			var boxToBlastOnLeft = blast.boxToBlastOnLeft;
			var boxToBlastOnTop = blast.boxToBlastOnTop;
			var boxToBlastOnBottom = blast.boxToBlastOnBottom;
			
			// TODO besoin d'un tableau de coordonnees des box pour faire marcher ce code
			// _.each(blast.boxes, function(box) {
				// var img = getMapObject(box.x, box.y);
				// stage.removeChild(box);
				// delete array_boxes[keyBox];
			// });
			// if (blast.blastRightBox
			// if (blast.boxesToBlast) {
				// // blast right box
				// if (
				// var blastBox = box.x == boxToBlastOnRight.x && box.y == boxToBlastOnRight.y;
			// }
			
			if (blast.boxesToBlast) {
				// TODO enregistrer les coordonnées des box qui correspond à une image de la box dans un tableau-associtif et utiliser une fonction getBoxAt(x, y)
				for (var keyBox in loopArrayBox) {
					var box = array_boxes[keyBox];
					
					var blastBox = box.x == boxToBlastOnRight.x && box.y == boxToBlastOnRight.y;
					blastBox |= box.x == boxToBlastOnLeft.x && box.y == boxToBlastOnLeft.y;
					blastBox |= box.x == boxToBlastOnTop.x && box.y == boxToBlastOnTop.y;
					blastBox |= box.x == boxToBlastOnBottom.x && box.y == boxToBlastOnBottom.y;
					
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
						// item = new Item(bItem.name, bItem.x, bItem.y);
						// item.image = bItem;
						stage.addChild(bItem);
						stage.swapChildren(bItem, me.animation);
						array_item.push(bItem);
						// array_item.push(item);
				   
						} // fin if box holds item
						
					} // fin if blast box
						   
				} // fin loop box
			} // fin if boxes to blast
		}
	});

	_.each(array_remove_bomb_index, function(index) {
		// delete _.find(array_bombs, function(b) { b.id == id });
		delete array_bombs[index];
	});
	
}

function tick_moveMe() {
	var shape = {
		x: me.animation.x,
		y: me.animation.y,
		width: 30,
		height: 30 };
	
	if (lfHeld) {
		// if (me.animation.x > imgWall.width && !willCollideOnLeft(shape))
		if (!willCollideOnLeft(shape))
			me.animation.x -= px * me.animation.vX;
	}
	else if (rtHeld) {
		// if (me.animation.x < canvas.width - imgWall.width * 2 && !willCollideOnRight(shape))
		if (!willCollideOnRight(shape))
			me.animation.x += px * me.animation.vX;
	}
	else if (upHeld) {
		// if (me.animation.y > imgWall.height && !willCollideOnTop(shape))
		if (!willCollideOnTop(shape))
			me.animation.y -= px * me.animation.vX;
	}
	else if (dwHeld) {
		// if (me.animation.y < canvas.height - imgWall.height * 2 && !willCollideOnBottom(shape))
		if (!willCollideOnBottom(shape))
			me.animation.y += px * me.animation.vX;
	}
	
	// code mystere
	if(lfHeld && keyDn==false){
		me.animation.gotoAndPlay("walkWest");
		keyDn=true;
	}
	if(rtHeld && keyDn==false){
		me.animation.gotoAndPlay("walkEast");
		keyDn=true;
	}
	if (dwHeld && keyDn==false) {
		me.animation.gotoAndPlay("walkSouth");
		keyDn=true;
	}
	if (upHeld && keyDn==false) {
		me.animation.gotoAndPlay("walkNorth");
		keyDn=true;
	}
}

function tick_moveOthers() {
	_.each(playersAnimation, function(p) {
		if (p.name != me.name) {
			if (p.moving) {
					var shape = {
						x: p.x,
						y: p.y,
						width: 30,
						height: 30 };
				switch (p.moving) {
					case 'east':
						if (!willCollideOnRight(shape))
							p.x += px;// p.moveEast();
						if (p.currentAnimation != 'walkEast')
							p.gotoAndPlay("walkEast");
						break;
					case 'west':
						if (!willCollideOnLeft(shape))
							p.x -= px;//p.moveWest();
						if (p.currentAnimation != 'walkWest')
							p.gotoAndPlay("walkWest");
						break;
					case 'north':
						if (!willCollideOnTop(shape))
							p.y -= px;//p.moveNorth();
						if (p.currentAnimation != 'walkNorth')
							p.gotoAndPlay("walkNorth");
						break;
					case 'south':
						if (!willCollideOnBottom(shape))
							p.y += px;//p.moveSouth();
						if (p.currentAnimation != 'walkSouth')
							p.gotoAndPlay("walkSouth");
						break;
				}
			}
			else {
				switch (p.facing) {
					case 'east':
						p.gotoAndStop("walkEast");
						break;
					case 'west':
						p.gotoAndStop("walkWest");
						break;
					case 'north':
						p.gotoAndStop("walkNorth");
						break;
					case 'south':
						p.gotoAndStop("walkSouth");
						break;
					
				}
			}
		}
	});
}

function gameIsOver() {
	// return _.size(playersAnimation) == 1;
	return false; // TODO ask the server
}

function endGame() {
	Ticker.setPaused(true);
	console.log(_.find(playersAnimation, function(p) { return true }).name + ' won');
	notyGameOver(_.find(playersAnimation, function(p) { return true }).name); 
}

var array_playersAnimationToKill = [];

function killPlayers(bomb, blast) {
	array_playersAnimationToKill = new Array();
	_.each(playersAnimation, function(p) {
		var bombermanInBlast = 
			p.x >= bomb.x && p.x < (bomb.x + 30) + 30 * blast.right || // right
			p.x < bomb.x && p.x >= (bomb.x - 0) - 30 * blast.left ||
			false;
		if (bombermanInBlast) {
			console.log(p.name + ' in blast');
			array_playersAnimationToKill.push(p); // seront supprimé dans handleEndBlastAnimation
			// p.gotoAndPlay("die");
			// p.onAnimationEnd = handleEndKillPlayerAnimation;
		}
	});
}

function getBlast(bomb) {
	// trouver la portée d'explosion de la bombe à droite
	var intRightBlast = 0;
	var intLeftBlast = 0;
	var intTopBlast = 0;
	var intBottomBlast = 0;
	
	// Il peut y avoir soit un mur soit une caisse
	// si'il y a une caisse on enregistre ses coordonées pour l'exploser
	var boxToBlastOnRight = new Object();
	for (var i = 1 ; i <= bomb.power ; i++) { // TODO utiliser le power de la bombe posée au lieu de me.bomb_power
		if (thereIsAWall(bomb.x + 30 * i, bomb.y) || thereIsABox(bomb.x + 30 * i, bomb.y)) {
			if (thereIsABox(bomb.x + 30 * i, bomb.y)) {
				intRightBlast++;
				boxToBlastOnRight.x = bomb.x + 30 * i; // on enregistre les coordonnees de la box, car il faudra l'exploser
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
	for (var i = 1 ; i <= bomb.power ; i++) {
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
	for (var i = 1 ; i <= bomb.power ; i++) {
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
	for (var i = 1 ; i <= bomb.power ; i++) {
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

	var boxesToBlast = // true s'il y a au moins une boite a exploser
	boxToBlastOnRight.x != undefined ||
	boxToBlastOnLeft.x != undefined ||
	boxToBlastOnTop.x != undefined ||
	boxToBlastOnBottom.x != undefined
	;
	return { // Blast object
		top: intTopBlast,
		bottom: intBottomBlast,
		right: intRightBlast,
		left: intLeftBlast,
		boxToBlastOnTop: boxToBlastOnTop,
		boxToBlastOnBottom: boxToBlastOnBottom,
		boxToBlastOnRight: boxToBlastOnRight,
		boxToBlastOnLeft: boxToBlastOnLeft,
		boxesToBlast: boxesToBlast
	};
}


/*****/
function getIndex(x) {
	if (x % 30 != 0)
		return null;
	else
		return x / 30;
}

/****/

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
	
   _.each(array_playersAnimationToKill, function(p) {
		p.gotoAndPlay("die");
		p.onAnimationEnd = handleEndKillPlayerAnimation;
		console.log(playersAnimation[p.name] + ' va etre supprime de playersAnimation');
		delete playersAnimation[p.name];
	});
	array_playersAnimationToKill = new Array();
}

function handleEndKillPlayerAnimation(animation, name) {
	stage.removeChild(animation);
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

/***************************************** COLLISION *****************************************/

function willCollideOnLeft(shape) {
	var collision = false;
	var a = quadtree.retrieve(shape);
	// console.log('left quadtree.retrieve size : ' + a.length);
	for (var i = 0 ; i < a.length ; i++) {
		//console.log(i + ' : ' + a[i].name + ' ' + a[i].x + ',' + a[i].y);
		collision = hasWallOnLeft(shape.x, shape.y, a[i].x, a[i].y);
		if (collision) break;
	}
	collision |= thereIsABox(shape.x - 30, shape.y) // il y a une box en face du joueur
	collision |= shape.x <= imgWall.width; // il y a les murs du contours en face du joueur
	// console.log('willCollideOnleft : ' + collision);
	return collision;
}

function willCollideOnRight(shape) {
	var collision = false;
	var a = quadtree.retrieve(shape);
	//console.log('right quadtree.retrieve size : ' + a.length);
	for (var i = 0 ; i < a.length ; i++) {
		//console.log(i + ' : ' + a[i].name + ' ' + a[i].x + ',' + a[i].y);
		collision = hasWallOnRight(shape.x, shape.y, a[i].x, a[i].y);
		if (collision) break;
	}
	collision |= thereIsABox(shape.x + 30, shape.y);
	collision |= shape.x >= canvas.width - imgWall.width * 2;
	return collision;
}

function willCollideOnTop(shape) {
	var collision = false;
	var a = quadtree.retrieve(shape);
	//console.log('top quadtree.retrieve size : ' + a.length);
	for (var i = 0 ; i < a.length ; i++) {
		//console.log(i + ' : ' + a[i].name + ' ' + a[i].x + ',' + a[i].y);
		collision = hasWallOnTop(shape.x, shape.y, a[i].x, a[i].y);
		if (collision) break;
	}
	collision |= thereIsABox(shape.x, shape.y - 30);
	collision |= shape.y <= imgWall.height;
	return collision;
}

function willCollideOnBottom(shape) {
	var collision = false;
	var a = quadtree.retrieve(shape);
	//console.log('bottom quadtree.retrieve size : ' + a.length);
	for (var i = 0 ; i < a.length ; i++) {
		//console.log(i + ' : ' + a[i].name + ' ' + a[i].x + ',' + a[i].y);
		collision = hasWallOnBottom(shape.x, shape.y, a[i].x, a[i].y);
		if (collision) break;
	}
	collision |= thereIsABox(shape.x, shape.y + 30);
	collision |= shape.y >= canvas.height - imgWall.height * 2;
	return collision;
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
		// console.log('hasWallOnRight ' + leftX + ' ' + leftY + ' ' + rightX + ' ' + rightY + ' => ' + hasWall);
	return hasWall;
}
/****/
function hasWallOnLeft(rightX, rightY, leftX, leftY) {
	var hasWall = rightX > leftX &&  // se trouve ? droite
	rightY + 30 > leftY && // se trouve ? droite
	rightX <= leftX + 30 && // se trouve dans l'axe vertical du mur
	rightY + 30 < leftY + 30 * 2;
	// console.log('hasWallOnLeft ' + rightX + ' ' + rightY + ' ' + leftX + ' ' + leftY + ' => ' + hasWall);
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
		// console.log('hasWallOnTop ' + bottomX + ' ' + bottomY + ' ' + topX + ' ' + topY + ' => ' + hasWall);
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
		// console.log('hasWallOnBottom ' + topX + ' ' + topY + ' ' + bottomX + ' ' + bottomY + ' => ' + hasWall);
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

/*****************************************  *****************************************/

/****/
function getMapObject(x, y) {
	var indexX = x / 30;
	var indexY = y / 30;
	return gameMap[indexY][indexX];
}

/***************************************** KEYBORD *****************************************/

/****/
function handleKeyDown(e) {
//log.info(e.which);
	if(!e){ var e = window.event; }
	prevent = false;
	switch(e.keyCode) {
		case KEY_CODE_LEFT:
			//me.animation.gotoAndPlay("walkWest"); // a qqc a voir avec code mystere
			me.moving = 'west'; me.facing = 'west';// me.setMoving('west');me.setMoving('west');
			lfHeld = true;
			// leftPressed = true;
			prevent = true;
			break;
		case KEY_CODE_RIGHT:
			//me.animation.gotoAndPlay("walkEast");
			me.moving = 'east'; me.facing = 'east';// me.setMoving('east');
			rtHeld = true;
			prevent = true;
			break;
		case KEY_CODE_UP:
			//me.animation.gotoAndPlay("walkNorth");
			me.moving = 'north'; me.facing = 'north';// me.setMoving('north');me.setMoving('north');me.setMoving('north');
			upHeld = true;
			prevent = true;
			break;
		case KEY_CODE_DOWN:
			//me.animation.gotoAndPlay("walkSouth");
			me.moving = 'south'; me.facing = 'south';// me.setMoving('south');me.setMoving('south');me.setMoving('south');me.setMoving('south');
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
			me.animation.gotoAndStop("walkWest");
			me.moving = false;// me.setMoving(false);
			keyDn=false;
			lfHeld = false;
			break;
		case KEY_CODE_RIGHT:
			me.animation.gotoAndStop("walkEast");
			me.moving = false;// me.setMoving(false);
			keyDn=false;
			rtHeld = false;
			break;
		case KEY_CODE_UP:
			me.animation.gotoAndStop("walkNorth");
			me.moving = false;//me.setMoving(false);
			keyDn=false;
			upHeld = false;
			break;
		case KEY_CODE_DOWN:
			me.animation.gotoAndStop("walkSouth");
			me.moving = false;//me.setMoving(false);
			keyDn=false;
			dwHeld = false;
			break;
	}
}
/*
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
*/

/***************************************** SERVER SYNCHRONIZATION *****************************************/

function sendGameState() {
	// log.info('sendGameState');
	var gameState = createGameState();
	if (typeof socket == 'undefined')
		console.error('socket undefined');
	else {
		socket.emit('clt_set_gameState', gameState);
	}
}

function handleReceiveGameState(gameState) {
	// log.info('handleReceiveGameState');
	updatePlayers(gameState.players);
	// updateBombs(gameState.bombs);
	_.each(gameState.bombs, function(b) {
		if (b.by != me.name) {
			// log.debug('adding bomb from ' + b.by);
			bombs_from_server.push(b); // ajouter les nouvelles bombes lors du prochain tick
		}
	});
	_.each(gameState.pickedUpItems, function(i) {
		
	});
}

function createGameState() {
	// log.info('createGameState');
	var gameState = new GameState();
	gameState.sender = me.name;
	gameState.players[me.name] = me.playerWithoutAnimation();
	
	// Renseigner les bombes qui ont été ajoutées par me depuis le dernier createGameState
	_.each(new_dropped_bombs, function(b) {// for (var i = 0; i < new_dropped_bombs.length; i++)
		gameState.bombs.push(b.bombWithoutImage());
	});
	new_dropped_bombs = new Array(); // Toutes les nouvelles bombes vont êtres envoyées au serveur, on les supprime du client
	
	return gameState;
}

function updatePlayers(playersFromServer) {
	// suppression des joueurs qui ont quitté la partie
	if (_.size(playersFromServer) < _.size(playersAnimation)) {
		_.each(playersAnimation, function(p) {
			var playerStillHere = _.has(playersFromServer, p.name);
			console.log(p.name + ' still here : ' + playerStillHere);
			if (!playerStillHere)
				removePlayer(p.name);
		});
	}
	
	_.each(playersFromServer, function(p) {
		var playerExists = _.has(playersAnimation, p.name);
		if (playerExists) {
			if (me.name != p.name) {
				// on met à jour les positions des autres joueurs
				// console.log('from server ' + p.name + ' moving ' + p.moving + ' facing ' + p.facing);
				playersAnimation[p.name].x = p.x;
				playersAnimation[p.name].y = p.y;
				playersAnimation[p.name].moving = p.moving;
				playersAnimation[p.name].facing = p.facing;
			}
		}
		else {
			createPlayerAnimation(p);
			notyNewPlayer(p.name);
		}
	});
}

function removePlayer(playerName) {
	stage.removeChild(playersAnimation[playerName]);
	delete playersAnimation[playerName];
	// gameInfo.setItemValue('player_' + 
	notyDefault(playerName + ' a quitte la partie.');
	
}
// function updateBombs(bombsFromServer) {
	// _.each(bombsFromServer, function(b) {
		
	// });
// }

function handlePlayerQuit() {
	// afficher notification
	// supprimer le nom du joueur de gameinfo
	// supprimer le joueur de la map
}

function swapPlayers(c) {
// pour que touts les joueurs se retrouvent au dessus de c
}