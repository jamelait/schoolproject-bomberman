var arrSocket = new Object();


/**
 * Module dependencies.
 */
var GameMaster = require('./public/game/GameMaster.js');
// var Level = require('./public/game/Level.js');
var _ = require('underscore');
var express = require('express')
  , routes = require('./routes')
  , app = express()
  , server = require('http').createServer(app)
  , path = require('path')
  , io = require('socket.io')
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore();

app.configure(function(){
  app.set('port', process.env.PORT || 3389);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('SecretCookieParser'));
  app.use(express.session({store: sessionStore, secret: 'SecretCookieParser', key: 'express.sid'}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Création des routes
app.get('/test', routes.test);

app.get('/', routes.index);
app.post('/', routes.index_post);

app.get('/list', routes.list);
app.get('/join/:gamename', routes.join);

app.get('/newgame/private', routes.newgame_private);
app.get('/newgame/public', routes.newgame_public);

app.post('/newgame/public', routes.newgame_public_post);
app.post('/newgame/private', routes.newgame_private_post);

// Démarrage du serveur web
server.listen(app.get('port'), function(){
  console.log("Server listening on port " + app.get('port'));
});
// Démarrage de l'écoute des connexions par websocket
io = io.listen(server);

io.set('authorization', function (data, accept) {
    // console.log('in authorization...');
    accept(null, true);
});

io.sockets.on('connection', function (socket, session) {
	// console.log('nouvelle connexion');
	
	socket.on('disconnect', function() {
		handleDisconnect(socket);
	});
	
	socket.on('clt_justRegistered', function(data) {
		handleJustRegistered(data, socket);
	});
	
	socket.on('askAuthorizationToPlay', function(data) { // devrait se faire dans authorization ? -> mettre client.askAuthorizationToPlay apres post index
		handleAskAuthorizationToPlay(data, socket);
	});
	
	socket.on('clt_set_gameState', function(data) {// socket.on('sendGameState', function(data) {
		handleSetGameState(data, socket);
	});
	
	socket.on('clt_send_invitation', function(data) {
		handleSendInvitation(data, socket);
	});
	
	// console.log('new socket connection');
});

function handleJustRegistered(data, socket) {
	arrSocket[data.pseudo] = socket;
	// console.log(' ---- ' + data.pseudo + ' just registered ' + socket.id);
}

// EVENT HANDLERS

function handleDisconnect(socket) {
	for (var playerName in arrSocket) {
		if (socket.id == arrSocket[playerName].id) {
			GameMaster.removePlayer(playerName);
			delete arrSocket[playerName];
			break;
		}
			// console.log('deconnexion de ' + playerName);
	}
	
	// supprimer le joueur de la partie où il se trouve
}

function handleAskAuthorizationToPlay(data, socket) {
	// console.log(data.pseudo + ' veut jouer a ' + data.gamename);
	
	// dire au player s'il peut jouer ou non
	var response = GameMaster.playerCanJoin(data.pseudo, data.gamename);
	if (response.canPlay)
		response.gameMap = GameMaster.getGameByName(data.gamename).map.getMap();
	socket.emit('askAuthorizationToPlay', response);// socket.emit('askAuthorizationToPlay', { canPlay: response.canPlay, reason: response.reason });
	
	if (response.canPlay) {
		// GameMaster.addSocket(socket, data.pseudo);
		// console.log('socket.id = ' + socket.id);
		arrSocket[data.pseudo] = socket;
		var game = GameMaster.getGameByName(data.gamename);
		// creer le player
		// GameMaster.createPlayer(data.pseudo, socket);
		var player = GameMaster.createPlayer(data.pseudo, data.gamename);
		if (!game.looping)
			runGameLoop(game); // la boucle est démarrée s'il y a au moins un joueur et si elle n'a pas déja été démarrée
			// GameMaster.runGameLoop(data.gamename);
		// console.log('nouveau joueur : ' + game.players[data.pseudo].name + ', position : ' + game.players[data.pseudo].x + ',' + game.players[data.pseudo].y);
	}
}

function handleSendInvitation(data, socket) {
	var reason = '';
	// Si le joueur existe
	if (typeof arrSocket[data.to] != 'undefined') {
		reason = GameMaster.createInvitation(data.to, data.gameName);
		if (reason == 'ok') {
			arrSocket[data.to].emit('srv_send_invitation', data.gameName);
			// console.log('invitation sent to ' + data.to);
		}
	}
	else {
		reason = 'not found';
	}
	
	var invitationCreated = reason == 'ok';
	
	socket.emit('srv_result_send_invitation', { success: invitationCreated, reason: reason, playerName: data.to });
	// console.log('   ++++++  srv_result_send_invitation success:' + invitationCreated + ' reason: ' + reason + ' playerName: ' + data.to);
}

// OTHER FUNCTIONS

function handleSetGameState(gameState, socket) {
	updated = GameMaster.updateGameState(gameState);
	if (!updated)
		socket.emit('error_gameRemoved', { message: 'La partie n\'existe plus.' });
}

function runGameLoop(game) {
	// console.log('loop for ' + game.gameName + ' started');
	game.looping = true;
	setInterval(function() {
		// Création du gameState
		var gameState = GameMaster.createGameState(game);
		// Envoi du gameState à tous les joueurs
		_.each(game.players, function(player) {
			arrSocket[player.name].emit('srv_set_gameState', gameState);
		});
		// sendGameStateToAll(game);
		// supprimer les bombes qui doivent exploser
	}, 500);
}

// function sendGameStateToAll(game) {
	// var gameState = GameMaster.createGameState(game);
	// _.each(game.players, function(player) {
		// arrSocket[player.name].emit('srv_set_gameState', gameState);
	// });
// }


