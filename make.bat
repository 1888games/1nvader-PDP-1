rem *********************************************************
rem IF YOU CHANGE THE ADDRESS OF YOUR MAIN LOOP
rem FROM 0200, YOU ALSO NEED TO UPDATE THE ENDOFMAINLOOP VALUE
rem IN HTML/MODULES/MYGAME.JS 
rem *********************************************************



rem make a copy of main.asm and move it to scripts folder

copy main.asm main_m.asm /b
move main_m.asm scripts/main.asm


rem combine all these files in the scripts folder to create
rem a single macro1 assembly file called main.mac
rem macros.asm and startup.asm must come first, end.asm last.

cd scripts
copy ^
macros.asm+^
startup.asm+^
constants.asm+^
ram.asm+^
main.asm+^
bullet.asm+^
bullet2.asm+^
title.asm+^
score.asm+^
ship.asm+^
invader.asm+^
stars.asm+^
sprite.asm+^
controls.asm+^
data.asm+^
end.asm ^   
main.mac /b

rem run main.mac through the macro1 PDP-1 assembler

cd ..
cd cmd
macro1 ../scripts/main.mac


rem tidy up and move the build files to build folder
cd..

cd scripts

move main.mac ../build/main.mac
move main.asm ../build/main.asm
move main.rim ../build/main.rim
move main.lst ../build/main.lst


rem convert the PDP-1 binary file into a base64 string representing a paper-tape
rem for use in the emulator

cd ..
cd cmd
base64convertcmd ../build/main.rim ../build/main.js

cd ..
cd build

rem insert the base64 string into the .js file that contains the paper-tape data

copy myGame_pre.js+main.js+myGame_post.js myGame.js /b

rem move the js file into the html folder so the emulator can reach it

move myGame.js ../html/modules/myGame.js

cd ..
cd html

rem kill any open windows (I use chrome for browsing so this is ideal)

taskkill /im "msedge.exe" /f

rem open in edge (I have edge set as default for .html files but not the default browser)

start index.html
