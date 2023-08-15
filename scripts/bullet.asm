

drawBullet,	


			dap drawExit

			lac bulHide
			sza 
			jmp drawExit

			law bulltX
			dap currX

			law bulltY
			dap currY

			law bulXpo
			dap xPadd

			law bulYpo
			dap yPadd

			law (lac bulltX+bulPt)
			dap loopCh

			jmp drawSprt

		

checkFire,
			
			dap checkExit

			lac didFire
			xor (1)
			sza
			jmp checkExit

			lac bulHide
			xor (1)
			sza
			jmp checkExit

			lac shipRgt
			sza
			jmp goRt

goLt,
			lac (1)
			dac shipRgt

			jmp doneLR


goRt,		
			lac (0)
			dac shipRgt
			

doneLR,
			lac bulHide
			sub (1)
			dac bulHide

			lac yPos
			add (30)
			dac bulYpo

			lac xPos
			add (36)
			dac bulXpo

checkExit,	
			jmp .



bulOff,

			dap bulOEx

			idx bulHide

bulOEx,
			jmp .


moveBullt,

			dap moveBEx

			lac bulHide
			sza
			jmp moveBEx

			lac bulYpo
			add (10)
			dac bulYpo
			sub (mxtp)
			sma

			jsp bulOff



moveBEx,
			jmp .




checkCol,

			dap colEx

			lac bulHide
			sza
			jmp colEx

			lac invXpo
			add (2000)
			add (30)
			dac tmp1

			lac bulXpo
			add (2000)
			dac tmp2

			lac invYpo
			add (2000)
			add (30)
			dac tmp3

			lac bulYpo
			add (2000)
			dac tmp4

			lac tmp1
			sub tmp2
			add (37)
			spa
			jmp colEx
			sub (77)
			sma
			jmp colEx

PossX,

			lac tmp3
			//sub (14)
			sub tmp4
			add (30)
			spa
			jmp colEx
			sub (60)
			sma
			jmp colEx



GetSpd,		lac	.


Hit,
			
			jsp HitIt


			lac (1)
			dac bulHide 

			jsp Incr1

colEx,
			jmp .


invOff,
			

			lac (mxtp)
			sub (10)
			dac invYpo

			law spdTbl
			dap GetSpd

			jmp invDone


decimal


spdTbl,
			2
			3
			3
			3
			4
			4
			4
			5
			5
			5
			5
			6
			6
			6
			6
			7
			7
			7
			7
			8
			8
			8
			8
			9
			9
			10
			10
			10
			10
			10
			



octal