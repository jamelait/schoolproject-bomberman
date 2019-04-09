function notyGameOver(winnerName) {
	text = winnerName + ' a gagne.<br>La partie est terminee.';
	notyRedirect(text, 'Retour a la liste', '/list')
}

function notyInvitation(gameName) {
	text = 'Tu a ete invite a rejoindre <strong>' + gameName + '</strong>.<br>Rejoindre la partie ?';
	notyConfirmation(text, '/join/' + gameName, 'Oui', 'Non');
}

function notyRedirect(text, textButton, redirectUrl) {
	noty({
		text: text,
		type: 'alert',
		layout: 'center',
		theme: 'default',
		timeout: false,
		modal: true,
		closeWith: ['click'],
		callback: {onShow: function() {}, afterShow: function() {}, onClose: function() {}, afterClose: function() {} }, //window.location = "/list";
		
		animation: {open: {height: 'toggle'}, close: {height: 'toggle'}, easing: 'swing', speed: 0 },// opening & closing animation speed
		buttons: 
		[
			{
				addClass: 'btn btn-inverse',
				text: textButton, 
				onClick: function($noty) {
							if (typeof redirectUrl != 'undefined' && redirectUrl != null && redirectUrl != '')
								window.location = redirectUrl;
							$noty.close();
							//noty({dismissQueue: true, force: true, layout: layout, theme: 'default', text: 'You clicked "Ok" button', type: 'success'});
						}
			}
			
		]
  	});
}

function notyInvitationSentSuccess(playerName) {
	notySuccess('Invitation envoyee a ' + playerName);
}

function notyInvitationSentError(playerName, reason) {
	// console.log('notyInvitationSentError playerName: ' + playerName + ' reason: ' + reason);
	switch(reason) {
		case 'not found':	
			notyError(playerName + ' est introuvable.');
			break;
		case 'full':
			notyError('Cette partie est pleine.');
			break
		case 'gamenotfound':
			notyError('La partie est introuvable.');
			break;
		default:
			notyError('L\'invitation n\'a pas ete envoyee.');
			break;
	}
}

function notyNewPlayer(playerName) {
	notyInfo(playerName + ' a rejoint la partie.');
}

function notySuccess(text) {
	notyBottomRight(text, 'success');
}

function notyInfo(text) {
	notyBottomRight(text, 'information');
}

function notyError(text) {
	notyBottomRight(text, 'error');
}

function notyDefault(text) {
	notyBottomRight(text, 'default');
}

function notyBottomRight(text, type) {
	noty({
		text: text,
		type: type,
		layout: 'bottomRight',
		theme: 'default',
		timeout: 3000,
		modal: false,
		dismissQueue: true, // If you want to use queue feature set this true
		//closeWith: ['button'],
		animation: {
			open: {height: 'toggle'},
			close: {height: 'toggle'},
			easing: 'swing',
			speed: 500 // opening & closing animation speed
		},
		buttons: false
  	});
}

function notyConfirmation(text, redirect, textOk, textCancel) {
	if (typeof textOk == 'undefined' || textOk == null | textOk == '')
		textOk = 'Ok';
	if (typeof textCancel == 'undefined' || textCancel == null | textCancel == '')
		textCancel = 'Annuler';
		
	noty({
		text: text,
		type: 'alert',
		layout: 'center',
		theme: 'default',
		timeout: false,
		modal: true,
		closeWith: ['click'],
		callback: {onShow: function() {}, afterShow: function() {}, onClose: function() {}, afterClose: function() {} }, //window.location = "/list";
		
		animation: {open: {height: 'toggle'}, close: {height: 'toggle'}, easing: 'swing', speed: 0 },// opening & closing animation speed
		buttons: 
		[
			{
				addClass: 'btn btn-primary',
				text: textOk, 
				onClick: function($noty) {
							if (typeof redirect != 'undefined' && redirect != null && redirect != '')
								window.location = redirect;
							$noty.close();
							//noty({dismissQueue: true, force: true, layout: layout, theme: 'default', text: 'You clicked "Ok" button', type: 'success'});
						}
			},
			{
				addClass: 'btn btn-danger',
				text: textCancel,
				onClick: function($noty) {
							$noty.close();
							//noty({dismissQueue: true, force: true, layout: layout, theme: 'default', text: 'You clicked "Cancel" button', type: 'error'});
						}
			}
		]
  	});
}



