#ifndef SHADER_H
#define SHADER_H

#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <string>
#include <fstream>
#include <sstream>
#include <iostream>

struct shaderSource
{
    std::string VertexShaderSource;
    std::string FragmentShaderSource;
};

struct shader
{
    unsigned int ID;
    std::string VertexShaderSource;
    std::string FragmentShaderSource;

    shaderSource parseShader(const std::string &filepath)
    {
        enum shaderType
        {
            NONE = -1,
            VERTEX = 0,
            FRAGMENT = 1
        };
        shaderType sourceType = shaderType::NONE; // type is none by default

        std::stringstream sst[2];
        try
        {
            std::ifstream stream(filepath); // path of the shader file
            std::string data;               // container to hold the scanned line from getline()

            while (getline(stream, data))
            {
                if (data.find("#shader") != std::string::npos) // find() returns position of the string if found, so if the position is valid we proceed
                {
                    if (data.find("vertex") != std::string::npos)
                    {
                        sourceType = VERTEX;
                    }
                    else if (data.find("fragment") != std::string::npos)
                    {
                        sourceType = FRAGMENT;
                    }
                }
                else
                {
                    sst[(int)sourceType] << data << '\n';
                }
            };
        }

        catch (std::ifstream::failure e)
        {
            std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
        }
        VertexShaderSource=sst[0].str();
        FragmentShaderSource=sst[1].str();

        return {sst[0].str(), sst[1].str()};
    }

    static int compileShader(unsigned int type, const std::string &source)
    {
        unsigned int id = glCreateShader(type);
        const char *src = source.c_str();
        glShaderSource(id, 1, &src, NULL);
        glCompileShader(id);

        int result;
        glGetShaderiv(id, GL_COMPILE_STATUS, &result);
        if (!result)
        {
            int length;
            glGetShaderiv(id, GL_INFO_LOG_LENGTH, &length);
            char *message = (char *)alloca(length * sizeof(char));
            glGetShaderInfoLog(id, length, &length, message);
            std::cout << "Failed to compile " << (type == GL_VERTEX_SHADER ? "vertex" : "fragment") << " shader" << std::endl;
            std::cout << message << std::endl;

            glDeleteShader(id);
            return 0;
        }

        return id;
    }
    
    void shaderCreation()
    {
        ID=createShader(VertexShaderSource,FragmentShaderSource);
    }

    static unsigned int createShader(const std::string &vertexShader, const std::string &fragmentShader)
    {
        unsigned int program = glCreateProgram();
        unsigned int vShader = compileShader(GL_VERTEX_SHADER, vertexShader);
        unsigned int fShader = compileShader(GL_FRAGMENT_SHADER, fragmentShader);

        glAttachShader(program, vShader);
        glAttachShader(program, fShader);
        glLinkProgram(program);

        int success;
        char infoLog[512];
        glGetProgramiv(program, GL_LINK_STATUS, &success);
        if (!success)
        {
            glGetProgramInfoLog(program, 512, NULL, infoLog);
            std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n"
                      << infoLog << std::endl;
        }
        glValidateProgram(program);

        glDeleteShader(vShader);
        glDeleteShader(fShader);        

        return program;
    }
    void useShader()
    {
        glUseProgram(ID);
    }

    void deleteShader()
    {
        glDeleteProgram(ID);
    }
    void setVal(std::string name, int value)
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
    }

};

#endif