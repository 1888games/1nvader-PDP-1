
drawB2,	


			dap drawExit

			lac bulHd2
			sza 
			jmp drawExit

			law bulltX
			dap currX

			law bulltY
			dap currY

			law bulX2
			dap xPadd

			law bulY2
			dap yPadd

			law (lac bulltX+bulPt)
			dap loopCh

			jmp drawSprt


TryAI,
			dap AIEx

			lac xPos2
			add (2000)
			dac tmp1

			lac invXpo
			add (2000)
			dac tmp2

			random
			and (177)
			add tmp1
			sub tmp2
			add (226)
			sub (454)
			spa
			jmp AIEx
			sub (454)
			spa
			jmp doFir2


AIEx,
			jmp .
		

chckF2,
			
			dap chckE2

			lac aiOff
			sza
			jmp noAI

			random
			and (377)
			sub (15)
			spa
			jsp TryAI


noAI,

			lac didF2
			xor (1)
			sza
			jmp chckE2


doFir2,
			lac bulHd2
			xor (1)
			sza
			jmp chckE2

			lac shipR2
			sza
			jmp goRt2

goLt2,
			lac (1)
			dac shipR2

			jmp dneLR2


goRt2,		
			lac (0)
			dac shipRgt
			

dneLR2,
			lac bulHd2
			sub (1)
			dac bulHd2

			lac yPos2
			add (30)
			dac bulY2

			lac xPos2
			add (36)
			dac bulX2

chckE2,	
			jmp .



bulO2,

			dap bulOE2

			idx bulHd2bb

bulOE2,
			jmp .


moveB2,

			dap mveBE2

			lac bulHd2
			sza
			jmp mveBE2

			lac bulY2
			add (10)
			dac bulY2
			sub (mxtp)
			sma

			jsp bulO2



mveBE2,
			jmp .




chckC2,

			dap colEx2

			lac bulHd2
			sza
			jmp colEx2

			lac invXpo
			add (2000)
			add (30)
			dac tmp1

			lac bulX2
			add (2000)
			dac tmp2

			lac invYpo
			add (2000)
			add (30)
			dac tmp3

			lac bulY2
			add (2000)
			dac tmp4

			lac tmp1
			sub tmp2
			add (37)
			spa
			jmp colEx2
			sub (77)
			sma
			jmp colEx2

PossX2,

			lac tmp3
			//sub (14)
			sub tmp4
			add (30)
			spa
			jmp colEx2
			sub (60)
			sma
			jmp colEx2




Hit2,
			
			jsp HitIt

			lac (1)
			dac bulHd2 

			jsp Incr2

colEx2,
			jmp .


HitIt,

			dap HitEx

			random
			and (1)
			dac invRgt

			random
			and (1777)
			sub (777)
			dac invXpo


			lac invYpo
			sub (mxht)
			sma
			jmp invOff

	
		

			lac invYpo
			add (165)
			dac invYpo

			lac GetSpd
			sub (3)
			dac GetSpd

			lac invRow
			sub (3)
			dac invRow

invDone,	
			
			idx hitCt
			sar 2s
			dac spdAd

			xct GetSpd
			add (bbSpd)
			add spdAd
			dac invSpd



HitEx,

			jmp .

