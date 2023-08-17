#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include "gui.h"
#include "shader.h"

#define STB_IMAGE_IMPLEMENTATION
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image.h"
#include "stb_image_write.h"

float vertices[] = { // vertex attributes for a quad that fills the entire screen in Normalized Device Coordinates.
        // positions   // texCoords
        -1.0f,  1.0f,  0.0f, 1.0f,
        -1.0f, -1.0f,  0.0f, 0.0f,
         1.0f, -1.0f,  1.0f, 0.0f,

        -1.0f,  1.0f,  0.0f, 1.0f,
         1.0f, -1.0f,  1.0f, 0.0f,
         1.0f,  1.0f,  1.0f, 1.0f
};
void saveImage(const char* filepath, GLFWwindow* w) 
{
    int width, height;
    glfwGetFramebufferSize(w, &width, &height);
    GLsizei nrChannels = 3;
    GLsizei stride = nrChannels * width;
    stride += (stride % 4) ? (4 - stride % 4) : 0;
    GLsizei bufferSize = stride * height;
    unsigned char* byteBuffer = new unsigned char[bufferSize];
    glPixelStorei(GL_PACK_ALIGNMENT, 4);
    glReadBuffer(GL_FRONT);
    glReadPixels(0, 0, width, height, GL_RGB, GL_UNSIGNED_BYTE, byteBuffer);
    stbi_flip_vertically_on_write(true);
    stbi_write_png(filepath, width, height, nrChannels, byteBuffer, stride);
}
unsigned int VAO,VBO,EBO, FBO;

    unsigned int framebuffer;
    unsigned int textureColorbuffer;
    bool discardBuffer = false;

void pointSetUp(shader &shader)
{   
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    glBindVertexArray(VAO);

    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), &vertices, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
    glEnableVertexAttribArray(1);
   
    shader.parseShader("shader/sphere.frag"); // reading the shader source code
    shader.shaderCreation();                        // creating shader from the shader source code
    shader.useShader(); 
    shader.setVal("screenTexture", 0);
}
void framebuffer_size_callback(GLFWwindow *window, int width, int height)
{
    // make sure the viewport matches the new window dimensions; note that width and
    // height will be significantly larger than specified on retina displays.

    glViewport(0, 0, width, height);

    SCR_HEIGHT = height;
    SCR_WIDTH = width;
    glBindTexture(GL_TEXTURE_2D, textureColorbuffer);

    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, SCR_WIDTH, SCR_HEIGHT, 0, GL_RGBA, GL_FLOAT, NULL);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textureColorbuffer, 0);
    discardBuffer = true;
}
int main()
{
    shader s1;
    windowCreation window;
    
    window.windowInitialize();
    GUI::init(window.window);
    int widgetSize=2;
    bool showWindow[2]={true,true};
    bool print=false;
    // -----------
    
    
    float radius[5]= {100,100,100,100,100};
    float center[15]={0.0,0.05,1.0,0.4,0.1,1.0,0.6, 0.1, 1.0,-0.4,0.1,1.0,0.2,0.1,1.0};
    
    pointSetUp(s1);    
    s1.useShader();
    
    // framebuffer configuration
    // -------------------------
    glGenFramebuffers(1, &framebuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
    // create a color attachment texture
    glGenTextures(1, &textureColorbuffer);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, textureColorbuffer);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, SCR_WIDTH, SCR_HEIGHT, 0, GL_RGBA, GL_FLOAT, NULL);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textureColorbuffer, 0);

    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE)
    {
        std::cout << "ERROR::FRAMEBUFFER:: Framebuffer is not complete!" << std::endl;
        return -1;
    }
    glBindFramebuffer(GL_FRAMEBUFFER, 0);

    glViewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
    glDisable(GL_DEPTH_TEST);
    int unitsOfFrame{0};

    while (!glfwWindowShouldClose(window.window))
    {
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;
        // input
        // -----
        // glm::vec2 random(randomFloat(),randomFloat());
        processInput(window.window);

        glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);

        unsigned int seedLoc = glGetUniformLocation(s1.ID, "seed");
        unsigned int screenOrBufferLoc = glGetUniformLocation(s1.ID, "screenOrBuffer");
        unsigned int unitsOfFrameLoc = glGetUniformLocation(s1.ID, "unitsOfFrame");

        glUniform1f(seedLoc, currentFrame); // giving time to give proper seed
        glUniform1i(screenOrBufferLoc, 0);  // 0 indicated we are drawing on buffer and not on screen

        unsigned int resID = glGetUniformLocation(s1.ID, "iResolution");
        glUniform2f(resID, (float)SCR_WIDTH, (float)SCR_HEIGHT);

        glUniform1fv(glGetUniformLocation(s1.ID, "sphereRadius"), 5, radius);

        unsigned int cameraID = glGetUniformLocation(s1.ID, "cameraPosition");
        glUniform3fv(cameraID, 1, glm::value_ptr(cameraPos));

        unsigned int directionID = glGetUniformLocation(s1.ID, "rotationMatrix");
        glUniformMatrix4fv(directionID, 1, GL_TRUE, glm::value_ptr(directionRotationMatrix));
        // std::cout<<random.x<<" "<<random.y<<std::endl;

        if (discardBuffer)
        {
            unitsOfFrame = 0;
            discardBuffer = false;
        }
        if(stashPreviousRender){
            unitsOfFrame = 0;
            stashPreviousRender = false;
        }
        glUniform1i(unitsOfFrameLoc, unitsOfFrame);//Update the value to 0 in case it was changed
        // DRAW INTO TEXTURE ATTACHED TO FBO
        glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 6);
        unitsOfFrame++;
        // std::cout << "UNITS OF FRAME:" << unitsOfFrame <<std::endl;

        // NOW DRAW TO SCREEN
        glBindFramebuffer(GL_FRAMEBUFFER, 0); // default
        glClearColor(0.0, 1.0f, 1.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        glUniform1i(screenOrBufferLoc, 1); // we are drawing to buffer  given by screen so set the value to true/1
        glUniform1i(unitsOfFrameLoc, unitsOfFrame);
        glDrawArrays(GL_TRIANGLES, 0, 6);

        if(print)
        {
            print=!print;
            showWindow[0]=false;showWindow[1]=false;
            GUI::render(showWindow, radius, print,center);            
            glfwSwapBuffers(window.window);            
            saveImage("imageSaved.png",window.window);
            std::cout<<"Image saved"<<std::endl;
            showWindow[0]=true;showWindow[1]=true;
        }
        else
        {
            GUI::render(showWindow, radius, print,center);
            glfwSwapInterval(1);
            glfwSwapBuffers(window.window);  

        }            

        // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
        // -------------------------------------------------------------------------------
        
        glfwPollEvents();
    }

    // glfw: terminate, clearing all previously allocated GLFW resources.
    // ------------------------------------------------------------------
    glfwTerminate();
    GUI::cleanup();
    s1.deleteShader();
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);
    glDeleteFramebuffers(1, &framebuffer);
    return 0;
}
