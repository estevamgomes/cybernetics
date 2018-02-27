//////////////////////
///// Light Unit /////
//////////////////////

/*
 * Light Constructor
 */
var LightUnit = function(config) {
	this.id    = config.id; // id
	this.cx    = config.cx; // id
	this.cy    = config.cy; // id
	this.state = false; 	// state [true = on; false = off]

	this.siblings = new Array(); // array of siblings IDs

	this.reset();
};

/*
 * LightUnit: reset()
 * Reset all variables
 */
LightUnit.prototype.addsibling = function(sibling) {
	this.siblings.push(sibling);
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
 * LightUnit: turnOn()
 * Turn this lightbulb on
 */
LightUnit.prototype.turnOn = function() {
	this.state = true;
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


///////////////////////
///// Light Array /////
///////////////////////

var LightArray = function(config) {
	this.unitArray		= new Array(); // lampadas
	this.unitArrayCnx	= new Array(); // id das lampadas que precisam de conexao
	this.cnxArray		= new Array(); // array com conexoes
	this.children 		= config.children || 100;
	this.children 		= this.children > 2 ? this.children : 2; // garante que tenha pelo menos uma lâmpada

	this.connections	= config.connections || 0;

	// limita o número de conexões
	this.connections 	= Number(this.connections) < Number(this.children) ? this.connections : this.children - 1;
	this.connections 	= Number(this.connections) > 0 ? this.connections : 0;

	this.equilibrium	= false;
	this.frameselapsed	= 0;

	this.bulbradius 	= 10;
	this.cellw 			= this.bulbradius * 4;
	this.cellh			= this.bulbradius * 4;
	this.maxline		= Math.floor(Math.sqrt(this.children));
	this.maxcol 		= Math.ceil(this.children / this.maxline);
	this.col 			= 1;
	this.line 			= 1;
	this.stagewidth  	= this.maxcol * this.cellw;
	this.stageheight 	= this.maxline * this.cellh;

	// create connections
	for (var i = 0; i < this.children; i++) {
		this.unitArray[i] = new LightUnit({
			id: i,
			cx: this.cellw * (this.col - 1) + this.bulbradius + Math.random() * (this.cellw - this.bulbradius * 2),
			cy: this.cellh * (this.line - 1) + this.bulbradius + Math.random() * (this.cellh - this.bulbradius * 2)
		});

		if(this.col >= this.maxcol) {
			this.col = 1;
			this.line += 1;
		} else {
			this.col += 1;
		}

		this.unitArrayCnx[i] = i;
	}

	// create connections
	this.createCnx = function(id1, id2) {
		// test to see if they are already siblings
		var alreadysiblings = false;
		for (var j = 0; j < this.unitArray[id1].siblings.length; j++) {
			if(this.unitArray[id1].siblings[j] == id2) alreadysiblings = true;
		};

		if(!alreadysiblings) {
			this.unitArray[id1].addsibling(id2);
			this.unitArray[id2].addsibling(id1);
			this.cnxArray.push([id1, id2]);
		}

		if(this.unitArray[id1].siblings.length >= this.connections) {
			var index = this.unitArrayCnx.indexOf(id1);
			if (index > -1) this.unitArrayCnx.splice(index, 1);
		}
	};

	// distance between two bulbs
	this.dist = function(id1, id2) {
		return Math.sqrt(Math.pow(this.unitArray[id1].cx - this.unitArray[id2].cx, 2) + Math.pow(this.unitArray[id1].cy - this.unitArray[id2].cy, 2));
	};

	this.findclosest = function(id, howmany) {
		var distArray = new Array();
		for (var i = 0; i < this.unitArrayCnx.length; i++) {
			distArray.push({
				id: this.unitArrayCnx[i],
				dist: this.dist(id, this.unitArrayCnx[i])
			});
		}
		distArray.sort(function(a, b) {
			return ((a.dist < b.dist) ? -1 : ((a.dist == b.dist) ? 0 : 1));
		});
		return distArray.splice(0, howmany);
	};

	// create connections
	while (this.unitArrayCnx.length > 0) {
		var i = Math.floor(Math.random() * this.unitArray.length);
	// for (var i = 0; i < this.unitArray.length; i++) {

		// remove da array
		var index = this.unitArrayCnx.indexOf(i);
		if (index > -1) this.unitArrayCnx.splice(index, 1);

		var howmany = this.connections - this.unitArray[i].siblings.length;
		var closest = this.findclosest(i, howmany);
		
		for (var j = 0; j < closest.length; j++) {
			this.createCnx(closest[j].id, i);
		};
	}

	// algumas vezes alguns elementos ficam com menos conexões
	/*
	for (var i = 0; i < this.unitArray.length; i++) {
		console.log(this.unitArray[i].siblings.length);
	}
	*/

	///////////
	/// svg ///
	///////////

	// svg variables
	var svg = '';

	// draw connections
	for (var i = this.cnxArray.length - 1; i >= 0; i--) {
		var unitA = this.unitArray[this.cnxArray[i][0]];
		var unitB = this.unitArray[this.cnxArray[i][1]];
		svg += '<line id="cnx-' + this.cnxArray[i][0] + '-' + this.cnxArray[i][1] + '" class="cnx" x1="' + unitA.cx + '" y1="' + unitA.cy + '" x2="' + unitB.cx + '" y2="' + unitB.cy + '" />';
	};

	// draw bulbs
	for (var i = this.unitArray.length - 1; i >= 0; i--) {
		var unit = this.unitArray[i];
  		svg += '<circle class="light-unit" id="unit-' + unit.id +'" data-id="' + unit.id +'" cx="' + unit.cx + '" cy="' + unit.cy + '" r="' + this.bulbradius + '" />';
	};

	// append html
	$('#onehundred').html('<svg id="connections" height="' + this.stageheight + 'px" width="' + this.stagewidth + 'px">' + svg + '</svg>');

	// ligar ao clicar
	var unit = this.unitArray;
	$('#onehundred .light-unit').click(function() {
		unit[$(this).data('id')].turnOn();
	});
};

LightArray.prototype.loop = function() {
	// supõe que está equilibrado
	this.equilibrium = true;

	// salva o esta atual das lâmpadas em uma nova array
	// para que elas mudam de estado simultaneamente e não em cadeia
	var currentState = new Array();
	for (var i = 0; i < this.unitArray.length; i++) {
		currentState[i] = this.unitArray[i].state;
	}

	for (var i = 0; i < this.unitArray.length; i++) {
		// if any sibling is on
		var siblingOn = false;
		for (var j = 0; j < this.unitArray[i].siblings.length; j++) {
			var siblingId = this.unitArray[i].siblings[j];
			if(currentState[siblingId] == true) siblingOn = true
		}

		// reset the light
		if(this.unitArray[i].state == true || siblingOn) {
			this.unitArray[i].reset();
		}

		// se a lâmpada estiver acesa não está em equilíbrio
		if(this.unitArray[i].state == true) this.equilibrium = false;
	}

	// muda a cor da conexão
	for (var i = this.cnxArray.length - 1; i >= 0; i--) {
		var unitAid = this.cnxArray[i][0];
		var unitA 	= this.unitArray[unitAid].state;
		var unitBid = this.cnxArray[i][1];
		var unitB 	= this.unitArray[unitBid].state;
		var $cnx = $('#cnx-' + unitAid + '-' + unitBid);
		if(unitA || unitB) {
			$cnx.addClass('active');
		} else {
			$cnx.removeClass('active');
		}
	};

	// aumenta o número de frames se não estiver em equilíbrio
	if(!this.equilibrium) this.frameselapsed++;
};


////////////////
///// Loop /////
////////////////

var startChildren 	= 100;
var children 		= startChildren;
var minChildren 	= 2;
var maxChildren 	= 150;

var startCnx 		= 10;
var connections 	= startCnx;
var maxRandomCnx 	= 30;

var lightArray 		= new LightArray({children: children, connections: connections});
var play 			= true;
var fps 			= 5;

var lastTick 		= new Date().getTime();

function loop() { 
	if(play) {
		lightArray.loop();
		updateFramesElapsed();
	}

	var millis 	= new Date().getTime();
	var realfps = Math.floor(((1000 / fps) / (millis - lastTick)) * fps);
	$('#realfps').html(realfps);
	lastTick 	= millis;
};

var tick = setInterval(function(){ loop(); }, 1000 / fps);

function updateFramesElapsed() { 
	var frames 	= lightArray.frameselapsed,
		seg 	= frames % 60,
		min 	= Math.floor(lightArray.frameselapsed / 60) % 60,
		h 		= Math.floor(lightArray.frameselapsed / (60 * 60));
	var clock 	= '';
	clock += h < 10 ? '0' + h : h;
	clock += ':';
	clock += min < 10 ? '0' + min : min;
	clock += ':';
	clock += seg < 10 ? '0' + seg : seg;
	$('#elapsedtime').html(clock);
}

function limitConnections() {
	connections = connections < (children - 1) ? connections : children - 1;
	connections = connections > 0 ? connections : 0;
	$('#unitcnx').val(connections);
}

function resetSystem(nchildren, ncnx) {
	play = false;
	children = nchildren;
	children = children < maxChildren ? children : maxChildren;
	children = children > minChildren ? children : minChildren;

	ncnx = ncnx < (children - 1) ? ncnx : children - 1;
	ncnx = ncnx > 0 ? ncnx : 0;

	connections = ncnx;

	$('#unitn').val(children);
	$('#unitcnx').val(connections).attr({
		max: children
	});

	lightArray = new LightArray({children: children, connections: connections});
	play = true;
}

function setFPS(newfps) {
	fps = newfps;
	$('#fps').val(newfps);

	clearInterval(tick);
	tick = setInterval(function(){ loop(); }, 1000 / newfps);
}

$(document).ready(function(){

	$('#unitn').val(children).change(function(event) {
		resetSystem($(this).val(), connections);
	});

	$('#unitcnx').val(connections).change(function(event) {
		resetSystem(children, $(this).val());
	});

	$('#fps').val(fps).change(function(event) {
		setFPS($(this).val());
	});

	$('.setfps').click(function(event) {
		setFPS($(this).data('fps'));
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
		lightArray.frameselapsed = 0;
		for(var i = 0; i < lightArray.unitArray.length; i++) lightArray.unitArray[i].reset();
	});

	$('#random').click(function() {
		var randomchildren = Math.floor(Math.random() * (maxChildren - minChildren)) + minChildren;
		var randomcnx = Math.floor(Math.random() * maxRandomCnx);
		resetSystem(randomchildren, randomcnx);
	});

	$('.example').click(function() {
		resetSystem($(this).data('bulbs'), $(this).data('cnx'));
	});

});

