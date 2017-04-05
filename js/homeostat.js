//////////////////////////
///// Homeostat Unit /////
//////////////////////////

var HomeostatUnit = function(config) {
	this.id = config.id;
	this.steps = 0; // steps since the program started

	this.resolution = 10000;
	this.siblings = config.siblings;

	this.output = 0;
	this.manualOutput = false;

	this.input = [];
	this.manualInput = [];
	this.inputCommutator = [];
	this.inputPotentiometer = [];
	this.inputCoil = [];

	this.uniselector = [];
	this.uniselectorLastChange = 0; // last step when the uniselector was changed
	this.uniselectorDelay = 5; // last step when the uniselector was changed
	this.uniselectorState = [];
	this.uniselectorIndex = [];

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

};

HomeostatUnit.prototype.reset = function() {
	for (var i = 0; i < this.input.length; i++) {
		this.inputPotentiometer[i] = 1;
		$('#unit-' + this.id + ' .input-' + i + ' .potentiometer').val(this.inputPotentiometer[i]);	
		$('#unit-' + this.id + ' .input-' + i + ' .potentiometer-slider').slider('value', this.inputPotentiometer[i]);
		this.inputCommutator[i] = 1;
		$('#unit-' + this.id + ' .input-' + i + ' .commutator').val(this.inputCommutator[i]);
	}
	this.output = 0;
};

HomeostatUnit.prototype.random = function() {
	for (var i = 0; i < this.input.length; i++) {
		this.inputPotentiometer[i] = Math.floor(Math.random() * 1000) / 1000;
		$('#unit-' + this.id + ' .input-' + i + ' .potentiometer').val(this.inputPotentiometer[i]);	
		$('#unit-' + this.id + ' .input-' + i + ' .potentiometer-slider').slider('value', this.inputPotentiometer[i]);
		this.inputCommutator[i] = Math.random() >= .5 ? 1 : -1;
		$('#unit-' + this.id + ' .input-' + i + ' .commutator').val(this.inputCommutator[i]);
	}
	this.output = Math.round((Math.random() * 2 - 1) * this.resolution) / this.resolution;
};

HomeostatUnit.prototype.loop = function() {
	this.update();
	for (var i = 0; i < this.input.length; i++) {
		$('#unit-' + this.id + ' .input-' + i + ' .coil').val(this.inputCoil[i]);
		$('#unit-' + this.id + ' .input-' + i + ' .value').val(this.input[i]);	
		if(!this.uniselectorState[i]) {
			$('#unit-' + this.id + ' .input-' + i + ' .uniselector-wrapper').hide();
			$('#unit-' + this.id + ' .input-' + i + ' .math-sign-commutator').show();
			$('#unit-' + this.id + ' .input-' + i + ' .commutator-wrapper').show();
			$('#unit-' + this.id + ' .input-' + i + ' .potentiometer-wrapper').show();	
		} else {
			$('#unit-' + this.id + ' .input-' + i + ' .uniselector-wrapper').show();
			$('#unit-' + this.id + ' .input-' + i + ' .math-sign-commutator').hide();
			$('#unit-' + this.id + ' .input-' + i + ' .commutator-wrapper').hide();
			$('#unit-' + this.id + ' .input-' + i + ' .potentiometer-wrapper').hide();	
			$('#unit-' + this.id + ' .input-' + i + ' .uniselector').val(this.uniselector[i][this.uniselectorIndex[i]]);
			$('#unit-' + this.id + ' .input-' + i + ' .uniselector-index').html(this.uniselectorIndex[i]);
		}
	};
	$('#unit-' + this.id + ' .output-value').val(this.output);	
	$('#unit-' + this.id + ' .output-graph-bar').css('left', (50 + 50 * this.output) + "%");	
	$('#unit-' + this.id + ' .output-slider').slider('value', this.output);	
};

HomeostatUnit.prototype.update = function() {
	if(!this.manualOutput) {
		this.output = 0;
		var divisor = 0;
		for (var i = 0; i < this.input.length; i++) {
			if(!this.uniselectorState[i]) {
				this.inputCommutator[i] = $('#unit-' + this.id + ' .input-' + i + ' .commutator').val();
				this.inputPotentiometer[i] = $('#unit-' + this.id + ' .input-' + i + ' .potentiometer').val();
				this.inputCoil[i] = this.input[i] * this.inputCommutator[i] * this.inputPotentiometer[i];
				divisor += +this.inputPotentiometer[i];
			} else {
				this.inputCoil[i] = this.input[i] * this.uniselector[i][this.uniselectorIndex[i]];
				divisor += +Math.abs(this.uniselector[i][this.uniselectorIndex[i]]);
			}
			this.output += this.inputCoil[i];
		};

		// this.output = Math.round( (this.output / this.input.length) * this.resolution) / this.resolution;
		divisor = divisor == 0 ? +this.input.length : divisor;
		this.output = Math.round( (this.output / divisor) * this.resolution) / this.resolution;

		// uniselector auto change
		if((this.output > 0.1 || this.output < -0.1) && this.steps - this.uniselectorLastChange > this.uniselectorDelay) {
			for (var i = 0; i < this.input.length; i++) {
				if(this.uniselectorIndex[i] < this.uniselector[i].length - 1) {
					this.uniselectorIndex[i]++;
				} else {
					this.uniselectorIndex[i] = 0;
				}
			}
			this.uniselectorLastChange = this.steps;
		}
	}
	this.steps++;
};

HomeostatUnit.prototype.getHtml = function() {
	var html = '<div id="unit-' + this.id + '" class="homeostat-unit">';
		html += '<h1>Unit ' + this.id + '</h1>';

		html += '<h2>Output</h2>';
		html += '<div class="output">';
			html += '<input type="number" name="output-value" class="output-value" readonly>';
			html += '<div class="output-graph"><div class="output-graph-bar"></div></div>';
		html += '</div>';

		html += '<h2>Input</h2>';
		html += '<ul class="input-wrapper">';

		for (var i = 0; i < this.siblings; i++) {
			html += '<li class="input input-' + i + '">';
				html += '<div class="math-operation">';

					html += '<div class="math-operand value-wrapper">';
						html += '<label>Input ' + i + '</label>';
						html += '<input type="number" name="input-' + i + '-value" class="value" readonly value="' + this.input[i] + '">';
					html += '</div>';

					html += '<span class="math-sign math-sign-commutator">&times;</span>';

					html += '<div class="math-operand commutator-wrapper">';
						html += '<label><abbr title="Commutator">Com</abbr></label>';
						html += '<select name="input-' + i + '-commutator" class="commutator">';
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
						html += '<label><abbr title="Potentiometer">Pot</abbr></label>';
						html += '<input type="number" name="input-' + i + '-potentiometer" class="potentiometer" value="' + this.inputPotentiometer[i] + '">';
					html += '</div>';

					html += '<div class="math-operand uniselector-wrapper">';
						html += '<label><abbr title="Uniselector">Uni</abbr> <span class="uniselector-index"></span></label>';
						html += '<input readonly type="number" name="input-' + i + '-uniselector" class="uniselector" value="' + this.uniselector[i][this.uniselectorIndex[i]] + '">';
					html += '</div>';

					html += '<span class="math-sign">=</span>';

					html += '<div class="math-operand coil-wrapper">';
						html += '<label>Coil</label>';
						html += '<input type="number" name="input-' + i + '-coil" class="coil" readonly>';
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

var Homeostat = function() {
	this.unit = new Array()
	this.children = 4;

	for (var i = 0; i < this.children; i++) {
		this.unit[i] = new HomeostatUnit({
			id: i,
			siblings: this.children
		});
		$('#homeostat').append(this.unit[i].getHtml());
	}
};

Homeostat.prototype.loop = function() {

	for (var i = 0; i < this.unit.length; i++) {
		for (var j = 0; j < this.unit.length; j++) {
			if(!this.unit[i].manualInput[j]) this.unit[i].input[j] = this.unit[j].output;
		}
	}

	for (var i = 0; i < this.unit.length; i++) {
		this.unit[i].loop();
	}
};

var homeostat = new Homeostat();
var play = true;
var fps = 5;

var loop = setInterval(function(){
	if(play) homeostat.loop();
}, 1000 / fps);

$(document).ready(function(){

	$('#step').click(function() {
		homeostat.loop();
	});

	$('#play').click(function() {
		play = play ? false : true;
		$(this).html(play ? 'Pause' : 'Play');
	});

	$('#random').click(function() {
		for(var i = 0; i < homeostat.unit.length; i++) homeostat.unit[i].random();
	});

	$('#reset').click(function() {
		for(var i = 0; i < homeostat.unit.length; i++) homeostat.unit[i].reset();
	});

	////////////////////
	//// POT SLIDER ////
	////////////////////

	$('.homeostat-unit').each(function(i) {
		$(this).find('.output').each(function(j) {
			$(this).append('<div class="output-slider"></div>');
			$(this).find('.output-slider').slider({
				animate: "fast",
				value: 0,
				min: -1,
				max: 1,
				step: .001,
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

		$(this).find('.input').each(function(j) {
			$(this).find('.potentiometer').attr('readonly', 'readonly');
			var potStartVal = $(this).find('.potentiometer').val();

			$(this).append('<div class="potentiometer-slider"></div>');
			$(this).find('.potentiometer-slider').slider({
				value: potStartVal,
				min: 0,
				max: 1,
				step: .001,
				slide: function( event, ui ) {
					$(this).parent().find('.potentiometer').val(ui.value);
				},
			});

			$(this).append('<button type="button" id="uniselector-toggle-' + i + '' + j + '">Uniselector</button>');
			$('#uniselector-toggle-' + i + '' + j).click(function() {
				var toggle = homeostat.unit[i].uniselectorState[j];
				homeostat.unit[i].uniselectorState[j] = toggle ? false : true;
				$(this).parent().find('.potentiometer-slider').toggle();
				$(this).toggleClass('active');
			});

			$(this).append('<div class="value-slider"></div>');
			$(this).find('.value-slider').slider({
				value: 0,
				min: 0,
				max: 1,
				step: .0001,
				slide: function( event, ui ) {
					$(this).parent().find('.value').val(ui.value);
					homeostat.unit[i].input[j] = ui.value;
				}
			}).hide();

			$(this).append('<button type="button" id="value-toggle-' + i + '' + j + '">Manual Input</button>');
			$('#value-toggle-' + i + '' + j).click(function() {
				var toggle = homeostat.unit[i].manualInput[j];
				homeostat.unit[i].manualInput[j] = toggle ? false : true;
				$(this).html(toggle ? 'Manual Input' : 'Automatic Input');
				$(this).parent().find('.value-slider').toggle();
			});

		});
	});
});