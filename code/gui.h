#include "../Dependencies/imgui/imgui.h"
#include "../Dependencies/imgui/imgui_impl_glfw.h"
#include "../Dependencies/imgui/imgui_impl_opengl3.h"
#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>

const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 800;

void framebuffer_size_callback(GLFWwindow *window, int width, int height);
void processInput(GLFWwindow *window);

struct windowCreation
{
    
    GLFWwindow *window;

    int windowInitialize();
};


namespace GUI {
	extern GLFWwindow* window;
	extern bool shouldQuit;
	extern bool animationRenderWindowVisible;

	void init(GLFWwindow* window);
	void cleanup();

	void render(bool &draw);
};

