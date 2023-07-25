#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include<vector>

class sphere
{
public:
    float radius;
    std::vector<float> positions;
    std::vector<float> normals;
    std::vector<float> texCoords;
    std::vector<unsigned int> indices;
    std::vector<float> vertices;
    int lattitude;
    int longitude;


    float getRadius() const                 { return radius; }
    int getSectorCount() const              { return longitude; }
    int getStackCount() const               { return lattitude; }
    unsigned int getPositionCount() const     { return (unsigned int)positions.size() / 3; }
    unsigned int getNormalCount() const     { return (unsigned int)normals.size() / 3; }
    unsigned int getTexCoordCount() const   { return (unsigned int)texCoords.size() / 2; }
    unsigned int getIndexCount() const      { return (unsigned int)indices.size(); }

    unsigned int getVertexSize() const   { return (unsigned int)vertices.size() * sizeof(float); }
    const float* getVertexPointer() const     { return vertices.data(); }
    unsigned int getIndexSize() const       { return (unsigned int)indices.size() * sizeof(unsigned int); }
    const unsigned int* getIndices() const  { return indices.data(); }


    // unsigned int vertexCount() const 

    void vertexData();
    void indexData();
    void vertexDataInSingleVector();
    void GPUready();
    void clearArrays();


};

