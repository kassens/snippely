// Aliases

var console = AIR.Introspector.Console;

// Configuration

Application.autoExit = true;

// Snippely Object

var Snippely = {
	
	initialize: function(){
		this.contentTop = $('content-top');
		this.contentLeft = $('content-left');
		this.contentRight = $('content-right');
		this.contentBottom = $('content-bottom');
		
		this.topResizer = $('top-resizer');
		this.leftResizer = $('left-resizer');
		
		this.initializeMenus();
		this.initializeLayout();
		this.initializeButtons();
		this.initializeKeyboard();
		this.database = new Database({
			file: 'app-storage:/application.db',
			onConnect: function(database){
				this.Groups.initialize();
				this.Snips.initialize();
				this.Snippet.initialize();
				this.Snippets.initialize();
			}.bind(this)
		});
		this.database.execute = function(query){
			air.trace('dead query: ' + query);
		};
		
		if (AIR.NativeApplication.supportsDockIcon){
			Application.addEventListener('exiting', function(){
				Snippely.exiting = true;
			});
			Application.addEventListener('invoke', function(){
				Snippely.activate();
			});
			nativeWindow.addEventListener('closing', function(event){
				if (!Snippely.exiting){
					event.preventDefault();
					Snippely.deactivate();
				}
			});
		} else {
			Snippely.activate();
		}
	},
	
	initializeMenus: function(){
		//add menu
		var addMenu = new ART.Menu('AddMenu').addItems(
			new ART.Menu.Item('Add Group...', {
				onSelect: this.Groups.add.bind(this.Groups)
			}),
			new ART.Menu.Item('Add Snippet...', {
				enabled: false,
				onSelect: this.Snippets.add.bind(this.Snippets)
			})
		);
		
		//action menu
		var actionMenu = new ART.Menu('ActionMenu').addItems(
			new ART.Menu.Item('Rename Group...', {
				enabled: false,
				onSelect: this.Groups.rename.bind(this.Groups)
			}),
			new ART.Menu.Item('Remove Group...', {
				enabled: false,
				onSelect: this.Groups.remove.bind(this.Groups)
			}),
			new ART.Menu.Item('Separator', {
				separator: true
			}),
			new ART.Menu.Item('Rename Snippet...', {
				enabled: false,
				onSelect: this.Snippets.rename.bind(this.Snippets)
			}),
			new ART.Menu.Item('Remove Snippet...', {
				enabled: false,
				onSelect: this.Snippets.remove.bind(this.Snippets)
			})
		);
		
		//brush menu
		var brushMenu = new ART.Menu('BrushMenu');
		for (var name in Paintbrush.Brushes) (function(name){
			brushMenu.addItem(new ART.Menu.Item(name, {
				onSelect: Snippely.Snips.updateType.bind(Snippely.Snips, name)
			}));
			if (name == "Note") brushMenu.addItem(new ART.Menu.Item('Separator', {
				separator: true
			}));
		})(name);
		
		$('button-add').addEvent('mousedown', function(event){
			this.addClass('active');
			(function(){
				addMenu.display(event.client);
				this.removeClass('active');
			}.delay(100, this));
			event.stopPropagation();
		});
		
		$('button-action').addEvent('mousedown', function(event){
			this.addClass('active');
			(function(){
				actionMenu.display(event.client);
				this.removeClass('active');
			}.delay(100, this));
			event.stopPropagation();
		});
		
		this.Menus = {
			addMenu: addMenu,
			actionMenu: actionMenu,
			brushMenu: brushMenu
		};
	},
	
	initializeLayout: function(){
		var redraw = this.redraw.bind(this);
		
		new Drag(this.contentLeft, {
			handle: this.leftResizer,
			modifiers: {y: null, x: 'width'},
			limit: {x: [150, 300]},
			onDrag: redraw
		});

		new Drag(this.contentTop, {
			handle: this.topResizer,
			modifiers: {y: 'height', x: null},
			limit: {y: [this.topResizer.getHeight.bind(this.topResizer), window.getHeight]},
			onDrag: redraw
		});
		
		nativeWindow.addEventListener('resize', redraw);
		nativeWindow.addEventListener('activate', redraw);
		nativeWindow.addEventListener('deactivate', redraw);
		nativeWindow.addEventListener('activate', this.focus);
		nativeWindow.addEventListener('deactivate', this.blur);
		nativeWindow.addEventListener('closing', this.storeProperties.bind(this));
		
		this.groupsScrollbar = new ART.ScrollBar('groups', 'groups-wrap');
		this.snippetScrollbar = new ART.ScrollBar('snippet', 'snippet-wrap');
		this.snippetsScrollbar = new ART.ScrollBar('snippets', 'snippets-wrap');
		
		this.retrieveProperties();
		this.redraw();
	},
	
	initializeButtons: function(){
		var previous;
		var addClass = function(){ this.addClass('active'); };
		var removeClass = function(){ this.removeClass('active'); };
		
		$$('#snippet-toolbar .button').addEvents({
			mouseout: removeClass,
			mousedown: function(event){
				previous = this.addEvent('mouseover', addClass);
				addClass.call(this);
				event.stop();
			}
		});
		
		document.addEvent('mouseup', function(){
			if (!previous) return;
			removeClass.call(previous.removeEvent('mouseover', addClass));
			previous = null;
		});
		
		$('add-code').addEvent('click', this.Snips.add.bind(this.Snips, 'Plain Text'));
		$('add-note').addEvent('click', this.Snips.add.bind(this.Snips, 'Note'));
	},
	
	retrieveProperties: function(){
		var top = ART.retrieve('window:y') || 100;
		var left = ART.retrieve('window:x') || 100;
		var width = ART.retrieve('window:width') || 640;
		var height = ART.retrieve('window:height') || 480;
		var groupsWidth = ART.retrieve('groups:width') || 200;
		var snippetsHeight = ART.retrieve('snippets:height') || 100;
		
		nativeWindow.y = top;
		nativeWindow.x = left;
		nativeWindow.width = width;
		nativeWindow.height = height;
		this.contentLeft.setStyle('width', groupsWidth);
		this.contentTop.setStyle('height', snippetsHeight);
	},
	
	initializeKeyboard: function(){
		var Groups = this.Groups;
		var Snippets = this.Snippets;
		var Snips = this.Snips;
		var previous = null;
		
		this.processKeyboard = function(event){
			var key = event.key, meta = event.meta, next;
			var active = Snippets.selected ? Snippets : Groups.selected ? Groups : null;
			var selected = active && active.selected;
			
			switch (key){
				case 'up':
					previous = null;
					if (selected) next = selected.getPrevious();
					else {
						next = Groups.elements && Groups.elements.getLast();
						active = Groups;
					} break;
					
				case 'down':
					previous = null;
					if (selected) next = selected.getNext();
					else {
						next = Groups.elements && Groups.elements[0];
						active = Groups;
					} break;
					
				case 'right':
					if (active == Groups){
						next = previous || Snippets.elements && Snippets.elements[0];
						active = Snippets;
					} break;
					
				case 'left':
					if (active == Snippets){
						previous = Snippets.selected;
						Snippets.deselect();
						active = Groups;
					} break;
					
				case 'enter':
					if (selected) active.rename(selected);
					break;
					
				case 'backspace':
					if (selected && meta) active.remove(selected);
					break;
					
				case 'n':
					if (meta){
						if (!active) Groups.add();
						else if (active == Groups) Snippets.add();
						else Snips.add('Plain Text');
					}
					break;
			}
			if (next) active.select(next);
		};
		
		this.enableKeyboard();
	},
	
	enableKeyboard: function(){
		window.addEvent('keydown', this.processKeyboard);
	},
	
	disableKeyboard: function(){
		window.removeEvent('keydown', this.processKeyboard);
	},
	
	storeProperties: function(){
		ART.store('window:y', nativeWindow.y);
		ART.store('window:x', nativeWindow.x);
		ART.store('window:height', nativeWindow.height);
		ART.store('window:width', nativeWindow.width);
		
		ART.store('groups:width', this.contentLeft.clientWidth);
		ART.store('groups:active', this.Groups.id);
		
		ART.store('snippets:height', this.contentTop.offsetHeight);
		ART.store('snippet:active', this.Snippets.id);
	},
	
	toggleMenus: function(type, state){
		this.Menus.actionMenu.items['Remove ' + type + '...'].setEnabled(state);
		this.Menus.actionMenu.items['Rename ' + type + '...'].setEnabled(state);
		if (type == 'Group') this.Menus.addMenu.items['Add Snippet...'].setEnabled(state);
	},
	
	redraw: function(){
		var height = window.getHeight();
		if (this.contentTop.offsetHeight > height) this.contentTop.setStyle('height', height);
		this.contentRight.setStyle('left', this.contentLeft.offsetWidth);
		this.contentBottom.setStyle('top', this.contentTop.offsetHeight);
		
		this.groupsScrollbar.update();
		this.snippetScrollbar.update();
		this.snippetsScrollbar.update();
	},
	
	activate: function(){
		(function(){
			nativeWindow.visible = true;
			nativeWindow.activate();
		}).delay(100);
	},

	deactivate: function(){
		nativeWindow.visible = false;
	},
	
	focus: function(){
		document.body.id = 'focus';
	},
	
	blur: function(){
		document.body.id = 'blur';
	}
	
};

// Global Snippely extensions for the Editable Class

Snippely.Editable = new Class({
	
	Extends: Editable,
	
	focus: function(){
		this.parent();
		Snippely.disableKeyboard();
	},
	
	blur: function(){
		this.parent();
		Snippely.enableKeyboard();
	}
	
});

window.addEvent('load', Snippely.initialize.bind(Snippely));