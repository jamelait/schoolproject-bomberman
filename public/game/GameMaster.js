var _ = require('underscore');
var Player = require('./Player.js');
var GameState = require('./GameState.js');
var GameMap = require('./GameMap.js');

// var sockets = new Object();
var games = new Object();
var invitations = new Object();

exports.getPrivateGames = getPrivateGames;
function getPrivateGames() {
	return _.select(games, function(game){ return game.isPublic == false;});
}

exports.getPublicGames = getPublicGames;
function getPublicGames() {
	return _.select(games, function(game){ return game.isPublic == true;});
}

exports.getPublicGamesForRender = getPublicGamesForRender;
function getPublicGamesForRender() {
	var listGames = new Array();
	_.each(getPublicGames(), function(game) {
		name = game.gameName;
		listGames.push({ name: name, playerCount: _.size(game.players) });
	});
	return listGames;
}

exports.getPublicGamesNames = getPublicGamesNames;
function getPublicGamesNames() {
	return _.pluck(getPublicGames(), 'gameName');
}

exports.getGameByName = getGameByName;
function getGameByName(gameName) {
	return _.find(games, function(game){ return game.gameName == gameName; });
}

exports.getGameByPlayer = getGameByPlayer;
function getGameByPlayer(playerName) {
	game = _.find(games, function(game) {
		return _.has(game.players, playerName);
	});
	
	return game;
}

exports.createPlayer = createPlayer;
function createPlayer(playerName, gameName) {
// TODO verifier si playerName n'est pas déja dans gameName
	var positions = [
	{x: 30, y: 30},
	{x: 450, y: 330},
	{x: 30, y: 330},
	{x: 450, y: 30}];
	var colors = ['blue', 'red', 'green', 'yellow'];
	
	var game = getGameByName(gameName);
	var position = positions[_.size(game.players)]; // assignation d'une position de départ au joueur // TODO meilleure assignation
	var player = new Player(playerName, position.x, position.y);
	player.color = colors[_.size(game.players)];  // TODO meilleure attribution des couleurs : si 2 player, le 1er pars puis revient, il aura la mm couleur que le 2e player
	game.players[playerName] = player; // ajout du joueur à la partie
	
	return player;
}

exports.createGame = createGame;
function createGame(playerName, gameName, isPublic) {
	// TODO ne pas creer si une partie du meme nom existe déja
	// console.log('game created');
	// var game = new Object();
	// game.gameName = gameName;
	// game.isPublic = isPublic;
	// game.createdBy = playerName;
	// game.players = new Object();
	// game.looping = false;
	// game.bombs = new Array();
	var game = {
		gameName: gameName,
		isPublic: isPublic,
		createdBy: playerName,
		players:{},
		looping: false,
		bombs: [],
		map: new GameMap(1) // level 1
	}
	
	games[gameName] = game;
	
	return game;
}

exports.playerCanJoin = playerCanJoin;
function playerCanJoin(playerName, gameName) {
	var response = new Object();
	response.canPlay = false;
	response.reason = '';
	
	var game = getGameByName(gameName);
	
	// if (typeof game == 'undefined') {
		// response.reason = 'Cette partie n\'existe plus.');
		// return response;
	// }
	
	var gameNotFull = _.size(game.players) < 4;
	
	// le joueur peut rejoindre la partie si elle est publique
	// et si elle n'est pas pleine
	if (game.isPublic) {
		if (gameNotFull)
			response.canPlay = true
		else
			response.reason = 'La partie est pleine.';
	}
	else { // si elle est privée, il peut la rejoindre s'il en est le createur ou s'il a été invité
		if (playerName == game.createdBy || isInvitedToPlay(playerName, gameName)) // TODO replace != with == : done
			if (gameNotFull)
				response.canPlay = true;
			else
				response.reason = 'La partie est pleine.';
		else
			response.reason = 'Ceci est une partie privee et tu n\'est pas invite';
	}
	return response;
}

// Retourne true si playerName a été invité à rejoindre gameName
exports.isInvitedToPlay = isInvitedToPlay;
function isInvitedToPlay(playerName, gameName) {
	if (typeof invitations[gameName] != 'undefined')
		if (_.include(invitations[gameName].players, playerName))
			return true;
		
	return false;
}

// Crée l'invitation si la partie existe et si elle n'est pas pleine
// Retourne :
// 	ok : Si l'invitation a été créée
// 	full : Si la partie est pleine
// 	gamenotfound : Si la partie n'a pas été trouvée
exports.createInvitation = createInvitation;
function createInvitation(playerName, gameName) {
	if (typeof invitations[gameName]  == 'undefined')
		invitations[gameName] = { players: [] };
		
	var game = getGameByName(gameName);
	
	if (typeof game == 'undefined')
		return 'gamenotfound';
	
	if (_.size(game.players) < 4) {
		invitations[gameName].players.push(playerName);
		return 'ok';
	}
	else {
		return 'full';
	}
}

exports.removePlayer = removePlayer;
function removePlayer(playerName) {
	var game = getGameByPlayer(playerName)
	if (typeof game != 'undefined' && typeof game.players[playerName] != 'undefined')  {// correction bug F5 sur list
		console.log(' ---- removing ' + playerName + ' from ' + game.gameName);
		delete game.players[playerName];
		console.log(' ++++ removed');
		
	}
	// if (_.size(game.players) == 0) {
		// console.log('no more players, removing ' + game.gameName);
		// delete games[game.gameName]
		// delete game;
	// }
}

exports.updateGameState = updateGameState;
function updateGameState(gameState) {
	if (typeof games == 'undefined') console.log('games undefined'); else
	// console.log('games size : ' + _.size(games));
	var game = getGameByPlayer(gameState.sender); // TODO reflechir
	// console.log('updating ' + game.gameName);
	
	if (typeof game == 'undefined')
		return false;
	
	_.each(gameState.players, function(player) {
		// Il ne devrais y avoir qu'un seul joueur dans gameState.players : le sender
		// console.log(gameState.sender + ' == ' + player.name);
		// console.log(player.name + ' moving ' + player.moving + ' facing ' + player.facing);
		game.players[player.name].x = player.x;
		game.players[player.name].y = player.y;
		game.players[player.name].moving = player.moving;
		game.players[player.name].facing = player.facing;
		// console.log('Recu ' + game.players[player.name].name + ' moving ' + game.players[player.name].moving + ' facing ' + game.players[player.name].facing);
	});
	
	_.each(gameState.bombs, function(bomb) {
		// bomb.by = gameState.sender;
		game.bombs.push(bomb);
	});
	
	return true;
}


exports.createGameState = createGameState;
function createGameState(game) {
	// console.log('getting ' + game.gameName);
	// _.each(games, function (g) { console.log(g.gameName); });
	// var game = getGameByName(gameName);
	var gameState = new GameState();
	gameState.players = game.players;
	// _.each(gameState.player, function(player) {
		// console.log('createGameState ' + player.name + ' moving ' + player.moving + ' facing ' + player.facing);
	// });
	_.each(game.bombs, function(bomb) {
		gameState.bombs.push(bomb);
	});
	
	// Supprimer les box qui se trouvent dans le blast des bombes si elles ont explosees
	
	// Supprimer les bombes qui ont explosées
	game.bombs = new Array(); // TODO le client ne doit pas ajouter deux bombes ayant le mm id
	
	return gameState;
}

// exports.updateGameMap = updateGameMap;
// function updateGameMap() {
// }