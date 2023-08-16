# 1nvader-PDP-1
Port of the C64 game 1nvader for the PDP-1 computer from 1959, written in macro1 assembly.


To build on Windows just run the make.bat file, which will join the source files, assemble using macro1.exe, convert the binary to a base64 string and then insert it into the .js file that the emulator uses as a pretend paper-tape, then launch the html file.

For mac/linux you'll need to build macro.c that's in the cmd folder and convert the .bat file to an .sh file.

To use with other PDP-1 emulators or even the real thing (!) the binary file is called main.rim and is in the build folder.
