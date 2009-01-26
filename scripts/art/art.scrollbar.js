ART.ScrollBar = new Class({
	
	Implements: [Events, Options],

	options: {
		id: null,
		wheel: 8,
		className: null,
		minThumbSize: 35,
		morph: {duration: 200, link: 'cancel'}
	},

	initialize: function(scrolling, content, options){
		this.setOptions(options);
		this.scrolling = $(scrolling);
		this.content = $(content);
		
		this.document = this.scrolling.getDocument();
		this.padding = this.scrolling.getStyle('padding-right').toInt();
		this.container = new Element('div').addClass('art-scrollbar').inject(this.scrolling);
		
		if (this.options.id) this.container.set('id', this.options.id);
		if (this.options.className) this.container.addClass(this.options.className);
		
		this.track = new Element('div', {'class': 'art-scrollbar-track'}).inject(this.container);
		this.thumb = new Element('div', {'class': 'art-scrollbar-thumb'}).inject(this.track);
		this.paintTop = new Element('div', {'class': 'art-scrollbar-paint-top'}).inject(this.thumb);
		this.paintCenter = new Element('div', {'class': 'art-scrollbar-paint-center'}).inject(this.thumb);
		this.paintBottom = new Element('div', {'class': 'art-scrollbar-paint-bottom'}).inject(this.thumb);
		
		this.scroller = new Fx.Scroll(this.content, this.options.morph);
		this.morphThumb = new Fx.Morph(this.thumb, this.options.morph);
		
		this.selection = (Browser.Engine.trident) ? 'selectstart' : 'mousedown';
		
		this.bound = {
			start: this.start.bind(this),
			end: this.end.bind(this),
			drag: this.drag.bind(this),
			wheel: this.wheel.bind(this),
			page: this.page.bind(this),
			show: this.show.bind(this),
			hide: this.hide.bind(this),
			stopSelection: $lambda(false)
		};
		
		this.mousedown = this.hidden = false;
		this.position = {};
		this.mouse = {};
		this.update();
		this.attach();
	},

	attach: function(){
		this.thumb.addEvent('mousedown', this.bound.start);
		if (this.options.wheel) this.scrolling.addEvent('mousewheel', this.bound.wheel);
		this.container.addEvent('click', this.bound.page);
	},
	
	show: function(force){
		if (force || this.hidden){
			this.scrolling.setStyle('padding-right', this.padding + this.track.offsetWidth);
			this.container.setStyle('visibility', 'visible');
			this.hidden = false;
		}
	},
	
	hide: function(force){
		if (force || !this.hidden){
			this.scrolling.setStyle('padding-right', this.padding);
			this.container.setStyle('visibility', 'hidden');
			this.hidden = true;
		}
	},

	update: function(){
		this.contentSize = this.content.offsetHeight;
		this.contentScrollSize = this.content.scrollHeight;
		this.contentRatio = this.contentSize / this.contentScrollSize;
		
		this.trackSize = this.track.offsetHeight;
		this.thumbSize = (this.trackSize * this.contentRatio).limit(this.options.minThumbSize, this.trackSize);
		
		this.availableTrackScroll = this.trackSize - this.thumbSize;
		this.availableContentScroll = this.contentScrollSize - this.contentSize;
		this.scrollRatio = (this.availableContentScroll) / (this.availableTrackScroll);

		this.thumb.setStyle('height', this.thumbSize);
		
		if (this.thumbSize == this.trackSize){
			this.hide(true);
		} else {
			this.paintCenter.setStyles({
				height: this.thumb.offsetHeight - this.paintTop.offsetHeight - this.paintBottom.offsetHeight
			});
			this.show(true);
		}
		
		this.updateThumbFromContentScroll();
		this.updateContentFromThumbPosition();
	},
	
	updateThumbFromContentScroll: function(scroll){
		var scrollValue = $pick(scroll, this.content.scrollTop);
		this.position.now = (scrollValue / this.scrollRatio).limit(0, (this.trackSize - this.thumbSize));
		if ($defined(scroll)) this.morphThumb.start({top: this.position.now});
		else this.thumb.setStyles({top: this.position.now});
	},

	updateContentFromThumbPosition: function(){
		this.content.scrollTop = this.position.now * this.scrollRatio;
	},

	wheel: function(event){
		this.content.scrollTop -= event.wheel.round() * this.options.wheel;
		this.updateThumbFromContentScroll();
	},

	page: function(event){
		if (this.track.hasChild(event.target)) return;
		var height = this.content.offsetHeight;
		var page = (event.page.y > this.thumb.getTop()) ? height : -height;
		var scroll = this.content.scrollTop + page;
		this.scroller.start(0, scroll);
		this.updateThumbFromContentScroll(scroll);
	},

	start: function(event){
		this.mousedown = true;
		this.mouse.start = event.page.y;
		this.position.start = this.thumb.getStyle('top').toInt();
		document.addEvent('mousemove', this.bound.drag);
		document.addEvent('mouseup', this.bound.end);
		this.document.addEvent(this.selection, this.bound.stopSelection);
	},

	end: function(event){
		this.mousedown = false;
		this.document.removeEvent('mousemove', this.bound.drag);
		this.document.removeEvent('mouseup', this.bound.end);
		this.document.removeEvent(this.selection, this.bound.stopSelection);
	},

	drag: function(event){
		this.mouse.now = event.page.y;
		this.position.now = (this.position.start + (this.mouse.now - this.mouse.start));
		this.updateContentFromThumbPosition();
		this.updateThumbFromContentScroll();
	}

});