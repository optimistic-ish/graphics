#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include "gui.h"
#include "shader.h"
// #include <random>

// inline float randomFloat() {
//     static std::uniform_real_distribution<float> distribution(0.0, 1.0);
//     static std::mt19937 generator;
//     return distribution(generator);
// }


const float vertices[] = {
    -1.0f,  1.0f,
     1.0f,  1.0f,
    -1.0f, -1.0f,
     1.0f,  1.0f,
    -1.0f, -1.0f,
     1.0f, -1.0f	
};
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
    
    shader.parseShader("shader/sphere.shader"); // reading the shader source code
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
    // -----------

    
    float radius= 300;
    
    pointSetUp(s1);    
    s1.useShader();    
    
    while (!glfwWindowShouldClose(window.window))
    {
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

        // unsigned int randomID = glGetUniformLocation(s1.ID, "random");
        // glUniform2fv(randomID,1,glm::value_ptr(random));
        // std::cout<<random.x<<" "<<random.y<<std::endl; 
        
       

        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES,0,6);
        
        // render
        // ------
        
        GUI::render(show_another_window,&radius);

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

