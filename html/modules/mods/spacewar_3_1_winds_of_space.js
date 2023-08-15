/*
  PDP-1 Spacewar! code (spacewar 3.1  24 sep 62), Winds of Space
  
  copy and patch module "spacewar3.1_sr" for "Winds of Space":
  patch setup table entry 00021 "amount of torpedo space warpage"
  from default value 0675777 (sar 9s) to "sar 0" (no shift or scaling).
  => the lower the value, the more torpedo trajectories will be
     modulated by a sine-like curvature. the effect varies with
     position on the speed.
  additionally, the torpedo life-time (00011) is set to "law 150"
  (normally "law 140") for a bit longer torpedo range.
*/
if (PDP1Engine) {
	PDP1Engine.load( {
		'id': 'spacewar3.1_winds_of_space',
		'versionString': 'spacewar 3.1   winds of space (hack)',
		'displayLabel': 'Spacewar! 3.1 "Winds of Space" (Hack)',
		'startAddress': -1,       // get it from tape
		'endOfMainLoop': 02051,   // location of jump to ml0
		'useHwMulDiv': false,
		'hiRes': true,
		'hasParams': true,
		'message': [' Spacewar 3.1, demonstrating the "Winds of Space" hack. '],
		'copyModule': 'spacewar3.1',
		'patches': [
			[011, 0710150], // label tlf: 'law i 0150' (torpedo life; normal: 0140)
			[021, 0675000] // label the: 'sar 0' (torpedo warpage, normal: 'sar 9s')
		]
	});
}