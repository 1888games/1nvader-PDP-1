
////ironic computer space  0.01  nl 2016-10-12

define initialize A,B
	law B
	dap A
	term

define index A,B,C
	idx A
	sas B
	jmp C
	term

define swap
	rcl 9s
	rcl 9s
	term

define load A,B
	lio (B
	dio A
	term

define setup A,B
	law i B
	dac A
	term

define count A,B
	isp A
	jmp B
	term

define random
	lac ran
	dac oldRan
	rar 1s
	xor (355670
	add (355670
	dac ran
	term
