# 1nvader-PDP-1
Port of the C64 game 1nvader for the PDP-1 computer from 1959, written in macro1 assembly.


To build on Windows just run the make.bat file, which will join the source files, assemble using macro1.exe, convert the binary to a base64 string and then insert it into the .js file that the emulator uses as a pretend paper-tape, then launch the html file.

For mac/linux you'll need to build macro.c that's in the cmd folder and convert the .bat file to an .sh file.

To use with other PDP-1 emulators or even the real thing (!) the binary file is called main.rim and is in the build folder.

While I was learning the instruction set I put together this table that explains the most important instructions and where there is a 6502 equivalent or near-equivalent:

|	Load and Store	|	6502	|	Description	|	Notes
|	---------------------------------	|	---------------------------------	|	---------------------------------	|	---------------------------------
|	lac	|	lda	|	Load Accumulator with Y	|	
|	law	|	lda	|	Load Accumulator with N	|	Load immediate
|	dac	|	sta	|	Deposit Accumulator into Y	|	Store to memory
|	dap	|		|	Deposit Address Part into Y	|	Self-mod address of instruction
|	dip	|		|	Deposit Instruction Part into Y	|	Self-mod op code of instruction
|	lio	|	ldx	|	Load In-Out Register from Y	|	
|	dio	|	stx	|	Deposit In-Out Register to Y	|	
|	dzm	|		|	Deposit Zero to Y	|	Clear memory address
|	lap	|		|	Transfer PC to A	|	
|	cla	|		|	Clear Accumulator	|	
|	cli	|		|	Clear IO	|	
							
|	Mathematical Operations	|	6502	|	Description	|	Notes
|	---------------------------------	|	---------------------------------	|	---------------------------------	|	---------------------------------
|	add	|	adc	|	Add Y to A	|	
|	sub	|	sbc	|	Minus Y from A	|	
|	mul	|		|	Multiply A and Y into A and IO	|	
|	div	|		|	Divide AC/IO by Y, quotient into A, remainder IO	|	
|	and	|	and	|	And A with Y	|	
|	xor	|	eor	|	Xor A with Y	|	
|	ior	|	ora	|	Or A with Y	|	
|	cma	|		|	Complement	|	
							
|	Jump Instructions	|	6502	|	Description	|	Notes
|	---------------------------------	|	---------------------------------	|	---------------------------------	|	---------------------------------
|	jmp	|	jmp	|		|	
|	jsp	|	jsr	|	Jump and Save PC	|	Program counter stored in accumulator
|	jda	|		|	Jump and Deposit	|	Jumps to Y+1 and puts a in Y as a parameter
|	xct	|		|	Execute	|	Execute instruction outside program flow
							
|	Branch Instructions	|	6502	|	Description	|	Notes
|	---------------------------------	|	---------------------------------	|	---------------------------------	|	---------------------------------
|	idx	|	inc	|	Increment Y	|	
|	isp	|	inc, beq	|	Increment Y skip if now positive	|	Loops are done by using negative numbers!
|	sad	|	cmp, bne	|	Skip if A & Y different	|	Skips next instruction if not equal
|	sas	|	cmp, beq	|	Skip if A & Y equal	|	Skips next instruction if equal
|	sza	|	beq	|	Skip if A zero	|	
|	spa	|	bpl	|	Skip if plus	|	
|	sma	|	bmi	|	Skip if minus	|	
|	szo	|	bcc	|	Skip on zero overflow	|	
|	spi	|	cmp IO, bpl	|	Skip on IO positive	|	
|	szs	|	cmp SW, beq	|	Skip if switch is zero	|	
|	szf	|		|	Skip on zero program flag	|	Addresses 0001 to 0007
							
|	Shift Operations	|	6502	|	Description	|	Notes
|	---------------------------------	|	---------------------------------	|	---------------------------------	|	---------------------------------
|	rar	|	ror	|	Rotate A right	|	
|	ral	|	rol	|	Rotate A left	|	
|	sar	|	asr	|	Shift A right	|	
|	sal	|	asl	|	Shift A left	|	
|		|		|		|	
|	rir	|		|	Rotate IO right	|	
|	ril	|		|	Rotate IO left	|	
|	sir	|		|	Shift IO right	|	
|	sil	|		|	Shift IO left	|	
|		|		|		|	
|	rcr	|		|	Rotate both right	|	
|	rcl	|		|	Rotate both left	|	
|	scr	|		|	Shift both right	|	
|	scl	|		|	Shift rotate left	|	


