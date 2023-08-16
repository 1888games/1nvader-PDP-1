
////ironic computer space  0.01  nl 2016-10-12

define initialize A,B
	law B
	dap A
	term

define index A,B,C
	idx A
	sas B
	jmp C
	term

define swap
	rcl 9s
	rcl 9s
	term

define load A,B
	lio (B
	dio A
	term

define setup A,B
	law i B
	dac A
	term

define count A,B
	isp A
	jmp B
	term

define random
	lac ran
	dac oldRan
	rar 1s
	xor (355670
	add (355670
	dac ran
	term

3/		jmp sbf				     // ignore seq. break
		jmp titScr				// start addr (4), jump to title screen


//routine to flush sequence breaks, if they occur.

sbf,	tyi
		lio 2
		lac 0
		lsm
		jmp i 1

mxri=670
mxli=-770
mxtp=730
mxht=550
shipPt=17
sh2Pt=17

startY=-757
bulPt=4
startX=-36
true=1
false=0

numPts=2
bbSpd=4
txtfl=7
title=1
game=0


decimal

ZERO=0
ONE=1
TWO=2
THREE=3
FOUR=4
FIVE=5
SIX=6
SEVEN=7
EIGHT=8
NINE=9
A=10
B=11
C=12
D=13
E=14
F=15
G=16
H=17
I=18
J=19
K=20
L=21
M=22
N=23
O=24
P=25
Q=26
R=27
S=28
T=29
U=30
V=31
W=32
X=33
Y=34
Z=35
Spc=50
Dash=36
Equ=37

octal


ran,		0			// random number
oldRan,		30			// previous random number

xPos,	    -30			// P1 X position
yPos,		30			// P1 Y position

xPos2,		0 			// P2 X position
yPos2,		0   		// P2 Y position

countr,		0 			// Frame counter

bulXpo,		0 			// P1 bullet X pos
bulX2,		0 		    // P2 bullet X pos

bulYpo,		0 			// P1 bullet Y pos
bulY2,		0 			// P2 bullet Y pos

bulHide, 	1 			// P1 bullet hide flag
bulHd2,		1 		    // P2 bullet hide flag

shipRgt,	1 			// P1 ship direction, 1=right, 0=elft
shipR2,		0 			// P2 ship direction


debo,		0 			// Debounce timer
aiOff,		0          
					    // P2 AI shooting
invXpo,		0 			// Invader X pos
invYpo,		0 			// Invader Y pos

didFire,	0 			// Did P1 press fire this frame
didF2,		0    		// Did P2 press fire

invFr,		0   		// Invader frame number
anmT,		0 		    // Invader anim timer
invSpd,		3 			// Invader speed


invRgt,		1 			// Invader direction, 1=right
invRow,		1 			// Invader row on screen

tmp1,		0 			// Temp variables for various calcs
tmp2,		0
tmp3,		0
tmp4,		0
  	
gmMode,		0 			// Current game mode (0=game, 1=title)
txtX,		0 			// X position for text to draw
txtY,		0 			// Y position for text to draw
txtId,		0 			// Character id to draw
txtCn,		0 			// Count of pixels to draw in char
numCn,		0 			// Count of chars to draw in string
txtSp,		0 			// Distance between text chars
flsh,		0  			// Title screen flash timerr
carry,		0 			// Carry flag for score calcs
hitCt,		0 			// Total hit count
spdAd,		0 			// Speed add to end game

scrP1,		0 			// Three digits for P1 score
			0
			0

scrP2,	
			0 			// Three digits for P2 score
			0
			0




// come here after pressing fire on title screen

rstrt,	lac (0)
		dac gmMode
		dac invFr

		jmp play


// come here upon startup and game over

play,

		// set player ship start positions

		lac (startY)
		dac yPos
		dac yPos2

		lac (startX-170)
		dac xPos
		lac (startX+170)
		dac xPos2


		// hide the bullets

		lac (true)
		dac bulHide
		dac bulHd2

		// set p2 and invader to go right

		lac (1)
		dac invRgt		
		dac shipR2

		// reset score, various other things

		lac (0)
		dac shipRgt
		dac invRow
		dac scrP1
		dac scrP1+1
		dac scrP1+2
		dac scrP2+1
		dac scrP2+2
		dac scrP2+0
		dac invXpo
		dac invFr
		dac didFire
		dac didF2
		dac hitCt
		dac spdAd

		// get invader start speed

		law spdTbl
		dap GetSpdb

		xct GetSpd
		add (bbSpd)
		dac invSpd


		// set invader start position

		lac (mxtp)
		sub (10)
		dac invYpo


		// debounce so player who pressed start doesn't fire stray bullet

		lac (-20)
		dac debo
	

		jmp main
	

200/
//main loop
main,	load \ict, -2		// initial instruction budget (delay)
		
		// check game mode

		lac gmMode
		sza
		jmp titl

// playing game

		// move the player ships 

		jsp moveShip
		jsp moveS2

		// check debounce flag, skip controls if not -1

		idx debo
		sza 
		jmp noFi

doCon,	

		jsp controls
		lac (-1)
		dac debo
		
		jsp checkFire
		jsp chckF2


noFi,
		// draw the player ships

		jsp drawShip				
		jsp drawS2

		jsp drawStar	// draw flickering stars
		jsp drawInv		// draw invader (and move)


		// move any alive bullets

		jsp moveBullt
		jsp moveB2

		// draw any alive bullets

		jsp drawBullet
		jsp drawB2

		// check bullet to invader collisions

		jsp checkCol
		jsp chckC2

		// go to end of main loop

		jmp endMn



titl,
		
		// draw invader on title screen

		jsp drawInv

		// check control debounce

		idx debo
		sza 
		jmp debou

okay,	

		jsp controls
		

		// no debounce needed after first timer

		lac (-1)
		dac debo


		// set ai to off as default

		lac (0)
		dac aiOff

		// check P1 start pressed, jmp to rstrt if true

		lac didFire
		sza
		jmp rstrt

		// ai will be on if 2P start

		lac (1)
		dac aiOff

		// check P2 start pressed, jmp to rstrt if true
		lac didF2
		sza
		jmp rstrt

debou,

		// no button pressed, do we draw title this 'frame'?
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

gmOver,
			
			lac gmMode
			sza
			jmp downEx

			lac (1)
			dac gmMode
			jmp titScr



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
			add spdAd
			dac invSpd


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

drawStar,
			
			dap drawExit

			lac countr
			and (15)
			sza
			jmp drawExit

			law shipX
			dap currX

			law shipX
			dap currY

				random

			law oldRan
			dap xPadd

			law ran
			dap yPadd

			//law	xPos
			//dap xPadd

			//law yPos
			//dap yPadd

			law (lac shipX+true)
			dap loopCh

			jmp drawSprt


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


decimal


// sprite definitions


// ships use two separate tables for X/Y
// numbers and letters use combined tables that go XYXYXY...

shipX,	
0
0
4
12
24
32
40
52
60
64
64
52
40
24
12


shipY,	
0
9
18
24
27
33
27
24
18
9
0
0
0
0
0



decimal

sh2Pt=17

shipY2,
0
9
18
24
33
24
18
9
0
3
9
9
9
3
3




shipX2,
0
6
12
18
21
24
30
36
42
33
27
21
15
9
21



octal

bulltX, 
0
3
0
3

bulltY,
0
5
13
20


decimal

invPt=37

invadX,

0
0
5
5
10
10

10
16
22
28
34
40
45

5
5
50
50

55
55
50
50
45
45


10
16
22
28
34
40
45

22
28
34

16
40
10
45


invadY,

24
32
16
22
8
16

28
28
28
28
28
28
28

0
0
0
0

24
32
16
22
8
16

16
16
16
16
16
16
16

22
22
22

34
34
40
40



inXD2,

0
0
5
5
10
10

10
16
22
28
34
40
45

16
22
34
40

55
55
50
50
45
45


10
16
22
28
34
40
45

22
28
34

16
40
10
45


inYD2,

8
16
16
22
8
16

28
28
28
28
28
28
28

0
0
0
0

8
16
16
22
8
16

16
16
16
16
16
16
16

22
22
22

34
34
40
40


dig1,
40
0
48
8
40
8
32
8
24
8
16
8
8
8
0
8


dig2,
48
0
48
8
40
16
32
16
24
8
16
0
8
0
0
16
0
8
0
0




dig3,
48
0
48
8
40
16
32
16
24
0
24
8
16
16
8
16
0
8
0
0

dig4,
48
0
40
0
32
0
24
0
24
8
48
16
40
16
32
16
24
16
16
16
8
16
0
16



dig5,
48
16
48
8
48
0
40
0
32
0
24
0
24
8
16
16
8
16
0
8
0
0


dig6,
24
8
40
16
48
8
40
0
32
0
24
0
16
16
16
0
8
16
8
0
0
8


dig8,
48
8
40
16
40
0
32
16
32
0
24
8
16
16
16
0
8
16
8
0
0
8


dig7,
48
0
48
8
48
16
40
16
32
16
24
8
16
8
8
8
0
8


dig0,
48
8
40
16
40
0
32
16
32
0
24
16
24
0
16
16
16
0
8
16
8
0
0
8




dig9,
48
8
40
0
32
0
24
8
40
16
32
16
24
16
16
16
8
16
0
8
0
0


digDt,
	dig0
	dig1
	dig2
	dig3
	dig4
	dig5
	dig6
	dig7
	dig8
	dig9
	digA
	digB
	digC
	digD
	digE
	digF
	digG
	digH
	digI
	digJ
	digK
	digL
	digM
	digN
	digO
	digP
	digQ
	digR
	digS
	digT
	digU
	digV
	digW
	digX
	digY
	digZ
	digDs
	digEq

digLn,
	12
	8
	10
	10
	12
	11
	11
	9
	11
	11
	14 
	14
	9
	14
	12
	10
	12
	15
	11
	9
	14
	9
	15
	14
	12
	11
	11
	14
	9
	9
	13
	12
	15
	13
	10
	11
	3
	6


digA,
24
8
0
16
8
16
16
16
24
16
32
16
40
16
48
8
40
0
32
0
24
0
16
0
8
0
0
0

digB,
24
8
0
8
8
16
16
16
32
16
40
16
48
8
48
0
40
0
32
0
24
0
16
0
8
0
0
0

digC,

48
16
48
8
40
0
32
0
24
0
16
0
8
0
0
16
0
8

digD,

8
0
16
0
24
0
32
0
40
0
48
0
48
8
40
16
32
16
24
16
16
16
8
16
0
8
0
0



digE,

48
16
48
8
48
0
40
0
32
0
24
8
24
0
16
0
8
0
0
16
0
8
0
0

digF,

48
16
48
8
48
0
40
0
32
0
24
8
24
0
16
0
8
0
0
0


digG,

48
16
48
8
40
0
32
0
24
0
16
0
8
0
24
16
16
16
8
16
0
16
0
8

digH,
48
16
48
0
40
16
40
0
32
16
32
0
24
16
24
8
24
0
16
16
16
0
8
16
8
0
0
16
0
0


digI,

48
16
48
8
48
0
40
8
32
8
24
8
16
8
8
8
0
16
0
8
0
0

digJ,
48
16
48
8
48
0
40
8
32
8
24
8
16
8
8
8
0
0



digK,
16
16
8
16
0
16
40
16
48
16
32
8
24
8
48
0
40
0
32
0
24
0
16
0
8
0
0
0

digL,
0
16
0
8
48
0
40
0
32
0
24
0
16
0
8
0
0
0


digM,
40
8
48
16
40
16
32
16
24
16
16
16
8
16
0
16
48
0
40
0
32
0
24
0
16
0
8
0
0
0


digN,

48
8
40
16
32
16
24
16
16
16
8
16
0
16
48
0
40
0
32
0
24
0
16
0
8
0
0
0

digO,
48
8
40
16
40
0
32
16
32
0
24
16
24
0
16
16
16
0
8
16
8
0
0
8

digP,

24
8
32
16
40
16
48
8
48
0
40
0
32
0
24
0
16
0
8
0
0
0

digQ,

48
8
40
16
40
0
32
16
32
0
24
16
24
0
16
16
16
0
8
8
0
16

digR,

24
8
48
8
40
16
32
16
16
16
8
16
0
16
48
0
40
0
32
0
24
0
16
0
8
0
0
0


digS,

48
8
40
16
40
0
32
0
24
8
16
16
8
16
8
0
0
8

digT,

48
16
48
0
48
8
40
8
32
8
24
8
16
8
8
8
0
8



digU,


0
8
48
16
40
16
32
16
24
16
16
16
8
16
48
0
40
0
32
0
24
0
16
0
8
0

digV,

48
16
40
16
32
16
24
16
16
16
48
0
40
0
32
0
24
0
16
0
8
8
0
8

digW,

0
16
0
0
8
8
48
16
40
16
32
16
24
16
16
16
8
16
48
0
40
0
32
0
24
0
16
0
8
0

digX,

24
8
48
16
40
16
32
16
16
16
8
16
0
16
48
0
40
0
32
0
16
0
8
0
0
0

digY,

48
16
40
16
32
16
48
0
40
0
32
0
24
8
16
8
8
8
0
8

digZ,


48
0
48
8
48
16
40
16
32
16
24
8
16
0
8
0
0
16
0
8
0
0

digDs,
24
16
24
8
24
0

digEq,
32
16
32
8
32
0
16
16
16
8
16
0





octal

// text strings

TgmNm,		
			
ONE
N
V
A
D
E
R
Spc
P
D
P
Dash
ONE


Tarl,

A
R
L
A
S
O
F
T
Spc
TWO
ZERO
TWO
THREE


Tscrs,

S
C
O
R
E
S

Tplyr,

P
L
A
Y
E
R



TIn1,

Z
Equ
P
ONE
Spc
F
I
R
E
Spc
Spc
ONE
P
Spc
G
A
M
E

TIn2,

M
Equ
P
TWO
Spc
F
I
R
E
Spc
Spc
TWO
P
Spc
G
A
M
E








	constants
	variables

	start 4