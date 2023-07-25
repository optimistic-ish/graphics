#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include "gui.h"
#include "shader.h"
#include "sphere.h"



void pointSetUp(shader &shader,unsigned int &buffer)
{
     float positions[]={
        // positions         // colors
        0.5f, -0.5f, 0.0f,  1.0f, 0.0f, 0.0f,   // bottom right
        -0.5f, -0.5f, 0.0f,  0.0f, 1.0f, 0.0f,   // bottom left
        0.0f,  0.5f, 0.0f,  0.0f, 0.0f, 1.0f    // top 
    };

    unsigned int indices[]={
        0,1,2
    };

    float colour[]={.0f,.0f,.0f,1.0f};

    
    glGenBuffers(1, &buffer);
    glBindBuffer(GL_ARRAY_BUFFER, buffer);
    glBufferData(GL_ARRAY_BUFFER, sizeof(positions), positions, GL_STATIC_DRAW);

    //position attribute
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    // color attribute
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3* sizeof(float)));
    glEnableVertexAttribArray(1);


    unsigned int vbo;
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, vbo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    
    shader.parseShader("code/shader/base.shader"); // reading the shader source code

    shader.shaderCreation();                        // creating shader from the shader source code
    shader.useShader();
}

int main()
{
    windowCreation window;
    sphere sphere;
    window.windowInitialize();
    GUI::init(window.window);
    bool show_another_window=true;
    // -----------

    unsigned int vaoId;
    glGenVertexArrays(1, &vaoId);
    glBindVertexArray(vaoId);

    // create VBO to copy interleaved vertex data (V/N/T) to VBO
    unsigned int vboId;
    glGenBuffers(1, &vboId);
    glBindBuffer(GL_ARRAY_BUFFER, vboId);           // for vertex data
    glBufferData(GL_ARRAY_BUFFER,                   // target
                sphere.getVertexSize(), // data size, # of bytes
                sphere.getVertexPointer(),   // ptr to vertex data
                GL_STATIC_DRAW);                   // usage

    // create VBO to copy index data to VBO
    unsigned int iboId;
    glGenBuffers(1, &iboId);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, iboId);   // for index data
    glBufferData(GL_ELEMENT_ARRAY_BUFFER,           // target
                sphere.getIndexSize(),             // data size, # of bytes
                sphere.getIndices(),               // ptr to index data
                GL_STATIC_DRAW);                   // usage

    // activate attrib arrays
    glEnableVertexAttribArray(0);
    glEnableVertexAttribArray(1);
    glEnableVertexAttribArray(2);

    // set attrib arrays with stride and offset
    int stride = 32;     
    glVertexAttribPointer(0, 3, GL_FLOAT, false, stride, (void*)0);
    glVertexAttribPointer(1, 3, GL_FLOAT, false, stride, (void*)(sizeof(float)*3));
    glVertexAttribPointer(2,  2, GL_FLOAT, false, stride, (void*)(sizeof(float)*6));

    while (!glfwWindowShouldClose(window.window))
    {
        // input
        // -----

        processInput(window.window);

        glClearColor(1.f, 0.f, 0.3, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        


        
        
        
        // render
        // ------
        
        GUI::render(show_another_window);

        // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
        // -------------------------------------------------------------------------------
        glfwSwapBuffers(window.window);
        glfwPollEvents();
    }
    
    

    // glfw: terminate, clearing all previously allocated GLFW resources.
    // ------------------------------------------------------------------
    glfwTerminate();
    GUI::cleanup();
    return 0;
}

