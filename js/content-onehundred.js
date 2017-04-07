//////////////////////
///// Light Unit /////
//////////////////////

/*
 * Light Constructor
 */
var LightUnit = function(config) {
	this.id    = config.id; // id
	this.state = false; 		// steps since the program started

	this.siblings 	= config.siblings;

	this.reset();
};

/*
 * LightUnit: reset()
 * Reset all variables
 */
LightUnit.prototype.reset = function() {

	this.state = Math.random() > .5 ? true : false;

	for (var i = 0; i < this.siblings; i++) {}

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
	this.update();
	this.updateUI();
};

/*
 * LightUnit: update()
 * Update the values
 */
LightUnit.prototype.update = function() {
	this.state = Math.random() > .5 ? true : false;
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
	this.unit = new Array()
	this.children = config.children || 4;

	$('#onehundred').html('');
	for (var i = 0; i < this.children; i++) {

		this.unit[i] = new LightUnit({
			id: i,
			siblings: this.children
		});

		$('#onehundred').append(this.unit[i].getHtml());
	}

};

LightArray.prototype.loop = function() {

	// update all outputs
	for (var i = 0; i < this.unit.length; i++) {
		for (var j = 0; j < this.unit.length; j++) {
		}
	}

	// loop again
	for (var i = 0; i < this.unit.length; i++) {
		this.unit[i].loop();
	}

};


////////////////
///// Loop /////
////////////////

var children = 100;
var maxChildren = 200;
var minChildren = 2;
var lightArray = new LightArray({children: children});
var play = true;
var fps = 5;

function loop() { if(play) lightArray.loop(); };

var start = setInterval(function(){ loop(); }, 1000 / fps);

$(document).ready(function(){

	$('#unitn').val(children).change(function(event) {
		children = $(this).val();
		children = children < maxChildren ? children : maxChildren;
		children = children > minChildren ? children : minChildren;
		lightArray = new LightArray({children: children});
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

	$('#uniselector').click(function() {
		for(var i = 0; i < lightArray.unit.length; i++) {
			for(var j = 0; j < lightArray.unit[i].siblings; j++) {
				lightArray.unit[i].uniselectorState[j] = true;
			}
		}
	});

});