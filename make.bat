copy main.asm main_m.asm /b
move main_m.asm scripts/main.asm


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


cd ..
cd cmd
macro1 ../scripts/main.mac

cd..

cd scripts

move main.mac ../build/main.mac
move main.asm ../build/main.asm
move main.rim ../build/main.rim
move main.lst ../build/main.lst

cd ..
cd cmd
base64convertcmd ../build/main.rim ../build/main.js

cd ..
cd build

copy myGame_pre.js+main.js+myGame_post.js myGame.js /b

move myGame.js ../html/modules/myGame.js

cd ..
cd html

taskkill /im "msedge.exe" /f

start index.html
