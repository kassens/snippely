Snippely.Snippet = {
	
	initialize: function(){
		this.title = $('snippet-title');
		this.toolbar = $('snippet-toolbar');
		this.description = $('snippet-description');
		this.container = $('content-bottom');
		
		new Snippely.Editable(this.title, { onBlur: this.updateTitle.bind(this) });
		new Snippely.Editable(this.description, { enter: true, onBlur: this.updateDescription.bind(this) });
	},
	
	load: function(id){
		var callback = function(result){
			var data = result.data && result.data[0];
			if (data) this.build(data);
		}.bind(this);
		
		Snippely.database.select('snippets', {id: id}, {
			onResult: callback
		});
	},
	
	build: function(snippet){
		this[snippet ? 'show' : 'hide']();
		if (!snippet) return;
		
		this.id = snippet.id;
		this.title.set('text', snippet.title);
		this.description.set('text', snippet.description);
	},
	
	updateTitle: function(element){
		Snippely.database.update('snippets', {id: this.id}, {title: element.get('text')}, {
			onResult: Snippely.Snippets.load.bind(Snippely.Snippets)
		});
	},
	
	updateDescription: function(element){
		Snippely.database.update('snippets', {id: this.id}, {description: element.get('text')});
	},
	
	show: function(){
		this.container.setStyle('display', '');
	},
	
	hide: function(){
		this.container.setStyle('display', 'none');
	}
	
};
