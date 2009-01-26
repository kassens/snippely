// Content Editable Class

var Editable = new Class({
	
	Implements: [Events, Options],
	
	options: {/*
		onBlur: $empty,
		onFocus: $empty,*/
		code: false,
		enter: false,
		wrapper: false,
		className: 'editing',
		activation: 'dblclick',
		policy: 'read-write-plaintext-only'
	},
	
	initialize: function(element, options){
		this.setOptions(options);
		this.element = $(element);
		this.wrapper = this.options.wrapper || this.element;
		this.element.addEvent(this.options.activation, this.focus.bind(this));
		this.element.addEvent('keydown', this.process.bind(this));
		this.element.addEvent('blur', this.blur.bind(this));
		this.element.store('editable', this);
	},
	
	editing: function(){
		return this.wrapper.hasClass(this.options.className);
	},
	
	focus: function(){
		this.wrapper.addClass(this.options.className);
		this.element.setStyle('-webkit-user-modify', this.options.policy);
		if (this.options.activation == 'dblclick') this.element.focus();
		this.fireEvent('onFocus', this.element);
	},
	
	blur: function(){
		this.wrapper.removeClass(this.options.className);
		this.element.setStyle('-webkit-user-modify', 'read-only');
		this.fireEvent('onBlur', this.element);
	},
	
	process: function(event, node){
		var key = event.key, meta = event.meta;
		if (key == 'backspace' && this.element.get('text') == '') event.stop();
		else if ((meta && (key == 's' || key == 'enter')) || (key == 'enter' && !this.options.enter)){
			this.element.blur();
			event.stop();
		} else if (!meta && this.options.code){
			var selection = window.getSelection();
			try {
				var range = selection.getRangeAt(0);
				if (!range) return;
				switch (key){
					case 'tab': node = document.createTextNode('\t'); break;
					case 'enter': node = document.createTextNode('\n'); break;
				}
				if (node){
					range.insertNode(node);
					selection.setPosition(node, 1);
					event.preventDefault();
				}
			}
			catch(e){};
		}
	}
	
});

// Content History Class

var History = new Class({
	
	Implements: [Events, Options],
	
	options: {
		steps: 15,
		property: 'text'
	},
	
	initialize: function(element, options){
		this.setOptions(options);
		this.element = $(element);
		this.element.addEvent('keydown', this.process.bind(this));
		this.reset();
	},
	
	current: function(){
		return this.element.get(this.options.property);
	},
	
	process: function(event){
		var content = this.current();
		if (event.meta && event.key == 'z'){
			event.preventDefault();
			this[event.shift ? 'redo' : 'undo'](content);
		} else if (!event.meta) {
			this.stack = this.stack.slice(0, this.index + 1);
			if (content != this.stack[this.index]){
				if (this.index >= this.options.steps - 1) this.stack.shift();
				this.stack.push(content);
				this.index = this.stack.length;
			}
		}
	},
	
	undo: function(content){
		this.index = (0).max(this.index - 1);
		this.element.set(this.options.property, this.stack[this.index]);
	},
	
	redo: function(content){
		this.index = (this.stack.length - 1).min(this.index + 1);
		this.element.set(this.options.property, this.stack[this.index]);
	},
	
	reset: function(){
		this.stack = [this.current()];
		this.index = 0;
	}
	
});