
3/		jmp sbf				// ignore seq. break
		jmp newGame				// start addr, jmp to a0


//routine to flush sequence breaks, if they occur.

sbf,	tyi
		lio 2
		lac 0
		lsm
		jmp i 1
