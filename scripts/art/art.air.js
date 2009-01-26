// # Requires AIR.Aliases.js

// Aliases

var ART = {}, AIR = air;

var Application = AIR.NativeApplication.nativeApplication;

// ART Menu for AIR

ART.Menu = new Class({
	
	Implements: Options,
	
	options: {
		_menu: null
	},
	
	initialize: function(name, options){
		this.setOptions(options);
		this.menu = this.options._menu || new AIR.NativeMenu();
		this.name = name;
		
		this.items = {};
	},
	
	addItem: function(item){
		this.items[item.name] = item;
		this.menu.addItem(item.item);
		return this;
	},
	
	addItems: function(){
		$A(arguments).flatten().each(this.addItem, this);
		return this;
	},
	
	addMenu: function(menu){
		this.menu.addSubmenu(menu.menu, menu.name);
		return this;
	},
	
	attachTo: function(menu){
		menu.menu.addSubMenu(this.menu, this.name);
		return this;
	},
	
	display: function(pos){
		var activeWindow = Application.activeWindow;
		if (activeWindow) this.menu.display(activeWindow.stage, pos.x, pos.y);
		return this;
	},
	
	clone: function(){
		return new ART.Menu(this.name, $extend(this.options, {_menu: this.menu}));
	}
	
});

// ART Menu Item for AIR

ART.Menu.Item = new Class({
	
	Implements: [Events, Options],
	
	options: {
		checked: undefined,
		enabled: undefined,
		shortcut: undefined,
		separator: false,
		_item: null
	},
	
	initialize: function(name, options){
		this.setOptions(options);
		this.name = name;
		
		if (this.options._item){
			this.item = this.options._item;
		} else {
			this.item = new AIR.NativeMenuItem(name, this.options.separator);

			this.item.addEventListener('select', function(){
				this.fireEvent('onSelect', this);
			}.bind(this));
			
			if (this.options.checked) this.setChecked(this.options.checked);
			if (this.options.enabled) this.setEnabled(this.options.enabled);
			if (this.options.shortcut) this.setShortcut(this.options.shortcut);
		}
	},
	
	attachTo: function(menu){
		menu.addItem(this);
		return this;
	},
	
	clone: function(){
		return new ART.Menu.Item(this.name, $extend(this.options, {_item: this.item}));
	},
	
	// Exposed class properties
	
	setChecked: function(value){
		this.item.checked = value;
	},
	
	getChecked: function(){
		this.item.checked;
	},
	
	setEnabled: function(value){
		this.item.enabled = value;
	},
	
	getEnabled: function(){
		return this.item.enabled;
	},
	
	setShortcut: function(shortcut){
		var keys = shortcut.split('+');
		this.item.keyEquivalent = keys.pop();
		var modifiers = [];
		keys.each(function(key){
			modifiers.push(AIR.Keyboard[key.toUpperCase()]);
		});
		this.item.keyEquivalentModifiers = modifiers;
		this._shortcut = shortcut;
	},
	
	getShortcut: function(shortcut){
		return this._shortcut;
	}
	
});

// storage wrappers

ART.Storage = {
	
	data: {},
	
	store: function(key, value){
		ART.Storage.data[key] = value;
		var bytes = new AIR.ByteArray();
		bytes.writeUTFBytes(JSON.encode(ART.Storage.data));
		AIR.EncryptedLocalStore.setItem('application:storage', bytes);
		return ART.Storage;
	},
	
	retrieve: function(key){
		var stored = AIR.EncryptedLocalStore.getItem('application:storage');
		var data = (stored && stored.length) ? JSON.decode(stored.readUTFBytes(stored.length)) : null;
		if (data) return (data[key] != undefined) ? data[key] : null;
	}
	
};

ART.store = ART.Storage.store;
ART.retrieve = ART.Storage.retrieve;

// ART Window for AIR

ART.HTML = {};

ART.HTML.Window = new Class({

	Implements: [Events, Options],
	
	initialize: function(){
		
	}

});