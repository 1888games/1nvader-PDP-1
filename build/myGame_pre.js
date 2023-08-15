
if (PDP1Engine) {
	PDP1Engine.load( {
		'id': 'snowflake',
		'versionString': 'Arlasofts PDP-1 Game',
		'displayLabel': 'Arlasofts PDP-1 Game',
		'startAddress': -1,       // get it from tape
		'endOfMainLoop': 0170,   // location of jump to ml0
		'endOfScorerLoop': 03066, // end of scorer loop
		'splashScreen': false,
		'useHwMulDiv': true,
		'hiRes': true,
		'hasParams': true,
		'senseSwitchLabels': {
			'2': ['Ptolemaic View', 'On: Needle\'s ego view, Off: normal display', 'Ptolemaic Ego View' ],
			'3': ['Torpedoes', 'On: single shot, Off: salvoes', 'Single Shot Mode' ]
		},
		'message': [
			'@@@ Spacewar 2015 @@@',
			'Featuring the Minskytron hyperspace, a score display',
			' (press {scorer}), and a Ptolemaic ego view (sense switch 2).',
			'Proudly presented by N. Landsteiner, 2015.','(Not an authentic program.)'],
		'tapes': ['