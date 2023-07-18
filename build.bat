@echo off
setlocal
path = dll; %PATH%
g++ -g -IDependencies/include -LDependencies/lib -o test code/source.cpp code/gui.cpp Dependencies/glad.c Dependencies/imgui/*.cpp -lglfw3 -lopengl32 -lgdi32 -limm32
.\test.exe
del test.exe

