

rstrt,	lac (0)
		dac gmMode
		dac invFr


		jmp play

newGame,

		
		lac (-600)
		dac xPos

		add (10)
		dac xPos2

		lac (-50)
		dac yPos

		lac (-200)
		dac yPos2

		lac (0)
		dac invXpo
		dac invRow

		dac invFr

	
		law spdTbl
		dap GetSpdb

		xct GetSpd
		add (bbSpd)
		dac invSpd

		lac (mxtp)
		sub (10)
		dac invYpo


		lac (title)
		dac gmMode

		lac (-txtfl)
		dac flsh

		lac (-100)
		dac debo

		jmp main

play,
		lac (startY)
		dac yPos
		dac yPos2

		lac (true)
		dac bulHide
		dac bulHd2

		lac (startX-70)
		dac xPos

		lac (5)
		dac invSpd

		lac (1)
		dac invRgt	
		dac shipRgt

		lac (0)
		dac shipR2
		dac invRow
		dac scrP1
		dac scrP1+1
		dac scrP1+2
		dac scrP2+1
		dac scrP2+2
		dac scrP2+0
		dac invXpo
		dac invFr

		law spdTbl
		dap GetSpdb

		xct GetSpd
		add (bbSpd)
		dac invSpd

		lac (mxtp)
		sub (10)
		dac invYpo
	

		jmp main
	

170/
//main loop
main,	load \ict, -5		// initial instruction budget (delay)
		
		lac gmMode
		sza
		jmp titl

		jsp moveShip
		jsp moveS2

		jsp controls	
		jsp checkFire
		jsp chckF2

		jsp drawShip				
		jsp drawS2

		jsp drawStar
		jsp drawInv

		jsp moveBullt
		jsp moveB2

		jsp drawBullet
		jsp drawB2

		jsp checkCol
		jsp chckC2

		jmp endMn

titl,
		
		jsp drawInv

		idx debo
		sza 
		jmp debou

okay,	

		jsp controls
		

		lac (0)
		dac aiOff

		lac (-1)
		dac debo

		lac didFire
		sza
		jmp rstrt

		lac (1)
		dac aiOff

		lac didF2
		sza


		jmp rstrt
debou,
		idx flsh
		sza
		jmp endMn

		lac (-txtfl)
		dac flsh

		jsp drwTi

		


		
endMn,

		idx countr

		count \ict, .			// use up rest of time of main loop
		jmp main				// next frame 

