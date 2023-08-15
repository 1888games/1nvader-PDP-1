
titScr,

		// position the two player ships for the title screen

		lac (-600)
		dac xPos

		add (10)
		dac xPos2

		lac (-50)
		dac yPos

		lac (-200)
		dac yPos2

		// reset invader variables

		lac (0)
		dac invXpo
		dac invRow
		dac invFr

		// set invader Y at top of screen
		lac (mxtp)
		sub (10)
		dac invYpo

		// get invader initial speed

		law spdTbl
		dap GetSpdb

		xct GetSpd
		add (bbSpd)
		dac invSpd


		// set game mode to title

		lac (title)
		dac gmMode

		// setup title page flash interval

		lac (-txtfl)
		dac flsh

		// setup fire debounce timer

		lac (-100)
		dac debo

		// go to main loop

		jmp main


drwTi,


		dap titEx

		lac (60)
		dac txtSp

		lac (-15)
		dac numCn

		law TgmNm
		swap
		
		lac (-430)
		dac txtX

		lac (600)
		dac txtY

		jsp drNum


		lac (-15)
		dac numCn

		law Tarl
		swap

		lac (400)
		dac txtY


		lac (-430)
		dac txtX
		
		jsp drNum


		lac (-6)
		dac numCn

		law Tscrs
		swap

		lac (100)
		dac txtY


		lac (-170)
		dac txtX
		
		jsp drNum
		
		lac (-6)
		dac numCn

		law Tplyr
		swap

		lac (-50)
		dac txtY


		lac (-340)
		dac txtX
		
		jsp drNum


		lac (-50)
		dac txtY

		lac (130)
		dac txtX

		lac (1)
		dac txtId

		jsp drwDig


		lac (-6)
		dac numCn

		law scrP1
		swap

		lac (-50)
		dac txtY

		lac (-3)
		dac numCn

		lac (340)
		dac txtX
		
		jsp drNum



		lac (-6)
		dac numCn

		law Tplyr
		swap

		lac (-200)
		dac txtY


		lac (-340)
		dac txtX
		
		jsp drNum


		lac (-200)
		dac txtY

		lac (130)
		dac txtX

		lac (2)
		dac txtId

		jsp drwDig


		lac (-6)
		dac numCn

		law scrP2
		swap

		lac (-200)
		dac txtY

		lac (-3)
		dac numCn

		lac (340)
		dac txtX
		
		jsp drNum


		law TIn1
		swap

		lac (-500)
		dac txtY

		lac (-22)
		dac numCn

		lac (-640)
		dac txtX
		
		jsp drNum


		law TIn2
		swap

		lac (-650)
		dac txtY

		lac (-22)
		dac numCn

		lac (-640)
		dac txtX
		
		jsp drNum


		jsp drawShip
		jsp drawS2


titEx,

		jmp .