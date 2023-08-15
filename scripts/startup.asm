
3/		jmp sbf				     // ignore seq. break
		jmp titScr				// start addr (4), jump to title screen


//routine to flush sequence breaks, if they occur.

sbf,	tyi
		lio 2
		lac 0
		lsm
		jmp i 1
