#shader vertex
#version 330 core
layout (location=0) in vec2 vertexPos;

void main() {	
	gl_Position = vec4(vertexPos.xy, 1.0, 1.0);
}

#shader fragment
#version 330 core
out vec4 FragColor;



struct ray {
	vec3 origin;
	vec3 direction;
};


float hit_sphere(const vec3 center, float radius, const ray r) {
    vec3 oc = r.origin - center;
    float a = dot(r.direction, r.direction);
    float b = dot(oc, r.direction);
    float c = dot(oc, oc) - radius*radius;
    float discriminant = b*b - a*c;
    if (discriminant < 0) {
        return -1.0;
    } else {
        return (-b - sqrt(discriminant) ) / a;
    }
}

void main()
{
    // Manual resolution (800x600)
    vec2 iResolution = vec2(800.0, 800.0);

    // Normalized screen coordinates (-1 to 1)
    vec2 screenCoords = (gl_FragCoord.xy * 2.0 - iResolution) / iResolution;

    // Aspect ratio correction
    float aspectRatio = iResolution.x / iResolution.y;
    screenCoords.x *= aspectRatio;

    // Ray origin (camera position)
    vec3 cameraPosition = vec3(0.0, 0.0, 10.0);

    // Ray direction (pointing from camera to screen coordinates)
    ray r;
    r.origin = cameraPosition;
    r.direction = normalize(vec3(screenCoords, -1.0) - cameraPosition);

    // Sphere properties (centered at the origin)
    vec3 sphereCenter = vec3(0.0, 0.0, 0.0);
    float sphereRadius = 0.5; // Adjust the sphere radius as needed

    // if (hit_sphere(sphereCenter, sphereRadius, r))
    // FragColor = vec4(1.0, 0.0, 0.0, 0.0); // Red if there's an intersection
    // else
    // FragColor = vec4(1.0, 1.0, 1.0, 0.0); // White otherwise


    float t = hit_sphere(sphereCenter, sphereRadius, r);
    if (t > 0.0) {
        vec3 N = normalize(r.origin+r.direction*t - sphereCenter);
        FragColor = vec4(0.5*N.x+0.5, 0.5*N.y+0.5, 0.5*N.z+0.5,1.0);
    }
    else
    {
        vec3 unit_direction = normalize(r.direction);
        t = 0.5*(unit_direction.y + 1.0);
        FragColor = vec4(1-0.5*t,1-0.3*t,1.0,1.0);
    }
    
}