//////////////////////////
///// Homeostat Unit /////
//////////////////////////

/*
 * HomeostatUnit Constructor
 */
var HomeostatUnit = function(config) {
	this.id    = config.id; // id
	this.steps = 0; 		// steps since the program started

	this.resolution = 1000;
	this.siblings 	= config.siblings;

	this.output 	  = 0;
	this.outputLimit  = 1;	// se o output estiver entre +outputLimit e -outputLimit o homeostato está em equilíbrio
	this.manualOutput = false;

	this.input 				= [];
	this.manualInput 		= [];
	this.inputCommutator	= [];
	this.inputPotentiometer = [];
	this.inputCoil 			= [];

	this.uniselector 			= [];	// 25 randomized values between -1 and 1
	this.uniselectorLastChange  = 0;	// last step when the uniselector was changed
	this.uniselectorDelay		= 15; 	// delay between changes at the uniselector in steps
	this.uniselectorState 		= [];	// if uniselector is ON or OFF
	this.uniselectorIndex 		= [];	// 

	this.reset();
};

/*
 * HomeostatUnit: reset()
 * Reset all variables
 */
HomeostatUnit.prototype.reset = function() {

	for (var i = 0; i < this.siblings; i++) {

		this.input[i] = 0;
		this.manualInput[i] = false;

		/*
		But the inputs, instead of being controlled by parameters set by hand,
		can be sent by the switches S through similar components arranged
		on a uniselector (or 'stepping-switch') U. The values of the
		components in U were deliberately randomised by taking the
		actual numerical values from Fisher and Yates' Table of Random
		Numbers. Once built on to the uniselectors, the values of these
		parameters are determined at any moment by the positions of
		the uniselectors. Twenty-five positions on each of four uniselectors
		(one to each unit) provide 390,625 combinations of
		parameter-values
		*/
		this.uniselectorState[i] = false;
		this.uniselectorIndex[i] = 0;
		this.uniselector[i] = [];
		for (var j = 0; j < 25; j++) {
			this.uniselector[i][j] = Math.round((Math.random() * 2 - 1) * this.resolution) / this.resolution;
		}

		// a commutator (X) which determines the polarity of entry to the coil
		// +1 or -1
		this.inputCommutator[i] = 1;

		// a potentiometer (P) which determines what fraction of the input shall reach the coil.
		// real number between 0 and 1
		this.inputPotentiometer[i] = 1;

		// coil
		this.inputCoil[i] = 0;
	}

	this.steps 		  = 0;
	this.output 	  = 0;
	this.manualOutput = false;

	this.uniselectorLastChange  = 0;
	this.uniselectorDelay		= 5;

	this.updateUI(); // update the user interface
};

/*
 * HomeostatUnit: updateUI()
 * Update UI (User Interface)
 */
HomeostatUnit.prototype.updateUI = function() {

	var $unit = $('#unit-' + this.id);

	for (var i = 0; i < this.input.length; i++) {

		var $sibIn = $unit.find('.input-' + i);
		$sibIn.find('.coil').html(Math.round(this.inputCoil[i] * this.resolution) / this.resolution);
		$sibIn.find('.in-value').html(this.input[i]);

		$sibIn.find('.potentiometer').html(this.inputPotentiometer[i]);	
		$sibIn.find('.potentiometer-slider').slider('value', this.inputPotentiometer[i]);
		$sibIn.find('.commutator').val(this.inputCommutator[i]);

		if(!this.uniselectorState[i]) {
			$sibIn.find('.math-sign-commutator').show();
			$sibIn.find('.commutator-wrapper').show();
			$sibIn.find('.uniselector-wrapper').hide();
			$sibIn.find('.potentiometer-wrapper').show();	
		} else {
			$sibIn.find('.math-sign-commutator').hide();
			$sibIn.find('.commutator-wrapper').hide();
			$sibIn.find('.potentiometer-wrapper').hide();	
			$sibIn.find('.uniselector-wrapper').show();
			$sibIn.find('.uniselector').html(this.uniselector[i][this.uniselectorIndex[i]]);
			$sibIn.find('.uniselector-index').html(this.uniselectorIndex[i]);
		}
	};

	$unit.find('.output-value').html(this.output);
	$unit.find('.output-slider').slider('value', this.output);

	// change slider color if is stable
	if(this.output < this.outputLimit && this.output > -this.outputLimit) {
		$unit.find('.output-slider').addClass('stable');
	} else {
		$unit.find('.output-slider').removeClass('stable');
	}
};

/*
 * HomeostatUnit: random()
 * Random potentiometer and commutator value
 */
HomeostatUnit.prototype.random = function() {
	for (var i = 0; i < this.input.length; i++) {
		this.inputPotentiometer[i] = Math.floor(Math.random() * 100) / 100;
		this.inputCommutator[i] = Math.random() >= .5 ? 1 : -1;
	}
};

/*
 * HomeostatUnit: loop()
 * updates values and interfaces
 */
HomeostatUnit.prototype.loop = function() {
	this.update();
	this.updateUI();
};

/*
 * HomeostatUnit: update()
 * Update the values
 */
HomeostatUnit.prototype.update = function() {

	if(!this.manualOutput) {
		this.output = 0;
		for (var i = 0; i < this.input.length; i++) {
			if(!this.uniselectorState[i]) {
				this.inputCoil[i] = this.input[i] * this.inputCommutator[i] * this.inputPotentiometer[i];
			} else {
				this.inputCoil[i] = this.input[i] * this.uniselector[i][this.uniselectorIndex[i]];
			}
			this.output += this.inputCoil[i];
		};
		this.output = Math.round( (this.output / this.input.length) * this.resolution) / this.resolution;

		// uniselector auto change
		if((this.output > this.outputLimit || this.output < -this.outputLimit) && this.steps - this.uniselectorLastChange > this.uniselectorDelay) {
			for (var i = 0; i < this.input.length; i++) {
				// funcionamento da forma como foi descrito
				/*
				if(this.uniselectorIndex[i] < this.uniselector[i].length - 1) {
					this.uniselectorIndex[i]++;
				} else {
					this.uniselectorIndex[i] = 0;
				}
				*/
				// alteração randomica
				this.uniselectorIndex[i] = Math.floor(Math.random() * this.uniselector[i].length);
			}
			this.uniselectorLastChange = this.steps;
		}
	}

	this.steps++;
};

/*
 * HomeostatUnit: getHtml()
 * Output the user interface HTML
 */
HomeostatUnit.prototype.getHtml = function() {
	var html = '<div id="unit-' + this.id + '" class="homeostat-unit">';
		html += '<h1>Unit ' + this.id + '</h1>';

		html += '<div class="output">';
			html += '<h2>Output: <span class="output-value"></span></h2>';
		html += '</div>';

		html += '<h2>Input</h2>';
		html += '<ul class="input-wrapper">';

		for (var i = 0; i < this.siblings; i++) {
			html += '<li class="input input-' + i + '">';
				html += '<div class="math-operation">';

					html += '<div class="math-operand value-wrapper">';
						html += '<span class="label">IN.' + i + ': </span>';
						html += '<span class="in-value number">' + this.input[i] + '</span>';
					html += '</div>';

					html += '<span class="math-sign math-sign-commutator">&times;</span>';

					html += '<div class="math-operand commutator-wrapper">';
						html += '<label class="label"><abbr title="Commutator">Com</abbr>: </label>';
						html += '<select class="commutator">';
							html += '<option value="1"';
							if(this.inputCommutator[i] == 1) html += ' selected';
							html += '>+1</option>';
							html += '<option value="-1"';
							if(this.inputCommutator[i] == -1) html += ' selected';
							html += '>-1</option>';
						html += '</select>';
					html += '</div>';

					html += '<span class="math-sign">&times;</span>';

					html += '<div class="math-operand potentiometer-wrapper">';
						html += '<span class="label"><abbr title="Potentiometer">Pot</abbr>: </span>';
						html += '<span class="potentiometer number">' + this.inputPotentiometer[i] + '</span>';
					html += '</div>';

					html += '<div class="math-operand uniselector-wrapper">';
						html += '<span class="label"><abbr title="Uniselector">Uni</abbr> <span class="uniselector-index"></span>: </span>';
						html += '<span class="uniselector number">' + this.uniselector[i][this.uniselectorIndex[i]] + '</span>';
					html += '</div>';

					html += '<span class="math-sign">=</span>';

					html += '<div class="math-operand coil-wrapper">';
						html += '<span class="label">Coil: </span>';
						html += '<span class="coil number"></span>';
					html += '</div>';

				html += '</div>';
			html += '</li>';
		};

		html += '</ul>';
	html += '</div>';
	return html;
};


/////////////////////
///// Homeostat /////
/////////////////////

var Homeostat = function(config) {
	this.unit = new Array()
	this.children = config.children || 4;
	this.steps = 0;

	$('#homeostat').html('');
	for (var i = 0; i < this.children; i++) {

		this.unit[i] = new HomeostatUnit({
			id: i,
			siblings: this.children
		});

		$('#homeostat').append(this.unit[i].getHtml());
	}

	////////////////
	//// SLIDER ////
	////////////////

	$('.homeostat-unit').each(function(i) {

		// Ouput Slider
		$(this).find('.output').each(function(j) {
			$(this).append('<div class="output-slider"></div>');
			$(this).find('.output-slider').slider({
				animate: "fast",
				value: 0,
				min: -100,
				max: 100,
				step: 1,
				slide: function( event, ui ) {
					homeostat.unit[i].output = ui.value;
				},
				start: function() {
					homeostat.unit[i].manualOutput = true;
				},
				stop: function() {
					homeostat.unit[i].manualOutput = false;
				},
			});
		});

		// Input Sliders
		$(this).find('.input').each(function(j) {

			// Pot Slider
			var potStartVal = $(this).find('.potentiometer').html();

			$(this).append('<div class="potentiometer-slider"></div>');
			$(this).find('.potentiometer-slider').slider({
				value: potStartVal,
				min: 0,
				max: 1,
				step: .01,
				slide: function( event, ui ) {
					homeostat.unit[i].inputPotentiometer[j] = ui.value;
				},
			});

			// Uniselector Toggle
			$(this).append('<button type="button" id="uniselector-toggle-' + i + '' + j + '" class="uniselector-toggle">Uniselector</button>');
			$('#uniselector-toggle-' + i + '' + j).click(function() {
				var toggle = homeostat.unit[i].uniselectorState[j];
				homeostat.unit[i].uniselectorState[j] = toggle ? false : true;
				$(this).parent().find('.potentiometer-slider').toggle();
				$(this).toggleClass('active');
			});

			// Manual Input Slider
			$(this).append('<div class="manual-input-slider"></div>');
			$(this).find('.manual-input-slider').slider({
				value: 0,
				min: 0,
				max: 100,
				step: 1,
				slide: function( event, ui ) {
					homeostat.unit[i].input[j] = ui.value;
				}
			}).hide();

			// Manual Input Toggle
			$(this).append('<button type="button" id="value-toggle-' + i + '' + j + '" class="manual-input-toggle">Manual Input</button>');
			$('#value-toggle-' + i + '' + j).click(function() {
				var toggle = homeostat.unit[i].manualInput[j];
				homeostat.unit[i].manualInput[j] = toggle ? false : true;
				$(this).html(toggle ? 'Manual Input' : 'Automatic Input');
				$(this).parent().find('.manual-input-slider').toggle();
			});

		});
	});
};

Homeostat.prototype.loop = function() {

	// update all outputs
	for (var i = 0; i < this.unit.length; i++) {
		for (var j = 0; j < this.unit.length; j++) {
			if(!this.unit[i].manualInput[j]) this.unit[i].input[j] = this.unit[j].output;
		}
	}

	// loop again
	for (var i = 0; i < this.unit.length; i++) {
		this.unit[i].loop();
	}

	this.steps++;
};


////////////////
///// Loop /////
////////////////

var children = 4;
var maxChildren = 10;
var minChildren = 2;
var homeostat = new Homeostat({children: children});
var play = true;
var fps = 5;

function loop() {
	if(play) homeostat.loop();
	$('#steps').val(homeostat.steps);
};

var start = setInterval(function(){ loop(); }, 1000 / fps);

$(document).ready(function(){

	$('#unitn').val(children).change(function(event) {
		children = $(this).val();
		children = children < maxChildren ? children : maxChildren;
		children = children > minChildren ? children : minChildren;
		homeostat = new Homeostat({children: children});
	});

	$('#fps').val(fps).change(function(event) {
		fps = $(this).val();
		clearInterval(start);
		start = setInterval(function(){ loop(); }, 1000 / fps);
	});

	$('#step').addClass('disabled').click(function() {
		homeostat.loop();
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

	$('#random').click(function() {
		for(var i = 0; i < homeostat.unit.length; i++) homeostat.unit[i].random();
	});

	$('#reset').click(function() {
		for(var i = 0; i < homeostat.unit.length; i++) homeostat.unit[i].reset();
		$('.uniselector-toggle').removeClass('active');
		$('.potentiometer-slider').show();
		$('.manual-input-slider').hide();
		$('.manual-input-toggle').html('Manual Input');
	});

	$('#uniselector').click(function() {
		for(var i = 0; i < homeostat.unit.length; i++) {
			for(var j = 0; j < homeostat.unit[i].siblings; j++) {
				homeostat.unit[i].uniselectorState[j] = true;
			}
		}
		$('.uniselector-toggle').addClass('active');
		$('.potentiometer-slider').hide();
	});

});