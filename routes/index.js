var GameMaster = require('../public/game/GameMaster.js');

// TEST
exports.test = function(req, res) {
	res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
};

// INDEX
exports.index = function(req, res){
	res.render('index', { title: 'Bomberman' });
};

// INDEX POST
exports.index_post = function(req, res) {
	pseudo = req.body.pseudo || 'undefined';
	req.session.pseudo = pseudo;
	
	res.redirect('/list');
};

// LIST
exports.list = function(req, res) {
	redirectIfNoPseudo(req, res);
	publicGames = GameMaster.getPublicGamesForRender();
	res.render('list', { title: 'Liste des parties publiques', pseudo: req.session.pseudo, games: publicGames });
};

// JOIN
exports.join = function(req, res) {
	redirectIfNoPseudo(req, res);
	game = GameMaster.getGameByName(req.params.gamename);
	
	if (typeof game == 'undefined' || game == 'game') {
		res.redirect('/list');
	}
	else {
		res.render('game', {
			title: 'Partie : ' + game.gameName,
			isPublic: game.isPublic,
			pseudo: req.session.pseudo,
			gamename: req.params.gamename });
	}
};

// NEW GAME PUBLIC
exports.newgame_public = function(req, res) {
	redirectIfNoPseudo(req, res);
	res.render('newgame', { title: 'Nouvelle partie publique', pseudo: req.session.pseudo, subtitle: 'Nouvelle partie publique' });
};

// NEW GAME PRIVATE
exports.newgame_private = function(req, res) {
	redirectIfNoPseudo(req, res);
	res.render('newgame', { title: 'Nouvelle partie priv&eacute;e', pseudo: req.session.pseudo, subtitle: 'Nouvelle partie priv&eacute;e' });
};

// NEW GAME PUBLIC POST
exports.newgame_public_post = function(req, res) {
	handleNewGamePost(req, res, true);
};

// NEW GAME PRIVATE POST
exports.newgame_private_post = function(req, res) {
	handleNewGamePost(req, res, false);
};


/* FUNCTIONS */

function handleNewGamePost(req, res, isPublic) {
	// if (isPublic)
		// console.log('new public game created');
	// else
		// console.log('new private game created');
	redirectIfNoPseudo(req, res);
	gameName = req.body.gamename || 'undefined';
	GameMaster.createGame(req.session.pseudo, gameName, isPublic);
	
	res.redirect('/join/' + gameName);
}

function redirectIfNoPseudo(req, res) {
	if (typeof req.session.pseudo == 'undefined' || req.session.pseudo == 'undefined')
		res.redirect('/');
}