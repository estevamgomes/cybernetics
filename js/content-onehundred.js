//////////////////////
///// Light Unit /////
//////////////////////

/*
 * Light Constructor
 */
var LightUnit = function(config) {
	this.id    = config.id; // id
	this.state = false; 	// state [true = on; false = off]

	this.siblings = config.siblings; // array of siblings IDs

	this.reset();
};

/*
 * LightUnit: reset()
 * Reset all variables
 */
LightUnit.prototype.reset = function() {
	this.state = Math.random() > .5 ? true : false;
	this.updateUI(); // update the user interface
};

/*
 * LightUnit: updateUI()
 * Update UI (User Interface)
 */
LightUnit.prototype.updateUI = function() {
	var $unit = $('#unit-' + this.id);
	if(this.state) $unit.addClass('active'); else $unit.removeClass('active');
};

/*
 * LightUnit: loop()
 * updates values and interfaces
 */
LightUnit.prototype.loop = function() {
	this.updateUI();
};

/*
 * LightUnit: getHtml()
 * Output the user interface HTML
 */
LightUnit.prototype.getHtml = function() {
	var html = '<div id="unit-' + this.id + '" class="light-unit"></div>';
	return html;
};


///////////////////////
///// Light Array /////
///////////////////////

var LightArray = function(config) {
	this.unit 			= new Array();
	this.children 		= config.children || 100;
	this.connections	= config.connections || 10;

	if(this.connections > this.children) this.connections = this.children;

	$('#onehundred').html('');

	for (var i = 0; i < this.children; i++) {

		var siblings = new Array();
		for (var j = 0; j < this.connections; j++) {
			siblings[j] = Math.floor(Math.random() * this.children);
		}

		this.unit[i] = new LightUnit({
			id: i,
			siblings: siblings
		});

		$('#onehundred').append(this.unit[i].getHtml());
	}
};

LightArray.prototype.loop = function() {

	var currentState = new Array();
	for (var i = 0; i < this.unit.length; i++) {
		currentState[i] = this.unit[i].state;
	}

	for (var i = 0; i < this.unit.length; i++) {
		// if any sibling is on
		var siblingOn = false;
		for (var j = 0; j < this.unit[i].siblings.length; j++) {
			var siblingId = this.unit[i].siblings[j];
			if(currentState[siblingId] == true) siblingOn = true
		}

		// reset the light
		if(this.unit[i].state == true || siblingOn) {
			this.unit[i].reset();
		}
	}

};


////////////////
///// Loop /////
////////////////

var children = 100;
var connections = 100;
var maxChildren = 200;
var minChildren = 2;
var lightArray = new LightArray({children: children, connections: connections});
var play = true;
var fps = 5;

function loop() { if(play) lightArray.loop(); };

var start = setInterval(function(){ loop(); }, 1000 / fps);

$(document).ready(function(){

	$('#unitn').val(children).change(function(event) {
		children = $(this).val();
		if(children > maxChildren) children = maxChildren;
		if(children < minChildren) children =  minChildren;
		lightArray = new LightArray({children: children, connections: connections});

		$('#unitcnx').attr({
			max: children
		});

		if(children < connections) $('#unitcnx').val(children);
	});

	$('#unitcnx').val(connections).change(function(event) {
		connections = $(this).val();
		connections = connections < maxChildren ? connections : maxChildren;
		connections = connections > 0 ? connections : 0;
		lightArray = new LightArray({children: children, connections: connections});
	});

	$('#fps').val(fps).change(function(event) {
		fps = $(this).val();
		clearInterval(start);
		start = setInterval(function(){ loop(); }, 1000 / fps);
	});

	$('#step').addClass('disabled').click(function() {
		lightArray.loop();
	});

	$('#play').click(function() {
		play = play ? false : true;
		if(play) {
			$('#step').addClass('disabled');
		} else {
			$('#step').removeClass('disabled');
		}
		$(this).html(play ? 'Pause' : 'Play');
	});

	$('#reset').click(function() {
		for(var i = 0; i < lightArray.unit.length; i++) lightArray.unit[i].reset();
	});

});