#include "sphere.h"

void sphere::clearArrays()
{
    std::vector<float>().swap(positions);
    std::vector<float>().swap(normals);
    std::vector<float>().swap(texCoords);
    std::vector<unsigned int>().swap(indices);    
}

void sphere::vertexData()
{
    float x, y, z, xy;                              // vertex position
    float nx, ny, nz, lengthInv = 1.0f / radius;    // vertex normal
    float s, t;                                     // vertex texCoord

    float sectorStep = 2 * 3.1415 / longitude;
    float stackStep = 3.1415 / lattitude;
    float sectorAngle, stackAngle;

    for(int i = 0; i <= lattitude; ++i)
    {
        stackAngle = 3.1415 / 2 - i * stackStep;        // starting from pi/2 to -pi/2
        xy = radius * cosf(stackAngle);             // r * cos(u)
        z = radius * sinf(stackAngle);              // r * sin(u)

        // add (longitude+1) positions per stack
        // first and last positions have same position and normal, but different tex coords
        for(int j = 0; j <= longitude; ++j)
        {
            sectorAngle = j * sectorStep;           // starting from 0 to 2pi

            // vertex position (x, y, z)
            x = xy * cosf(sectorAngle);             // r * cos(u) * cos(v)
            y = xy * sinf(sectorAngle);             // r * cos(u) * sin(v)
            positions.push_back(x);
            positions.push_back(y);
            positions.push_back(z);

            // normalized vertex normal (nx, ny, nz)
            nx = x * lengthInv;
            ny = y * lengthInv;
            nz = z * lengthInv;
            normals.push_back(nx);
            normals.push_back(ny);
            normals.push_back(nz);

            // vertex tex coord (s, t) range between [0, 1]
            s = (float)j / longitude;
            t = (float)i / lattitude;
            texCoords.push_back(s);
            texCoords.push_back(t);
        }
    }
}

void sphere::indexData()
{
    int k1, k2;
    for(int i = 0; i < lattitude; ++i)
    {
        k1 = i * (longitude + 1);     // beginning of current stack
        k2 = k1 + longitude + 1;      // beginning of next stack

        for(int j = 0; j < longitude; ++j, ++k1, ++k2)
        {
            // 2 triangles per sector excluding first and last stacks
            // k1 => k2 => k1+1
            if(i != 0)
            {
                indices.push_back(k1);
                indices.push_back(k2);
                indices.push_back(k1 + 1);
            }

            // k1+1 => k2 => k2+1
            if(i != (lattitude-1))
            {
                indices.push_back(k1 + 1);
                indices.push_back(k2);
                indices.push_back(k2 + 1);
            }
            
        }
    }
}
void sphere::vertexDataInSingleVector()
{
    std::vector<float>().swap(vertices);

    std::size_t i, j;
    std::size_t count = positions.size();
    for(i = 0, j = 0; i < count; i += 3, j += 2)
    {
        vertices.push_back(positions[i]);
        vertices.push_back(positions[i+1]);
        vertices.push_back(positions[i+2]);

        vertices.push_back(normals[i]);
        vertices.push_back(normals[i+1]);
        vertices.push_back(normals[i+2]);

        vertices.push_back(texCoords[j]);
        vertices.push_back(texCoords[j+1]);
    }
}