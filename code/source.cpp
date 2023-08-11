#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include "gui.h"
#include "shader.h"

#define STB_IMAGE_IMPLEMENTATION
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image.h"
#include "stb_image_write.h"

const float vertices[] = {
    -1.0f,  1.0f,
     1.0f,  1.0f,
    -1.0f, -1.0f,
     1.0f,  1.0f,
    -1.0f, -1.0f,
     1.0f, -1.0f	
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
unsigned int VAO,VBO,EBO;
void pointSetUp(shader &shader)
{   
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    glBindVertexArray(VAO);

    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    // glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    // glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    // position attribute
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    // unsigned int vbo;
    // glGenBuffers(1, &vbo);
    // glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, vbo);
    // glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    
    shader.parseShader("shader/sphere.frag"); // reading the shader source code
    shader.shaderCreation();                        // creating shader from the shader source code
    shader.useShader();
}

int main()
{
    shader s1;
    windowCreation window;
    
    window.windowInitialize();
    GUI::init(window.window);
    bool show_another_window=true;
    bool print=false;
    // -----------

    
    float radius= 300;
    
    pointSetUp(s1);    
    s1.useShader();    
    
    while (!glfwWindowShouldClose(window.window))
    {
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;
        // input
        // -----
        // glm::vec2 random(randomFloat(),randomFloat());
        processInput(window.window);

        glClearColor(1.f, 0.f, 0.3, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        unsigned int resID = glGetUniformLocation(s1.ID, "iResolution");        
        glUniform2f(resID, (float)SCR_WIDTH,(float)SCR_HEIGHT);

        unsigned int radvID = glGetUniformLocation(s1.ID, "sphereRadius");
        glUniform1f(radvID, radius); 

        unsigned int cameraID = glGetUniformLocation(s1.ID, "cameraPosition");
        glUniform3fv(cameraID,1, glm::value_ptr(cameraPos)); 

        unsigned int directionID = glGetUniformLocation(s1.ID, "rotationMatrix");
        glUniformMatrix4fv(directionID,1, GL_TRUE,glm::value_ptr(directionRotationMatrix));
        // std::cout<<random.x<<" "<<random.y<<std::endl; 
        
       

        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES,0,6);
        
        // render
        // ------
        
        GUI::render(show_another_window,&radius, print);
        if(print)
        {
            saveImage("imageSaved.png",window.window);
            std::cout<<"Image saved"<<std::endl;
        }
            

        // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
        // -------------------------------------------------------------------------------
        glfwSwapBuffers(window.window);
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
    return 0;
}

