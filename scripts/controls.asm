
rightMax,
			
			dap maxExit

			lac (mxri)
			dac xPos

			lac (0)
			dac shipRgt

maxExit,
			jmp .



leftMax,
			
			dap leftExit

			lac (mxli)
			dac xPos

			lac (1)
			dac shipRgt

leftExit,
			jmp .




righM2,
			
			dap maxEx2

			lac (mxri)
			dac xPos2

			lac (0)
			dac shipR2

maxEx2,
			jmp .



leftM2,
			
			dap leftE2

			lac (mxli)
			dac xPos2

			lac (1)
			dac shipR2

leftE2,
			jmp .





controls,
			dap contExit

			//dzm didFire

			cli
			iot 11


			cla
			ril 2s
			spi
			add (1)
			dac didF2
			
			cla
			ril 1s
			spi
			add (1)
			dac didFire		

			lac xPos
			sub (mxri)
			sma 
			jsp rightMax

			lac xPos
			sub (mxli)
			spa

			jsp leftMax


			lac xPos2
			sub (mxri)
			sma 
			jsp righM2

			lac xPos2
			sub (mxli)
			spa

			jsp leftM2


contExit,
			jmp .

