

gmOver,
			
			lac gmMode
			sza
			jmp downEx

			lac (1)
			dac gmMode
			jmp newGame



moveDn,

			dap downEx

			lac invYpo
			sub (47)
			dac invYpo

			idx invRow
			lac invRow
			sub (33)
			sma 
			jmp gmOver

			idx GetSpd
			xct GetSpd
			add (bbSpd)
			dac invSpd


			//idx spdCnt
			//and (3)
			//sza
	
			//jmp downEx
			//idx invSpd


downEx,

			jmp .


rightTn,
			
			dap rtEx

			lac (0)
			dac invRgt
			
			lac (mxri)
			dac invXpo

			jsp moveDn

			
rtEx,	
			jmp .


leftTn,
			
			dap ltEx

			
			lac (1)
			dac invRgt


			lac (mxli)
			dac invXpo

			jsp moveDn

ltEx,	
			jmp .



drawInv,
			
			dap drawExit

			lac invRgt
			sza
			jmp goRight

goLeft,
			lac invXpo
			sub invSpd
			dac invXpo

			sub (mxli)
			spa
			jsp leftTn
			jmp nowDrIn


goRight,

			lac invXpo
			add invSpd
			dac invXpo

			sub (mxri)
			sma 
			jsp rightTn


nowDrIn,
			
			idx anmT
			sza flp

			jmp noflp

flp,
			
			lac (-100000)
			dac anmT

			lac invFr
			xor (1)
			dac invFr

noflp,
			lac invFr
			sza 
			jmp fra2

			law invadX
			dap currX

			law invadY
			dap currY

			law (lac invadX+invPt)
			dap loopCh

			jmp nowXY

fra2,		
	
			law inXD2
			dap currX

			law inYD2
			dap currY

			law (lac inXD2+invPt)
			dap loopCh

nowXY,
			law invXpo
			dap xPadd

			law invYpo
			dap yPadd

		
			jmp drawSprt


