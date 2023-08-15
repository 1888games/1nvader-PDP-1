
drawSprt,

currY,		lac	.

yPadd,		add .
			scr 9s
			scr 1s

currX,		lac .	
xPadd,		add .

			sal 8s

			dpy-i

			idx currY
			idx currX
loopCh,		sas .
			jmp currY


drawExit,
			jmp .





drawComb,

crrY,		lac	.

yPad,		add txtY
			scr 9s
			scr 1s

			idx crrX
			idx crrY

crrX,		lac .	
xPad,		add txtX

			sal 8s

			dpy-i

			idx crrY
			idx crrX
lopCh,		idx txtCn
			sza
			jmp crrY


drawE,
			jmp .


drwDig,

			dap drawE


			law digDt
			add txtId
			dap getAdr

			//dap crrX
			//dap crrY
			

			law digLn
			add txtId
			dap getDigs

getAdr,		
			lac . 
			dap crrX
			dap crrY

getDigs,
			lac .
			cma
			dac txtCn

			//lac (-14)
			//dac txtCn

			jmp drawComb

