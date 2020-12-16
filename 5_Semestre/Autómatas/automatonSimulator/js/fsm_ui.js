var fsm = (function() {
	var self = null;
	var delegate = null;
	var container = null;
	var stateCounter = 0;
	var saveLoadDialog = null;

	var localStorageAvailable = function () {
		return (typeof Storage !== "undefined"  && typeof localStorage !== "undefined");
	};

	var refreshLocalStorageInfo = function() {
		if (localStorageAvailable()) {
			$('#storedMachines').empty();
			var keys = [];
			for (var i=0; i < localStorage.length; ++i) {
				keys.push(localStorage.key(i));
			}
			keys.sort();
			$.each(keys, function(idx, key) {
				$('<li></li>', {'class':'machineName'})
					.append($('<span></span>').html(key))
					.append('<div class="delete" style="display:none;" title="Eliminar"><i class="delete fas fa-times"></i></div>')
					.appendTo('#storedMachines');
			});
		}
	};

	var makeSaveLoadDialog = function() {
		saveLoadDialog = $('#saveLoadDialog');
		$('#saveLoadTabs').tabs();
		$('#saveLoadTabs textarea').height(275);
		if (!localStorageAvailable()) {
			$('#saveLoadTabs')
				.tabs('option', 'active', 1)
				.tabs('option', 'disabled', [0])
				.find('ul li').eq(0).attr('title', 'Browser Storage not supported in this browser');
		}
		saveLoadDialog.dialog({
			autoOpen: false,
			dialogClass: 'loadSave no-close',
			width: 500,
			height: 450,
			open: function() {
				// Focus on either the machineName entry box or the textarea depending on what panel is active
				saveLoadDialog.find("div.ui-tabs-panel:not(.ui-tabs-hide)").find('input, textarea').focus();
			}
		});

		// Event Handlers for the LocalStorage widget
		$('#machineName').focus(function() {if ($(this).val() === $(this).attr('title')) {$(this).val('');}})
			.blur(function() {if($(this).val() === '') {$(this).val($(this).attr('title'));}})
			.keyup(function(event) {
				if (event.which === $.ui.keyCode.ENTER) {
					saveLoadDialog.parent().find('.ui-dialog-buttonpane button').eq(-1).trigger('click');
			}});

		$('#storedMachines').on('mouseover', 'li.machineName', function(event) {
			$(this).find('div.delete').show();
		}).on('mouseout', 'li.machineName', function(event) {
			$(this).find('div.delete').hide();
		}).on('click', 'li.machineName div.delete', function(event) {
			event.stopPropagation();
			localStorage.removeItem($(this).closest('li.machineName').find('span').html());
			refreshLocalStorageInfo();
		}).on('click', 'li.machineName', function(event) { // select the machineName
			$('#machineName').val($(this).find('span').html()).focus();
		}).on('dblclick', 'li.machineName', function(event) {	// immediately load the machineName
			$('#machineName').val($(this).find('span').html());
			saveLoadDialog.parent().find('.ui-dialog-buttonpane button').eq(-1).trigger('click');
		});
	};

	var initJsPlumb = function() {
		jsPlumb.importDefaults({
			Anchors: ["Continuous", "Continuous"],
			ConnectorZIndex: 5,
			ConnectionsDetachable: false,
			Endpoint: ["Dot", {radius:2}],
			HoverPaintStyle: {strokeStyle:"#d44", lineWidth:2},
			ConnectionOverlays: [
				["Arrow", {
					location: 1,
					length: 14,
					foldback: 0.8
					}],
				["Label", {location:0.5}]
			],
			Connector: ["StateMachine", {curviness:20}],
			PaintStyle: {strokeStyle:'#0dd', lineWidth:2}
		});

		jsPlumb.bind("click", connectionClicked);
	};

	var initStateEvents = function() {
		// Setup handling the 'delete' divs on states
		container.on('mouseover', 'div.state', function(event) {
			$(this).find('div.delete').show();
		}).on('mouseout', 'div.state', function(event) {
			$(this).find('div.delete').hide();
		});
		container.on('click', 'div.delete', function(event) {
			self.removeState($(this).closest('div.state'));
		});

		// Setup handling for accept state changes
		container.on('change', 'input[type="checkbox"].isAccept', function(event) {
			var cBox = $(this);
			var stateId = cBox.closest('div.state').attr('id');
			if (cBox.prop('checked')) {
				delegate.fsm().addAcceptState(stateId);
			} else {
				delegate.fsm().removeAcceptState(stateId);
			}
		});
	};

	var initFSMSelectors = function() {
		// Setup the Automaton type listeners:
		$('button.delegate').on('click', function() {
			var newDelegate = null;
			switch ($(this).html()) {
				case 'DFA': newDelegate = dfa_delegate; break;
				case 'PDA': newDelegate = pda_delegate; break;
			}
			if (newDelegate !== delegate) {
				self.setDelegate(newDelegate);
				$('button.delegate').prop('disabled', false);
				$(this).prop('disabled', true);
			}
		});

		$('button.delegate').each(function() {
			if ($(this).html() === 'DFA') { // Default to DFA
				$(this).click();
			}
		});
	};

	var loadSerializedFSM = function(serializedFSM) {
		var model = serializedFSM;
		if (typeof serializedFSM === 'string') {
			model = JSON.parse(serializedFSM);
		}

		// Load the delegate && reset everything
		self.reset();
		$('button.delegate').each(function() {
			if ($(this).html() === model.type) {
				$(this).click();
			}
		});

		// Load Bulk Tests
		$('#acceptStrings').val(model.bulkTests.accept);
		$('#rejectStrings').val(model.bulkTests.reject);

		// Create states
		$.each(model.states, function(stateId, data) {
			var state = null;
			if (stateId !== 'inicio') {
				state = makeState(stateId)
					.css('left', data.left + 'px')
					.css('top', data.top + 'px')
					.appendTo(container);
				jsPlumb.draggable(state, {containment:"parent"});
				makeStatePlumbing(state);
			} else {
				state = $('#inicio');
			}
			if (data.isAccept) {state.find('input.isAccept').prop('checked', true);}
		});

		// Create Transitions
		jsPlumb.unbind("jsPlumbConnection"); // unbind listener to prevent transition prompts
		$.each(model.transitions, function(index, transition) {
			jsPlumb.connect({source:transition.stateA, target:transition.stateB}).setLabel(transition.label);
		});
		jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded);

		// Deserialize to the fsm
		delegate.deserialize(model);
	};

	var updateStatusUI = function(status) {
		$('.simulator__console__status .consumedInput').html(status.input.substring(0, status.inputIndex));
		if (status.nextChar === '') {
			$('.simulator__console__status .currentInput').html(delegate.getEmptyLabel());
			$('.simulator__console__status .futureInput').html(status.input.substring(status.inputIndex));
		} else if (status.nextChar === null) {
			$('.simulator__console__status .currentInput').html('[End of Input]');
			$('.simulator__console__status .futureInput').html('');
		} else {
			$('.simulator__console__status .currentInput').html(status.input.substr(status.inputIndex, 1));
			$('.simulator__console__status .futureInput').html(status.input.substring(status.inputIndex+1));
		}
	};

	var connectionClicked = function(connection) {
		delegate.connectionClicked(connection);
	};

	var checkHashForModel = function() {
		var hash = window.location.hash;
		hash = hash.replace('#', '');
		hash = decodeURIComponent(hash);
		if (hash) {loadSerializedFSM(hash);}
	};

	var domReadyInit = function() {
		self.setGraphContainer($('.simulator__graph-container'));

		$(window).resize(function() {
			jsPlumb.repaintEverything();
		});
		$(window).resize();

		// Setup handling 'enter' in test string box
		$('.simulator__tools__test-string').keyup(function(event) {if (event.which === $.ui.keyCode.ENTER) {$('#testBtn').trigger('click');}});

		container.dblclick(function(event) {
			self.addState({top: event.offsetY, left: event.offsetX});
		});

		initJsPlumb();
		initStateEvents();
		initFSMSelectors();
		makeSaveLoadDialog();

		checkHashForModel();
	};

	var makeStartState = function() {
		var startState = makeState('inicio');
		startState.find('div.delete').remove(); // Can't delete start state
		container.append(startState);
		makeStatePlumbing(startState);
	};

	var makeState = function(stateId) {
		return $('<div id="' + stateId + '" class="state"></div>')
			.append('<input id="' + stateId+'_isAccept' + '" type="checkbox" class="isAccept" value="true" title="Accept State" />')
			.append(stateId)
			.append('<div class="plumbSource" title="Drag from here to create new transition">&nbsp;</div>')
			.append('<div class="delete" style="display:none;" title="Delete"><i class="delete fas fa-times"></div>');
	};

	var makeStatePlumbing = function(state) {
		var source = state.find('.plumbSource');
		jsPlumb.makeSource(source, {
			parent: state,
			maxConnections: 10,
			onMaxConnections:function(info, e) {
				alert("Maximum connections (" + info.maxConnections + ") reached");
			},
		});

		jsPlumb.makeTarget(state, {
			dropOptions: {hoverClass:'dragHover'}
		});
		return state;
	};

	return {
		init: function() {
			self = this;
			$(domReadyInit);
			return self;
		},

		setDelegate: function(newDelegate) {
			delegate = newDelegate;
			delegate.setContainer(container);
			delegate.reset().fsm().setStartState('inicio');
			jsPlumb.unbind("jsPlumbConnection");
			jsPlumb.reset();
			container.empty();
			initJsPlumb();
			jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded);
			stateCounter = 0;
			makeStartState();
			return self;
		},

		setGraphContainer: function(newContainer) {
			container = newContainer;
			jsPlumb.Defaults.Container = container;
			return self;
		},

		addState: function(location) {
			while ($('#q'+stateCounter).length > 0) {++stateCounter;} // Prevent duplicate states after loading
			var state = makeState('q' + stateCounter);
			if (location && location.left && location.top) {
				state.css('left', location.left + 'px')
				.css('top', location.top + 'px');
			}
			container.append(state);
			jsPlumb.draggable(state, {containment:"parent"});
			makeStatePlumbing(state);
			// Do nothing to model
			return self;
		},

		removeState: function(state) {
			var stateId = state.attr('id');
			jsPlumb.select({source:stateId}).detach(); // Remove all connections from UI
			jsPlumb.select({target:stateId}).detach();
			state.remove(); // Remove state from UI
			delegate.fsm().removeTransitions(stateId); // Remove all transitions from model touching this state
			delegate.fsm().removeAcceptState(stateId); // Assure no trace is left
			return self;
		},

		removeConnection: function(connection) {
			jsPlumb.detach(connection);
		},

		test: function(input) {
			if ($.type(input) === 'string') {
				$('.simulator__tools__debug-result').html('Testing.simulator__tools__debug-result.')
				var accepts = delegate.fsm().accepts(input);
				$('.simulator__tools__debug-result').html(accepts ? 'Aceptada' : 'Rechazada').effect('highlight', {color: accepts ? '#bfb' : '#fbb'}, 1000);
			} else {
				$('.simulator__console').empty();
				var makePendingEntry = function(input, type) {
						return $('<div></div>', {'class':'pending', title:'Pending'}).append(type + ': ' + (input === '' ? '[Empty String]' : input)).appendTo('.simulator__console');
				};
				var updateEntry = function(result, entry) {
					entry.removeClass('pending').addClass(result).attr('title', result).append(' -- ' + result);
				};
				$.each(input.accept, function(index, string) {
					updateEntry((delegate.fsm().accepts(string) ? 'pass' : 'fail'), makePendingEntry(string, 'Accept'));
				});
				$.each(input.reject, function(index, string) {
					updateEntry((delegate.fsm().accepts(string) ? 'fail' : 'pass'), makePendingEntry(string, 'Reject'));
				});
				$('#bulkResultHeader').effect('highlight', {color: '#add'}, 1000);
			}
			return self;
		},

		debug: function(input) {
			if ($('#stopBtn').prop('disabled')) {
				$('.simulator__tools__debug-result').html('&nbsp;');
				$('#stopBtn').prop('disabled', false);
				$('#loadBtn, #testBtn, #bulkTestBtn, .simulator__tools__test-string, #resetBtn').prop('disabled', true);
				$('button.delegate').prop('disabled', true);
				$('.simulator__console__status').show();
				delegate.debugStart();
				delegate.fsm().stepInit(input);
			} else {
				delegate.fsm().step();
			}
			var status = delegate.fsm().status();
			updateStatusUI(status);
			delegate.updateUI();
			if (status.status !== 'Active') {
				$('.simulator__tools__debug-result').html(status.status === 'Accept' ? 'Aceptada' : 'Rechazada').effect('highlight', {color: status.status === 'Accept' ? '#bfb' : '#fbb'}, 1000);
				$('#debugBtn').prop('disabled', true);
			}
			return self;
		},

		debugStop: function() {
			$('.simulator__console__status').hide();
			$('#stopBtn').prop('disabled', true);
			$('#loadBtn, #testBtn, #bulkTestBtn, #debugBtn, .simulator__tools__test-string, #resetBtn').prop('disabled', false);
			$('button.delegate').prop('disabled', false).each(function() {
				switch ($(this).html()) {
					case 'DFA': if (delegate === dfa_delegate) {$(this).prop('disabled', true);} break;
					case 'PDA': if (delegate === pda_delegate) {$(this).prop('disabled', true);} break;
				}
			});
			delegate.debugStop();
			return self;
		},

		reset: function() {
			self.setDelegate(delegate);
			$('.simulator__tools__test-string').val('');
			$('.simulator__tools__debug-result').html('&nbsp;');
			$('#acceptStrings').val('');
			$('#rejectStrings').val('');
			$('.simulator__console').empty();
			return self;
		},

		load: function() {
			var finishLoading = function() {
				var serializedModel = null;
				if ($('#saveLoadTabs').tabs('option', 'active') === 0) {
					var storageKey = $('#machineName').val();
					if (localStorageAvailable()) {
						serializedModel = localStorage.getItem(storageKey);
						if (!serializedModel) {
							alert('failed to Retrieve Machine with Name "'+storageKey+'"');
							return false;
						}
					} else {
						alert("Can't load machine from Browser Storage, this browser doesn't support it.");
						return false;
					}
				} else {
					serializedModel = saveLoadDialog.find('textarea').val();
				}
				loadSerializedFSM(serializedModel);
				return true;
			};

			saveLoadDialog.dialog('option', {
				title: 'Load Automaton',
				buttons: {
					Cancel: function(){saveLoadDialog.dialog('close');},
					Load: function(){if (finishLoading()) {saveLoadDialog.dialog('close');}}
				}
			});
			$('#saveLoadTabs').off('tabsactivate');

			refreshLocalStorageInfo();
			$('#plaintext textarea').empty();
			saveLoadDialog.dialog('open');
		},

		save: function() {
			var model = delegate.serialize();
			container.find('div.state').each(function() {
				if ($(this).attr('id') !== 'inicio') {$.extend(model.states[$(this).attr('id')], $(this).position());}
			});
			model.bulkTests = {
				accept: $('#acceptStrings').val(),
				reject: $('#rejectStrings').val()
			};
			var serializedModel = JSON.stringify(model);

			var finishSaving = function() {
				var storageKey = $('#machineName').val();
				if (!storageKey) {alert("Please Provide a Name"); return false;}
				if (localStorageAvailable()) {
					localStorage.setItem(storageKey, serializedModel);
				} else {
					alert("Can't save machine to Browser Storage, this browser doesn't support it.");
					return false;
				}
				return true;
			};

			var buttonUpdater = function(event, ui) {
				if (ui.newPanel.attr('id') === 'browserStorage') {
					saveLoadDialog.dialog('option', 'buttons', {
						Cancel: function(){saveLoadDialog.dialog('close');},
						Save: function(){if (finishSaving()) {saveLoadDialog.dialog('close');}}
					});
				} else if (ui.newPanel.attr('id') === 'plaintext' || ui.newPanel.attr('id') === 'shareableURL') {
					ui.newPanel.find('textarea').select();
					saveLoadDialog.dialog('option', 'buttons', {
						Copy: function(){ui.newPanel.find('textarea').select();document.execCommand('copy')},
						Close: function(){saveLoadDialog.dialog('close');}
					});
				}
			};

			saveLoadDialog.dialog('option', 'title', 'Save Automaton');
			$('#saveLoadTabs').on('tabsactivate', buttonUpdater);
			buttonUpdater(null, {newPanel: $('#saveLoadTabs div').eq($('#saveLoadTabs').tabs('option', 'active'))});

			refreshLocalStorageInfo();
			$('#plaintext textarea').val(serializedModel);
			$('#shareableURL textarea').val(window.location.href.split("#")[0] + '#' + encodeURIComponent(serializedModel));
			saveLoadDialog.dialog('open');
		}
	};
})().init();