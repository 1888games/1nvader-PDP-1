
drawShip,

			dap drawExit

			law shipX
			dap currX

			law shipY
			dap currY

			law xPos
			dap xPadd

			law yPos
			dap yPadd

			law (lac shipX+shipPt)
			dap loopCh

			jmp drawSprt



moveShip,
			
			dap moveEx

			lac shipRgt
			sza
			jmp shRight

shLeft,		
	
			lac xPos
			sub (2)
			dac xPos

			jmp moveEx

shRight,

			lac xPos
			add (2)
			dac xPos

		
moveEx,	
			jmp .	




drawS2,

			dap drawExit

			law shipX2
			dap currX

			law shipY2
			dap currY

			law xPos2
			dap xPadd

			law yPos2
			dap yPadd

			law (lac shipX2+sh2Pt)
			dap loopCh

			jmp drawSprt



moveS2,
			
			dap moveE2

			lac shipR2
			sza
			jmp shR2

shL2,		
	
			lac xPos2
			sub (2)
			dac xPos2

			jmp moveE2

shR2,

			lac xPos2
			add (2)
			dac xPos2

		
moveE2,	
			jmp .	