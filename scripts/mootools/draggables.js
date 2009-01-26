// rule: { subject, property, axis, min, max, invert }

var Draggable = new Class({
	
	Implements: Options,
	
	options: {
		min: false,
		max: false,
		axis: false,
		handle: false
	},
	
	initialize: function(rules, options){
		this.setOptions(options);
		this.bound = this.drag.bind(this);
		this.rules = $splat(rules) || [];
		this.body = $(document.body).addEvent('mouseup', this.stop.bind(this));
		($(this.options.handle) || this.body).addEvent('mousedown', this.start.bind(this));
	},
	
	start: function(event){
	  event.preventDefault();
	  this.initial = event.page;
		this.body.addEvent('mousemove', this.bound);
		this.rules.each(function(rule){
			rule.subject = $(rule.subject);
			rule.min = rule.min || this.options.min;
			rule.max = rule.max || this.options.max;
			rule.axis = rule.axis || this.options.axis;
			rule.initial = rule.subject.getStyle(rule.property).toInt();
		}, this);
	},
	
	stop: function(event){
		this.body.removeEvent('mousemove', this.bound);
	},
	
	drag: function(event){
	  var delta = { x: event.page.x - this.initial.x, y: event.page.y - this.initial.y };
		this.rules.each(function(rule, index){
			var value = rule.initial + (delta[rule.axis] * (rule.invert ? -1 : 1));
			if (rule.min && value < rule.min) value = rule.min;
			if (rule.max && value > rule.max) value = rule.max;
			rule.subject.setStyle(rule.property, value);
		}, this);
	}
	
});
