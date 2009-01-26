Snippely.Snips = {
	
	initialize: function(){
		this.container = $('snippet-snips');
	},
	
	load: function(id){
		var callback = function(result){
			var snips = result.data || [];
			this.container.empty();
			this.build(snips);
		}.bind(this);
		
		Snippely.database.execute(this.Queries.select, callback, { snippet_id: id });
	},
	
	build: function(snips){
		var elements = snips.map(this.create, this);
		this.elements = $$(elements);
		
		this.sortables = new Sortables('snippet-snips', {
			clone: true,
			opacity: 0,
			handle: 'div.info',
			onStart: function(){
				this.element.addClass('sorting');
				Snippely.redraw();
				this.drag.options.modifiers = {x: false, y: 'top'};
				this.clone.addClass('sorting').setStyles({'z-index': 1000, 'width': this.element.getStyle('width')});
			},
			onComplete: function(element){
				if (element) element.removeClass('sorting');
				Snippely.redraw();
				this.updatePositions(this.sortables.serialize(function(element){
					return element.retrieve('snip:id');
				}));
			}.bind(this)
		});
		
		Snippely.redraw();
	},
	
	create: function(snip){
		var items = Snippely.Menus.brushMenu.items;
		var clipboard = air.Clipboard.generalClipboard;
		
		var wrapper = new Element('div', {'class': (snip.type == 'Note' ? 'note' : 'code') + ' snip'});
		var info = new Element('div', {'class': 'info'}).inject(wrapper);
		var remove = new Element('span', {'class': 'action', 'text': 'remove'}).inject(info);
		//var paste = new Element('span', {'class': 'action', 'text': 'paste'}).inject(info);
		//var copy = new Element('span', {'class': 'action', 'text': 'copy'}).inject(info);
		var select = new Element('span', {'class': 'select', 'text': snip.type}).inject(info);
		var content = new Element('div', {'class': 'content', 'text': snip.content}).inject(wrapper).paint(snip.type);
		
		var history = new History(content);
		var editable = new Snippely.Editable(content, {
			code: true,
			enter: true,
			wrapper: wrapper,
			activation: 'mousedown',
			onBlur: function(){
				history.reset();
				this.updateContent(wrapper);
				content.paint(wrapper.retrieve('snip:type'));
			}.bind(this)
		});
		
		remove.addEvent('mousedown', this.remove.bind(this, wrapper));
		
		/*
		paste.addEvent('mousedown', function(event){
			content.set('text', clipboard.getData("text/plain"));
		}.bind(this));
		
		copy.addEvent('mousedown', function(event){
			clipboard.clear();
			clipboard.setData(content.get('text'), "text/plain", false);
		}.bind(this));
		*/
		
		select.addEvent('mousedown', function(event){
			this.active = wrapper;
			for (var item in items) items[item].checked = !!(item == wrapper.retrieve('snip:type'));
			select.addClass('active');
			Snippely.Menus.brushMenu.display(event.client);
			select.removeClass('active');
			event.stop();
		}.bind(this));
		
		wrapper.store('select', select);
		wrapper.store('content', content);
		wrapper.store('snip:id', snip.id);
		wrapper.store('snip:type', snip.type);
		
		return wrapper.inject(this.container);
	},
	
	add: function(type){
		var snippet = Snippely.Snippets.selected;
		if (!snippet) return;
		
		type = type || 'Plain Text';
		var content = 'Some Content';
		var callback = function(result){
			var wrapper = this.create({ id: result.lastInsertRowID, type: type, content: content });
			this.sortables.addItems(wrapper);
			this.elements.push(wrapper);
			Snippely.redraw();
			wrapper.retrieve('content').fireEvent('mousedown').focus();
		}.bind(this);
		
		Snippely.database.execute(this.Queries.insert, callback, {
			type: type,
			content: content,
			position: this.elements.length,
			snippet_id: snippet.retrieve('snippet:id')
		});
	},
	
	remove: function(element){
		this.removeById(element.retrieve('snip:id'));
		this.sortables.removeItems(element).destroy();
		this.sortables.fireEvent('onComplete');
	},
	
	removeById: function(id){
		Snippely.database.execute(this.Queries.remove, { id: id });
	},
	
	removeBySnippet: function(snippet_id){
		Snippely.database.execute(this.Queries.removeBySnippet, { snippet_id: snippet_id });
	},
	
	updateType: function(type){
		var wrapper = this.active;
		if (!wrapper) return;
		var callback = function(){
			wrapper.store('snip:type', type).retrieve('select').set('text', type);
			wrapper.set('class', (type == 'Note' ? 'note' : 'code') + ' snip');
			wrapper.retrieve('content').paint(type);
		};
		
		Snippely.database.execute(this.Queries.updateType, callback, {
			id: wrapper.retrieve('snip:id'),
			type: type
		});
	},
	
	updateContent: function(wrapper){
		Snippely.database.execute(this.Queries.updateContent, {
			id: wrapper.retrieve('snip:id'),
			content: wrapper.retrieve('content').get('text')
		});
	},
	
	updatePositions: function(order){
		order.each(function(id, position){
			Snippely.database.execute(this.Queries.updatePosition, { id: id, position: position });
		}, this);
	}
	
};

//Snip related queries

Snippely.Snips.Queries = {
	
	select: "SELECT * FROM snips WHERE snippet_id = :snippet_id ORDER BY position ASC",
	
	insert: "INSERT INTO snips (snippet_id, position, type, content) VALUES (:snippet_id, :position, :type, :content)",
	
	remove: "DELETE FROM snips WHERE id = :id",
	
	updateType: "UPDATE snips SET type = :type WHERE id = :id",
	
	updateContent: "UPDATE snips SET content = :content WHERE id = :id",
	
	updatePosition: "UPDATE snips SET position = :position WHERE id = :id",
	
	removeBySnippet: "DELETE FROM snips WHERE snippet_id = :snippet_id"
	
};