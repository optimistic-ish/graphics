#include "gui.h"
#include <string>


unsigned int SCR_WIDTH=1100;
unsigned int SCR_HEIGHT=699;

glm::vec3 cameraPos   = glm::vec3(-0.5f, 0.0,  0.5f);
glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);
glm::vec3 cameraUp    = glm::vec3(0.0f, 1.0f,  0.0f);

float deltaTime = 0.0f;	// time between current frame and last frame
float lastFrame = 0.0f;

bool firstMouse = true;
bool mouseTrigger=false;
float yaw   = 0.0f;	// yaw is initialized to -90.0 degrees since a yaw of 0.0 results in a direction vector pointing to the right so we initially rotate a bit to the left.
float pitch =  0.0f;
float lastX =  800.0f / 2.0;
float lastY =  600.0 / 2.0;
float fov   =  45;
bool stashPreviousRender = false;

glm::mat4 directionRotationMatrix(1);


namespace GUI {
	
	GLFWwindow* window;
	bool shouldQuit = false;
	bool animationRenderWindowVisible = false;

	void init(GLFWwindow* window) {

		GUI::window = window;

		// Setup Dear ImGui context
		IMGUI_CHECKVERSION();
		ImGui::CreateContext();
		ImGuiIO& io = ImGui::GetIO(); (void)io;
		//io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;     // Enable Keyboard Controls
		//io.ConfigFlags |= ImGuiConfigFlags_NavEnableGamepad;      // Enable Gamepad Controls

		// io.Fonts->AddFontFromFileTTF("fontfilename", 15.0f);

		// Setup Dear ImGui style
		ImGui::StyleColorsDark();
		//ImGui::StyleColorsClassic();

		// Setup Platform/Renderer backends
		ImGui_ImplGlfw_InitForOpenGL(window, true);
		ImGui_ImplOpenGL3_Init("#version 130");
	}

	void cleanup() {
		ImGui_ImplOpenGL3_Shutdown();
		ImGui_ImplGlfw_Shutdown();
		ImGui::DestroyContext();
	}
    void windowUI(bool &show_another_window, float *radiusValue,float *centerValue)
    {        
        
        if (show_another_window)
        {
            ImGui::Begin("Control menu", &show_another_window);   // Pass a pointer to our bool variable (the window will have a closing button that will clear the bool when clicked)
            ImGui::Text("Hello from control window!");
            std::string temp="";
            ImGui::Text((temp.append(std::to_string(ImGui::GetIO().Framerate)).c_str()));
            if (ImGui::Button("Close Me"))
                show_another_window = false;
            for(int i=0;i<5;i++)
            {
                std::string sliderID="radius";
                sliderID.append(std::to_string(i));
                // ImGui::InputFloat3("Center",centerValue);
                ImGui::SliderFloat(sliderID.c_str(),&radiusValue[i],100.0f, 450.0f);
            }
                
            ImGui::End();
        }
    }
    void ImageUI(bool &showWindow, bool &print)
    {
        if(showWindow)
        {
            ImGui::Begin("Save Image", &showWindow);   // Pass a pointer to our bool variable (the window will have a closing button that will clear the bool when clicked)
            ImGui::Text("Print the ray traced image");
            if (ImGui::Button("print"))
                print=!print;
            
            ImGui::End();
        }
    }
    void render(bool *windowDraw, float *radiusValue, bool &print , float *center) {
        
		ImGui_ImplOpenGL3_NewFrame();
		ImGui_ImplGlfw_NewFrame();
		ImGui::NewFrame();

        windowUI(windowDraw[0], radiusValue, center);
		ImageUI(windowDraw[1], print);

		ImGui::Render();
		ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
	}

}

int windowCreation::windowInitialize()
{    
    glfwInit();
    window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "RAY_TRACER", NULL, NULL);
    if (window == NULL)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    glfwSetCursorPosCallback(window, mouse_callback);

    // glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

    // glad: load all OpenGL function pointers
    // ---------------------------------------
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }
    return 0;
}

void processInput(GLFWwindow *window)
{
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);

    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);

    // float cameraSpeed = static_cast<float>(2.5 * deltaTime);
    directionRotationMatrix = glm::rotate(glm::rotate(glm::mat4(1), pitch, glm::vec3(1, 0, 0)), yaw, glm::vec3(0, 1, 0));

    glm::vec3 forward = glm::vec3(glm::vec4(0, 0, -1, 0) * (directionRotationMatrix));

    glm::vec3 up(0, 1, 0);
    glm::vec3 right = glm::cross(forward, up);

    glm::vec3 movementDirection(0);
    float multiplier = 1;

    if (glfwGetKey(window, GLFW_KEY_W))
    {
        movementDirection += forward;
        stashPreviousRender = true;
    }
    if (glfwGetKey(window, GLFW_KEY_S))
    {
        movementDirection -= forward;
        stashPreviousRender = true;
    }
    if (glfwGetKey(window, GLFW_KEY_D))
    {
        movementDirection += right;
        stashPreviousRender = true;
    }
    if (glfwGetKey(window, GLFW_KEY_A))
    {
        movementDirection -= right;
        stashPreviousRender = true;
    }
    if (glfwGetKey(window, GLFW_KEY_SPACE))
    {
        movementDirection += up;
        stashPreviousRender = true;
    }
    if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT))
    {
        movementDirection -= up;
        stashPreviousRender = true;
    }
    if (glfwGetKey(window, GLFW_KEY_LEFT_CONTROL))
    {
        multiplier = 5;
    }

    if (glm::length(movementDirection) > 0.0f)
    {
        cameraPos += glm::normalize(movementDirection) * (float)deltaTime * (float)multiplier;
    }

    if (glfwGetKey(window, GLFW_KEY_M) == GLFW_PRESS)
    {
        mouseTrigger = !mouseTrigger;
        if (mouseTrigger == false)
            glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_NORMAL);
        else
            glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
    }
}

void mouse_callback(GLFWwindow* window, double xposIn, double yposIn)
{
    if(mouseTrigger)
    {

        float xpos = static_cast<float>(xposIn);
        float ypos = static_cast<float>(yposIn);

        if (firstMouse)
        {
            lastX = xpos;
            lastY = ypos;
            firstMouse = false;
        }

        float xoffset = xpos - lastX;
        float yoffset = ypos -lastY ; // reversed since y-coordinates go from bottom to top
        lastX = xpos;
        lastY = ypos;

        float sensitivity = 0.002f; // change this value to your liking
        xoffset *= sensitivity;
        yoffset *= sensitivity;

        yaw += xoffset;
        pitch += yoffset;

        // make sure that when pitch is out of bounds, screen doesn't get flipped
        if (pitch > 89.0f)
            pitch = 89.0f;
        if (pitch < -89.0f)
            pitch = -89.0f;

        // glm::vec3 front;
        // front.x = cos(glm::radians(yaw)) * cos(glm::radians(pitch));
        // front.y = sin(glm::radians(pitch));
        // front.z = sin(glm::radians(yaw)) * cos(glm::radians(pitch));
        // cameraFront = glm::normalize(front);
        // cameraPos += (glm::normalize(glm::cross(cameraFront, cameraUp))) * 0.01f;
        directionRotationMatrix = glm::rotate(glm::rotate(glm::mat4(1), pitch, glm::vec3(1, 0, 0)), yaw, glm::vec3(0, 1, 0));
        stashPreviousRender = true;
    }
}