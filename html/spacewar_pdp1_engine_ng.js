/*
  Spacewar! - PDP-1 emulation engine (v.3.0.2 NG)

  Norbert Landsteiner, 2012-2022
  Based on the original HTML5/JS "Spacewar!" emulation by
    Barry Silverman, Brian Silverman, and Vadim Gerasimov, 2012:
    http://spacewar.oversigma.com/html5/
    For credits see: http://spacewar.oversigma.com/html5/readme.html
  Original Spacewar! by
    Stephen Russell, Peter Samson, Dan Edwards, and Martin Graetz,
    together with Alan Kotok, Steve Piner, and Robert A Saunders, 1961-1962.
  GUI: All rights reserved.
*/

var PDP1Engine = (function() {

/* config */

var visualWidth = 512,               // original: 1024
	gameInterval = 28,               // refresh rate used for splash-screen (28)
	emulationSpeed = 1.0,
	useHighRes = false,
	singleResOnly = true,
	showSplashScreen = false,
	showInstructions = true,
	setCSSDimensions = true,
	canvasId = 'pdp1_canvas',
	tw5indicatorId = 'tw5indicator',
	tw5IndicatorClassHi = 'on toolTipBottom',
	tw5IndicatorClassLo = 'off toolTipBottom',
	restartButtonId = 'restart',
	debugTape = true,
	crtSelectableOrigins = true,
	dpy10microsec = false,
	width = (useHighRes)? 1024:visualWidth,
	showFPS = false,
	version = '3.0.2';

// local override by object 'PDP1Presets'

if (typeof PDP1Presets == 'object') {
	if (typeof PDP1Presets.emulationSpeed!='undefined') emulationSpeed=parseInt(PDP1Presets.emulationSpeed,10);
	if (typeof PDP1Presets.useHighRes!='undefined') useHighRes=!!PDP1Presets.useHighRes;
	if (typeof PDP1Presets.singleResOnly!='undefined') singleResOnly=!!PDP1Presets.singleResOnly;
	if (typeof PDP1Presets.showSplashScreen!='undefined') showSplashScreen=!!PDP1Presets.showSplashScreen;
	if (typeof PDP1Presets.showInstructions!='undefined') showInstructions=!!PDP1Presets.showInstructions;
	if (typeof PDP1Presets.setCSSDimensions!='undefined') setCSSDimensions=!!PDP1Presets.setCSSDimensions;
	if (typeof PDP1Presets.debugTape!='undefined') debugTape=!!PDP1Presets.debugTape;
	if (typeof PDP1Presets.crtSelectableOrigins!='undefined') crtSelectableOrigins=!!PDP1Presets.crtSelectableOrigins;
	if (typeof PDP1Presets.dpy10microsec!='undefined') dpy10microsec=!!PDP1Presets.dpy10microsec;
	if (typeof PDP1Presets.showFPS!='undefined') showFPS=!!PDP1Presets.canvasId;
	if (typeof PDP1Presets.canvasId!='undefined') canvasId=''+PDP1Presets.canvasId;
	if (typeof PDP1Presets.CRTWidth!='undefined') {
		visualWidth=parseInt(PDP1Presets.CRTWidth,10);
		width = (useHighRes)? 1024:visualWidth;
	}
	if (typeof PDP1Presets.CRTSustain!='undefined') setTimeout(function() {CRT.setSustain(parseFloat(PDP1Presets.CRTSustain))},0);
	if (typeof PDP1Presets.CRTBlurLevels!='undefined') setTimeout(function() {CRT.setBlurLevels(parseInt(PDP1Presets.CRTBlurLevels,10))},0);
	if (typeof PDP1Presets.CRTElectrostatics!='undefined') setTimeout(function() {CRT.useElectrostatics(!!PDP1Presets.CRTElectrostatics)},0);
}


/* private static */

// PDP-1 emulation related
var loopPoint, loopPointScorer;

// game control
var timer, gameState, inited=false, interval, oddFrame,
	splashCnt, splashOffset, module, intensitiesMap,
	displayScaleCf=width/02000, crtAliasing=true,
	emulateSubpixels=true, moduleSubpixels=true,
	performanceNow=Boolean(window.performance),
	estaticCntr, framesMissed, estaticLock=false,
	scoreTrap, scoreAddrWedge, scoreAddrNeedle,
	fpsElement, fpsStore;

var tapeErrorStrings = {
	'-1': 'UNEXPECTED END OF TAPE.',
	'-2': 'EMPTY READ BUFFER.',
	'-3': 'UNEXPECTED RIM INSTRUCTION.',
	'-4': 'CHECKSUM ERROR.',
	'-5': 'UNEXPECTED LOADER INSTRUCTION.',
	'-6': 'NO START ADDRESS IN LOADER DATA.',
	'-7': 'DEVICE NOT CONNECTED.',
	'-8': 'NO TAPE TO MOUNT.'
};

// default sense switch labels
var defaultSenseSwitchLabels = {
	'1': ['Ship Rotation', 'On: Inertial/Angular momentum, Off: Bergenholm/Gyros', 'Angular Momentum'],
	'2': ['Strength of Gravity', 'On: low, Off: high', 'Low Gravity'],
	'3': ['Torpedoes', 'not operating in this version', 'Torpedoes (no-op)' ],
	'4': ['Background', 'On: none, Off: starfield', 'Background Off'],
	'5': ['Gravitational Star &ndash; Collision', 'On: kills, Off: warps to anti-pode', 'Grav. Star Kills'],
	'6': ['Gravitational Star &ndash; Display', 'On: big star off, Off: big star on', 'Grav. Star Off']
};

var spacewarParamLabels = {
	'tno': 'number of torps +1',
	'tvl': 'torpedo velocity',
	'rlt': 'torpedo reload time',
	'tlf': 'torpedo life',
	'maa': 'spaceship angular acceleration',
	'sac': 'spaceship acceleration',
	'the': 'amount of torpedo warpage',
	'mhs': 'number of hyperspace shots',
	'hr1': 'hyperspatial displacement',
	'hr2': 'hyperspatially induced velocity'
};
var spacewarParamRanges = {
	'tno': [4, 077],
	'tvl': [0, 9],
	'rlt': [1, 0377],
	'tlf': [1, 0377],
	'maa': [1, 030],
	'sac': [0, 9],
	'the': [0, 9],
	'mhs': [1, 020],
	'hr1': [0, 9],
	'hr2': [0, 9]
};
var spacewarParamShiftModifier = {
	'tno': false,
	'tvl': true,
	'rlt': false,
	'tlf': false,
	'maa': false,
	'sac': true,
	'the': true,
	'mhs': false,
	'hr1': true,
	'hr2': true
};

var gameStates = {
	'init': -1,
	'idle': 0,
	'splash': 1,
	'run': 2,
	'service': 3,
	'fatal': 4
};

/* code import & selection */

var ModuleManager = new function() {

	var codeRepository=new Object(), codeMenu=new Array(), selectedCodeId='';

	function load(obj) {
		if (typeof obj == 'object') {
			if (Object.prototype.toString.call(obj.copyModule) == '[object String]') {
				/*
				var r1, r2, m1=codeRepository[obj.copyModule];
				if (m1) {
					if (m1.mem && Object.prototype.toString.call(m1.mem) == '[object Array]') {
						r1 = m1.mem, r2 = new Array(r1.length);
						for (var i=0, l=r1.length; i<l; i++) r2[i]=r1[i];
						obj.mem=r2;
					}
					if (m1.tapes && Object.prototype.toString.call(m1.tapes) == '[object Array]') {
						r1 = m1.tapes, r2 = new Array(r1.length);
						for (var i=0, l=r1.length; i<l; i++) {
							if (Object.prototype.toString.call(r1[i]) == '[object Array]' && r1[i].length) {
								var r3 = r1[i], r4 = new Array(r3.length);
								for (var j=0, lj=r3.length; j<lj; j++) r4[j]=r3[j];
								r2.push(r4);
							}
						}
						obj.tapes=r2;
					}
				}
				*/
				var m1=codeRepository[obj.copyModule];
				if (m1.mem && Object.prototype.toString.call(m1.mem) == '[object Array]') obj.mem=m1.mem;
				if (m1.tapes && Object.prototype.toString.call(m1.tapes) == '[object Array]') obj.tapes=m1.tapes;
			}
			var memType = Object.prototype.toString.call(obj.mem),
				hasMem = ((memType == '[object Array]' || memType == '[object String]') && obj.mem.length),
				tapes=[]; 
			if (Object.prototype.toString.call(obj.tapes) == '[object Array]' && obj.tapes.length) {
				for (var i=0; i<obj.tapes.length; i++) {
					var t=obj.tapes[i], tt=Object.prototype.toString.call(t);
					if (tt == '[object Array]' && t.length) {
						tapes.push(t);
					}
					else if (tt == '[object String]' && t.length) {
						tapes.push(decodeBase64ToArray(t));
					}
				}
			}
			if ((hasMem || tapes.length)
				&& !isNaN(obj.endOfMainLoop)
				&& obj.id && typeof obj.id == 'string'
				&& obj.versionString && typeof obj.versionString == 'string'
				&& obj.displayLabel && typeof obj.displayLabel == 'string') {
				var def = {
					id: obj.id,
					versionString: obj.versionString,
					displayLabel: obj.displayLabel,
					startAddress: (typeof obj.startAddress !== 'undefined')? obj.startAddress:-1,
					endOfMainLoop: obj.endOfMainLoop,
					endOfScorerLoop: obj.endOfScorerLoop || 0,
					useHwMulDiv: Boolean(obj.useHwMulDiv),
					loRes: (typeof obj.lowRes === 'undefined' || Boolean(obj.lowRes)),
					hiRes: Boolean(obj.hiRes),
					splashScreen: (typeof obj.splashScreen === 'undefined' || Boolean(obj.splashScreen)),
					rotateControls: Boolean(obj.rotateControls),
					mem: (hasMem)? (memType == '[object String]')? decodeBase64ToArray(obj.mem) : obj.mem : undefined,
					tapes: (tapes.length)? tapes : undefined,
					intensitiesMap: (Object.prototype.toString.call(obj.intensitiesMap) == '[object Array]' && obj.intensitiesMap.length==8)? obj.intensitiesMap:undefined,
					intensitiesMapHiRes: (Object.prototype.toString.call(obj.intensitiesMapHiRes) == '[object Array]' && obj.intensitiesMapHiRes.length==8)? obj.intensitiesMapHiRes:undefined,
					senseSwitchLabels: obj.senseSwitchLabels,
					message: (Object.prototype.toString.call(obj.message) == '[object Array]' && obj.message.length)? obj.message : null,
					restartButton: Boolean(obj.restartButton),
					mergeControls: Boolean(obj.mergeControls),
					hasParams: Boolean(obj.hasParams),
					useTestword: Boolean(obj.useTestword),
					rimSequence: (Object.prototype.toString.call(obj.rimSequence) == '[object Array]')? obj.rimSequence:null,
					renderSubPixels: (typeof obj.renderSubPixels === 'undefined')? true:Boolean(obj.renderSubPixels),
					showControllers: (obj.showControllers!==false),
					testword: (typeof obj.testword === 'number')? obj.testword:-1,
					testwordStartButton: Boolean(obj.testwordStartButton)
				};
				if (obj.patches && Object.prototype.toString.call(obj.patches) == '[object Array]') {
					var patches=[];
					for (var i=0; i<obj.patches.length; i++) {
						var p=obj.patches[i];
						if (Object.prototype.toString.call(p) == '[object Array]' &&
							Object.prototype.toString.call(p[0]) == '[object Number]') {
							var tt=Object.prototype.toString.call(p[1]);
							if (tt=='[object Array]' || '[object Number]') {
								patches.push(p);
							}
							else if (tt=='[object String]')  {
								patches.push(p[0],decodeBase64ToArray(p[1]));
							}
						}
					}
					if (patches.length) def.patches=patches;
				}
				codeRepository[def.id] = def;
				if (singleResOnly) {
					codeMenu.push({'id': def.id, 'version': def.versionString, 'label': def.displayLabel });
				}
				else {
					if (def.loRes) codeMenu.push({'id': def.id+':lr', 'version': def.versionString, 'label': def.displayLabel, 'res': 'lo'});
					if (def.hiRes) codeMenu.push({'id': def.id+':hr', 'version': def.versionString, 'label': def.displayLabel, 'res': 'hi'});
				}
			}
		}
	}

	function select(optionId) {
		var parts=optionId.split(':'), id=parts[0], res=parts[1] || '';
		if (singleResOnly) optionId=id;
		if (optionId==selectedCodeId) return;
		var obj=codeRepository[id];
		if (obj) {
			var msg, rimMode;
			if (obj.message) {
				msg=[];
				for (var i=0, l=obj.message.length; i<l; i++) {
					var t=msg[i]=obj.message[i].replace(/\{(\w+)\}/g, KeyManager.keyExpression);
				}
			}
			else {
				msg=null;
			}
			selectedCodeId = optionId;
			PDP1.setHardwareMulDiv(obj.useHwMulDiv);
			PDP1.mergeControls(obj.mergeControls);
			PDP1.rotateControls(obj.rotateControls);
			if (!singleResOnly) setHighResMode(res.toLowerCase()=='hr', true);
			loopPoint = obj.endOfMainLoop;
			if (loopPointScorer != obj.endOfScorerLoop) resetTW5();
			loopPointScorer = obj.endOfScorerLoop;
			intensitiesMap = (useHighRes)?
				obj.intensitiesMapHiRes || obj.intensitiesMap || [0,1,2,3,4,5,6,7]:
				obj.intensitiesMap || [0,1,2,3,4,5,6,7];
			if (obj.mem) {
				// inject memory
				PDP1.setMemory(obj.mem);
				PDP1.setPC((obj.startAddress >= 0)? obj.startAddress:4);
				rimMode=false;
			}
			if (obj.tapes) rimMode=true;
			if (module && module.testword>=0 && obj.testword<0) {
				PDP1.setTestword(0777777, false);
				if (module.scorer) resetTW5();
			}
			setTW5IndicatorDisplay(loopPointScorer);
			showRestartButton(obj.restartButton);
			KeyManager.useTestword(obj.useTestword);
			moduleSubpixels= obj.renderSubPixels;
			crtAliasing = (moduleSubpixels && emulateSubpixels);
			if (window.PDP1GUI) PDP1GUI.autoShowTouchControls(obj.showControllers);
			return {
				id: optionId,
				showSplashScreen: obj.splashScreen,
				message: msg,
				senseSwitchLabels: obj.senseSwitchLabels,
				manualRestart: obj.restartButton,
				tapes: obj.tapes,
				rimMode: rimMode,
				startAddress: obj.startAddress,
				scorer: Boolean(loopPointScorer),
				manualRestart: obj.restartButton,
				mergeControls: obj.mergeControls,
				patches: obj.patches,
				rimSequence: obj.rimSequence,
				hasParams: obj.hasParams,
				testword: obj.testword,
				tapeError: 0,
				testwordStartButton: obj.testwordStartButton,
				showScores: Boolean(obj.showControllers)
			};
		}
		return null;
	}

	function getCodeMenu(selectElement) {
		if (!selectElement || typeof selectElement!='object' || selectElement.nodeName!='SELECT') {
			if (window.console) console.log('USAGE: PDP1Engine.getCodeMenu( selectElement ) - selectElement must be HTML-element of type SELECT.');
			return;
		}
		if (!singleResOnly) {
			var hr = false;
			for (var i=0; i<codeMenu.length; i++) {
				if (codeMenu[i].res=='hi') {
					hr=true;
					break;
				}
			}
			if (hr) {
				var ogLR = document.createElement('optgroup');
				ogLR.label = 'Standard (Low Res)';
				var ogHR = document.createElement('optgroup');
				ogHR.label = 'High Res';
				selectElement.appendChild(ogLR);
				selectElement.appendChild(ogHR);
			}
			else singleResOnly=true;
		}
		for (var i=0; i<codeMenu.length; i++) {
			var item=codeMenu[i];
			var el=document.createElement('option');
			el.value=item.id;
			el.className='notranslate';
			var tn=document.createTextNode(item.label);
			el.appendChild(tn);
			if ((selectedCodeId && item.id==selectedCodeId) || (i==0)) el.selected=true;
			if (singleResOnly) {
				selectElement.appendChild(el);
			}
			else if (item.res=='hi') {
				ogHR.appendChild(el);
			}
			else {
				ogLR.appendChild(el);
			}
		}
	}

	function selectDefault(id) {
		if (codeMenu.length) {
			if (id && codeRepository[id.replace(/:.*/, '')]) {
				return select(id);
			}
			else {
				return select(codeMenu[0].id);
			}
		}
	}

	function getModuleList() {
		var list=[];
		var i, item, v, lv, id, sid=(selectedCodeId)? selectedCodeId.replace(/:.*$/, ''):'';
		for (i=0; i<codeMenu.length; i++) {
			item=codeMenu[i];
			v=item.version || item.label || 'unknown';
			id=(item.id)? item.id.replace(/:.*$/, ''):'-';
			if (v!=lv) list.push({id: item.id, label: (id==sid? '*':'\u00b7')+' '+v.toUpperCase()});
			lv=v;
		}
		return list;
	}


	function decodeBase64ToArray(str) {
		var h1, h2, h3, h4, out=[], i=0, l=str.length;
		function f(c) {
			if (c == 43) {
				return 62; // "+"
			}
			else if (c == 47) {
				return 63; // "/"
			}
			else if (c == 61) {
				return 64; // "="
			}
			else if (c <= 57) {
				return c+4; // "0".."9"
			}
			else if (c <= 90) {
				return c-65; // "A".."Z"
			}
			else {
				return c-71; // "a".."z"
			}
		}
		while (i < l) {
			h1 = f(str.charCodeAt(i++));
			h2 = f(str.charCodeAt(i++));
			h3 = f(str.charCodeAt(i++));
			h4 = f(str.charCodeAt(i++));
			out.push( (h1 << 2) | (h2 >> 4) );
			if (h3 != 64) out.push( ((h2 & 15) << 4) | (h3 >> 2) );
			if (h4 != 64) out.push( ((h3 & 3) << 6) | h4 );
		}
		return out;
	}

	return {
		load: load,
		select: select,
		getCodeMenu: getCodeMenu,
		getModuleList: getModuleList,
		selectDefault: selectDefault
	}

};

// internal module selection

function selectModule(optionId) {
	if (window.PDP1GUI) PDP1GUI.hideModuleLinks();
	var m = (module)? ModuleManager.select(optionId):ModuleManager.selectDefault(optionId);
	if (m) {
		module=m;
		if (gameState==gameStates.service) gameState=gameStates.run;
		initModule();
		if (gameState==gameStates.service) return;
		if (inited && (gameState>gameStates.splash || !showSplashScreen
				|| !module.showSplashScreen || module.tapeError)) start();
	}
	else if (module && module.tapeError) {
		displayTapeError();
		return;
	}
}

function initModule() {
	if (module.rimMode) {
		var i, sa, t;
		PDP1.resetMemory();
		if (module.rimSequence) {
			t=0;
			for (i=0; i<module.rimSequence.length; i++) {
				switch(String(module.rimSequence[i]).toLowerCase()) {
					case 'mount':
						if (t>=module.tapes.length) {
							module.tapeError=-8;
							return;
						}
						PDP1.mountPaperTape(module.tapes[t++]);
						break;
					case 'rim':
						sa=PDP1.readInMemory();
						if (sa<0) {
							module.tapeError=t;
							return;
						}
						break;
				}
			}
		}
		else {
			for (var i=0; i<module.tapes.length; i++) {
				PDP1.mountPaperTape(module.tapes[i]);
				sa=PDP1.readInMemory();
				if (sa<0) {
					module.tapeError=t;
					return;
				}
			}
		}
		if (module.startAddress<0) module.startAddress=sa;
		PDP1.setPC(module.startAddress);
	}
	if (module.patches) {
		for (var i=0, l=module.patches.length; i<l; i++) {
			var p=module.patches[i];
			PDP1.patchMemory(p[0], p[1]);
		}
	}
	if (module.hasParams) initSpacewarParams();
	if (module.testword>=0) {
		PDP1.setTestword(0777777, false);
		PDP1.setTestword(module.testword, true);
	}
	scoreTrap = false;
	if (window.PDP1GUI) {
		PDP1GUI.showTestword(module.testword, module.testwordStartButton);
		// search for scoring code
		if (module.showScores) {
			var mem = PDP1.getMemRange(0, 07777), a = mem.indexOf(0760400);
			while (a>=0) {
				if (mem[a-1]>>12 == 022 && mem[a-2]>>12 == 020) {
					scoreTrap = true;
					scoreAddrNeedle = mem[a-2] & 07777;
					scoreAddrWedge = mem[a-1] & 07777;
					break;
				}
				a = mem.indexOf(0760400, a+4);
			}
		}
		if (!scoreTrap) module.showScores = false;
		PDP1GUI.showScoreDisplay(scoreTrap);
	}
}

function displayTapeError() {
	CRT.reset();
	SymGen.write(512, 300, 'READ IN ERROR:'+module.tapeError, 6, 3, true);
	var errStr=tapeErrorStrings[module.tapeError];
	if (errStr) SymGen.write(512, 410, errStr, 3, 1, true);
	CRT.render(oddFrame);
	CRT.updateSingleFrame();
	gameState=gameStates.service;
}

/* interface to spacewar program params */

function initSpacewarParams() {
	if (!module.defaultParams) {
		var p= PDP1.getMemRange(0, 027), m=~0777;
		module.defaultParams={
			'tno': [ 06, p[ 06]&m, p[ 06]&0777],
			'tvl': [ 07, p[ 07]&m, p[ 07]&0777],
			'rlt': [010, p[010]&m, p[010]&0777],
			'tlf': [011, p[011]&m, p[011]&0777],
			'maa': [013, p[013]&m, p[013]&0777],
			'sac': [014, p[014]&m, p[014]&0777],
			'the': [021, p[021]&m, p[021]&0777],
			'mhs': [022, p[022]&m, p[022]&0777],
			'hr1': [026, p[026]&m, p[026]&0777],
			'hr2': [027, p[027]&m, p[027]&0777]
		};
		module.params={};
	}
	for (var n in module.defaultParams) {
		module.params[n]=module.defaultParams[n][2];
	}
}
function setSpacewarParam(n, val) {
	var v=parseInt(val);
	if (isNaN(v)) return;
	if (module && module.defaultParams && typeof  module.defaultParams[n]!=='undefined') {
		var t, p=module.defaultParams[n];
		if (v<spacewarParamRanges[n][0]) {
			v=spacewarParamRanges[n][0];
		}
		else if (v>spacewarParamRanges[n][1]) {
			v=spacewarParamRanges[n][1];
		}
		if (spacewarParamShiftModifier[n]) {
			t=0;
			if (v>9) v=9;
			while (v) {
				t=(t<<1)+1;
				v--;
			}
			v=t;
		}
		PDP1.patchMemory(p[0], p[1]|(v&0777));
		module.params[n]=v;
	}
}
function setSpacewarParams(obj) {
	if (typeof obj !== 'object') return;
	for (var n in obj) setSpacewarParam(n, obj[n]);
}
function resetSpacewarParams() {
	if (module && module.defaultParams) {
		for (var n in module.defaultParams) {
			var p=module.defaultParams[n];
			PDP1.patchMemory(p[0], p[1]|p[2]);
			module.params[n]=p[2];
		}
	}
}
function getSpacewarParams() {
	function getShiftBits(v) {
		var t, r=0;
		for (var i=0; i<9; i++) {
			t=1<<i;
			if (v&t) r++;
		}
		return r;
	}
	if (module && module.params) {
		var n, v, v0, t, mp=module.params, mdp=module.defaultParams, obj={};
		for (n in mdp) {
			v=(spacewarParamShiftModifier[n])? getShiftBits(mp[n]):mp[n];
			v0=((spacewarParamShiftModifier[n]))? getShiftBits(mdp[n][2]):mdp[n][2];
			obj[n]= {
				'label': spacewarParamLabels[n],
				'min': spacewarParamRanges[n][0],
				'max': spacewarParamRanges[n][1],
				'value':  v,
				'default': v0,
				shift: spacewarParamShiftModifier[n]
			};
		}
		return obj;
	}
	else {
		return null;
	}
}

/* game I/O interface */

var KeyManager = new function() {

	var useTw=false, keyLang, keyCharMap, keySpecials, keyLegends, keyLock=false,
		shiftedNumbersAsSenseSwitch=true,
		hyperspaceLock=true,
		keyMaps = {
			'int': {
				'keys': {
					'W': 0200000,
					'Z': 040000,
					'D': 0600000,
					'A': 0400000,
					'M': 0100000,
					'K': 06,
					'L': 04,
					'J': 01,
					'I': 000000,
					'0': 040000,
					'Q': 014,
					'U': 0600000
				},
				'specials': {
					'scorer': 'B',
					'restart': 'R'
				},
				'legends': {
					'p1': 'W,A,S,D',
					'p2': 'I,J,K,L',
					'altf': '4,0',
					'hs': 'Q,U'
				}
			},
			'fr': {
				'keys': {
					'Z': 01,
					'S': 02,
					'D': 04,
					'Q': 010,
					'I': 040000,
					'K': 0100000,
					'L': 0200000,
					'J': 0400000,
					'A': 014,
					'U': 0600000
				},
				'specials': {
					'scorer': 'B',
					'restart': 'R'
				},
				'legends': {
					'p1': 'Z,Q,S,D',
					'p2': 'I,J,K,L',
					'altf': 'N.A.',
					'hs': 'A,U'
				}
			},
			'bepo': {
				'keys': {
					'\u00c9': 01,
					'\u00e9': 01,
					'E': 01,
					'U': 02,
					'I': 04,
					'A': 010,
					'D': 040000,
					'S': 0100000,
					'R': 0200000,
					'T': 0400000,
					'(': 01,
					'*': 040000,
					'B': 014,
					'V': 0600000
				},
				'specials': {
					'scorer': 'C',
					'restart': 'K'
				},
				'legends': {
					'p1': '\u00c9,A,U,I',
					'p2': 'D,T,S,R',
					'altf': '( and *',
					'hs': 'B,V'
				}
			},
			'tr': {
				'keys': {
					'G': 01,
					'I': 02,
					'E': 04,
					'U': 010,
					'N': 040000,
					'M': 0100000,
					'L': 0200000,
					'K': 0400000,
					'4': 01,
					'0': 040000,
					'F': 014,
					'R': 0600000
				},
				'specials': {
					'scorer': 'B',
					'restart': 'D'
				},
				'legends': {
					'p1': 'G,U,I,E',
					'p2': 'N,K,M,L',
					'altf': '4,0',
					'hs': 'F,R'
				}
			},
			'dvorak': {
				'keys': {
					',': 01,
					'\u00bc': 01,
					'O': 02,
					'E': 04,
					'A': 010,
					'C': 040000,
					'T': 0100000,
					'N': 0200000,
					'H': 0400000,
					'4': 01,
					'0': 040000,
					'\'': 014,
					'\u00de': 014,
					'G': 0600000
				},
				'specials': {
					'scorer': 'B',
					'restart': 'X'
				},
				'legends': {
					'p1': ', A O E',
					'p2': 'C H T N',
					'altf': '4,0',
					'hs': '\' and G'
				}
			},
			'colemak': {
				'keys': {
					'W': 01,
					'R': 02,
					'S': 04,
					'A': 010,
					'U': 040000,
					'E': 0100000,
					'I': 0200000,
					'N': 0400000,
					'4': 01,
					'0': 040000,
					'Q': 014,
					'L': 0600000
				},
				'specials': {
					'scorer': 'B',
					'restart': 'G'
				},
				'legends': {
					'p1': 'W,A,R,S',
					'p2': 'U,N,E,I',
					'altf': '4,0',
					'hs': 'Q,L'
				}
			},
			'neo': {
				'keys': {
					'V': 01,
					'I': 02,
					'A': 04,
					'U': 010,
					'G': 040000,
					'R': 0100000,
					'T': 0200000,
					'N': 0400000,
					'4': 01,
					'0': 040000,
					'Q': 014,
					'H': 0600000
				},
				'specials': {
					'scorer': 'B',
					'restart': 'Z'
				},
				'legends': {
					'p1': 'V,U,I,A',
					'p2': 'G,N,R,T',
					'altf': '4,0',
					'hs': 'Q,H'
				}
			}
		},
		keyCodeMap = {// key-pad
			104: 040000,
			101: 0100000,
			102: 0200000,
			100: 0400000,
			103: 0600000
		},
		senseSwitchMap = {
			49: 1,
			50: 2,
			222: 2,
			51: 3,
			52: 4,
			53: 5,
			54: 6
		};

	function setLang(v) {
		if (keyMaps[v]) {
			keyCharMap=keyMaps[v].keys;
			keyLegends=keyMaps[v].legends;
			keySpecials=keyMaps[v].specials;
			keyLang=v;
		}
	}
	function getLang() {
		return keyLang;
	}
	function keyExpression(a,b) {
		return keySpecials[b];
	}
	function getLegend(k) {
		return keyLegends[k];
	}
	setLang('int');

	function handleKeydown(e) {
		if (e.ctrlKey || e.metaKey) return;
		if (e.altKey) {
			if (e.keyCode && String.fromCharCode(e.keyCode)=='P') {
				var url=CRT.getDataURL(!e.shiftKey);
				if (url && confirm('Export screenshot?')) {
					var win = window.open();
					if (win) {
						win.document.title = 'Screenshot';
						win.document.body.innerHTML = '<img src="' + url + '" />';
					}
				}
			}
			return;
		}
		if (keyLock) {
			if (e.preventDefault) e.preventDefault();
			return;
		}
		if (e.keyCode==9) {
			GamepadManager.swap();
			if (e.preventDefault) e.preventDefault();
			if (e.stopPropagation) e.stopPropagation();
			e.returnValue=false;
		}
		else if (gameState==gameStates.splash) {
			CRT.reset();
			startGame();
			if (e.preventDefault) e.preventDefault();
			if (e.stopPropagation) e.stopPropagation();
			e.returnValue=false;
		}
		else if (gameState==gameStates.run) {
			var c=e.keyCode,
				ch=String.fromCharCode(c),
				b= keyCodeMap[c] || keyCharMap[ch];
			if (e.shiftKey) {
				if (shiftedNumbersAsSenseSwitch && c) {
					var n=senseSwitchMap[c];
					if (n) {
						PDP1.setSense(n, !PDP1.getSense(n));
						if (window.PDP1GUI && PDP1GUI.showSenseSwitchInfo) PDP1GUI.showSenseSwitchInfo();
					}
				}
			}
			else if (b) {
				var f=(useTw)? PDP1.setTestword:PDP1.setControl;
				f(b, true);
				if (hyperspaceLock) { // inhibit left+right
					switch(b) {
						case 04: f(010, false); break;
						case 010: f(04, false); break;
						case 0200000: f(0400000, false); break;
						case 0400000: f(0200000, false); break;
					}
				}
			}
			else {
				switch (ch) {
					case ' ':
					case '\b':
						// inhibit accidental scrolling or back-paging
						if (e.preventDefault) e.preventDefault();
						if (e.stopPropagation) e.stopPropagation();
						e.returnValue=false;
						break;
					case keySpecials.scorer:
						if (module.scorer) {
							// toggle bit 5 of test-word (switch 6) for scorer
							toggleTW5();
						}
						break;
					case keySpecials.restart: // restart manually (Spacewar! 2)
						if (module.manualRestart) restart(150); //startGame();
						break;
				}
			}
		}
		else if (gameState==gameStates.service) {
			restartFromService();
			if (e.preventDefault) e.preventDefault();
			if (e.stopPropagation) e.stopPropagation();
			e.returnValue=false;
		}
	}

	function handleKeyup(e) {
		if (!keyLock && gameState==gameStates.run && !e.shiftKey) {
			var c=e.keyCode,
				b= keyCodeMap[c] || keyCharMap[String.fromCharCode(c)];
			if (b) {
				if (useTw) {
					PDP1.setTestword(b, false);
				}
				else {
					PDP1.setControl(b, false);
				}
			}
		}
	}

	function init() {
		window.addEventListener('keydown', handleKeydown, false);
		window.addEventListener('keyup', handleKeyup, false);
		keyLock=false;
	}

	function lock() {
		keyLock=true;
	}
	function unlock() {
		keyLock=false;
	}

	function useTestword(v) {
		useTw=Boolean(v);
	}

	function getHSLock() {
		return hyperspaceLock;
	}

	function setHSLock(v) {
		hyperspaceLock=Boolean(v);
	}

	return {
		init: init,
		setLang: setLang,
		getLang: getLang,
		getLegend: getLegend,
		keyExpression: keyExpression,
		handleKeydown: handleKeydown,
		handleKeyup: handleKeyup,
		useTestword: useTestword,
		getHSLock: getHSLock,
		setHSLock: setHSLock,
		lock: lock,
		unlock: unlock
	};
};

var GamepadManager = new function() {
	var hasGPEvent=(typeof window.GamepadEvent !== 'undefined'),
		hasGetGamepads=Boolean(typeof navigator.getGamepads == 'function'
			|| typeof navigator.webkitGetGamepads == 'function'),
		playersSwapped=false,
		enabled=true,
		THRSHBTN=0.9,
		THRSHAX1=0.6,
		THRSHAX2=0.93;

	var states = [
			{ up: false, down: false, left: false, right: false, fire: false },
			{ up: false, down: false, left: false, right: false, fire: false }
		],
		commands = [
			{ up: 014, down: 02, left: 010, right: 04, fire: 01 },
			{ up: 0600000, down: 0100000, left: 0400000, right: 0200000, fire: 040000 }
		];

	function gamepadConnect(event) {
		//if (event.gamepad) controllers[event.gamepad.index]=event.gamepad;
	}
	function gamepadDisconnect(event) {
		/*
		try {
			if (event.gamepad) delete controllers[event.gamepad.index];
		}
		catch(e) {
			if (window.console) console.log('Error on attempt to disconnect a gamepad:', e);
		}
		*/
	}

	function readGamepads() {
		if (!enabled) return null;
		var gamepads, indices, idx, gp, i, l, ret, controllers;
		if (!hasGetGamepads) return null;
		gamepads=(navigator.getGamepads)? navigator.getGamepads():navigator.webkitGetGamepads();
		if (!gamepads || !gamepads.length) return null;
		indices=[]; controllers={};
		for (i=0, l=gamepads.length; i<l; i++) {
			gp=gamepads[i];
			if (gp && gp.connected!==false) {
				idx=gp.index;
				controllers[idx]=gp;
				indices.push(idx);
			}
		}
		if (!indices.length) return null;
		indices.sort();
		ret=[];
		for (i=0, l=(indices.length>2)? 2:indices.length; i<l; i++) {
			var c=controllers[indices[i]],
				b=c.buttons, a=c.axes,
				readings, s=states[i], cmd= (playersSwapped)? commands[1-i]:commands[i],
				d=(c.mapping!='standard' && c.axes.length==5)?1:0;
			if (!b || !a) continue;
			readings= {
				fire: getButton(b[0]) || getButton(b[1]) || getButton(b[2]) || getButton(b[3]) || getButton(b[10]) || getButton(b[11]) || getButton(b[5]) || getButton(b[7]),
				left: getAxis(-a[d]) || getButton(b[14]),
				right: getAxis(a[d]) || getButton(b[15]),
				up: getAxis2(-a[d+3]) || getButton(b[12]) || getButton(b[4]) || getButton(b[6]) || getButton(b[8]),
				down: getAxis(a[d+3]) || getButton(b[13])
			}
			if (readings.up && (readings.left || readings.right)) readings.up=s.up; //spacewar hyperspace up exclusive
			if (readings.up!=s.up) {
				s.left=readings.left;
				s.right=readings.right;
			}
			for (var p in readings) {
				if (readings[p]!=s[p]) {
					ret.push([cmd[p], readings[p]]);
					s[p]=readings[p];
				}
			}
		}
		return ret;
	}

	function getButton(b) {
		return Boolean((typeof b == 'object')? (b.pressed || b.value>=THRSHBTN):b>=THRSHBTN);
	}
	function getAxis(a, invert) {
		return Boolean(a>=THRSHAX1);
	}
	function getAxis2(a, invert) {
		return Boolean(a>=THRSHAX2);
	}

	function swapPlayers() {
		if (enabled) playersSwapped=!playersSwapped;
	}
	function supported() {
		return hasGetGamepads;
	}

	function enable(v) {
		enabled=!!v;
	}
	function isEnabled() {
		return enabled;
	}

	if (hasGPEvent) {
		window.addEventListener("gamepadconnected", gamepadConnect, false);
		window.addEventListener("gamepaddisconnected", gamepadDisconnect, false);
	}

	return {
		read: readGamepads,
		swap: swapPlayers,
		supported: supported,
		enable: enable,
		isEnabled: isEnabled
	};
};


function setControlBits(v) {
	if (gameState==gameStates.run) {
		PDP1.setControl(v, true);
		//PDP1.setTestword(v, true);
	}
	else {
		KeyManager.handleKeydown({keyCode: 48});
	}
}
function clearControlBits(v) {
	if (gameState==gameStates.run) {
		PDP1.setControl(v, false);
		//PDP1.setTestword(v, false);
	}
	else {
		KeyManager.handleKeyup({keyCode: 48});
	}
}

/* game control & API */

function start(id, pxWidth) {
	if (pxWidth) {
		visualWidth=pxWidth;
		width = (useHighRes)? 1024:visualWidth;
		displayScaleCf=width/02000;
	}
	reset();
	if (!inited) {
		var canvas = document.getElementById(canvasId);
		if (!canvas || !canvas.getContext || !window.addEventListener) {
			alert('Sorry, not compatible.\nStandards-compliant browsers only.');
			return;
		}
		CRT.setup(canvas, width, setCSSDimensions);
		selectModule(id);
	}
	if (gameState<gameStates.service) CRT.reset();
	if (!inited) {
		if (!setupChecks() && (gameState<gameStates.idle || ModuleManager.getModuleList().lengtgh==0)) return;
		adjustGameInterval();
		KeyManager.init();
		enableVisibilityChangeDetection();
		inited=true;
	}
	if (gameState==gameStates.service) {
		return;
	}
	else if (module.tapeError) {
		displayTapeError();
		return;
	}
	else if (showSplashScreen && module.showSplashScreen) {
		displaySplashScreen();
	}
	else {
		startGame();
	}
}

function restart(delay) {
	if (gameState==gameStates.run) {
		var sa=(module && module.startAddress>=0)? module.startAddress:4;
		if (delay===0) {
			PDP1.setPC(sa);
		}
		else {
			stop();
			setTimeout(
				function() {
					PDP1.setPC(sa);
					resume();
				},
				delay || 300
			);
		}
	}
	else {
		if (window.PDP1GUI) PDP1GUI.hideModuleLinks();
		start();
	}
}

function stop() {
	if (timer) clearTimeout(timer);
	timer=null;
	CRT.clearReadyState();
}

function halt() {
	stop();
	KeyManager.lock();
}

function resume() {
	if (!inited) return;
	KeyManager.unlock();
	if (gameState==gameStates.splash) {
		timer = setTimeout(splashLoop, gameInterval);
	}
	else if (gameState==gameStates.run) {
		timer = setTimeout(gameLoop, gameInterval);
	}
	else {
		start();
	}
}

function reset() {
	stop();
	CRT.clearDisplay();
	PDP1.reset();
	//PDP1.clearTestword();
	//if (module && module.scorer) setTW5IndicatorValue();
	if (module) PDP1.setPC((module.startAddress >= 0)? module.startAddress:4);
	gameState=gameStates.idle;
	if (showFPS) {
		if (!fpsElement) {
			fpsElement=document.createElement('div');
			fpsElement.id='fpsDisplay';
			document.body.appendChild(fpsElement);
		}
		else fpsElement.innerHTML='';
		fpsStore=[];
	}
}

function adjustGameInterval() {
	interval = gameInterval/emulationSpeed;
}

function setupChecks() {

	return true;
	var textIntensity=0;
	var textIntensitySmall=7;
	if (self!=top) {
		SymGen.write(512, 300, 'ILLEGAL EMBEDDING DETECTED.', 5, 3, true);
		SymGen.write(512, 430, 'VISIT THE ORIGINAL LOCATION:', 3, textIntensity, true);
		SymGen.write(512, 490, self.location.href.replace(/#.*/, ''), 3, textIntensity, true);
		CRT.render(oddFrame);
		CRT.updateSingleFrame();
		gameState=gameStates.init;
		return false;
	}
	if (!module) {
		SymGen.write(512, 300, 'SETUP ERROR', 10, 3, true);
		SymGen.write(512, 450, 'NO CODE LOADED.', 3, textIntensity, true);
		SymGen.write(512, 510, 'MEMORY REGISTERS EMPTY.', 3, textIntensity, true);
		CRT.render(oddFrame);
		CRT.updateSingleFrame();
		gameState=gameStates.service;
		return false;
	}
	return true
}

/* service screen */

function displayServiceScreen() {
	if (gameState==gameStates.service) {
		restartFromService();
		return;
	}
	var textIntensity=2, textIntensitySmall=0, textIntensityDump=1;
	reset();
	CRT.reset();
	var list=ModuleManager.getModuleList();
	var y=174-Math.floor(list.length/2)*40, x=96;
	y-=y*displayScaleCf-Math.floor(y*displayScaleCf);
	if (list.length>4 && list.length<10) y+=(list.length-4)*10;
	if (y<0) y=0;
	SymGen.write(x, y, 'SPACEWAR-PDP1-ENGINE '+version, 4, textIntensity);
	y+=70;
	SymGen.write(x, y, 'BY NORBERT LANDSTEINER, WWW.MASSWERK.AT, 2012-2022', 2, textIntensitySmall);
	y+=40;
	SymGen.write(x, y, 'BASED ON A PDP-1 EMULATION BY BARRY AND BRIAN SILVER-', 2, textIntensitySmall);
	y+=40;
	SymGen.write(x, y, 'MAN, AND VADIM GERASIMOV.', 2, textIntensitySmall);
	y+=(list.length>10)? 50:70;
	SymGen.write(x, y, 'CODE MODULES LOADED:', 2, textIntensitySmall);
	y+=40;
	if (list.length) {
		if (window.PDP1GUI) PDP1GUI.initModuleLinks();
		for (i=0; i<list.length; i++) {
			SymGen.write(x, y, list[i].label, 2, textIntensitySmall);
			if (window.PDP1GUI) PDP1GUI.createModuleLink(
				list[i].id,
				Math.floor(x*displayScaleCf),
				Math.floor(y*displayScaleCf)-2,
				Math.ceil(list[i].label.length*7*2*displayScaleCf),
				Math.ceil(7*2*displayScaleCf)+4
			);
			y+=40;
		}
	}
	else {
		SymGen.write(x, y, '- NONE -', 2, textIntensitySmall);
		y+=40;
	}
	y+=(list.length>10)? 10:30;
	SymGen.write(x, y, 'CHARACTER DUMP ("CHARACTER DISPLAY",DEC 1964,CA):', 2, textIntensitySmall);
	SymGen.write(x, y+40, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4, textIntensityDump);
	SymGen.write(x, y+79, 'abcdefghijklmnopqrstuvwxyz', 4, textIntensityDump);
	SymGen.write(x, y+123, '0123456789', 4, textIntensityDump);
	SymGen.write(x, y+162, '+-*/=.,_?<>()[]\'"\u00B7\u2283\u2227\u2228\u2191\u2192~|\u00af', 4, textIntensityDump);
	SymGen.write(x, y+216, 'ADDITIONAL CHARACTERS:', 2, textIntensitySmall);
	var inset=SymGen.getTextWidth('ADDITIONAL CHARACTERS:', 2);
	inset+=4*7-inset%(4*7);
	SymGen.write(x+inset, y+202, '!#&:;', 4, textIntensityDump);
	y+=252;
	var t='INTENSITIES:', cw=SymGen.getTextWidth('1', 2), px=x+SymGen.getTextWidth(t, 2)+cw;
	var intensities=[3,2,1,0,7,6,5,4];
	SymGen.write(x, y, t, 2, textIntensitySmall);
	for (var i=0; i<intensities.length; i++) {
		var v=intensities[i];
		SymGen.write(px, y, String(v), 2, v);
		px+=cw;
	}
	var r=Math.floor((1024/width)*1000)/1000;
	SymGen.write(px, y, ' @ RENDERING AT '+width+' PX ('+r+':1)', 2, textIntensitySmall);
	y+=(list.length>10)? 70:90;
	if (y>996 && y<1036) y=996
	if (y<=996) SymGen.write(512, y, '=== PRESS ANY KEY TO RESTART ===', 3, textIntensityDump, true);
	CRT.render(oddFrame);
	CRT.update();
	gameState=gameStates.service;
}

function restartFromService() {
	if (window.PDP1GUI) PDP1GUI.hideModuleLinks();
	reset();
	initModule();
	start();
}


/* splash screen */

function displaySplashScreen() {
	splashCnt=splashOffset=0;
	gameState=gameStates.splash;
	oddFrame=true;
	splashLoop();
}

function splashLoop() {
	var d, lastUpdate= (performanceNow)? performance.now() : new Date().getTime();
	splashFrame();
	CRT.update();
	var gp=GamepadManager.read();
	if (gp) {
		for (var i=0; i<gp.length; i++) {
			if (gp[i][1] && (gp[i][0]==01 || gp[i][0]==040000)) {
				setTimeout(startGame, interval);
				return;
			}
		}
	}
	d=(performanceNow)?
		interval-Math.round(performance.now()-lastUpdate):
		interval-(new Date().getTime()-lastUpdate);
	if (d<1) d=1;
	timer = setTimeout(splashLoop, d);
}

function splashFrame() {
	oddFrame=!oddFrame;
	var y=(showInstructions)? 140:410,
		gamePads=GamepadManager.supported();
	//if (showInstructions && module.message) y-=4*module.message.length;
	if (showInstructions && gamePads) y-=21;
	SymGen.write(512, y, 'SPACEWAR!', 14, 3, true);
	if (showInstructions) {
		y+=248;
		if (module.message) y-=62;
		SymGen.drawOutline(222, y-18, 1, 2, 6);
		SymGen.write(512, y, 'Player 1: '+KeyManager.getLegend('p1'), 4, 0, true);
		y+=77;
		SymGen.drawOutline(222, y-20, 0, 2, 6);
		SymGen.write(512, y, 'Player 2: '+KeyManager.getLegend('p2'), 4, 0, true);
		y+=92;
		SymGen.write(512, y, 'Hyperspace: '+KeyManager.getLegend('hs') + (KeyManager.getHSLock()? '':' or LEFT+RIGHT'), 3, 0, true);
		y+=62;
		SymGen.write(512, y, 'Alternative Fire: '+KeyManager.getLegend('altf'), 3, 0, true);
		if (gamePads) {
			SymGen.write(512, y+62, ' USB Gamepads ' + (GamepadManager.isEnabled()? 'enabled':'disabled') + '.', 3, 0, true);
			y+=44;
		}
		y+=124;
		if (!module.message) y+=62;
		SymGen.write(512, y, 'PRESS ANY KEY TO CONTINUE.', 4, 1, true);
		if (module.message) {
			y+=131;
			for (var i=0; i<module.message.length; i++) {
				SymGen.write(512, y+i*36, module.message[i].toUpperCase(), 2, 7, true);
			}
		}
	}
	CRT.render(oddFrame);
}

/* main */

function startGame() {
	stop();
	if (gameState==gameStates.run) {
		reset();
		CRT.reset();
	}
	gameState=gameStates.run;
	oddFrame=true;
	resetElectrostatics();
	timer = setTimeout(gameLoop, gameInterval);
}

function gameLoop() {
	var d, rt, lastUpdate= (performanceNow)? performance.now() : new Date().getTime();
	CRT.updateNow();
	var gp=GamepadManager.read();
	if (gp) {
		for (var i=0; i<gp.length; i++) {
			if (gp[i][1]) {
				setControlBits(gp[i][0]);
			}
			else {
				clearControlBits(gp[i][0]);
			}
		}
	}
	rt=frame();
	if (rt<0) return infinitLoopError();
	rt=Math.round(rt/(1000*emulationSpeed));
	CRT.update();
	if (showFPS) {
		fpsStore.push(rt);
		var fs=0;
		for (var i=0; i<fpsStore.length; i++) fs+=fpsStore[i];
		//fpsElement.innerHTML= 'frt '+rt+'<br />avg '+Math.round((fs/fpsStore.length)*100)/100;
		if (fs) fs=1000/(fs/fpsStore.length);
		var fcur=rt? Math.round(100000/rt)/100:0;
		fpsElement.innerHTML= 'fps '+fcur+'<br />avg '+Math.round(fs*100)/100;
		if (fpsStore.length>10) fpsStore.shift();
	}
	if (rt==0) rt=interval;
	d=(performanceNow)?
		rt-Math.round(performance.now()-lastUpdate):
		rt-(new Date().getTime()-lastUpdate);
	if (d<1) {
		if (!estaticLock && d>-300 && ++framesMissed==10) {
			// opt out of complex fading on too many misses
			if (CRT.usesElectrostatics()) CRT.useElectrostatics(false);
		}
		d=1;
	}
	if (++estaticCntr > 20) framesMissed=estaticCntr=0;
	timer = setTimeout(gameLoop, d);
	if (scoreTrap) PDP1GUI.showScores(PDP1.getMemAddress(scoreAddrWedge), PDP1.getMemAddress(scoreAddrNeedle));
}

function frame() {
	var i, k, pc=-1, rt, maxLoop=15000;
	oddFrame=!oddFrame;
	PDP1.setFrame(oddFrame);
	PDP1.clearTC();
	if (loopPoint<0) {
		//fps
		for (i=Math.ceil(-1000000/loopPoint);PDP1.getTC()<i;) PDP1.step();
	}
	else if (loopPointScorer) {
		for (i=0; pc!=loopPoint && pc!=loopPointScorer; i++) pc=PDP1.step();
		if (i>maxLoop) PDP1.clearTC(); // fix possible scorer overlap
	}
	else {
		for (i=0; i<maxLoop && pc!=loopPoint; i++) pc=PDP1.step();
		if (i==maxLoop) return -1;
	}
	CRT.render(oddFrame);
	return PDP1.getTC();
}

function infinitLoopError() {
	reset();
	CRT.reset();
	SymGen.write(120, 300, 'INFINITE LOOP DETECTED.', 5, 3);
	SymGen.write(120, 400, 'THIS MIGHT BE DUE TO CUSTOM PARAMETERS', 3, 0);
	SymGen.write(120, 460, 'CAUSING THE GAME TO RUN OUT OF OBJECTS.', 3, 0);
	SymGen.write(120, 520, 'PRESS ANY KEY TO RESUME WITH A RESET. ', 3, 0);
	CRT.render(oddFrame);
	CRT.updateSingleFrame();
	gameState=gameStates.fatal;
	setTimeout(function() {gameState=3;}, 1000);
	return undefined;
}

// set high-speed mode
function setHighSpeedMode(v) {
	emulationSpeed = Boolean(v)? 2:1;
	adjustGameInterval();
}
function getHighSpeedMode() {
	return Boolean(emulationSpeed==2);
}

function setEmulationSpeed(v) {
	v=parseFloat(v);
	if (!isNaN(v)) {
		if (v<emulationSpeed) CRT.useElectrostatics(true);
		emulationSpeed=v;
		adjustGameInterval();
	}
}
function getEmulationSpeed(v) {
	return emulationSpeed;
}

// high resolution rendering
function setHighResMode(v, noRestart) {
	if (singleResOnly) return;
	v=Boolean(v);
	if (v!=useHighRes) {
		useHighRes=v;
		width = (useHighRes)? 1024:visualWidth;
		displayScaleCf=width/02000;
		CRT.setWidth(width);
		CRT.reset();
		if (!noRestart && gameState==gameStates.service) displayServiceScreen();
	}
}
function getHighResMode() {
	return useHighRes;
}

function resetElectrostatics() {
	CRT.useElectrostatics(true);
	framesMissed=estaticCntr=0;
}

function lockElectrostatics(v) {
	estaticLock=Boolean(v);
	if (!estaticLock) framesMissed=estaticCntr=0;
}

function resetScores() {
	if (scoreTrap) {
		lockElectrostatics(true);
		if (confirm('Sure to reset scores to zero?')) {
			PDP1.patchMemory(scoreAddrNeedle, 0);
			PDP1.patchMemory(scoreAddrWedge, 0);
			if (window.PDP1GUI) PDP1GUI.showScores(0, 0);
		}
		lockElectrostatics(false);
	}
}

/* PDP-1 emulation stack */

var PDP1 = new function() {

	/*
		DEC PDP-1 emulation
		original emulation by Barry Silverman, Brian Silverman, and Vadim Gerasimov, 2012
		(c.f. http://spacewar.oversigma.com/html5/)

		Extended by N.Landsteiner 2012-2015
		(fairly complete implemntation of CPU and paper tape reader.
		 still missing: sequence break, flexo writer, paper tape punch.
		 there is no internal memory buffer, since memory is implemented
		 as an array.)
		Most important changes:
		* added hardware multiply/divide option
		* re-implemented arithmetics, sense switches, and program flags
		* re-implemented shift-group (no loops)
		* added emulated hardware multiply/divide
		* added xct in-place skips
		* extended some iot and opr instructions and flags logic
		* added test-word (not zeroed by reset)
		* added paper-tape emulation and status register
		* added realtime count
	*/

	var ac, io, pc, y, ib, ov,
		flags=0, status=0, sense=0, control=0, testword=0, halted=false,
		ctc, ioc=0, msecs=0,
		hwMulDiv=false, memory, papertape,
		oddFrame=false,  // used to fix iot 111, set by setFrame
		mergeCT=false,   // merge control and testword, used to fix 4.8 input
		haltTrap = null, // optional callback on hlt instr.
		rotateCtrls = false,
		dpy10ticks = typeof dpy10microsec!=='undefined'? !!dpy10microsec:false;

	var AND=002, IOR=004, XOR=006, XCT=010, JFD=012, CAL_JDA=016,
		LAC=020, LIO=022, DAC=024, DAP=026, DIP=030, DIO=032, DZM=034,
		ADD=040, SUB=042, IDX=044, ISP=046, SAD=050, SAS=052,
		MUS_MUL=054, DIS_DIV=056,
		JMP=060, JSP=062, SKP=064, SFT=066, LAW=070, IOT=072, OPR=076;

	var nShifts=(function() {
			var t=new Array(01000);
			for (var i=0; i<01000; i++) {
				var b=0;
				for (var j=0; j<9; j++) {
					if (i&(1<<j)) b++;
				}
				t[i]=b;
			}
			return t;
		})(),
		shiftMasksLo=[0, 01, 03, 07, 017, 037, 077, 0177, 0377, 0777],
		shiftMasksHi=[0, 0400000, 0600000, 0700000, 0740000, 0760000, 0770000, 0774000, 0776000, 0777000];

	function step() {
		ctc=0;
		halted=false;
		dispatch(memory[pc++], -1);
		if (ioc) {
			ioc-=ctc;
			if (ioc<0) ioc=0;
		}
		msecs+=ctc;
		return pc;
	}

	function getTC() {
		return msecs;
	}

	function clearTC() {
		msecs=0;
	}

	function dispatch(md, xpc) {
		var mb, t, i;
		y=md&07777; ib=(md>>12)&1; ctc+=5;
		switch ((md>>12)&076) {
		case AND: ea(); ac&=memory[y]; break;
		case IOR: ea(); ac|=memory[y]; break;
		case XOR: ea(); ac^=memory[y]; break;
		case XCT: ea(true); dispatch(memory[y], y); break;
		case JFD: pc=memory[y]&07777; ctc+=5; break; //MIT ESL-R-140, June 62
		case CAL_JDA:
			var target=(ib==0)?0100:y;
			memory[target]=ac;
			ac=(ov<<17)+pc;
			pc=target+1;
			ctc+=5;
			break;
		case LAC: ea(); ac=memory[y]+0; break;
		case LIO: ea(); io=memory[y]; break;
		case DAC: ea(); memory[y]=ac+0; break;
		case DAP: ea(); memory[y]=(memory[y]&0770000)|(ac&07777); break;
		case DIP: ea(); memory[y]=(memory[y]&07777)|(ac&0770000); break; // (N.L., 2014)
		case DIO: ea(); memory[y]=io; break;
		case DZM: ea(); memory[y]=0; break;
		case ADD:  // N.L. 2014
			ea();
			mb=memory[y];
			var ov2=(ac>>17==mb>>17);
			ac+=mb;
			if (ac&01000000) ac=(ac+1)&0777777;
			if (ov2&&(mb>>17!=ac>>17)) ov=1;
			if (ac==0777777) ac=0;
			break;
		case SUB:  // N.L.2014
			ea();
			mb=memory[y];
			ac^=0777777;
			var ov2=(ac>>17==mb>>17);
			ac+=mb;
			if (ac&01000000) ac=(ac+1)&0777777;
			if (ov2&&(mb>>17!=ac>>17)) ov=1;
			ac^=0777777;
			break;
		case IDX:
			ea();
			ac=memory[y]+1;
			if (ac==0777777) ac=0;
			memory[y]=ac;
			break;
		case ISP:
			ea();
			ac=memory[y]+1;
			if (ac==0777777) ac=0;
			memory[y]=ac;
			if ((ac&0400000)==0) {
				if (xpc>=0) {
					pc=xpc+1;
				}
				else {
					pc++;
				}
			}
			break;
		case SAD: ea(); if (ac!=memory[y]+0) pc++; break;
		case SAS: ea(); if (ac==memory[y]+0) pc++; break;
		case MUS_MUL: // N.L. 2013-2014
			if (hwMulDiv) { // mul
				var scr, smb, srm;
				ea();
				mb=memory[y];
				io=ac;
				if (mb&0400000) {
					smb=true;
					mb^=0777777;
				}
				else {
					smb=false;
				}
				if (io&0400000) {
					srm=true;
					io^=0777777;
				}
				else {
					srm=false;
				}
				ac=0;
				scr=1;
				while (scr<022) {
					if (io&1) { // numero deus impare gaudet
						ac+=mb;
						if (ac&01000000) ac=(ac+1)&0777777;
					}
					io=io>>1|((ac&1)<<17);
					ac>>=1;
					scr++;
				}
				if (smb!=srm && (ac|io!=0)) {
					ac=ac^0777777;
					io=io^0777777;
				}
				ctc+=10; // average 20 us of 14-25 us
			}
			else { // mus
				ea();
				if (io&1) {
					ac=ac+memory[y];
					if (ac&01000000) ac=(ac+1)&0777777;
				}
				io=io>>1|((ac&1)<<17);
				ac>>=1;
			}
			break;
		case DIS_DIV: // N.L. 2013-2014
			if (hwMulDiv) { // div
				var scr, smb, srm;
				ea();
				mb=memory[y];
				if (mb&0400000) {
					smb=true;
				}
				else {
					mb^=0777777;
					smb=false;
				}
				if (ac&0400000) {
					srm=true;
					ac^=0777777;
					io^=0777777;
				}
				else {
					srm=false;
				}
				scr=0;
				while (true) {
					ac+=mb;
					if (ac==0777777) {
						ac^=0777777;
					}
					else if (ac&01000000) {
						ac=(ac+1)&0777777;
					}
					if (mb&0400000) mb^=0777777;
					if (scr==022 || (scr==0 && (ac&0400000)==0)) break;
					scr++;
					if ((ac&0400000)==0) mb^=0777777;
					t=(ac>>17)^1;
					ac=((ac<<1)|(io>>17))&0777777;
					io=((io<<1)|t)&0777777;
					if ((io&1)==0) ac=(ac+1)&0777777;
				}
				ac+=mb;
				if (ac==0777777) {
					ac^=0777777;
				}
				else if (ac&01000000) {
					ac=(ac+1)&0777777;
				}
				if (scr!=0) {
					pc++;
					ac>>=1;
				}
				if (srm && ac!=0777777) ac^=0777777;
				if (scr==0) {
					if (srm) io^=0777777;
					ctc+=2;
				}
				else {
					if (srm!=smb && io!=0) io^=0777777;
					mb=io;
					io=ac;
					ac=mb;
					ctc+=25; // average 35 us of 30-40 us
				}
			}
			else { // dis
				ea();
				t=(ac>>17)^1;
				ac=(ac<<1|io>>17)&0777777;
				io=(io<<1|t)&0777777;
				if (t) {
					ac=(ac^0777777)+memory[y];
				}
				else {
					ac=((ac+1)&0777777)+memory[y];
				}
				if (ac&01000000) ac=(ac+1)&0777777;
				if (t) ac^=0777777;
				if (ac==0777777) ac=0;
			}
			break;
		case JMP: ea(true); pc=y; break;
		case JSP: ea(true); ac=(ov<<17)+pc; pc=y; break;
		case SKP: // mod N.L. 2014
			var cond = (
				((y&0100)==0100&&(ac==0)) ||      // sza
				((y&0200)==0200&&(ac>>17==0)) ||  // spa
				((y&0400)==0400&&(ac>>17==1)) ||  // sma
				((y&01000)==01000&&(ov==0)) ||    // szo
				((y&02000)==02000&&(io>>17==0))   // spi
				)? 1:0;
			if ((y&01000)==01000) ov=0;
			if (cond==0 && (y&070)) { // szs, N.L. 2014
				t=(y&070)>>3;
				if (t==7) {
					cond=(sense)?0:1;
				}
				else if (t!=0) {
					cond=(sense&(1<<(t-1)))?0:1;
				}
			}
			if (cond==0 && (y&07)) { // szf, N.L. 2014
				t=y&07;
				if (t==7) {
					cond=(flags)?0:1;
				}
				else if (t!=0) {
					cond=(flags&(1<<(t-1)))?0:1;
				}
			}
			if (cond^ib) { // negate on i-bit
				if (xpc>=0) {
					pc=xpc+1
				}
				else {
					pc++;
				}
			}
			break;
		case SFT: // N.L. 2015
			var nshift=nShifts[md&0777], ishift=18-nshift, mask, sign;
			if (nshift==0) break;
			switch ((md>>9)&017) {
				case 1: // ral
					ac=((ac<<nshift) | ((ac&shiftMasksHi[nshift])>>ishift)) & 0777777;
					break;
				case 2: // ril
					io=((io<<nshift) | ((io&shiftMasksHi[nshift])>>ishift)) & 0777777;
					break;
				case 3: // rcl
					mask=shiftMasksHi[nshift];
					t=(ac&mask)>>ishift;
					ac=((ac<<nshift) & 0777777) | ((io&mask)>>ishift);
					io=((io<<nshift) & 0777777) | t;
					break;
				case 5: // sal
					sign=ac&0400000;
					ac=sign | ((ac<<nshift) & 0377777);
					if (sign) ac|=shiftMasksLo[nshift];
					break;
				case 6: // sil
					sign=io&0400000;
					io=sign | ((io<<nshift) & 0377777);
					if (sign) io|=shiftMasksLo[nshift];
					break;
				case 7: // scl
					mask=shiftMasksHi[nshift];
					sign=ac&0400000;
					ac=sign | (((ac<<nshift) | ((io&mask)>>ishift)) & 0377777);
					io=((io<<nshift) & 0777777);
					if (sign) io|=shiftMasksLo[nshift];
					break;
				case 9: // rar
					ac=(ac>>nshift) | ((ac&shiftMasksLo[nshift])<<ishift);
					break;
				case 10: // rir
					io=(io>>nshift) | ((io&shiftMasksLo[nshift])<<ishift);
					break;
				case 11: // rcr
					mask=shiftMasksLo[nshift];
					t=(ac&mask)<<ishift;
					ac=(ac>>nshift) | ((io&mask)<<ishift);
					io=(io>>nshift) | t;
					break;
				case 13: // sar
					sign=ac&0400000;
					ac>>=nshift;
					if (sign) ac|=shiftMasksHi[nshift];
					break;
				case 14: // sir
					sign=io&0400000;
					io>>=nshift;
					if (sign) io|=shiftMasksHi[nshift];
					break;
				case 15: // scr
					sign=ac&0400000;
					mask=shiftMasksLo[nshift];
					t=(ac&mask)<<ishift;
					ac>>=nshift;
					io=(io>>nshift) | t;
					if (sign) ac|=shiftMasksHi[nshift];
					break;
				default:
					if (window.console) console.log('Undefined shift: '+os(md)+' at '+os(pc-1));
			}
			break;
		case LAW: ac=(ib==0)?y:y^0777777; break;
		case IOT:
			switch (y&077) {
				case 0:  // i/o wait
					if (ib && ioc) {
						ioc-=ctc;
						if (ioc>ctc) ctc=ioc;
						ioc=0;
					}
					break;
				case 7: // dpy (N.L. 2013-2022)
					// 073cb07 c: control/origin, b: brightness/intensity
					var px = ac>>8, py = io>>8, c = (y>>9)&3, b = (y>>6)&7;
					if (crtSelectableOrigins) {
						// c bit 0: x origin at center or left edge
						// c bit 1: y origin at center or bottom edge
						if ((c & 1) == 0) px = px & 01000? 511-(px^01777):512+px;
						if ((c & 2) == 0) py = py & 01000? 511-(py^01777):512+py;
					}
					else {
						px = px & 01000? 511-(px^01777):512+px;
						py = py & 01000? 511-(py^01777):512+py;
					}
					plotCRT(px, 1023-py, b);
					status&=0377777; // clear bit 0
					if (ib) {
						ctc+=45;
						ioc=0;
					}
					else {
						if (dpy10ticks) ctc+=5;
						if ((md>>11)&2) ioc=50;
					}
					break;
				case 011:  // read paper pin block
					t=(mergeCT)? control|testword : control;
					if (y&100) { // iot 111
						io=(oddFrame)? t&15:t&0740000;
						break;
					}
					io|=(rotateCtrls)? ((t<<4)&0777777) | (t>>14) : t;
					break;
				case 1: // rpa, N.L. 2014
					t=(papertape)? papertape.readAlpha(md&014000==0) : -7;
					if (t<0) {
						logTapeError(t);
					}
					else {
						io=t;
						ctc=0;
					}
					break;
				case 2: // rpb, N.L. 2014
					t=(papertape)? papertape.readBin(md&014000==0) : -7;
					if (t<0) {
						logTapeError(t);
					}
					else {
						io=t;
						ctc=0;
					}
					break;
				case 030: // rrb, N.L. 2014
					t=(papertape)? papertape.readBuffer() : -7;
					if (t<0) {
						logTapeError(t);
					}
					else {
						io=t;
						ctc=0;
					}
					break;
				case 033: // cks, N.L. 2015
					io=status;
					break;
				default:
					//if (window.console) console.log('Unknown iot instruction: 0'+Number(y&077).toString(8));
			}
			break;
		case OPR:
			if ((y&02200)==02200) {     // lat (N.L. 2014)
				ac=(mergeCT)? control|testword:testword;
			}
			else if ((y&0200)==0200) {	// cla
				ac=0;
			}
			if ((y&0100)==0100) ac=(ov<<17)+pc;    // lap, N.L. 2014
			if ((y&04000)==04000) io=0;            // cli
			if ((y&01000)==01000) ac^=0777777;     // cma
			if ((y&060)==060) {                    // swp (PDP-1D), N.L. 2014
				t=ac; ac=io; io=t;
			}
			else {
				if ((y&020)==020) io=ac;           // lia (PDP-1D), N.L. 2014
				if ((y&040)==040) ac=io;           // lai (PDP-1D), N.L. 2014
			}
			// stf (01f) / clf (00f), N.L. 2014
			var nflag=y&7;
			if (nflag==7) {
				flags=((y&010)==010)? 077:0;
			}
			else if (nflag>0) {
				t=1<<(nflag-1);
				if ((y&010)==010) {
					flags|=t;
				}
				else {
					flags&=(~t)&077;
				}
			}
			if ((y&0400)==0400) {     // hlt
				if (typeof haltTrap === 'function') haltTrap(pc, ac, io);
				else halted = true;
			}
			break;
		case 0:
			break;
		default:
			if (window.console) console.log('Undefined instruction:', os(md), 'at', os(pc-1));
	  }
	}

	function ea(inPlace) {
		if (!inPlace) ctc+=5;
		while (ib!=0) {
			ib=(memory[y]>>12)&1;
			y=memory[y]&07777;
			ctc+=5;
		}
	}

	function os(n) {
		n += 01000000;
		return '0'+ n.toString(8).substring(1);
	}

	function regs() {
		// debugging only
		if (window.console) console.log('pc: '+os(pc)+', mpc: '+os(memory[pc])+', ac: '+os(ac)+', io: '+os(io)+', ov: ', ov);
	}

	// external API (N.L. 2013-2014)

	function reset() {
		ac=0; io=0, pc=4; ov=0;
		flags=0; status=0; control=0; halted=false;
		msecs=0, ioc=0;
	}

	function setPC(n) {
		pc=n;
	}

	function getPC() {
		return pc;
	}

	function setFrame(v) {
		oddFrame=v;
	}

	function setHardwareMulDiv(v) {
		hwMulDiv=Boolean(v);
	}

	function setMemory(m) {
		var i, l;
		memory = new Array();
		for (i=0, l=m.length; i<l; i++) memory[i]=m[i];
		for (i=memory.length; i<4096; i++) memory[i]=0;
	}

	function patchMemory(addr, mem) {
		if (!memory) return;
		switch (Object.prototype.toString.call(mem)) {
			case '[object Number]':
				memory[addr]=mem;
				break;
			case '[object Array]':
				for (var i=0, l=mem.length; i<l; i++) memory[addr++]=mem[i];
				break;
		}
	}

	function getMemRange(a1, a2) {
		if (memory) return memory.slice(a1, a2+1);
	}

	function getMemAddress(a) {
		if (memory) return memory[a];
	}

	function setHaltTrap(callback) {
		haltTrap = callback;
	}

	// sense switches:  n: 1..6 => "set sense switch 1 to On": setSense(1, true)
	function setSense(n, v) {
		if (n>0 && n<7) {
			var b=1<<(n-1);
			if (v) {
				sense|=b;
			}
			else {
				sense&=(~b)&077;
			}
		}
	}
	function getSense(n) {
		if (n>0 && n<7) {
			return Boolean(sense&(1<<(n-1)));
		}
		else {
			return false;
		}
	}

	function setControl(bits, activate) {
		if (activate) {
			control |= bits&0777777;
		}
		else {
			control &= (~bits)&0777777;
		}
	}
	function getControl() {
		return control;
	}

	function setTestword(bits, activate) {
		if (activate) {
			testword |= bits&0777777;
		}
		else {
			testword &= (~bits)&0777777;
		}
	}
	function getTestword() {
		return testword;
	}

	function mergeControls(v) {
		mergeCT = Boolean(v);
	}

	function rotateControls(v) {
		rotateCtrls=Boolean(v);
	}

	/* paper tape (read only; N.L. 2013) */

	function PaperTape() {
		this.data=null;
		this.size=0;
		this.pos=0;
		this.buffer=0;
		status &= 0577777; // clear status bit 1
	}
	PaperTape.prototype={
		load: function(data) {
			this.size=(data)? data.length:0;
			if (this.size) {
				this.data=new Array(this.size);
				for (var i=0; i<this.size; i++) this.data[i]=data[i];
				this.pos=0;
			}
			else {
				this.data=null;
			}
		},
		reset: function() {
			this.pos=0;
			this.buffer=0;
			status &= 0577777;
		},
		readIn: function(mem) {
			// boot from a bin file
			var op, y;
			this.buffer=0;
			status &= 0577777;
			for (;;) {
				op=this.readBin(false);
				if (op < 0) return op;
				y= op & 07777;
				switch (op>>12) {
					case 032: // dioY
						op=this.readBin(false);
						if (op<0) return op;
						mem[y]=op;
						break;
					case 060: // jmp Y
						return y;
					default:
						if (window.console) console.log('Read In - Unexpected Instruction: '+os(op));
						return -3;
				}
			}
		},
		readBin: function(rtb) {
			var w=0;
			for (var i=0; i<3; i++) {
				for (;;) {
					if (this.pos>=this.size) {
						status &= 0577777;
						return -1;
					}
					var line= this.data[this.pos++];
					if (line&0200) {
						w= (w << 6) | (line & 077);
						break;
					}
				}
			}
			if (rtb) {
				status |= 0200000;
				this.buffer= w;
				return 0;
			}
			else {
				return w;
			}
		},
		readAlpha: function(rtb) {
			if (this.pos>=this.size) {
				status &= 0577777;
				return -1;
			}
			if (rtb) {
				status |= 0200000;
				this.buffer = this.data[this.pos++] & 0377;
				return 0;
			}
			else {
				return this.data[this.pos++] & 0377;
			}
		},
		readBuffer: function() {
			if (status & 0200000 == 0200000) {
				status &= 0577777;
				return this.buffer;
			}
			else {
				return -2;
			}
		}
	};

	function mountPaperTape(tp) {
		papertape=new PaperTape();
		if (tp) papertape.load(tp);
	}

	function tapeReadIn() {
		var sa, te, tp, w, ds, de;
		reset();
		pc = papertape.readIn(memory);
		if (pc==07751) {
			// Macro loader - load and halt at start address
			// first seek start address and last tape pos
			sa=-1; te=-1; tp=papertape.pos; w=0, ds=-1; de=-1;
			while (w>=0) {
				w = papertape.readBin(false);
				if (w<0) return w;
				var op = w>>12;
				if (op == 060) { // jmp
					te=papertape.pos;
					sa = w&07777;
					break;
				}
				if (op == 032) { // dio
					if (ds<0) { // start address
						ds = w&07777;
					}
					else { // end address
						de = w&07777;
						// payload and checksum
						for (var i=ds; i<=de && w>=0; i++) w=papertape.readBin();
						if (w<0) return w;
						ds= de= -1;
					}
				}
				else {
					return -5;
				}
			}
			if (sa<0) return -6;
			// now run it as it should (emulated)
			papertape.pos=tp;
			var tmpTrap=haltTrap;
			haltTrap=null;
			for (var i=0;
				i<0777777 && pc>=0 && (pc!=sa || papertape.pos!=te) && !halted;
				i++) pc=step();
			haltTrap=tmpTrap;
			if (halted) return -4;
			if (i==0777777) return -1;
		}
		return pc;
	}

	function resetMemory() {
		memory = new Array(4096);
		for (var i=0; i<4096; i++) memory[i]=0;
	}

	function getFlags() {
		return flags;
	}

	// return API
	return {
		step: step,
		setPC: setPC,
		getPC: getPC,
		getTC: getTC,
		clearTC: clearTC,
		getFlags: getFlags,
		setFrame: setFrame,
		setMemory: setMemory,
		resetMemory: resetMemory,
		patchMemory: patchMemory,
		getMemRange: getMemRange,
		getMemAddress: getMemAddress,
		setControl: setControl,
		getControl: getControl,
		setSense: setSense,
		getSense: getSense,
		setTestword: setTestword,
		getTestword: getTestword,
		mergeControls: mergeControls,
		rotateControls: rotateControls,
		reset: reset,
		setHardwareMulDiv: setHardwareMulDiv,
		mountPaperTape: mountPaperTape,
		readInMemory: tapeReadIn,
		setHaltTrap: setHaltTrap
	};
};

function plotCRT(x, y, i) {
	CRT.plot(x, y, intensitiesMap[i], crtAliasing);
}

function logTapeError(errno) {
	if (debugTape && window.console) console.log('Tape error: '+errno+' '+(tapeErrorStrings[errno] || ''));
}

/* pseudo-CRT graphics, any scaling from 1024 x 1024 done here */

var CRT = new function() {

	/*
		DEC Type 30 CRT emulation
		featuring a dual phospor
		N.Landsteiner 2012-2015
	*/

	var colorPhosphor1 = '#3daaf7',      // color (CSS-value) for newly set pixels
		colorPhosphor1Blur = '#0063eb',  // blur color for newly set pixels
		colorPhosphor2 = '#79cc3e',      // color of persiting phosphor (begin)
		colorPhosphor2Aged = '#7eba1e',  // color of persiting phosphor (end)
		backgroundColor = '',            // CSS-value (empty string for transparent)

		pixelIntensityMax = 240,         // intensity max (of 7) phosphor 1 (0..255), builds up
		pixelIntensityMin = 8,           // intensity min (of 7) phosphor 1 (0..255), builds up
		pixelHaloMinIntensity = 25,      // blur regions min. display intensity (0..255)
										 // (this value has no influence on any calculations)
		pixelSustainPercent = 0.90,      // fading factor (percent of range, see below)
		pixelSustainMin = 6,             // minimal threshold for sustain (to persist on phosphor 2)
		pixelSustainMax = 144,           // maximal value for phosphor 2 (0..255)
		pixelSustainSensitivity = 1.715, // increase bottom input level by n (n >= 1)
		pixelSustainRangeOffset = 0.45,  // move top sensitivity down by n*100 % of range (mean: 0.5) -- "smears" trails
										 // (smoothens trails, but washes out intensities)
		pixelThreshold = 2,              // pixel clearance below (0..255)

		blurLevelsDefault = 4,           // levels of blur (0: no blur)
		blurFactorSquare = 0.34,         // effective blur adds square and linear
		blurFactorLinear = 0.02,         // (bleeding)
		blurFactorDiagional = 0.125,       // factor of effective blur for corners

		sustainFuzzyness = 0.0075,       // random factor for phosphor 2 refresh (times +/- 0.5)
		sustainFadeCoeff = 0.04,         // factor for electrostatic effects
		sustainFadeMax = 0.98,           // max effect
		sustainFadeThreshold = 0.5,      // threshold
		sustainFadeFuzzyness = 0.0125,    // random factor (times +/- 0.5)

		sustainSFuzzyness = 0.02,        // as above, for simple algorithm
		sustainSFadeCoeff = 0.93,        // sustain-rate for pixels near blank
		sustainSFadeFuzzyness = 0.08,    // simple algorithm, random factor (+/- 0.5)
		sustainSFadeProbability = 0.8,   // simple algorithm, probabilty per pixel
		sustainSRatio = 0.9885654885654885, // translation factor

		phos2AlphaCorr = 26,
		phos2CosineWeight = 1.1,
		electrostatics = true;

	var pixelSustainFactorMin = 0.8,
		pixelSustainFactorMax = 1.0;

	var reqAnimFrame=null, cancelAnimFrame=null, afId,
		canvas, ctx, canvasData, pixels, pixelIntensity,
		pixelVals, pixelStack, pixelTOS, clearStack, clearTOS, tempStack,
		phos1Vals, phos1Stack, phos1TOS, phos2Vals, phos2Stack, phos2TOS,
		clrVecPhos1, clrVecPhos1Blr, clrVecPhos2, clrVecPhos2Aged,
		phos1Ramp, phos2Ramp, phos2MinVal, frameReady,
		width, p_maxw, p_maxh, setCSSDimensions, displayScaleCf, integerCoors,
		intensityRange=pixelIntensityMax-pixelIntensityMin,
		intensityOffset=pixelIntensityMin+(1-pixelSustainRangeOffset)*intensityRange,
		sustainTransferCf=intensityOffset*pixelSustainSensitivity||intensityOffset,
		pixelSustainFactor=pixelSustainFactorMin+pixelSustainPercent*(pixelSustainFactorMax-pixelSustainFactorMin),
		sustainFactorE=pixelSustainFactor,
		sustainFactorS=sustainFactorE*sustainSRatio,
		sustainFactor=(electrostatics)? sustainFactorE:sustainFactorS,
		blurLevels=blurLevelsDefault;

	var useAnimationFrames = false, // generally opt in/out of async drawing
		animationFrameOptOutByUA = ['Safari'],
		useAnimationFrameByVendor = {
			general: true,
			webkit: true,
			moz: false, // mozilla's frame rate became just too slow using animation-frames!
			o: true,
			ms: true
		};

	function resolveAnimationFrameAPI() {
		var optOut=false, ua=navigator.userAgent;
		for (var i=0; i<animationFrameOptOutByUA.length; i++) {
			if (ua.indexOf(animationFrameOptOutByUA[i])>=0) return;
		}
		for (var vendor in useAnimationFrameByVendor) {
			var optValue=useAnimationFrameByVendor[vendor];
			if (optValue) {
				reqAnimFrame=window[vendor+'RequestAnimationFrame'];
				if (reqAnimFrame) {
					cancelAnimFrame=window[vendor+'CancelAnimationFrame'] || window[vendor+'CancelRequestAnimationFrame'];
					break;
				}
			}
			else if (optValue === false) {
				optOut=true;
				break;
			}
		}
		if (!optOut && useAnimationFrameByVendor.general && window.requestAnimationFrame) {
			reqAnimFrame=window.requestAnimationFrame;
			cancelAnimFrame=window.cancelAnimationFrame;
		}
	}

	function setup(_canvas, _width, _setCSSDimensions) {
		canvas=_canvas;
		setCSSDimensions=_setCSSDimensions;
		setWidth(_width);
		ctx = canvas.getContext('2d');
		var st=canvas.style;
		if (setCSSDimensions) st.height=st.width=visualWidth+'px';
		if (backgroundColor) st.backgroundColor=backgroundColor;
		setupColors();
		setupPixelIntensities();
		setupPhosphor1Ramp();
		setupPhosphor2Ramp();
		if (useAnimationFrames) {
			resolveAnimationFrameAPI();
			useAnimationFrames = Boolean(reqAnimFrame);
		}
		phos2Stack=new Array();
		phos2Vals=new Array();
		phos1Stack=new Array();
		phos1Vals=new Array();
		clearStack=new Array();
		pixelStack=new Array();
		tempStack=new Array();
		pixelVals=new Array();
	}

	function setWidth(w) {
		width=w;
		canvas.width = canvas.height= width;
		p_maxw=width-1;
		p_maxh=width*p_maxw;
		if (setCSSDimensions) canvas.style.height=canvas.style.width=visualWidth+'px';
		displayScaleCf=width/1024;
		integerCoors=(width%1024==0);
	}

	function reset() {
		pixelVals.length=phos1Vals.length=phos2Vals.length=width*width;
		phos1TOS=phos2TOS=clearTOS=pixelTOS=0;
		ctx.clearRect(0,0,width,width);
		canvasData=ctx.getImageData(0, 0, width, width);
		pixels=canvasData.data;
		for (var j=0, r=0; r<width; r++) {
			for (var c=0; c<width; c++, j++) {
				phos2Vals[j]=0;
				phos1Vals[j]=0;
				pixelVals[j]=0;
			}
		}
	}

	function setupColors() {
		// extract rgb values from css defs
		if (!clrVecPhos1) {
			ctx.fillStyle = colorPhosphor2;
			ctx.fillRect(0,0,1,1);
			canvasData=ctx.getImageData(0, 0, 1, 1);
			clrVecPhos2=new Array();
			for (var i=0; i<3; i++) clrVecPhos2[i]=canvasData.data[i];
			ctx.fillStyle = colorPhosphor2Aged;
			ctx.fillRect(0,0,1,1);
			canvasData=ctx.getImageData(0, 0, 1, 1);
			clrVecPhos2Aged=new Array();
			for (var i=0; i<3; i++) clrVecPhos2Aged[i]=canvasData.data[i];
			ctx.fillStyle = colorPhosphor1Blur;
			ctx.fillRect(0,0,1,1);
			canvasData=ctx.getImageData(0, 0, 1, 1);
			clrVecPhos1Blr=new Array();
			for (var i=0; i<3; i++) clrVecPhos1Blr[i]=canvasData.data[i];
			ctx.fillStyle = colorPhosphor1;
			ctx.fillRect(0,0,1,1);
			canvasData=ctx.getImageData(0, 0, 1, 1);
			clrVecPhos1=new Array();
			for (var i=0; i<3; i++) clrVecPhos1[i]=canvasData.data[i];
		}
		ctx.fillStyle = '#000000';
	}

	function setupPixelIntensities() {
		pixelIntensity=new Array();
		var ico=[4,5,6,7,0,1,2,3];   // intensity codes, order min..max, 0: normal
		for (var i=0; i<8; i++) pixelIntensity[ico[i]]=pixelIntensityMin+(i/7)*intensityRange;
	}

	function setupPhosphor1Ramp() {
		phos1Ramp=new Array();
		var ofs=Math.floor(pixelIntensity[0]/4);
		for (var i=0; i<ofs; i++) phos1Ramp[i]=clrVecPhos1Blr;
		for (var i=ofs, j=0, d=255-ofs; i<256; i++, j++) {
			var c1=j/d, c2;
			c1*=c1;
			c2=1-c1;
			phos1Ramp[i] = [
				Math.round(clrVecPhos1Blr[0]*c2+clrVecPhos1[0]*c1),
				Math.round(clrVecPhos1Blr[1]*c2+clrVecPhos1[1]*c1),
				Math.round(clrVecPhos1Blr[2]*c2+clrVecPhos1[2]*c1)
			];
		}
	}

	function setupPhosphor2Ramp() {
		var r1=clrVecPhos2[0], g1=clrVecPhos2[1], b1=clrVecPhos2[2],
			r2=clrVecPhos2Aged[0], g2=clrVecPhos2Aged[1], b2=clrVecPhos2Aged[2],
			r, g, b, a, i, c1, c2, c3, psm, c3w, cfa;
		if (phos2AlphaCorr) {
			a=(255-phos2AlphaCorr)/255;
			r1*=a; g1*=a; g1*=a;
			a=(255-phos2AlphaCorr*0.25)/255;
			r2*=a; g2*=a; g2*=a;
			psm=pixelSustainMax+phos2AlphaCorr;
		}
		else {
			psm=pixelSustainMax;
		}
		phos2Ramp=new Array();
		phos2MinVal=0;
		c3w=phos2CosineWeight||1;
		cfa=1+c3w;
		for (i=0; i<=256; i++) {
			c1=i/255;
			c2=1-c1;
			c3= -0.5 * (Math.cos(Math.PI*c1) - 1);
			r=r1*c1+r2*c2;
			g=g1*c1+g2*c2;
			b=b1*c1+b2*c2;
			a=psm*(c1+c3*c3w)/cfa;
			phos2Ramp[i]=[Math.round(r), Math.round(g), Math.round(b), Math.round(a)];
			if (a<pixelThreshold) phos2MinVal=i;
		}
		phos2MinVal/=255;
	}

	// sets the pixels in a proxy-stack in order to deal with duplicate pixels caused by scaling
	function plot(x, y, amount, aliasing, level) {
		var intensity = pixelIntensity[amount];
		if (integerCoors) {
			// no aliasing at 1:1, ignore argument
			plotPixel(x, y, intensity, level, 0);
		}
		else if (aliasing) {
			var xs=x*displayScaleCf,
				ys=y*displayScaleCf,
				dx2 = xs%1,
				dy2 = ys%1,
				dx1, dy1, x1, x2, y1, y2;
			if (dx2!=0) {
				intensity = Math.round(intensity*1.09);
				dx1=1-dx2;
				x1=Math.floor(xs);
				x2=x1+1;
				if (dy2!=0) {
					dy1=1-dy2;
					y1=Math.floor(ys);
					y2=y1+1;
					plotPixel(x1, y1, intensity*dx1*dy1, level);
					if (y2<width) plotPixel(x1, y2, intensity*dx1*dy2, level);
					if (x2<width) {
						plotPixel(x2, y1, intensity*dx2*dy1, level);
						if ( y2<width) plotPixel(x2, y2, intensity*dx2*dy2, level);
					}
				}
				else {
					plotPixel(x1, ys, intensity*dx1, level);
					if (x2<width) plotPixel(x2, ys, intensity*dx2, level);
				}
			}
			else if (dy2!=0) {
				intensity = Math.round(intensity*1.09);
				dy1=1-dy2;
				y1=Math.floor(ys);
				y2=y1+1;
				plotPixel(xs, y1, intensity*dy1, level);
				if (y2<width) plotPixel(xs, y2, intensity*dy2, level);
			}
			else {
				plotPixel(xs, ys, intensity, level);
			}
		}
		else {
			plotPixel(Math.floor(x*displayScaleCf), Math.floor(y*displayScaleCf), intensity, level);
		}
	}

	function plotPixel(x, y, intensity, level) {
		var i=y*width+x, v=pixelVals[i], p;
		if (v==0) {
			p=pixelStack[pixelTOS];
			if (!p) {
				p=pixelStack[pixelTOS]=[
					x,
					y,
					i,
					(typeof level!=='undefined')? level:blurLevels
				];
			}
			else {
				p[0]=x;
				p[1]=y;
				p[2]=i;
				p[3]=(typeof level!=='undefined')? level:blurLevels;
			}
			pixelTOS++;
			pixelVals[i]=intensity;
		}
		else if (intensity>v) {
			pixelVals[i]=intensity;
		}
	}

	// processes the proxy-stack to display values for phosphor layer 1 (applying blur)
	function renderPixels() {
		for (var i=0; i<pixelTOS; i++) {
			var p=pixelStack[i], n=p[2];
			renderPixel(p[0], p[1], pixelVals[n], p[3]);
			pixelVals[n]=0;
		}
		pixelTOS=0;
	}

	function renderPixel(x, y, a, level) {
		var i=y*width+x, v=phos1Vals[i], v0=v;
		if (v<255) {
			if (v==0) phos1Stack[phos1TOS++]=i;
			v+=a;
			phos1Vals[i]= (v>255)? 255:v;
			if (--level) {
				var b=a/255;
				b=Math.floor(b*b*255*blurFactorSquare+a*blurFactorLinear);
				if (b>0) {
					if (x<p_maxw) renderPixel(x+1,y, b, level);
					if (x>0) renderPixel(x-1,y, b, level);
					if (y<p_maxw) renderPixel(x,y+1, b, level);
					if (y>0) renderPixel(x,y-1, b, level);
					if (blurFactorDiagional) {
						b=Math.floor(b*blurFactorDiagional);
						if (b>0) {
							if (y>0) {
								if (x<p_maxw) renderPixel(x+1,y-1, b, level);
								if (x>0) renderPixel(x-1,y-1, b, level);
							}
							if (y<p_maxw) {
								if (x<p_maxw) renderPixel(x+1,y+1, b, level);
								if (x>0) renderPixel(x-1,y+1, b, level);
							}
						}
					}
				}
			}
		}
	}

	// applies an emulated pixel to the canvas
	function applyScreenPixel(m, cv, v) {
		var v1=Math.round(v);
		if (v1>255) v1=255;
		if (cv==0 || v1==255) {
			var p=phos1Ramp[255];
			for (var k=0; k<3; k++) pixels[m+k]=p[k];
			pixels[m+3]= (cv==0 && v1<pixelHaloMinIntensity)? pixelHaloMinIntensity:v1;
		}
		else {
			var p=phos1Ramp[v1],
				clr=phos2Ramp[Math.floor(cv*255)],
				//cf=clr[3]/255*(1-v/255);
				cf=(1+clr[3]/255*(1-v/255))/2;
			for (var k=0; k<3; k++) {
				//var c=Math.round((p[k]+clr[k]*cf+p[k]+clr[k])/2);
				var c=Math.round(p[k]+clr[k]*cf);
				pixels[m+k]=(c>255)? 255:c;
			}
			v1+=clr[3];
			pixels[m+3]=(v1>255)? 255:v1;
		}
	}

	function update() {
		if (useAnimationFrames) {
			frameReady=true;
			if (!afId) updateAF();
		}
		else {
			ctx.putImageData(canvasData, 0, 0);
			frameReady=false;
		}
	}

	function updateAF() {
		if (frameReady) {
			ctx.putImageData(canvasData, 0, 0);
			frameReady=false;
		}
		afId = reqAnimFrame(updateAF);
	}

	function updateSingleFrame() {
		ctx.putImageData(canvasData, 0, 0);
	}

	function render(oddFrame) {
		// render proxy pixels to display values (phosphor 1)
		renderPixels();
		// dual phosphor emulation
		pixels=canvasData.data;
		// clear obsolete pixels
		for (var i=0; i<clearTOS; i++) pixels[clearStack[i]+3]=0;
		clearTOS=0;
		// display phosphor 2
		for (var i=0; i<phos2TOS; i++) {
			var n=phos2Stack[i],
				m=n<<2,
				p=phos2Ramp[Math.floor(phos2Vals[n]*255)];
			for (var k=0; k<4; k++) pixels[m+k]=p[k];
		}
		// process phosphor 1 (push new pixels to phos-2 stack and display them)
		for (var i=0; i<phos1TOS; i++) {
			var n=phos1Stack[i],
				m=n<<2,
				v=phos1Vals[n];
			if (v>=pixelSustainMin) {
				if (!phos2Vals[n]) phos2Stack[phos2TOS++]=n;
				var u=(v>=intensityOffset)? 1:1-(intensityOffset-v)/sustainTransferCf;
				if (phos2Vals[n]<u) phos2Vals[n]=u;
			}
			else if (!phos2Vals[n]) {
				clearStack[clearTOS++]=m;
			}
			applyScreenPixel(m, phos2Vals[n], v);
			phos1Vals[n]=0;
		}
		// update/reset the queues (fade phosphor 2 for display in next cycle)
		phos1TOS=0;
		var s=tempStack, tos=0;
		for (var i=0; i<phos2TOS; i++) {
			var n=phos2Stack[i],
				v=phos2Vals[n]*sustainFactor*(1-(Math.random()-0.5)*sustainFuzzyness);
			if (v>=phos2MinVal) {
				phos2Vals[n]=v;
				s[tos++]=n;
			}
			else {
				phos2Vals[n]=0;
				pixels[(n<<2)+3]=0;
			}
		}
		if (!oddFrame) {
			// add some more fuzzyness (phosphor 2 only)
			if (electrostatics) {
				applySustainFadeE(s, tos)
			}
			else {
				applySustainFadeS(s, tos)
			}
		}
		tempStack=phos2Stack;
		phos2Stack=s;
		phos2TOS=tos;
	}
	
	function applySustainFadeE(s, tos) {
		// model electrostatics
		var sf=(sustainFactor+(Math.random()-0.5)*sustainFadeFuzzyness*0.5)*0.5,
			th=sustainFactor*sustainFadeThreshold;
		for (var i=0; i<tos; i++) {
			var n=s[i], v=phos2Vals[n], x=n%width, f=0, z=0;
			if (x>0) { z++; f+=phos2Vals[n-1]-sf; }
			if (x<p_maxw) { z++; f+=phos2Vals[n+1]-sf; }
			if (n>width) { z++; f+=phos2Vals[n-width]-sf; }
			if (n<p_maxh) { z++; f+=phos2Vals[+width]-sf; }
			if (z) {
				var c=1+(f/z)*sustainFadeCoeff*(1-Math.random()*sustainFadeFuzzyness);
				if (c<1) {
					phos2Vals[n]*=c;
				}
				else if (v<th) {
					phos2Vals[n]*=c/c;
				}
				if (phos2Vals[n]>sustainFadeMax) phos2Vals[n]=sustainFadeMax;
			}
		}
	}
	
	function applySustainFadeS(s, tos) {
		// simple, low res
		var sf=sustainSFadeCoeff*(1-(Math.random()-0.5)*sustainSFadeFuzzyness);
		for (var i=0; i<tos; i++) {
			if (Math.random()<sustainSFadeProbability) {
				var n=s[i], v=phos2Vals[n], x=n%width;
				if (x>0 && !phos2Vals[n-1]) phos2Vals[n]*=sf;
				if (x<p_maxw && !phos2Vals[n+1]) phos2Vals[n]*=sf;
				if (n>width && !phos2Vals[n-width]) phos2Vals[n]*=sf;
				if (n<p_maxh && !phos2Vals[n+width]) phos2Vals[n]*=sf;
			}
		}
	}

	function updateNow() {
		if (frameReady && useAnimationFrames) {
			ctx.putImageData(canvasData, 0, 0);
			frameReady=false;
		}
	}

	function clearReadyState() {
		frame.ready=false;
		if (afId) cancelAnimFrame(afId);
		afId=null;
	}

	function clearDisplay() {
		if (ctx) ctx.clearRect(0,0,width,width);
	}

	function getDataURL(addBackground) {
		if (!canvas || !canvas.toDataURL || !pixels) return null;
		if (addBackground) {
			var cvs=document.createElement('canvas'),
				c=cvs.getContext('2d'),
				r=Math.ceil(width*Math.SQRT2/2),
				ofs=Math.round(r-width/2),
				w=r*2, d, pd;
			cvs.width=cvs.height=w;
			c.fillStyle='#000';
			c.beginPath();
			c.arc(r,r,r,0,Math.PI*2);
			c.closePath();
			c.fill();
			d=c.getImageData(ofs, ofs, width, width);
			pd=d.data;
			for (var x=0, x2=width*width*4; x<x2; x+=4) {
				var a=pixels[x+3]/255;
				pd[x]=Math.round(pixels[x]*a);
				pd[x+1]=Math.round(pixels[x+1]*a);
				pd[x+2]=Math.round(pixels[x+2]*a);
			}
			c.putImageData(d, ofs, ofs);
			return cvs.toDataURL('image/png');
		}
		else {
			return canvas.toDataURL('image/png');
		}
	}

	function setSustain(v, setDefault) {
		if (typeof v==='undefined') {
			v=pixelSustainFactor;
		}
		else if (typeof v==='string') {
			v=parseFloat(v);
		}
		if (typeof v!=='number' || isNaN(v)) {
			return;
		}
		if (v>1) {
			v=1;
		}
		else if (v<0) {
			v=0;
		}
		sustainFactorE=pixelSustainFactorMin+v*(pixelSustainFactorMax-pixelSustainFactorMin);
		sustainFactorS=sustainFactorE*sustainSRatio;
		sustainFactor=(electrostatics)? sustainFactorE:sustainFactorS;
		if (setDefault) pixelSustainFactor=sustainFactorE;
	}

	function resetSustain() {
		sustainFactorE=pixelSustainFactor;
		sustainFactorS=sustainFactorE*sustainSRatio;
		sustainFactor=(electrostatics)? sustainFactorE:sustainFactorS;
	}

	function getSustain() {
		return parametricSustain(sustainFactorE);
	}

	function getDefaultSustain() {
		return parametricSustain(pixelSustainFactor);
	}

	function parametricSustain(v) {
		return (v-pixelSustainFactorMin)/(pixelSustainFactorMax-pixelSustainFactorMin);
	}

	function setBlurLevels(v) {
		v=parseInt(v);
		if (!isNaN(v)) blurLevels=Math.max(2, Math.min(8, v));
	}

	function getBlurLevels() {
		return blurLevels;
	}

	function getDefaultBlurLevels() {
		return blurLevelsDefault;
	}

	function resetBlurLevels() {
		blurLevels=blurLevelsDefault;
	}
	
	function useElectrostatics(v) {
		electrostatics=Boolean(v);
		sustainFactor=(electrostatics)? sustainFactorE:sustainFactorS;
	}

	function usesElectrostatics() {
		return electrostatics;
	}

	// force managed colors by a proof image (jpeg/srgb with embeded profile)
	// color proof: 32 x 8, 4 squares of solid color (8 x 8)
	// colors are the same as defined in the config section
	// (colorPhosphor1, colorPhosphor1Blur, colorPhosphor2, colorPhosphor2Aged)

	(function(colorproof) {
		function getManagedColors() {
			var x, y, c, d, i, rerun=(clrVecPhos1 && clrVecPhos1.length),
				buffer=document.createElement('canvas');
			if (!buffer || !img || !img.width) return;
			c=buffer.getContext('2d');
			c.drawImage(img, 0, 0);
			d=c.getImageData(3,3,25,1);
			clrVecPhos1=new Array();
			clrVecPhos1Blr=new Array();
			clrVecPhos2=new Array();
			clrVecPhos2Aged=new Array();
			for (var i=0, p=0; i<3;  i++, p++) clrVecPhos1[i]=d.data[p];
			for (var i=0, p=32; i<3; i++, p++) clrVecPhos1Blr[i]=d.data[p];
			for (var i=0, p=64; i<3; i++, p++) clrVecPhos2[i]=d.data[p];
			for (var i=0, p=96; i<3; i++, p++) clrVecPhos2Aged[i]=d.data[p];
			if (rerun) {
				setupPhosphor1Ramp();
				setupPhosphor2Ramp();
			}
		}
		var img = new Image();
		img.src=colorproof;
		if (img.complete) {
			getManagedColors();
		}
		else {
			img.onload = getManagedColors;
		}
	})('data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABkAAD/4gxYSUNDX1BST0ZJTEUAAQEAAAxITGlubwIQAABtbnRyUkdCIFhZWiAHzgACAAkABgAxAABhY3NwTVNGVAAAAABJRUMgc1JHQgAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLUhQICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFjcHJ0AAABUAAAADNkZXNjAAABhAAAAGx3dHB0AAAB8AAAABRia3B0AAACBAAAABRyWFlaAAACGAAAABRnWFlaAAACLAAAABRiWFlaAAACQAAAABRkbW5kAAACVAAAAHBkbWRkAAACxAAAAIh2dWVkAAADTAAAAIZ2aWV3AAAD1AAAACRsdW1pAAAD+AAAABRtZWFzAAAEDAAAACR0ZWNoAAAEMAAAAAxyVFJDAAAEPAAACAxnVFJDAAAEPAAACAxiVFJDAAAEPAAACAx0ZXh0AAAAAENvcHlyaWdodCAoYykgMTk5OCBIZXdsZXR0LVBhY2thcmQgQ29tcGFueQAAZGVzYwAAAAAAAAASc1JHQiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAABJzUkdCIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAPNRAAEAAAABFsxYWVogAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z2Rlc2MAAAAAAAAAFklFQyBodHRwOi8vd3d3LmllYy5jaAAAAAAAAAAAAAAAFklFQyBodHRwOi8vd3d3LmllYy5jaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkZXNjAAAAAAAAAC5JRUMgNjE5NjYtMi4xIERlZmF1bHQgUkdCIGNvbG91ciBzcGFjZSAtIHNSR0IAAAAAAAAAAAAAAC5JRUMgNjE5NjYtMi4xIERlZmF1bHQgUkdCIGNvbG91ciBzcGFjZSAtIHNSR0IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGVzYwAAAAAAAAAsUmVmZXJlbmNlIFZpZXdpbmcgQ29uZGl0aW9uIGluIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAALFJlZmVyZW5jZSBWaWV3aW5nIENvbmRpdGlvbiBpbiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHZpZXcAAAAAABOk/gAUXy4AEM8UAAPtzAAEEwsAA1yeAAAAAVhZWiAAAAAAAEwJVgBQAAAAVx/nbWVhcwAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAo8AAAACc2lnIAAAAABDUlQgY3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAoAC0AMgA3ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKQAqQCuALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4CmAKiAqwCtgLBAssC1QLgAusC9QMAAwsDFgMhAy0DOANDA08DWgNmA3IDfgOKA5YDogOuA7oDxwPTA+AD7AP5BAYEEwQgBC0EOwRIBFUEYwRxBH4EjASaBKgEtgTEBNME4QTwBP4FDQUcBSsFOgVJBVgFZwV3BYYFlgWmBbUFxQXVBeUF9gYGBhYGJwY3BkgGWQZqBnsGjAadBq8GwAbRBuMG9QcHBxkHKwc9B08HYQd0B4YHmQesB78H0gflB/gICwgfCDIIRghaCG4IggiWCKoIvgjSCOcI+wkQCSUJOglPCWQJeQmPCaQJugnPCeUJ+woRCicKPQpUCmoKgQqYCq4KxQrcCvMLCwsiCzkLUQtpC4ALmAuwC8gL4Qv5DBIMKgxDDFwMdQyODKcMwAzZDPMNDQ0mDUANWg10DY4NqQ3DDd4N+A4TDi4OSQ5kDn8Omw62DtIO7g8JDyUPQQ9eD3oPlg+zD88P7BAJECYQQxBhEH4QmxC5ENcQ9RETETERTxFtEYwRqhHJEegSBxImEkUSZBKEEqMSwxLjEwMTIxNDE2MTgxOkE8UT5RQGFCcUSRRqFIsUrRTOFPAVEhU0FVYVeBWbFb0V4BYDFiYWSRZsFo8WshbWFvoXHRdBF2UXiReuF9IX9xgbGEAYZRiKGK8Y1Rj6GSAZRRlrGZEZtxndGgQaKhpRGncanhrFGuwbFBs7G2MbihuyG9ocAhwqHFIcexyjHMwc9R0eHUcdcB2ZHcMd7B4WHkAeah6UHr4e6R8THz4faR+UH78f6iAVIEEgbCCYIMQg8CEcIUghdSGhIc4h+yInIlUigiKvIt0jCiM4I2YjlCPCI/AkHyRNJHwkqyTaJQklOCVoJZclxyX3JicmVyaHJrcm6CcYJ0kneierJ9woDSg/KHEooijUKQYpOClrKZ0p0CoCKjUqaCqbKs8rAis2K2krnSvRLAUsOSxuLKIs1y0MLUEtdi2rLeEuFi5MLoIuty7uLyQvWi+RL8cv/jA1MGwwpDDbMRIxSjGCMbox8jIqMmMymzLUMw0zRjN/M7gz8TQrNGU0njTYNRM1TTWHNcI1/TY3NnI2rjbpNyQ3YDecN9c4FDhQOIw4yDkFOUI5fzm8Ofk6Njp0OrI67zstO2s7qjvoPCc8ZTykPOM9Ij1hPaE94D4gPmA+oD7gPyE/YT+iP+JAI0BkQKZA50EpQWpBrEHuQjBCckK1QvdDOkN9Q8BEA0RHRIpEzkUSRVVFmkXeRiJGZ0arRvBHNUd7R8BIBUhLSJFI10kdSWNJqUnwSjdKfUrESwxLU0uaS+JMKkxyTLpNAk1KTZNN3E4lTm5Ot08AT0lPk0/dUCdQcVC7UQZRUFGbUeZSMVJ8UsdTE1NfU6pT9lRCVI9U21UoVXVVwlYPVlxWqVb3V0RXklfgWC9YfVjLWRpZaVm4WgdaVlqmWvVbRVuVW+VcNVyGXNZdJ114XcleGl5sXr1fD19hX7NgBWBXYKpg/GFPYaJh9WJJYpxi8GNDY5dj62RAZJRk6WU9ZZJl52Y9ZpJm6Gc9Z5Nn6Wg/aJZo7GlDaZpp8WpIap9q92tPa6dr/2xXbK9tCG1gbbluEm5rbsRvHm94b9FwK3CGcOBxOnGVcfByS3KmcwFzXXO4dBR0cHTMdSh1hXXhdj52m3b4d1Z3s3gReG54zHkqeYl553pGeqV7BHtje8J8IXyBfOF9QX2hfgF+Yn7CfyN/hH/lgEeAqIEKgWuBzYIwgpKC9INXg7qEHYSAhOOFR4Wrhg6GcobXhzuHn4gEiGmIzokziZmJ/opkisqLMIuWi/yMY4zKjTGNmI3/jmaOzo82j56QBpBukNaRP5GokhGSepLjk02TtpQglIqU9JVflcmWNJaflwqXdZfgmEyYuJkkmZCZ/JpomtWbQpuvnByciZz3nWSd0p5Anq6fHZ+Ln/qgaaDYoUehtqImopajBqN2o+akVqTHpTilqaYapoum/adup+CoUqjEqTepqaocqo+rAqt1q+msXKzQrUStuK4trqGvFq+LsACwdbDqsWCx1rJLssKzOLOutCW0nLUTtYq2AbZ5tvC3aLfguFm40blKucK6O7q1uy67p7whvJu9Fb2Pvgq+hL7/v3q/9cBwwOzBZ8Hjwl/C28NYw9TEUcTOxUvFyMZGxsPHQce/yD3IvMk6ybnKOMq3yzbLtsw1zLXNNc21zjbOts83z7jQOdC60TzRvtI/0sHTRNPG1EnUy9VO1dHWVdbY11zX4Nhk2OjZbNnx2nba+9uA3AXcit0Q3ZbeHN6i3ynfr+A24L3hROHM4lPi2+Nj4+vkc+T85YTmDeaW5x/nqegy6LzpRunQ6lvq5etw6/vshu0R7ZzuKO6070DvzPBY8OXxcvH/8ozzGfOn9DT0wvVQ9d72bfb794r4Gfio+Tj5x/pX+uf7d/wH/Jj9Kf26/kv+3P9t////7gAmQWRvYmUAZMAAAAABAwAVBAMGCg0AAA3+AAAOHwAADlAAAA5x/9sAhAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAgICAgICAgICAgIDAwMDAwMDAwMDAQEBAQEBAQIBAQICAgECAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP/wgARCAAIACADAREAAhEBAxEB/8QAdQAAAwEAAAAAAAAAAAAAAAAABgcICQEAAwEBAAAAAAAAAAAAAAAABgcIAQoQAQAAAAAAAAAAAAAAAAAAACARAQAAAAAAAAAAAAAAAAAAACASAQAAAAAAAAAAAAAAAAAAACATAQAAAAAAAAAAAAAAAAAAACD/2gAMAwEAAhEDEQAAAWRccGQU8N055yH0GCZl/9oACAEBAAEFAh//2gAIAQIAAQUCH//aAAgBAwABBQIf/9oACAECAgY/Ah//2gAIAQMCBj8CH//aAAgBAQEGPwIf/9oACAEBAwE/IR//2gAIAQIDAT8hH//aAAgBAwMBPyEf/9oADAMBAAIRAxEAABDQP//aAAgBAQMBPxAf/9oACAECAwE/EB//2gAIAQMDAT8QH//Z');

	return {
		setup: setup,
		reset: reset,
		plot: plot,
		render: render,
		update: update,
		updateSingleFrame: updateSingleFrame,
		updateNow: updateNow,
		clearReadyState: clearReadyState,
		clearDisplay: clearDisplay,
		setWidth: setWidth,
		getDataURL: getDataURL,
		setSustain: setSustain,
		resetSustain: resetSustain,
		getSustain: getSustain,
		getDefaultSustain: getDefaultSustain,
		setBlurLevels: setBlurLevels,
		getBlurLevels: getBlurLevels,
		resetBlurLevels: resetBlurLevels,
		getDefaultBlurLevels: getDefaultBlurLevels,
		useElectrostatics: useElectrostatics,
		usesElectrostatics: usesElectrostatics
	};

};

var SymGen = new function() {
/*
 implementing an original 1964 PDP-1 soft symbol generator, 5 x 7 matrix
 compare http://archive.computerhistory.org/resources/text/DEC/pdp-1/DEC.pdp_1.102636251.pdf

 symbols are drawn at a variable unit size and are encoded by two 18-bit words each.
 encoding: lefthand (L) and righthand (R) word, bit = 0 (MSB) .. 17 (LSB),
 L0 (sign-bit of first word) indicates a vertical drop by 2 units (for lower-case descenders):

	L7   L14 |  R3  R10  R17
	L6   L13 |  R2   R9  R16
	L5   L12 |  R1   R8  R15
	L4   L11 |  R0   R7  R14
	L3   L10   L17 | R6  R13
	L2    L9   L16 | R5  R12
	L1    L8   L15 | R4  R11
*/

var decoderMatrix = [
	// data to screen location assignment by [word-index, bit-mask]
	//  col 0        col 1        col 2        col 3        col 4
	[[0,  02000], [0,    010], [1, 040000], [1,   0200], [1,     01]], // row 0
	[[0,  04000], [0,    020], [1,0100000], [1,   0400], [1,     02]], // row 1
	[[0, 010000], [0,    040], [1,0200000], [1,  01000], [1,     04]], // row 2
	[[0, 020000], [0,   0100], [1,0400000], [1,  02000], [1,    010]], // row 3
	[[0, 040000], [0,   0200], [0,     01], [1,  04000], [1,    020]], // row 4
	[[0,0100000], [0,   0400], [0,     02], [1, 010000], [1,    040]], // row 5
	[[0,0200000], [0,  01000], [0,     04], [1, 020000], [1,   0100]]  // row 6
];

var data = {
	' ':[0,0],
	'1':[027,0740000],
	'2':[0305214,0462306],
	'3':[0105014,0462266],
	'4':[036100,0437610],
	'5':[0137114,0462261],
	'6':[0175114,0462262],
	'7':[03610,0441203],
	'8':[0155114,0462266],
	'9':[015114,0452236],
	'0':[0175014,060276],
	'/':[0100200,0401002],
	's':[0221245,0211000],
	't':[010764,0211000],
	'u':[0171004,037000],
	'v':[070404,010034],
	'w':[0171003,020074],
	'x':[0210501,012104],
	'y':[0417104,0417600],
	'z':[0211445,0223104],
	',':[0500200,0],
	'\u00b7':[0,0400000], //middot
	'j':[0501004,0217200],
	'k':[0376202,0421000],
	'l':[01774,0],
	'm':[0370047,0401170],
	'n':[0370040,0236000],
	'o':[0161044,0216000],
	'p':[0776110,0441400],
	'q':[0414110,0477640],
	'r':[0370040,0202000],
	'-':[020100,0402010],
	')':[01012,0107000],
	'\\':[02010,040201], //upper stroke
	'(':[0342,0120200],
	'a':[0161044,0237100],
	'b':[0377104,0414000],
	'c':[0161044,0212000],
	'd':[0161044,0237600],
	'e':[0161245,0226000],
	'f':[021760,0440400],
	'g':[0415114,0457600],
	'h':[0376100,0434000],
	'i':[07,0500000],
	'.':[04,0],
	'"':[030,0600],
	'\'':[0,0140000],
	'~':[04010,040401],
	'\u2283':[0104422,0110434], //implies, superset
	'\u222a':[070402,010034], //union
	'\u2229':[070020,0100434], //intersection
	'<':[020242,0120200],
	'>':[01012,0105010],
	'\u2191':[010027,0740404], //up arrow
	'\u2192':[020102,0507010], //right arrow
	'?':[04015,042206],
	'S':[0115114,0462262],
	'T':[02017,0740201],
	'U':[0177004,020077],
	'V':[076404,010037],
	'W':[0177003,020077],
	'X':[0306240,0405143],
	'Y':[06047,0401003],
	'Z':[0303214,0461303],
	'=':[050241,0205024],
	'_':[0601004,020100],
	'J':[0101004,020077],
	'K':[0376101,0210501],
	'L':[0377004,020100],
	'M':[0376020,0200577],
	'N':[0376040,0404177],
	'O':[0175014,060276],
	'P':[0376110,0442206],
	'Q':[0175015,050336],
	'R':[0376111,0452306],
	'+':[020103,0702010],
	']':[01014,077600],
	'|':[07,0740000],
	'[':[01774,060200],
	'A':[0370221,044574],
	'B':[0377114,0462266],
	'C':[0175014,060242],
	'D':[0377014,060276],
	'E':[0377114,0462301],
	'F':[0376110,0442201],
	'G':[0175015,064262],
	'H':[0376100,0402177],
	'I':[01017,0760200],
	'\u00d7':[0104240,0405042], //times,
	'\u21d2':[051253,0305010], //pointer (=>)
	':':[0440,0], //not in original
	';':[0500220,0], //not in original
	'!':[05,0740000], //not in original
	'&':[0155114,054520], //not in original
	'#':[051771,0237624] //not in original
},
synonyms = {
	'}': '\u2283', // implies
	'^': '\u2191', // up arrow
	'`': '\u2192', // right arrow
	'@': '\u00B7', // mid-dot
	'*': '\u00d7', // times
	'\u2227': '\u222a', // or => union
	'\u2228': '\u2229'  // and => interscetion
};

	function write(x, y, txt, size, brightness, optCenter) {
		if (!txt) return;
		if (!size) size=1;
		if (!brightness) brightness=0;
		if (optCenter) x-=Math.floor(txt.length/2)*size*7;
		for (var i=0; i<txt.length; i++) {
			var c=txt.charAt(i);
			if (c!==' ') {
				var d=data[c] || data[synonyms[c]] || data['\\'];
				// d[0] sign-bit (bit 17) indicates vertical drop by two units
				for (var k=0, cy=(d[0]&0400000)? y+size*2:y; k<7; k++, cy+=size) {
					var mk=decoderMatrix[k];
					for (var n=0, cx=x; n<5; n++, cx+=size) {
						var m=mk[n];
						if (d[m[0]] & m[1]) CRT.plot(cx, cy, brightness, true);
					}
				}
			}
			x+=size*7;
		}
	}

	function getTextWidth(txt, size) {
		if (!txt) return 0;
		if (!size) size=1;
		return txt.length*size*7;
	}


/*
 additionally, draw spacewar-style symmetrical outlines, mirrored by the vertical axis,
 encoded by a stream of triplets in 18-bit words.
 - move & plot codes:
	0,1: down, 2: outwards, 3: down & outwards 4: inwards, 5: down & inwards
 - control codes:
	6: store/restore position (toggle)
	7: end of outline; draw flipped second side, exit on second pass
*/

	// spacewar ship outlines (needle, wedge)
	var spcwarOutlines = [
		[
			0111131,
			0111111,
			0111111,
			0111163,
			0311111,
			0146111,
			0111114,
			0700000
		],
		[
			0013113,
			0113111,
			0116313,
			0131111,
			0161151,
			0111633,
			0365114,
			0700000
		]
	];

	// draw an outline (index or custom array) at x/y at given unit size and brightness
	function drawOutline(x, y, outline, size, brightness) {
		var words;
		switch (typeof outline) {
			case 'number':
				words=spcwarOutlines[outline];
				break;
			case 'object':
				if (outline.length) words=outline;
				break;
		}
		if (!words) return;
		if (!size) size=1;
		if (!brightness) brightness=0;
		var x0=x, y0=y, mx, my, mf=false,
			cursor=0, wrd=words[cursor], bitOfs=15,
			dx=size, pass=1;
		while (pass>=0) {
			var triplet=(wrd >> bitOfs) & 7;
			switch(triplet) {
				case 0:
				case 1:
					y+=size;
					break;
				case 2:
					x+=dx;
					break;
				case 3:
					x+=dx;
					y+=size;
					break;
				case 4:
					x-=dx;
					break;
				case 5:
					x-=dx;
					y+=size;
					break;
				case 6:
					if (mf) {
						x=mx;
						y=my;
					}
					else {
						mx=x;
						my=y;
					}
					mf=!mf;
					break;
				case 7:
					if (pass==1) {
						dx=-dx;
						x=x0;
						y=y0;
						cursor=0;
						bitOfs=15;
						wrd=words[cursor]
						mf=false;
					}
					pass--;
					continue;
			}
			if (triplet<6) CRT.plot(x, y, brightness, true);
			if (bitOfs>=3) {
				bitOfs-=3;
			}
			else {
				bitOfs=15;
				wrd=words[++cursor];
				if (!wrd) break;
			}
		}
	}
	
	return {
		'write': write,
		'getTextWidth': getTextWidth,
		'drawOutline': drawOutline
	};

};


// external glue

function getSenseSwitchLabels(i) {
	if (module && module.senseSwitchLabels && module.senseSwitchLabels[i]) {
		return [
			String(i)+': '+(module.senseSwitchLabels[i][0] || defaultSenseSwitchLabels[i][0]),
			module.senseSwitchLabels[i][1] || defaultSenseSwitchLabels[i][1],
			String(i)+'&nbsp; '+(module.senseSwitchLabels[i][2] || defaultSenseSwitchLabels[i][2])
		];
	}
	else {
		return [
			String(i)+': '+defaultSenseSwitchLabels[i][0], defaultSenseSwitchLabels[i][1],
			String(i)+'&nbsp; '+defaultSenseSwitchLabels[i][2]
		];
	}
}

function setTW5IndicatorDisplay(v) {
	var el=document.getElementById(tw5indicatorId);
	if (el) {
		el.style.display = (v)? 'block':'none';
		if (v) setTW5IndicatorValue();
	}
}

function setTW5IndicatorValue() {
	var el=document.getElementById(tw5indicatorId);
	if (el) el.className= (PDP1.getTestword()&040)? tw5IndicatorClassHi:tw5IndicatorClassLo;
}

function toggleTW5() {
	// toggle bit 5 of test-word (switch 6) for scorer
	var v=!(PDP1.getTestword()&040);
	PDP1.setTestword(040, v);
	setTW5IndicatorValue();
}

function resetTW5() {
	PDP1.setTestword(040, false);
	setTW5IndicatorValue();
}

function showRestartButton(v) {
	var el= document.getElementById(restartButtonId);
	if (el) el.style.display = (v)? 'block':'none';
}

function setSubpixelRendering(v) {
	var changed=(emulateSubpixels!=v);
	emulateSubpixels = Boolean(v);
	crtAliasing = (moduleSubpixels && emulateSubpixels);
	if (changed && gameState==gameStates.service) displayServiceScreen();
}

function getSubpixelRenderingState() {
	return [!useHighRes && moduleSubpixels, emulateSubpixels];
}

function isSingleResOnly() {
	return singleResOnly;
}

function getScorerButtonState() {
	return [module && module.scorer, Boolean(PDP1.getTestword()&040)];
}

function getMemory(a,e) {
	if (!e || isNaN(e)) e=07777;
	if (!a || isNaN(a)) a=0;
	return PDP1.getMemRange(a,e);
}

function getConfiguration() {
	if (!module) return null;
	var fullid=module.id,
		p= fullid.split(':'),
		id=p[0],
		idparam=id,
		tw=PDP1.getTestword(),
		sense=[], ss='';
	for (var i=1; i<7; i++) {
		if (PDP1.getSense(i)) sense.push(i);
	}
	if (sense.length) ss=sense.join(',');
	if (!singleResOnly && p[1] && p[1].toLowerCase()=='hr') idparam+=':hr';
	if (tw==module.testword) tw=0;
	return {
		id: id,
		fullid: fullid,
		idparam: idparam,
		sense: ss,
		testword: tw
	};
}

// stop/restart game related to hidden tab states

var visibilityHidden, visibilityChangeEvent;

function enableVisibilityChangeDetection() {
	if (visibilityHidden) return;
	if (typeof document.hidden!=='undefined') {
		visibilityHidden='hidden';
		visibilityChangeEvent='visibilitychange';
	}
	else if (typeof document.mozHidden!=='undefined') {
		visibilityHidden='mozHidden';
		visibilityChangeEvent='mozvisibilitychange';
	}
	else if (typeof document.msHidden!=='undefined') {
		visibilityHidden='msHidden';
		visibilityChangeEvent='msvisibilitychange';
	}
	else if (typeof document.webkitHidden!=='undefined') {
		visibilityHidden='webkitHidden';
		visibilityChangeEvent='webkitvisibilitychange';
	}
	if (visibilityHidden) document.addEventListener(visibilityChangeEvent, handleVisibilityChange, false);
}

function disableVisibilityChangeDetection() {
	if (visibilityHidden) document.removeEventListener(visibilityChangeEvent, handleVisibilityChange);
	visibilityHidden='';
}

function handleVisibilityChange() {
	if (document[visibilityHidden]) {
		if (timer) clearTimeout(timer);
	}
	else {
		framesMissed=estaticCntr=0;
		if (timer) clearTimeout(timer);
		switch (gameState) {
			case gameStates.splash: timer=setTimeout(splashLoop,1); break;
			case gameStates.run: timer=setTimeout(gameLoop,1); break;
		}
	}
}

// export a public API
return {
	start: start,
	stop: stop,
	resume: resume,
	reset: reset,
	// (explanatory) synonyms
	abort: reset,
	restart: restart,
	setup: start,
	halt: halt,
	// code modules
	load: ModuleManager.load,
	select: selectModule,
	getCodeMenu: ModuleManager.getCodeMenu,
	// sense switches
	setSense: PDP1.setSense,
	getSense: PDP1.getSense,
	// emulation characteristics
	setHighSpeedMode: setHighSpeedMode,
	getHighSpeedMode: getHighSpeedMode,
	// service screen
	displayServiceScreen: displayServiceScreen,
	// controls
	setKeyLang: KeyManager.setLang,
	getKeyLang: KeyManager.getLang,
	setControlBits: setControlBits,
	clearControlBits: clearControlBits,
	setHighResMode: setHighResMode,
	getHighResMode: getHighResMode,
	getSenseSwitchLabels: getSenseSwitchLabels,
	toggleTW5: toggleTW5,
	isSingleResOnly: isSingleResOnly,
	getScorerButtonState: getScorerButtonState,
	getParams: getSpacewarParams,
	resetParams: resetSpacewarParams,
	setParams: setSpacewarParams,
	setParam: setSpacewarParam,
	setEmulationSpeed: setEmulationSpeed,
	getEmulationSpeed: getEmulationSpeed,
	setPC: PDP1.setPC,
	getMemory: getMemory,
	setTestword: PDP1.setTestword,
	getTestword: PDP1.getTestword,
	// CRT sustain factor (0 >= n >= 1)
	setCRTSustain: CRT.setSustain,
	resetCRTSustain: CRT.resetSustain,
	getCRTSustain: CRT.getSustain,
	getCRTDefaultSustain: CRT.getDefaultSustain,
	// CRT blur levels (2 => n >= 8)
	setCRTBlurLevels: CRT.setBlurLevels,
	getCRTBlurLevels: CRT.getBlurLevels,
	resetCRTBlurLevels: CRT.resetBlurLevels,
	getCRTDefaultBlurLevels: CRT.getDefaultBlurLevels,
	// CRT subpixel emulation
	setSubpixelRendering: setSubpixelRendering,
	getSubpixelRenderingState: getSubpixelRenderingState,
	lockElectrostatics: lockElectrostatics,
	getConfiguration: getConfiguration,
	// inhibit left+right keypress (single-button hyperspace)
	getHSLock: KeyManager.getHSLock,
	setHSLock: KeyManager.setHSLock,
	gamepadsSupported: GamepadManager.supported,
	gamepadsEnabled: GamepadManager.isEnabled,
	gamepadsEnable: GamepadManager.enable,
	resetScores: resetScores
};
})();

// GUI
var PDP1GUI = (function() {
	var contentLoaded=false, pageLoaded=false, started=false, dialogVisible=false,
		isTouch=false, isMSTouch=false, isMobileTouch=false, evntTouchStart, evntTouchEnd, evntTouchMove, evntTouchCancel, buttonTouches, touchControlsVisible=false, moduleHasControllers=true, onReadyQueue=[];
	function isCompatible() {
		if (!document.addEventListener || !document.createElement) return false;
		var canvas = document.createElement('canvas');
		if (!canvas || !canvas.getContext) return false;
		return true;
	}
	function initSpacewar() {
		var btn, el, select;
		if (started || contentLoaded) return;
		contentLoaded=true;
		btn=document.getElementById('reset');
		if (btn) {
			btn.addEventListener('click', resetBtnHandler, false);
			btn.style.cursor='pointer';
		}
		select=document.getElementById('spacewarCodeSelect');
		if (select) {
			PDP1Engine.getCodeMenu(select);
			select.onchange=versionSelectHandler;
		}
		select=document.getElementById('keyboardSelect');
		if (select) select.selectedIndex=0;
		el=document.getElementById('crtPopupTrigger');
		if (el) el.style.display='block';
		if (!isTouch) {
			evntTouchStart='mousedown';
			evntTouchEnd='mouseup';
			evntTouchMove='mousemove';
			evntTouchCancel='mouseup';
			if (self.location.search.indexOf('?touch')==0) isTouch=true;
		}
		if (isMobileTouch) {
			toggleTouchControls();
			el=document.getElementById('fullscreenToggle');
			if (el) el.style.display='none';
		}
		else observeFullscreen();
		if (!pageLoaded) {
			setTimeout(pageOnLoad, 8000);
		}
	}
	function versionSelectHandler(event) {
		toolsMenuClose();
		if (this.selectedIndex>=0) {
			PDP1Engine.select(this.options[this.selectedIndex].value);
		}
		if (this.blur) this.blur();
	}
	function toggleTouchControls() {
		if (!touchControlsVisible) {
			if (moduleHasControllers) showTouchControls(true);
			touchControlsVisible=true;
		}
		else {
			if (moduleHasControllers) showTouchControls(false);
			touchControlsVisible=false;
		}
	}
	function showTouchControls(v) {
		var el1=document.getElementById('touchControlWedge'),
			el2=document.getElementById('touchControlNeedle');
		if (v) {
			if (el1 && el2) {
				el1.style.display=el2.style.display='block';
			}
			else {
				setupTouchControls();
			}
		}
		else {
			if (el1 && el2) el1.style.display=el2.style.display='none';
		}
	}
	function autoShowTouchControls(v) {
		if (!v) {
			if (moduleHasControllers && touchControlsVisible) showTouchControls(false);
		}
		else {
			if (!moduleHasControllers && touchControlsVisible) showTouchControls(true);
		}
		moduleHasControllers=Boolean(v);
	}
	function setupTouchControls() {
		buttonTouches={};
		var codes=[010,04,01,02, 0400000,0200000,040000,0100000];
		var labels=['LEFT', 'RIGHT', 'FIRE', 'THRUST'];
		var e1=document.createElement('div');
		var e2=document.createElement('div');
		var box, btn, label;
		e1.id='touchControlWedge';
		e2.id='touchControlNeedle';
		e1.className=e2.className='touchControl';
		for (var i=0; i<2; i++) {
			box=document.createElement('div');
			box.className='touchButtonBox';
			btn=document.createElement('div');
			btn.className='touchButton';
			btn.id=(i==0)?'touchButtonWedge':'touchButtonNeedle';
			box.appendChild(btn);
			label=document.createElement('div');
			label.className='touchButtonLabel touchButtonLabelDrag';
			label.innerHTML='MOVE';
			box.appendChild(label);
			((i==0)? e1:e2).appendChild(box);
			btn.addEventListener(evntTouchStart, new buttonTouchHandlerFactory(i-2), false);
		}
		for (var i=0; i<8; i++) {
			box=document.createElement('div');
			box.className='touchButtonBox';
			if (i%4==2) box.className+=' touchButtonBoxSpaceBefore';
			btn=document.createElement('div');
			btn.className='touchButton';
			box.appendChild(btn);
			label=document.createElement('div');
			label.className='touchButtonLabel';
			label.innerHTML=labels[i%4];
			box.appendChild(label);
			((i<4)? e1:e2).appendChild(box);
			btn.addEventListener(evntTouchStart, new buttonTouchHandlerFactory(codes[i]), false);
		}
		var b=document.getElementsByTagName('body')[0];
		b.appendChild(e1);
		b.appendChild(e2);
		e1.addEventListener(evntTouchStart, buttonTouchEndHandler, false);
		e2.addEventListener(evntTouchStart, buttonTouchEndHandler, false);
		e1.addEventListener(evntTouchEnd, buttonTouchEndHandler, false);
		e1.addEventListener(evntTouchCancel, buttonTouchEndHandler, false);
		e2.addEventListener(evntTouchEnd, buttonTouchEndHandler, false);
		e2.addEventListener(evntTouchCancel, buttonTouchEndHandler, false);
		if (window.orientation && Math.abs(window.orientation)==90) {
			var dx=window.innerWidth-b.scrollWidth;
			if (dx<0) window.scrollTo(Math.floor(-dx/2), 0);
		}
	}
	function resolveTouchAPI() {
		isTouch=Boolean(typeof window.ontouchstart!=='undefined'
			|| (document.documentElement && typeof document.documentElement.ontouchstart!=='undefined')
			|| isTouchDeviceByEvent());
		if (window.navigator.msPointerEnabled) {
			if (navigator.msMaxTouchPoints>0) {
				isTouch=true;
				isMSTouch=true;
				evntTouchStart='MSPointerDown';
				evntTouchEnd='MSPointerUp';
				evntTouchMove='MSPointerMove';
				evntTouchCancel='MSPointerCancel';
			}
			else {
				isTouch=false;
			}
		}
		else if (window.navigator.pointerEnabled) {
			if (navigator.maxTouchPoints>0) {
				isTouch=true;
				isMSTouch=true;
				evntTouchStart='pointerdown';
				evntTouchEnd='pointerup';
				evntTouchMove='pointermove';
				evntTouchCancel='pointercancel';
			}
			else {
				isTouch=false;
			}
		}
		else {
			isMSTouch=false;
			if (isTouch) {
				evntTouchStart='touchstart';
				evntTouchEnd='touchend';
				evntTouchMove='touchmove';
				evntTouchCancel='touchcancel';
			}
		}
		isMobileTouch = (isTouch && navigator.userAgent.match(/(Mobile|iPhone|iPad|iPod|Android|iOS)/i));
	}
	function isTouchDeviceByEvent() {
	   try {
	   	var el=document.createElement('div');
	   	el.setAttribute('ongesturestart', 'return;');
	   }
	   catch(e) {}
	   return (typeof el.ongesturestart == "function");
	}
	function cancelTouchEvent(e) {
		if (e.preventDefault) e.preventDefault();
		if (e.stopPropagation) e.stopPropagation();
		if (event.preventManipulation) event.preventManipulation();
		if (event.preventMouseEvent) event.preventMouseEvent();
		e.cancelBubble=true;
		e.returnValue=false;
	}
	function buttonTouchHandlerFactory(code) {
		return function(event) { buttonTouchHandler(event, code); }
	}
	function buttonTouchHandler(event, code) {
		var id, x, y, touchIds=new Array();
		if (event.touches) {
			for (var i=0; i<event.changedTouches.length; i++) {
				var t=event.changedTouches[i];
				id=t.identifier;
				if (!buttonTouches[id]) {
					touchIds.push(id);
					if (code<0) {
						x=t.pageX;
						y=t.pageY;
					}
				}
			}
		}
		else {
			id=event.pointerId || 1;
			if (!buttonTouches[id]) {
				touchIds.push(id);
				if (code<0) {
					x=event.pageX;
					y=event.pageY;
				}
			}
		}
		if (touchIds.length) {
			if (code<0) {
				var pn=document.getElementById((code==-2)? 'touchControlWedge':'touchControlNeedle');
				document.addEventListener(evntTouchMove, touchMoveControls, false);
				for (var i=0; i<touchIds.length; i++) {
					buttonTouches[touchIds[i]]={code: code, x0: x, y0: y, left: pn.offsetLeft, top: pn.offsetTop};
				}
			}
			else {
				PDP1Engine.setControlBits(code);
				for (var i=0; i<touchIds.length; i++) {
					buttonTouches[touchIds[i]]={code: code};
				}
			}
		}
		cancelTouchEvent(event);
	}
	function buttonTouchEndHandler(event) {
		var id, touchIds=new Array();
		if (event.touches) {
			for (var i=0; i<event.changedTouches.length; i++) {
				id=event.changedTouches[i].identifier;
				if (buttonTouches[id]) touchIds.push(id);
			}
		}
		else {
			id=event.pointerId || 1;
			if (buttonTouches[id]) touchIds.push(id);
		}
		for (var i=0; i<touchIds.length; i++) {
			var td=buttonTouches[touchIds[i]];
			if (td) {
				if (td.code<0) {
					var pn=document.getElementById((td.code==-2)? 'touchControlWedge':'touchControlNeedle');
					document.removeEventListener(evntTouchMove, touchMoveControls, false);
				}
				else {
					PDP1Engine.clearControlBits(td.code);
				}
				delete buttonTouches[touchIds[i]];
			}
		}
		cancelTouchEvent(event);
	}
	function touchMoveControls(event) {
		var id, x, y, touchIds=new Array();
		if (event.touches) {
			for (var i=0; i<event.changedTouches.length; i++) {
				var t=event.changedTouches[i];
				id=t.identifier;
				if (buttonTouches[id] && buttonTouches[id].code<0) {
					touchIds.push(id);
					x=t.pageX;
					y=t.pageY;
				}
			}
		}
		else {
			id=event.pointerId || 1;
			if (buttonTouches[id] && buttonTouches[id].code<0) {
				touchIds.push(id);
				x=event.pageX;
				y=event.pageY;
			}
		}
		for (var i=0; i<touchIds.length; i++) {
			var td=buttonTouches[touchIds[i]];
			if (td && td.code<0) {
				var pn=document.getElementById((td.code==-2)? 'touchControlWedge':'touchControlNeedle');
				pn.style.top=td.top+(y-td.y0)+'px';
				if (td.code==-2) {
					pn.style.left=td.left+(x-td.x0)+'px';
				}
				else {
					pn.style.right=pn.parentNode.offsetWidth-(td.left+(x-td.x0))-pn.offsetWidth+'px'
				}
			}
		}
		cancelTouchEvent(event);
	}
	function pageOnLoad() {
		pageLoaded=true;
		if (!started) {
			// extract any settings from URL
			var id, tw=0;
			if (self.location && (self.location.search || self.location.hash)) {
				var switches=[], search = self.location.search || self.location.hash, parts=search.substring(1).split('&');
				for (var i=0; i<parts.length; i++) {
					var pair=parts[i].split('='), k=pair[0].toLowerCase(), v=pair[1];
					if (k && v) {
						switch (k) {
							case 'v':
							case 'vers':
							case 'version':
								id=getModuleId(v);
								break;
							case 's':
							case 'ss':
							case 'ssw':
							case 'switch':
							case 'switches':
							case 'sense':
							case 'senseswitch':
							case 'senseswitches':
								var ss=v.split(/[,:;]/);
								for (var j=0; j<ss.length; j++) {
									var s=ss[j];
									if (s.match(/^[1-6]$/)) switches.push(parseInt(s,10));
								}
								break;
							case 'keys':
							case 'lang':
								PDP1Engine.setKeyLang(v.toLowerCase());
								break;
							case 'sustain':
							case 'trails':
								if (v.match(/^([0-9]{1,2}|100)$/)) {
									PDP1Engine.setCRTSustain(parseFloat(v)/100);
								}
								else if (v.match(/^(0\.[0-9]+|1\.0+)$/)) {
									PDP1Engine.setCRTSustain(v);
								}
								break;
							case 'tw':
							case 'testword':
								if (v.match(/^[0-7]+$/)) tw=parseInt(v,8)&0777777;
								break;
							case 'gamepads':
								PDP1Engine.gamepadsEnable(!v.match(/^(0|f(alse)?|no?)$/i));
								break;
						}
					}
				}
			}
			// handle any external startup tasks
			for (var i=0; i<onReadyQueue.length; i++) {
				if (typeof onReadyQueue[i] == 'function') onReadyQueue[i]();
			}
			// start it
			if (id) {
				for (var i=0; i<switches.length; i++) PDP1Engine.setSense(switches[i], true);
				PDP1Engine.start(id);
			}
			else {
				PDP1Engine.start();
			}
			if (tw) {
				PDP1Engine.setTestword(0777777, false);
				PDP1Engine.setTestword(tw, true);
				updateTestword(tw);
			}
			initToolsMenu();
			started=true;
		}
	}
	function selectModule(v) {
		toolsMenuClose();
		var id=getModuleId(v);
		if (id) {
			PDP1Engine.select(id);
			return true;
		}
		else {
			return false;
		}
	}
	var versionsMap = { // provide compatibilty to former links
		'spacewar2x': 'spacewar2b',
		'spacewar4.2': 'spacewar4.2a',
		'spacewar4.3f': 'spacewar2015'
	};
	function getModuleId(v) {
		var id, el=document.getElementById('spacewarCodeSelect');
		if (!el) return;
		v=v.toLowerCase().replace(/[^a-z0-9_\.:]/g, '_');
		if (v.match(/^[0-9](\.[0-9]|[a-z])/i)) v='spacewar'+v;
		if (PDP1Engine.isSingleResOnly()) {
			v=v.replace(/:.*/, '').replace(/^(spacewar3\.1)_sr$/,'$1');
		}
		else {
			v=v.replace(/:low?res$/, ':lr').replace(/:hi(gh)?res$/, ':hr');
			if (!v.match(/:(hr|lr)$/)) v+=':lr';
			v=v.replace(/^(spacewar3\.1)_sr(:.*)?$/, '$1$2');
		}
		var parts = v.split(':'); // remap old ids
		if (versionsMap[parts[0]]) {
			parts[0]=versionsMap[parts[0]]; 
			v=parts.join(':');
		}
		for (var j=0; j<el.options.length; j++) {
			if (el.options[j].value==v) {
				id=v;
				el.selectedIndex=j;
				break;
			}
		}
		return id;
	}
	function resetBtnHandler(e) {
		if (dialogVisible) hideSenseSwitchDialog();
		PDP1Engine.displayServiceScreen();
		if (isTouch) buttonTouches={};
	}
	function setSenseSwitch(n, v) {
		PDP1Engine.setSense(n,v);
	}
	function setHighSpeedMode(v) {
		PDP1Engine.setHighSpeedMode(v);
	}
	function setEmulationSpeed(v) {
		PDP1Engine.setEmulationSpeed(v);
	}
	function setKeyLang(v) {
		PDP1Engine.setKeyLang(v);
	}
	// sense switch dialog
	function showSenseSwitchDialog(e) {
		PDP1Engine.halt();
		PDP1Engine.lockElectrostatics(true);
		document.getElementById('senseSwitchDialogWrapper').style.display='block';
		for (var i=1; i<7; i++) {
			var labels=PDP1Engine.getSenseSwitchLabels(i);
			document.getElementById('cbxSenseSwitch'+i).checked=PDP1Engine.getSense(i);
			document.getElementById('lblSenseSwitch'+i).innerHTML = labels[0];
			document.getElementById('cmtSenseSwitch'+i).innerHTML = labels[1];
		}
		var el=document.getElementById('keyboardSelect'),
			opts=el.options,
			lang=PDP1Engine.getKeyLang(),
			speed=PDP1Engine.getEmulationSpeed();
		for (var i=0; i<opts.length; i++) {
			if (opts[i].value==lang) {
				el.selectedIndex=i;
				break;
			}
		}
		el=document.getElementById('speedSelect');
		if (el) {
			opts=el.options;
			for (var i=0; i<opts.length; i++) {
				if (opts[i].value==speed) {
					el.selectedIndex=i;
					break;
				}
			}
		}
		dialogVisible=true;
	}
	function hideSenseSwitchDialog() {
		document.getElementById('senseSwitchDialogWrapper').style.display='none';
		dialogVisible=false;
		PDP1Engine.resume();
		PDP1Engine.lockElectrostatics(false);
	}
	function toggleTW5() {
		PDP1Engine.toggleTW5();
	}
	function restart() {
		PDP1Engine.restart();
	}
	// tools menu
	var toolsMenu=false, toolsMenuVisible=false, toolsMenuMaxScrollY=880, toolsButtonClass='toolTipLeft';
	function hideToolsMenuIcon() {
		var el=document.getElementById('menu_tools_button');
		if (el) el.style.display='none';
	}
	function initToolsMenu() {
		var el=document.getElementById('menu_tools_button')
			defs = [
				{ id: 'tools_menu_ssw_1', code: 1 },
				{ id: 'tools_menu_ssw_2', code: 2 },
				{ id: 'tools_menu_ssw_3', code: 3 },
				{ id: 'tools_menu_ssw_4', code: 4 },
				{ id: 'tools_menu_ssw_5', code: 5 },
				{ id: 'tools_menu_ssw_6', code: 6 },
				{ id: 'tools_menu_restart', code: 7 },
				{ id: 'tools_menu_params', code: 8 },
				{ id: 'tools_menu_settings', code: 9, dependency: 'senseSwitchDialogWrapper' },
				{ id: 'tools_menu_scorer', code: 10 },
				{ id: 'tools_menu_speed_1', code: 11 },
				{ id: 'tools_menu_speed_2', code: 12 },
				{ id: 'tools_menu_speed_3', code: 13 },
				{ id: 'tools_menu_crt', code: 15 },
				{ id: 'tools_menu_controllers', code: 16 },
				{ id: 'tools_menu_subpixels', code: 17 },
				{ id: 'tools_menu_link', code: 18 },
				{ id: 'tools_menu_cleanstart', code: 19 },
				{ id: 'tools_menu_hslock', code: 20 },
				{ id: 'tools_menu_gamepads', code: 21 },
				{ id: 'tools_menu_fullscreen', code: 22 }
			];
		if (el) {
			if (isMobileTouch) {
				var ctrlEl=document.getElementById('keyboardControl'),
					m=document.getElementById('menu_tools');
				if (ctrlEl && m) {
					ctrlEl.parentNode.appendChild(m);
					ctrlEl.parentNode.removeChild(ctrlEl);
				}
				else {
					hideToolsMenuIcon();
					return;
				}
			}
			el.addEventListener('click', toggleToolsMenu, false);
			for (var i=0, l=defs.length; i<l; i++) {
				var item=defs[i];
				el=document.getElementById(item.id);
				if (el) {
					if (!item.dependency || document.getElementById(item.dependency)) {
						el.addEventListener('click', getToolsMenuHandler(item.code), false);
					}
					else if (item.dependency) {
						el.className='disabled';
					}
				}
			}
			if (!isTouch) window.addEventListener('scroll', toolsMenuScrollHandler, false);
		}
	}
	function getToolsMenuHandler(code) {
		return function(event) { toolsMenuItemHandler(event, code); };
	}
	function toolsMenuItemHandler(event, item) {
		var el, s, sv;
		switch (item) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5:
			case 6:
				PDP1Engine.setSense(item, !PDP1Engine.getSense(item)); break;
			case 7:
				PDP1Engine.restart(); break;
			case 8:
				showParamsDialog(); break;
			case 9:
				showSenseSwitchDialog(); break;
			case 10:
				toggleTW5(); break;
			case 11:
			case 12:
			case 13:
				s=PDP1Engine.getEmulationSpeed(),
				sv=1+0.5*(item-11);
				if (s!=sv) PDP1Engine.setEmulationSpeed(sv);
				break;
			case 15:
				showCRTDialog(); break;
			case 16:
				toggleTouchControls(); break;
			case 17:
				s=PDP1Engine.getSubpixelRenderingState();
				if (s[0]) PDP1Engine.setSubpixelRendering(!s[1]);
				break;
			case 18:
				showLinkDialog(); break;
			case 19:
				PDP1Engine.setTestword(0777777, false);
				updateTestword(0);
				for (var i=1; i<=6; i++) PDP1Engine.setSense(i, false);
				PDP1Engine.restart();
				break;
			case 20:
				PDP1Engine.setHSLock(!PDP1Engine.getHSLock()); break;
			case 21:
				PDP1Engine.gamepadsEnable(!PDP1Engine.gamepadsEnabled());
				break;
			case 22:
				toggleFullscreen();
				break;
		}
		toggleToolsMenu(event);
	}
	function toggleToolsMenu(event, internal) {
		if (!internal) stopEvent(event);
		var el=document.getElementById('tools_menu');
		if (!el) return;
		if (toolsMenu) {
			toolsMenuClose(el)
		}
		else {
			updateToolsMenu(true);
			document.addEventListener('click', toggleToolsMenu, false);
			el.className='on';
			toolsMenu=true;
			document.getElementById('menu_tools_button').className='';
		}
	}
	function toolsMenuClose(el) {
		if (toolsMenu) {
			if (!el) el =document.getElementById('tools_menu');
			if (!el) return;
			document.removeEventListener('click', toggleToolsMenu);
			el.className='';
			toolsMenu=false;
			document.getElementById('menu_tools_button').className=toolsButtonClass;
		}
	}
	function stopEvent(event) {
		if (event.preventDefault) event.preventDefault();
		if (event.stopPropagation) event.stopPropagation();
		if (event.stopImmediatePropagation) event.stopImmediatePropagation();
		if (event.preventManipulation) event.preventManipulation();
		event.cancelBubble=true;
		event.returnValue=false;
	}
	function updateToolsMenu(updateLabels) {
		var el;
		for (var i=1; i<7; i++) {
			el=document.getElementById('tools_menu_ssw_'+i);
			if (el) {
				if (updateLabels) {
					var labels=PDP1Engine.getSenseSwitchLabels(i);
					el.title=labels[1].replace(/&[mn]dash;/g, '-');
					el.innerHTML='<span class="menuicon">&nbsp;</span>'+labels[2];
				}
				el.className=(PDP1Engine.getSense(i))? 'on':'off';
			}
		}
		el=document.getElementById('tools_menu_params');
		if (el) {
			params=PDP1Engine.getParams();
			if (params) {
				el.className='';
			}
			else {
				el.className='disabled';
			}
		}
		el=document.getElementById('tools_menu_scorer');
		if (el) {
			var state=PDP1Engine.getScorerButtonState();
			if (!state[0]) {
				el.style.display='none';
			}
			else {
				el.style.display='block';
				el.className=(state[1])? 'on':'off';
			}
		}
		var s=PDP1Engine.getEmulationSpeed();
		for (var i=1, sv=1.0; i<4; i++, sv+=0.5) {
			el=document.getElementById('tools_menu_speed_'+i);
			if (el) el.className=(s==sv)? 'on':'off';
		}
		el=document.getElementById('tools_menu_controllers');
		if (el) {
			/*
			el.innerHTML=(touchControlsVisible)? 'Hide Virtual Controllers':'Show Virtual Controllers';
			el.className = (moduleHasControllers)? '': 'disabled';
			*/
			el.className = (touchControlsVisible? 'on':'off') + (moduleHasControllers? '': 'disabled');
		}
		el=document.getElementById('tools_menu_subpixels');
		if (el) {
			var state=PDP1Engine.getSubpixelRenderingState();
			if (!state[0]) {
				el.className='off disabled';
			}
			else {
				el.className=(state[1])? 'on':'off';
			}
		}
		el=document.getElementById('tools_menu_hslock');
		if (el) {
			el.className=(PDP1Engine.getHSLock())? 'on':'off';
		}
		el=document.getElementById('tools_menu_gamepads');
		if (el) {
			if (PDP1Engine.gamepadsSupported()) {
				el.className=(PDP1Engine.gamepadsEnabled())? 'on':'off';
			}
			else {
				el.className='disabled';
			}
		}
	}
	function toolsMenuScrollHandler(event) {
		var el;
		if (window.pageYOffset>=toolsMenuMaxScrollY) {
			if (toolsMenuVisible) {
				if (toolsMenu) toggleToolsMenu(null, true);
				el=document.getElementById('menu_tools');
				el.style.display='none';
				toolsMenuVisible=false;
			}
		}
		else {
			if (!toolsMenuVisible) {
				el=document.getElementById('menu_tools');
				el.style.display='block';
				toolsMenuVisible=true;
			}
		}
	}
	// params dialog
	var paramsDialogWrapper, paramsDialog, params;
	function showParamsDialog() {
		var el, item, n, p;
		crtPopupClose();
		if (!params) params=PDP1Engine.getParams();
		if (!params) return;
		PDP1Engine.halt();
		if (!paramsDialogWrapper) {
			paramsDialogWrapper=document.createElement('div');
			paramsDialogWrapper.id='spacewarParamsDialogWrapper';
		}
		if (!paramsDialog) {
			paramsDialog=document.createElement('div');
			paramsDialog.id='spacewarParamsDialog';
			paramsDialog.className='notranslate';
			el=document.createElement('p');
			el.innerHTML='interesting and often changed constants<br />(&quot;<span class="bitshift">s</span>&quot; indicates amounts of bit-shifts, &quot;mhs&quot; may require a restart to become effective,<br />values in parentheses represent the standard/reset value.)';
			paramsDialog.appendChild(el);
			for (n in params) {
				p=params[n];
				item=document.createElement('div');
				item.className='spacewarParamsItem';
				el=document.createElement('span');
				el.className='spacewarParamsName';
				el.id='spacewarParam_'+n;
				el.innerHTML='&ldquo;'+n+'&rdquo;';
				item.appendChild(el);
				el=document.createElement('span');
				el.className='spacewarParamsLabel';
				el.innerHTML=p.label;
				item.appendChild(el);
				el=document.createElement('input');
				el.className='spacewarParamsSlider';
				el.type='range';
				el.min=p.min;
				el.max=p.max;
				el.value=p.value;
				el.id='spacewarParamsSlider_'+n;
				el.addEventListener('change', getParamsSliderHandler(n), false);
				item.appendChild(el);
				el=document.createElement('span');
				el.className='spacewarParamsValue';
				el.id='spacewarParamsValue_'+n;
				if (p.shift) el.title='division by 2^n: smaller value has greater effect'; 
				el.innerHTML=p.value+getParamsShiftString(n,p.value);
				item.appendChild(el);
				el=document.createElement('span');
				el.className='spacewarParamsDefault';
				el.id='spacewarParamsDefault_'+n;
				el.title='default value';
				el.innerHTML='('+p['default']+getParamsShiftString(n,p['default'])+')';
				item.appendChild(el);
				el=document.createElement('input');
				el.type='button';
				el.className='spacewarParamsResetButton';
				el.value='reset';
				el.addEventListener('click', getParamsResetHandler(n), false);
				item.appendChild(el);
				paramsDialog.appendChild(item);
			}
			var el2=document.createElement('div');
			el2.id='spacewarParamsButtons';
			el=document.createElement('input');
			el.type='button';
			el.className='spacewarParamsDialogButton';
			el.value='Cancel';
			el.addEventListener('click', paramsCloseHandler, false);
			el2.appendChild(el);
			el=document.createElement('input');
			el.type='button';
			el.className='spacewarParamsDialogButton';
			el.value='Apply';
			el.addEventListener('click', paramsApplyHandler, false);
			el2.appendChild(el);
			paramsDialog.appendChild(el2);
			paramsDialogWrapper.appendChild(paramsDialog);
			document.getElementsByTagName('body')[0].appendChild(paramsDialogWrapper);
		}
		else {
			paramsDialogWrapper.appendChild(paramsDialog);
			document.getElementsByTagName('body')[0].appendChild(paramsDialogWrapper);
			for (n in params) {
				p=params[n];
				document.getElementById('spacewarParamsValue_'+n).innerHTML=p.value+getParamsShiftString(n,p.value);
				el=document.getElementById('spacewarParamsSlider_'+n);
				el.min=p.min;
				el.max=p.max;
				el.value=p.value;
				document.getElementById('spacewarParamsDefault_'+n).innerHTML='('+p['default']+getParamsShiftString(n,p['default'])+')';
			}
		}
		paramsDialog.style.top=Math.max(10, Math.floor((paramsDialogWrapper.offsetHeight-paramsDialog.offsetHeight)*.35)-32)+'px';
	}
	function getParamsShiftString(n,v) {
		return (params[n].shift && parseInt(v))? '<span class="bitshift">s</span>':'';
	}
	function getParamsSliderHandler(n) {
		return function(event) {
			var v=document.getElementById('spacewarParamsSlider_'+n).value;
			document.getElementById('spacewarParamsValue_'+n).innerHTML=params[n].value=v+getParamsShiftString(n,v);
			setParamValue(n, v);
		};
	}
	function getParamsResetHandler(n) {
		return function(event) {
			var v=resetParamValue(n);
			document.getElementById('spacewarParamsSlider_'+n).value=v;
			document.getElementById('spacewarParamsValue_'+n).innerHTML=params[n].value=v+getParamsShiftString(n,v);
			setParamValue(n, v);
		};
	}
	function setParamValue(n, v) {
		params[n].value=v;
	}
	function resetParamValue(n) {
		params[n].value=params[n]['default'];
		return params[n].value;
	}
	function paramsApplyHandler(event) {
		 paramsCloseHandler(event, true);
	}
	function paramsCloseHandler(event, apply) {
		var el=document.getElementById('spacewarParamsDialogWrapper');
		el.parentNode.removeChild(el);
		if (apply) {
			var p={};
			for (var n in params) {
				p[n]=params[n].value;
			}
			PDP1Engine.setParams(p);
		}
		if (event) stopEvent(event);
		params=null;
		PDP1Engine.resume();
	}
	// CRT dialog
	var crtDialogWrapper, crtDialog,
		crtParams = [
			{
				label: 'phosphor sustain (trails)',
				min: '1.0',
				max: '100.0',
				step: '0.5',
				val: function() { return PDP1Engine.getCRTSustain()*100; },
				format: crtSustainString,
				dfltStrg: crtSustainString(PDP1Engine.getCRTDefaultSustain()*100)
			},
			{
				label: 'blur levels',
				min: 2,
				max: 6,
				step: 1,
				val: PDP1Engine.getCRTBlurLevels,
				dfltStrg: PDP1Engine.getCRTDefaultBlurLevels()
			}
		];
	function showCRTDialog() {
		var el, item, n, p, v;
		crtPopupClose();
		PDP1Engine.lockElectrostatics(true);
		if (!crtDialogWrapper) {
			crtDialogWrapper=document.createElement('div');
			crtDialogWrapper.id='spacewarCRTDialogWrapper';
		}
		if (!crtDialog) {
			crtDialog=document.createElement('div');
			crtDialog.id='spacewarCRTDialog';
			crtDialog.className='notranslate';
			el=document.createElement('p');
			el.innerHTML='Configure the Type 30 CRT display:';
			crtDialog.appendChild(el);
			for (n=0; n<crtParams.length; n++) {
				p=crtParams[n];
				v=p.val();
				item=document.createElement('div');
				item.className='spacewarCRTItem';
				el=document.createElement('span');
				el.className='spacewarCRTLabel';
				el.innerHTML=p.label;
				item.appendChild(el);
				el=document.createElement('input');
				el.className='spacewarCRTSlider';
				el.type='range';
				el.min=p.min;
				el.max=p.max;
				el.step=p.step;
				el.value=v;
				el.id='spacewarCRTSlider_'+n;
				el.addEventListener('change', getCRTSliderHandler(n), false);
				el.addEventListener('input', getCRTSliderHandler(n), false);
				item.appendChild(el);
				el=document.createElement('span');
				el.className='spacewarCRTValue';
				el.id='spacewarCRTValue_'+n;
				el.innerHTML= (p.format)? p.format(v):v;
				item.appendChild(el);
				el=document.createElement('span');
				el.className='spacewarCRTDefault';
				el.id='spacewarCRTDefault_'+n;
				el.title='default value';
				el.innerHTML='('+p.dfltStrg+')';
				item.appendChild(el);
				el=document.createElement('input');
				el.type='button';
				el.className='spacewarCRTResetButton';
				el.value='reset';
				el.addEventListener('click', getCRTResetHandler(n), false);
				item.appendChild(el);
				crtDialog.appendChild(item);
			}
			var el2=document.createElement('div');
			el2.id='spacewarCRTButtons';
			el=document.createElement('input');
			el.type='button';
			el.className='spacewarCRTDialogButton';
			el.value='Done';
			el.addEventListener('click', crtCloseHandler, false);
			el2.appendChild(el);
			crtDialog.appendChild(el2);
			crtDialogWrapper.appendChild(crtDialog);
			document.getElementsByTagName('body')[0].appendChild(crtDialogWrapper);
		}
		else {
			crtDialogWrapper.appendChild(crtDialog);
			document.getElementsByTagName('body')[0].appendChild(crtDialogWrapper);
			for (n=0; n<crtParams.length; n++) {
				p=crtParams[n];
				v=p.val();
				document.getElementById('spacewarCRTValue_'+n).innerHTML=(p.format)? p.format(v):v;
				el=document.getElementById('spacewarCRTSlider_'+n);
				el.value=v;
			}
		}
		crtDialog.style.top=Math.max(10, Math.floor((crtDialogWrapper.offsetHeight-crtDialog.offsetHeight)*.35)-32)+'px';
	}
	function getCRTSliderHandler(n) {
		if (n==0) {
			return function(event) {
				var v=parseFloat(document.getElementById('spacewarCRTSlider_'+n).value);
				document.getElementById('spacewarCRTValue_'+n).innerHTML=crtSustainString(v);
				PDP1Engine.setCRTSustain(v/100);
			};
		}
		else {
			return function(event) {
				var v=parseInt(document.getElementById('spacewarCRTSlider_'+n).value);
				document.getElementById('spacewarCRTValue_'+n).innerHTML=v;
				PDP1Engine.setCRTBlurLevels(v);
			};
		}
	}
	function getCRTResetHandler(n) {
		if (n==0) {
			return function(event) {
				PDP1Engine.resetCRTSustain();
				var v=PDP1Engine.getCRTSustain()*100;
				document.getElementById('spacewarCRTSlider_'+n).value=v;
				document.getElementById('spacewarCRTValue_'+n).innerHTML=crtSustainString(v);
			};
		}
		else {
			return function(event) {
				PDP1Engine.resetCRTBlurLevels();
				var v=PDP1Engine.getCRTBlurLevels();
				document.getElementById('spacewarCRTSlider_'+n).value=v;
				document.getElementById('spacewarCRTValue_'+n).innerHTML=v;
			};
		}
	}
	function crtCloseHandler(event) {
		var el=document.getElementById('spacewarCRTDialogWrapper');
		el.parentNode.removeChild(el);
		if (event) stopEvent(event);
		PDP1Engine.lockElectrostatics(false);
	}
	function crtSustainString(v) {
		return Number(v).toFixed(1)+'%';
	}
	// CRT popup
	var crtPopup, crtPopupParentId = 'crtPopupTrigger',
		crtPopupParams = {
			label: 'CRT Sustain (trails)',
			min: '1.0',
			max: '100.0',
			step: '0.5',
			val: function() { return PDP1Engine.getCRTSustain()*100; },
			format: crtSustainString
		};
	function showCRTPopup() {
		var parentElement,el, item, v;
		parentElement=document.getElementById(crtPopupParentId);
		if (!parentElement) return;
		PDP1Engine.lockElectrostatics(true);
		if (!crtPopup) {
			crtPopup=document.createElement('div');
			crtPopup.id='spacewarCRTPopup';
			crtPopup.className='notranslate';
			v=crtPopupParams.val();
			item=document.createElement('div');
			item.className='spacewarCRTItem';
			el=document.createElement('span');
			el.className='spacewarCRTLabel';
			el.innerHTML=crtPopupParams.label;
			item.appendChild(el);
			el=document.createElement('input');
			el.className='spacewarCRTSlider';
			el.type='range';
			el.min=crtPopupParams.min;
			el.max=crtPopupParams.max;
			el.step=crtPopupParams.step;
			el.value=v;
			el.id='spacewarCRTPopupSlider';
			el.addEventListener('change', crtPopupSliderHandler, false);
			el.addEventListener('input', crtPopupSliderHandler, false);
			item.appendChild(el);
			el=document.createElement('span');
			el.className='spacewarCRTValue';
			el.id='spacewarCRTPopupValue';
			el.innerHTML= (crtPopupParams.format)? crtPopupParams.format(v):v;
			item.appendChild(el);
			el=document.createElement('input');
			el.type='button';
			el.className='spacewarCRTResetButton';
			el.value='reset';
			el.addEventListener('click', crtPopupResetHandler, false);
			item.appendChild(el);
			crtPopup.appendChild(item);
			el=document.createElement('div');
			el.className='spacewarPopupClose';
			el.addEventListener('click', crtPopupClose, false);
			crtPopup.appendChild(el);
			parentElement.appendChild(crtPopup);
		}
		else {
			if (crtPopup.parentElement) {
				crtPopupClose(null);
				return;
			}
			parentElement.appendChild(crtPopup);
			v=crtPopupParams.val();
			document.getElementById('spacewarCRTPopupValue').innerHTML=(crtPopupParams.format)? crtPopupParams.format(v):v;
			el=document.getElementById('spacewarCRTPopupSlider');
			el.value=v;
		}
		crtPopup.addEventListener('click', stopEvent, false);
		el=document.getElementById('crtPopupTrigger');
		el.className='';
	}
	function crtPopupSliderHandler(event) {
		var v=parseFloat(document.getElementById('spacewarCRTPopupSlider').value);
		document.getElementById('spacewarCRTPopupValue').innerHTML=crtSustainString(v);
		PDP1Engine.setCRTSustain(v/100);
	}
	function crtPopupResetHandler(event) {
		PDP1Engine.resetCRTSustain();
		var v=PDP1Engine.getCRTSustain()*100;
		document.getElementById('spacewarCRTPopupSlider').value=v;
		document.getElementById('spacewarCRTPopupValue').innerHTML=crtSustainString(v);
	}
	function crtPopupClose(event) {
		if (!crtPopup || !crtPopup.parentElement) return;
		crtPopup.removeEventListener('click', stopEvent);
		console.log(crtPopup, crtPopup.parentElement);
		crtPopup.parentElement.removeChild(crtPopup);
		var el=document.getElementById('crtPopupTrigger');
		el.className='toolTipBottom';
		if (event) stopEvent(event);
		PDP1Engine.lockElectrostatics(false);
	}
	function setCRTDefaultSustain(v) {
		PDP1Engine.setCRTSustain(v, true);
		crtParams[0].dfltStrg=crtSustainString(PDP1Engine.getCRTDefaultSustain()*100);
	}
	// testword panel
	var testwordPanelActive=false;
	function showTestword(tw, showStart) {
		var el=document.getElementById('testwordpannel');
		if (el) {
			el.style.display=(tw>=0)? 'block':'none';
			if (tw>=0) {
				el.className = (showStart)? '':'nostart';
				updateTestword(tw);
				testwordPanelActive=true;
			}
			else {
				testwordPanelActive=false;
			}
		}
	}
	function setTestwordSwitch(b, v) {
		PDP1Engine.setTestword(1<<(17-b), v);
		document.getElementById('testwordswitch_'+b).setAttribute('data-title', 'bit '+b+': '+((v)? 'hi':'lo'));
		var el=document.getElementById('testword_title'),
			tw=PDP1Engine.getTestword();
		if (el) {
			el.setAttribute('data-title', getTestwordString(tw));
			el.className='toolTipTop';
		}
		updateTestwordOctalDisplay(tw);
	}
	function getTestwordString(tw) {
		return ' o'+(01000000|tw).toString(8).substring(1)+' ';
	}
	function updateTestword(tw) {
		var el=document.getElementById('testwordpannel');
		if (el) {
			for (var i=0; i<18; i++) {
				var b=17-i, v=((tw & (1<<i)) != 0);
				document.getElementById('testword_'+b).checked = v;
				document.getElementById('testwordswitch_'+b).setAttribute('data-title', 'bit '+b+': '+((v)? 'hi':'lo'));
			}
		}
		el=document.getElementById('testword_title');
		if (el) {
			el.setAttribute('data-title', getTestwordString(tw));
			el.className='toolTipTop';
		}
		updateTestwordOctalDisplay(tw);
	}
	function updateTestwordOctalDisplay(tw) {
		for (var i=0; i<6; i++) {
			var el=document.getElementById('testword_triplet'+i);
			if (el) el.innerHTML = '– ' + ((tw >> (i * 3)) & 7) + ' –';
			else break;
		}
	}
	function onReady(f) {
		if (typeof f == 'function') onReadyQueue.push(f);
	}
	function getLink() {
		var url=self.location.protocol+'//'+self.location.hostname+self.location.pathname.replace(/\/index\.(html|php)$/, '/');
		var conf=PDP1Engine.getConfiguration();
		if (conf) {
			url+='?version='+conf.idparam;
			if (conf.sense) url+='&sense='+conf.sense;
			if (testwordPanelActive && conf.testword) url+='&testword='+(01000000 | conf.testword).toString(8).substring(1);
		}
		return url;
	}
	var linkDialogWrapper, linkDialog;
	function showLinkDialog() {
		var el, el2, url=getLink();
		crtPopupClose();
		PDP1Engine.lockElectrostatics(true);
		if (!linkDialogWrapper) {
			linkDialogWrapper=document.createElement('div');
			linkDialogWrapper.id='spacewarLinkDialogWrapper';
		}
		if (!linkDialog) {
			linkDialog=document.createElement('div');
			linkDialog.id='spacewarLinkDialog';
			linkDialog.className='notranslate';
			el=document.createElement('p');
			el.innerHTML='Share a Link to This Configuration:';
			linkDialog.appendChild(el);
			el=document.createElement('input');
			el.type='text';
			el.id='spacewarLinkDialogTextfield';
			el.value=url;
			linkDialog.appendChild(el);
			var el2=document.createElement('div');
			el2.id='spacewarLinkButtons';
			el=document.createElement('input');
			el.type='button';
			el.className='spacewarLinkDialogButton';
			el.value='Done';
			el.addEventListener('click', linkDialogCloseHandler, false);
			el2.appendChild(el);
			linkDialog.appendChild(el2);
			linkDialogWrapper.appendChild(linkDialog);
			document.getElementsByTagName('body')[0].appendChild(linkDialogWrapper);
		}
		else {
			linkDialogWrapper.appendChild(linkDialog);
			document.getElementsByTagName('body')[0].appendChild(linkDialogWrapper);
			document.getElementById('spacewarLinkDialogTextfield').value=url;
		}
		linkDialog.style.top=Math.max(10, Math.floor((linkDialogWrapper.offsetHeight-linkDialog.offsetHeight)*.35)-32)+'px';
		setTimeout( function() {
			var el=document.getElementById('spacewarLinkDialogTextfield');
			if (el && el.select) el.select();
		},10);
	}
	function linkDialogCloseHandler(event) {
		var el=document.getElementById('spacewarLinkDialogWrapper');
		el.parentNode.removeChild(el);
		if (event) stopEvent(event);
		PDP1Engine.lockElectrostatics(false);
	}
	// sense switch info popup
	var senseSwitchInfo, senseSwitchInfoTimer, senseSwitchInfoParentId='pdp1screen';
	function showSenseSwitchInfo() {
		var el, item, i, v, parentElement=document.getElementById(senseSwitchInfoParentId);
		senseSwitchInfoClose();
		if (!parentElement) return;
		senseSwitchInfo=document.createElement('div');
		senseSwitchInfo.id='spacewarSenseSwitchInfo';
		senseSwitchInfo.className='notranslate';
		el=document.createElement('p');
		el.innerHTML='&mdash; Sense Switches &mdash;';
		senseSwitchInfo.appendChild(el);
		for (i=1; i<7; i++) {
			item=document.createElement('div');
			item.className='spacewarSenseSwitchInfoItem';
			el=document.createElement('span');
			el.className='spacewarSenseSwitchInfoLabel';
			el.innerHTML=PDP1Engine.getSenseSwitchLabels(i)[2];
			item.appendChild(el);
			el=document.createElement('span');
			el.className='spacewarSenseSwitchInfoValue';
			if (PDP1Engine.getSense(i)) {
				el.innerHTML='On';
				el.className+=' spacewarSenseSwitchInfoValueOn';
			}
			else {
				el.innerHTML='Off';
			}
			item.appendChild(el);
			senseSwitchInfo.appendChild(item);
		}
		parentElement.appendChild(senseSwitchInfo);
		senseSwitchInfoTimer = setTimeout(senseSwitchInfoClose, 1600);
	}
	function senseSwitchInfoClose() {
		if (senseSwitchInfo) {
			if (senseSwitchInfo.parentNode) senseSwitchInfo.parentNode.removeChild(senseSwitchInfo);
			senseSwitchInfo=null;
		}
		if (senseSwitchInfoTimer) {
			clearTimeout(senseSwitchInfoTimer);
			senseSwitchInfoTimer=0;
		}
	}
	// score display
	var scoreDisplayId="scoring", scoreIndicatorIdPrefix="scoreindicator_",
		scoreNumericIdPrefix="score_player_",
		scoreIndicatorClassLo="scorelight", scoreIndicatorClassHi="scorelight hi",
		hasScoreDisplay=false, scoreP1, scoreP2;
	function showScoreDisplay(v) {
		var el=document.getElementById(scoreDisplayId);
		if (el) {
			el.style.display=v? 'block':'none';
			hasScoreDisplay=true;
			showScores(0, 0);
		}
		else {
			hasScoreDisplay=false;
		}
	}
	function showScores(s1, s2) {
		function showPlayerScore(p, s) {
			for (var i=0; i<18; i++) {
				var el=document.getElementById(scoreIndicatorIdPrefix+p+'_'+(17-i));
				if (el) el.className = ((s >> i) & 1)? scoreIndicatorClassHi:scoreIndicatorClassLo;
			}
			var el=document.getElementById(scoreNumericIdPrefix+p);
			if (el) el.innerHTML=s;
		}
		if (hasScoreDisplay) {
			if (s1 !== scoreP1) { showPlayerScore(1, s1); scoreP1=s1; }
			if (s2 !== scoreP2) { showPlayerScore(2, s2); scoreP2=s2; }
		}
	}
	function resetScores() {
		PDP1.Engine.resetScores();
	}
	// service screen links
	function initModuleLinks() {
		var moduleLinksOverlay = document.getElementById('moduleLinksOverlay');
		if (moduleLinksOverlay) {
			moduleLinksOverlay.innerHTML='';
			moduleLinksOverlay.className='active';
		}
	}
	function createModuleLink(id, x, y, w, h) {
		var moduleLinksOverlay = document.getElementById('moduleLinksOverlay');
		if (moduleLinksOverlay) {
			var el=document.createElement('div');
			el.title='Click to select and run';
			el.style.position='absolute';
			el.style.left=x+'px';
			el.style.top=y+'px';
			el.style.width=w+'px';
			el.style.height=h+'px';
			el.style.cursor='pointer';
			el.onclick=function() {selectModule(id);};
			moduleLinksOverlay.appendChild(el);
		}
	}
	function hideModuleLinks() {
		var moduleLinksOverlay = document.getElementById('moduleLinksOverlay');
		if (moduleLinksOverlay) {
			moduleLinksOverlay.innerHTML='';
			moduleLinksOverlay.className='';
		}
	}
	// trigger
	if (isCompatible()) {
		resolveTouchAPI();
		document.addEventListener('DOMContentLoaded', initSpacewar, false);
		window.onload=pageOnLoad;
	}
	else {
		alert('Sorry, not compatible.\nStandards-compliant browsers only.');
	}
	// fullscreen API
	function toggleFullscreen() {
		if (document.fullscreenElement === undefined && document.mozFullScreen === undefined && document.webkitIsFullScreen === undefined) return;
		var method;
		if (document.fullscreenElement != null || document.mozFullScreen || document.webkitIsFullScreen) {
			method = document.exitFullscreen
				|| document.cancelFullscreen
				|| document.webkitCancelFullScreen
				|| document.mozCancelFullScreen
				|| document.msCancelFullScreen;
			if (method) method.call(document);
		}
		else {
			var el= document.documentElement || document.getElementsByTagName('body')[0];
			method = el.requestFullscreen
				|| el.webkitRequestFullScreen
				|| el.mozRequestFullScreen
				|| el.msRequestFullScreen;
			if (method) method.call(el);
		}
	}
	function observeFullscreen() {
		var el=document.getElementById('fullscreenToggle'),
			etypes= ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'];
		function setScreenMode() {
			var isFullscreen = document.fullscreenElement != null || document.mozFullScreen || document.webkitIsFullScreen;
			el.className=isFullscreen?'fullscreen':'';
		}
		if (el) {
			for (var i=0; i<etypes.length; i++) {
				var et=etypes[i];
				if (typeof document['on'+et] !== 'undefined') {
					document.addEventListener(et, function(event) {
						setScreenMode();
						if (event.preventDefault) event.preventDefault();
						if (event.stopPropagation) event.stopPropagation();
						event.cancelBubble=true;
						event.returnValue=false;
					}, false);
					setTimeout(setScreenMode, 10);
					break;
				}
			}
		}
	}
	// export a public API
	return {
		showSenseSwitchDialog: showSenseSwitchDialog,
		hideSenseSwitchDialog: hideSenseSwitchDialog,
		setSenseSwitch: setSenseSwitch,
		setHighSpeedMode: setHighSpeedMode,
		setEmulationSpeed: setEmulationSpeed,
		setKeyLang: setKeyLang,
		toggleTW5: toggleTW5,
		showCRTPopup: showCRTPopup,
		showSenseSwitchInfo: showSenseSwitchInfo,
		selectModule: selectModule,
		restart: restart,
		autoShowTouchControls: autoShowTouchControls,
		setTestwordSwitch: setTestwordSwitch,
		showTestword: showTestword,
		setCRTDefaultSustain: setCRTDefaultSustain,
		onReady: onReady,
		getLink: getLink,
		showScoreDisplay: showScoreDisplay,
		showScores: showScores,
		resetScores: resetScores,
		toolsMenuClose: toolsMenuClose,
		toggleFullscreen: toggleFullscreen,
		initModuleLinks: initModuleLinks,
		createModuleLink: createModuleLink,
		hideModuleLinks: hideModuleLinks
	};
})();

