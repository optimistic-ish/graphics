
# Compile and link the program
# g++ -o test code/source.cpp code/gui.cpp Dependencies/glad.c Dependencies/imgui/*.cpp  -lglfw -lGL -lX11 -lpthread -lXrandr -lXi -ldl
g++ -g -I./Dependencies/include -I./imgui -o test code/source.cpp code/gui.cpp Dependencies/glad.c Dependencies/imgui/*.cpp -lglfw -lGL -lX11 -lpthread -lXrandr -lXi -ldl

# Run the program
./test