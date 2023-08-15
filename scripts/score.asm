


drNum,
	
	dap digEx
	swap
	dap digAd

digAd,

	lac	.
	dac txtId

	sub (62)
	sza 
	jmp digDo
	jmp digSk

digDo,	
	jsp drwDig


digSk,
	lac txtX
	add txtSp
	dac txtX

	idx digAd
	idx numCn

	sza 
	jmp digAd




digEx,

	jmp .




Incr1,
			
			dap IncEx

			lac (0)
			dac carry

			lac scrP1+2
			add carry
			add (1)
			dac scrP1+2
			sub (12)
			spa
			jmp NoWr1

			lac scrP1+2
			sub (12)
			dac scrP1+2

			idx carry

NoWr1,
			lac scrP1+1
			add carry
			dac scrP1+1

			lac (0)
			dac carry

			lac scrP1+1
			sub (12)
			spa
			jmp NoWr2

			lac scrP1+1
			sub (12)
			dac scrP1+1

			idx carry

NoWr2,
			lac scrP1+0
			add carry
			dac scrP1+0

			

NoWr3,

IncEx,

		jmp .		



Incr2,
			
			dap IncE2

			lac (0)
			dac carry

			lac scrP2+2
			add carry
			add (1)
			dac scrP2+2
			sub (12)
			spa
			jmp NoW12

			lac scrP2+2
			sub (12)
			dac scrP2+2

			idx carry

NoW12,
			lac scrP2+1
			add carry
			dac scrP2+1

			lac (0)
			dac carry

			lac scrP2+1
			sub (12)
			spa
			jmp NoW22

			lac scrP2+1
			sub (12)
			dac scrP2+1

			idx carry

NoW22,
			lac scrP2+0
			add carry
			dac scrP2+0

			
IncE2,

		jmp .		