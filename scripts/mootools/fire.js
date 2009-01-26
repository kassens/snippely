// AIRAliases.js - Revision: 1.5

var air = window.air || {};

(function(namespace, props){
	props.each(function(prop){
		air[prop] = namespace[prop];
	});
	return arguments.callee;
})
(window.runtime, ['trace'])
(window.runtime.flash.filesystem, ['File', 'FileStream', 'FileMode'])
(window.runtime.flash.events, ['AsyncErrorEvent', 'AsyncErrorEvent', 'BrowserInvokeEvent', 'DataEvent', 'DRMAuthenticateEvent', 'DRMStatusEvent', 'Event', 'EventDispatcher', 'FileListEvent', 'HTTPStatusEvent', 'IOErrorEvent', 'InvokeEvent', 'NetStatusEvent', 'OutputProgressEvent', 'ProgressEvent', 'SecurityErrorEvent', 'StatusEvent', 'TimerEvent', 'ActivityEvent', 'NativeWindowBoundsEvent', 'NativeWindowDisplayStateEvent', 'SQLErrorEvent', 'SQLEvent', 'SQLUpdateEvent'])
(window.runtime.flash.display, ['NativeWindow', 'NativeWindowDisplayState', 'NativeWindowInitOptions', 'NativeWindowSystemChrome', 'NativeWindowResize', 'NativeWindowType', 'NativeMenu', 'NativeMenuItem', 'Screen', 'Loader', 'Bitmap', 'BitmapData'])
(window.runtime.flash.geom, ['Point', 'Rectangle', 'Matrix'])
(window.runtime.flash.net, ['navigateToURL', 'sendToURL', 'FileFilter', 'LocalConnection', 'NetConnection', 'URLLoader', 'URLLoaderDataFormat', 'URLRequest', 'URLRequestDefaults', 'URLRequestHeader', 'URLRequestMethod', 'URLStream', 'URLVariables', 'Socket', 'XMLSocket', 'Responder', 'ObjectEncoding', 'NetStream', 'SharedObject', 'SharedObjectFlushStatus'])
(window.runtime.flash.system, ['Capabilities', 'System', 'Security'])
(window.runtime.flash.desktop, ['Updater', 'Clipboard', 'ClipboardFormats', 'ClipboardTransferMode', 'NativeDragManager', 'NativeDragOptions', 'NativeDragActions', 'Icon', 'DockIcon', 'InteractiveIcon', 'NotificationType', 'SystemTrayIcon', 'NativeApplication'])
(window.runtime.flash.ui, ['Keyboard', 'KeyLocation', 'Mouse'])
(window.runtime.flash.utils, ['ByteArray', 'CompressionAlgorithm', 'Endian', 'Timer'])
(window.runtime.flash.security, ['XMLSignatureValidator'])
(window.runtime.flash.html, ['HTMLLoader', 'HTMLPDFCapability'])
(window.runtime.flash.media, ['ID3Info', 'Sound', 'SoundChannel', 'SoundLoaderContext', 'SoundMixer', 'SoundTransform', 'Microphone', 'Video', 'Camera'])
(window.runtime.flash.data, ['EncryptedLocalStore', 'SQLCollationType', 'SQLColumnNameStyle', 'SQLColumnSchema', 'SQLConnection', 'SQLIndexSchema', 'SQLMode', 'SQLResult', 'SQLSchema', 'SQLSchemaResult', 'SQLStatement', 'SQLTableSchema', 'SQLTransactionLockType', 'SQLTriggerSchema', 'SQLViewSchema'])
(window.runtime.flash.errors, ['SQLError', 'SQLErrorOperation']);

(function(namespace, props){
	props.each(function(prop){
		air.__defineGetter__(prop, function(){
			return namespace[prop];
		});
	});
	return arguments.callee;
})
(window.runtime.air.net, ["ServiceMonitor", "SocketMonitor", "URLMonitor"])
(window.runtime.air.update, ["ApplicationUpdater", "ApplicationUpdaterUI"])
(window.runtime.air.update.events, ["UpdateEvent", "StatusUpdateEvent", "StatusUpdateErrorEvent", "DownloadErrorEvent", "StatusFileUpdateEvent", "StatusFileUpdateErrorEvent"]);
var Stream = new Class({

	Implements: [Events, Options],

	options: {
		endian: "bigEndian"
	},

	accessors: {
		"boolean": "Boolean",
		"byte": "Byte",
		"bytes": "Bytes",
		"double": "Double",
		"float": "Float",
		"int": "Int",
		"multibyte": "MultiByte",
		"object": "Object",
		"short": "Short",
		"unsignedbyte": "UnsignedByte",
		"unsignedint": "UnsignedInt",
		"unsignedshort": "UnsignedShort",
		"utf": "UTF",
		"utfbytes": "UTFBytes"
	},

	initialize: function(stream, options){
		this.setOptions(options);
		this.stream = stream;
		stream.endian = this.options.endian;

		var events = ['close', 'complete', 'connect', 'httpResponseStatus', 'httpStatus','ioError', 'open', 'outputProgress', 'progress', 'securityError', 'socketData'];
		events.each(function(event){
			stream.addEventListener(event, (function(){
				this.fireEvent(event, arguments);
			}).bind(this), false);
		}, this);
	},

	read: function(type, args){
		var response = "";
		type = (type) ? type.toLowerCase() : "utfbytes";
		args = args || this.stream.bytesAvailable;
		try {
			response = this.stream["read" + this.accessors[type]](args);
		} catch(e){
			this.fireEvent('error', e);
		}
		return response;
	},

	write: function(data, type){
		type = (type) ? type.toLowerCase() : "utfbytes";
		try {
			this.stream["write" + this.accessors[type]](data);
		} catch(e){
			this.fireEvent('error', e);
		}
		return this;
	},

	close: function(){
		this.stream.close();
		return this;
	}

});
var Filesystem = {

	protocols: {
		desktop: air.File.desktopDirectory,
		documents: air.File.documentsDirectory,
		user: air.File.userDirectory
	},

	resolve: function(path){
		if (path.nativePath) return path; // better check?
		return $try(function(){
			return new air.File(path);
		}, function(){
			var match = path.match(/^([a-z\-]+):\/(.*)$/);
			return File.protocols[match[1]].resolvePath(match[2]);
		});
	},

	create: function(file){
		if (file.isDirectory) return new Directory(file);
		return new File(file);
	}

};

Filesystem.Object = new Class({

	options: {
		create: true,
		createParents: true // bad naming
	},

	initialize: function(path, options){
		this.file = Filesystem.resolve(path);
	},

	move: function(target, override){
		this.file.moveTo(Filesystem.resolve(target), override);
		return this;
	},

	trash: function(){
		this.file.moveToTrash();
	},

	getPath: function(){
		return this.file.nativePath;
	}

});

var Directory = new Class({

	Extends: Filesystem.Object,

	initialize: function(path, options){
		this.parent(path, options);
	},

	// recursive: (default = false)
	dispose: function(recursive){
		this.file.deleteDirectory(recursive);
		return this;
	},

	// returns an array of <File>s and <Directory>s
	list: function(){
		return this.file.getDirectoryListing().map(Filesystem.create);
	}

});

var File = new Class({

	Extends: Filesystem.Object,

	initialize: function(path, options){
		this.parent(path, options);
	},

	dispose: function(){
		this.file.deleteFile();
		return this;
	},

	// overrides the file
	write: function(str, type, append){
		var stream = new Stream(new air.FileStream());
		stream.stream.open(this.file, append ? 'append' : 'write');
		stream.write(str, type);
		stream.close();
		return this;
	},

	// appends str to the end of the file
	append: function(str, type){
		return this.write(str, type, true);
	},

	// returns the content
	read: function(){
		try {
			var stream = new Stream(new air.FileStream());
			stream.stream.open(this.file, 'read');
			var str = stream.read();
			stream.close();
			return str;
		} catch (e){
			return null;
		}
	}

});

File.Temp = new Class({

	Extends: File,

	initialize: function(options){
		this.parent(air.File.createTempFile());
	}

});

Directory.Temp = new Class({

	Extends: Directory,

	initialize: function(options){
		this.parent(air.File.createTempDirectory());
	}

});
var Secure = new Class({

	Implements: Options,

	options: {
		stronglyBound: false
	},

	initialize: function(key, options){
		this.setOptions(options);
		this.key = key;
	},

	read: function(){
		return Secure.read(this.key);
	},

	write: function(value){
		Secure.write(this.key, value, this.options.stronglyBound);
		return this;
	},

	dispose: function(){
		Secure.dispose(this.key);
		return this;
	}

});

Secure.read = function(key){
	var bytes = air.EncryptedLocalStore.getItem(key);
	return (bytes === null) ? null : bytes.readUTFBytes(bytes.length);
};

Secure.write = function(key, value, stronglyBound){
	var bytes = new air.ByteArray();
	bytes.writeUTFBytes(value);
	air.EncryptedLocalStore.setItem(key, bytes, stronglyBound);
};

Secure.dispose = function(key){
	air.EncryptedLocalStore.removeItem(key);
};

// Clears the entire encrypted local store, deleting all data.
Secure.reset = function(){
	air.EncryptedLocalStore.reset();
};
Hash.Secure = new Class({

	Extends: Secure,
	
	options: {
		autoSave: true
	},

	initialize: function(key, options){
		this.parent(key, options);
		this.load();
	},

	save: function(){
		var value = JSON.encode(this.hash);
		if (!value) return false;
		if (value == '{}') this.dispose();
		else this.write(value);
		return true;
	},

	load: function(){
		this.hash = new Hash(JSON.decode(this.read(), true));
		return this;
	}

});

Hash.Secure.implement((function(){

	var methods = {};

	Hash.each(Hash.prototype, function(method, name){
		methods[name] = function(){
			var value = method.apply(this.hash, arguments);
			if (this.options.autoSave) this.save();
			return value;
		};
	});

	return methods;

})());
var Database = new Class({

	Implements: [Events, Options],

	options: {
		file: 'database.db'
	},

	initialize: function(options){
		this.setOptions(options);

		this.connection = new air.SQLConnection();
		this.connection.addEventListener('open', this.onOpen.bind(this));
		this.connection.addEventListener('error', this.onError.bind(this));

		var file = air.File.applicationDirectory.resolvePath(this.options.file);
		this.connection.openAsync(file);
	},

	parseCondition: function(condition){
		var clause = '1', parameters = [];
		switch ($type(condition)){
			case 'object':
				clause = Hash.getKeys(condition).join(' = ? AND ') + ' = ?';
				parameters = Hash.getValues(condition);
				break;
			case 'array':
				clause = condition[0];
				parameters = ($type(condition[1]) == 'object') ? condition[1] : condition.slice(1).flatten();
				break;
			case 'string':
				clause = condition;
		};
		return {clause: clause, parameters: parameters};
	},

	prepare: function(query, options){
		return new Database.Query(this, query, options);
	},

	query: function(query, params, options){
		return this.prepare(query, options).execute(params);
	},

	INSERT: function(table, data, options){
		var query = 'INSERT INTO ' + table + '(' + Hash.getKeys(data).join(',') + ') VALUES (:' + Hash.getKeys(data).join(', :') + ')';
		return this.query(query, data, options);
	},

	SELECT: function(table, condition, options){
		condition = this.parseCondition(condition);
		var query = 'SELECT * FROM ' + table + ' WHERE ' + condition.clause;
		return this.query(query, condition.parameters, options);
	},

	UPDATE: function(table, condition, data, options){
		condition = this.parseCondition(condition);
		var query = 'UPDATE ' + table + ' SET ' + Hash.getKeys(data).join(' = ?, ') + ' = ? WHERE ' + condition.clause;
		return this.query(query, Hash.getValues(data).extend(condition.parameters), options);
	},

	DELETE: function(table, condition, options){
		condition = this.parseCondition(condition);
		var query = 'DELETE FROM ' + table + ' WHERE ' + condition.clause;
		return this.query(query, condition.parameters, options);
	},

	loadSchema: function(type, name, callback){
		this.connection.loadSchema(type, name, 'main', true, new air.Responder(callback, this.onError.bind(this)));
		return this;
	},

	loadTableSchema: function(table, callback){
		this.loadSchema(air.SQLTableSchema, table, function(schema){
			air.trace(schema.tables[0].name);
			callback(schema.tables[0].columns);
		});
		return this;
	},

	onOpen: function(event){
		this.fireEvent('connect', event);
	},

	onError: function(event){
		this.fireEvent('error', event);
	}

});

(function(aliases){
	for (alias in aliases) Database.prototype[aliases[alias]] = Database.prototype[alias];
})({
	INSERT: 'insert',
	SELECT: 'select',
	UPDATE: 'update',
	DELETE: 'delete'
});
Database.Query = new Class({

	Implements: [Events, Options, Chain],

	options: {
		link: 'chain',
		limit: false
	},

	initialize: function(database, query, options){
		this.setOptions(options);
		var statement = new air.SQLStatement();
		statement.addEventListener('error', this.onError.bind(this));
		statement.addEventListener('result', this.onResult.bind(this));
		statement.sqlConnection = database.connection;
		if (this.options.limit) query += ' LIMIT ' + $splat(this.options.limit).join(', ');
		statement.text = query;
		this.statement = statement;
	},

	check: function(caller){
		if (!this.statement.executing) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(caller.bind(this, Array.slice(arguments, 1))); return false;
		}
		return false;
	},

	execute: function(parameters){
		if (!this.check(arguments.callee, parameters)) return this;
		var statement = this.statement;
		if (statement.executing) return;
		statement.clearParameters();
		if ($type(parameters) == 'object'){
			Hash.each(parameters, function(value, key){
				statement.parameters[':' + key] = value;
			});
		} else {
			Array.flatten(arguments).each(function(value, key){
				statement.parameters[key] = value;
			});
		}
		this.statement.execute();
		return this;
	},

	onResult: function(event){
		this.fireEvent('result', this.statement.getResult().data);
		this.callChain();
	},

	onError: function(event){
		this.fireEvent('error', event);
	}

});
(function(){

var dimensions = ['x', 'y', 'width', 'height'];

var parse = function(value, min, max){
	if (typeof value == 'string'){
		var match = value.match(/^(\d+)(%?)$/);
		value = match[1].toInt();
		if (match[2]) value = (max - min) * value / 100 + min;
	}
	return value.limit(min, max);
};

Window.implement({
	getBounds: function(){
		var bounds = {};
		var x, y, width, height, args = Array.flatten(arguments);
		if (args.length == 4) {
			dimensions.each(function(dim, index){
				bounds[dim] = args[index];
			});
		} else {
			args = args[0] || {};
			var current = window.nativeWindow.bounds;
			dimensions.each(function(dim){
				bounds[dim] = $pick(args[dim], current[dim]);
			});
		}
		var sb = air.Screen.mainScreen.bounds,
			svb = air.Screen.mainScreen.visibleBounds,
			minSize = window.nativeWindow.minSize,
			maxSize = window.nativeWindow.maxSize;
		bounds.width = parse(bounds.width, minSize.x, Math.min(maxSize.x, svb.width));
		bounds.height = parse(bounds.height, minSize.y, Math.min(maxSize.y, svb.height));
		bounds.x = parse(bounds.x, svb.x, sb.width - bounds.width);
		bounds.y = parse(bounds.y, svb.y, sb.height - bounds.height);
		return bounds;
	},

	setBounds: function(){
		var bounds = this.getBounds(arguments);
		window.nativeWindow.bounds = new air.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
	}
});

Fx.Window = new Class({

	Extends: Fx,

	set: function(bounds){
		window.nativeWindow.bounds = new air.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
	},

	compute: function(from, to, delta){
		var obj = {};
		dimensions.each(function(dim){
			obj[dim] = Fx.compute(from[dim], to[dim], delta);
		});
		return obj;
	},

	start: function(from, to){
		if (!this.check(arguments.callee, from, to)) return this;
		if (!to){
			to = from;
			from = null;
		}
		return this.parent(window.getBounds(from), window.getBounds(to));
	}

});

})();
var AppWindow = new Class({

	Implements: Options,

	options: {
		maximizable: true,
		minimizable: true,
		resizable: true,
		systemChrome: true,
		transparent: false,
		type: 'normal', // utility, lightweight

		visible: true,
		scrollbars: true,

		bounds: {
			top: 300,
			left: 300,
			width: 300,
			height: 200
		}
	},

	initialize: function(content, options){
		this.setOptions(options);

		var windowOptions = new air.NativeWindowInitOptions();
		windowOptions.systemChrome = this.options.systemChrome ? 'standard' : 'none';
		['maximizable', 'minimizable', 'resizable', 'transparent', 'type'].each(function(option){
			windowOptions[option] = this.options[option];
		}, this);

		// TODO: should use setBounds
		var bounds = new air.Rectangle(
			this.options.bounds.top, this.options.bounds.left,
			this.options.bounds.width, this.options.bounds.height);

		var loader = air.HTMLLoader.createRootWindow(this.options.visible, windowOptions, this.options.scrollbars, bounds);
		this.nativeWindow = loader.window.nativeWindow;
		if (content.test(/[a-z]+:/)){
			var file = Filesystem.resolve(content);
			if (file) content = file.url;
			loader.load(new air.URLRequest(content));
		} else {
			loader.loadString(content);
		}
	},

	close: function(){
		this.nativeWindow.close();
		return this;
	}

});
var Menu = new Class({

	initialize: function(){
		this.menu = new air.NativeMenu();
	},

	addItem: function(label, callback){
		var item = new air.NativeMenuItem(label);
		if (callback) item.addEventListener('select', callback, false);
		this.menu.addItem(item);
		return this;
	},
	
	addSubmenu: function(label, menu){
		this.menu.addSubmenu(menu.menu, label);
	},

	addSeperator: function(){
		this.menu.addItem(new air.NativeMenuItem('', true));
	},
	
	display: function(x, y){
		this.menu.display(window.htmlLoader.stage, x, y);
	}
	
});

Element.implement({

	setContextMenu: function(menu){
		this.addEventListener('contextmenu', function(event){
			menu.display(event.x, event.y);
			event.preventDefault();
			event.stopPropagation();
		}, false);
	}

});
var Socket = new Class({

	Extends: Stream,

	options: {
		host: "127.0.0.1",
		port: 80,
		timeout: 20000,
		persistent: false,
		autoConnect: false
	},

	initialize: function(options){
		this.parent(new air.Socket(), options);
		if ($defined(this.stream.timeout)) this.stream.timeout = this.options.timeout;
		this.addEvent('close', this.persist.bind(this), true);
		if (this.options.autoConnect) this.connect();
	},

	isConnected: function(){
		return this.stream.connected;
	},

	connect: function(host, port){
		this.host = host || this.options.host;
		this.port = port || this.options.port;
		this.stream.connect(this.host, this.port);
		return this;
	},

	persist: function(){
		if (this.options.persistent && !this.stream.connected) this.connect(this.host, this.port);
	},

	read: function(type, args){
		this.persist();
		return this.parent(type, args);
	},

	write: function(data, type){
		this.persist();
		return this.parent(data, type);
	},

	send: function(data, type){
		this.write(data, type);
		return this.flush();
	},

	flush: function(){
		this.persist();
		this.stream.flush();
		return this;
	},

	close: function(){
		if (this.stream.connected) this.parent();
	}

});
