#include "../Dependencies/imgui/imgui.h"
#include "../Dependencies/imgui/imgui_impl_glfw.h"
#include "../Dependencies/imgui/imgui_impl_opengl3.h"
#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>


extern unsigned int SCR_WIDTH;
extern unsigned int SCR_HEIGHT;

extern glm::vec3 cameraPos   ;
extern glm::vec3 cameraFront ;
extern glm::vec3 cameraUp    ;

extern float deltaTime ;	// time between current frame and last frame
extern float lastFrame ;

extern bool firstMouse;
extern float yaw ;	// yaw is initialized to -90.0 degrees since a yaw of 0.0 results in a direction vector pointing to the right so we initially rotate a bit to the left.
extern float pitch;
extern float lastX;
extern float lastY;
extern float fov;
extern glm::mat4 directionRotationMatrix;


void framebuffer_size_callback(GLFWwindow *window, int width, int height);
void processInput(GLFWwindow *window);
void mouse_callback(GLFWwindow* window, double xpos, double ypos);

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

	void render(bool *draw, float *radiusValue,bool &print, float *center);
};

