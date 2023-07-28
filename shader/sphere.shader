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


bool hit_sphere(vec3 center, float radius, const ray r) 
{
    float t = dot(center - r.origin, r.direction);
	vec3 p = r.origin + r. direction * t;

	float y = length(center - p);
	if (y < radius) { 
		float x =  sqrt(radius*radius - y*y);
		float t1 = t-x;
		if (t1 >  0) {			
			return true;
		}

	}
	
	return false;
}

void main()
{
    // Manual resolution (800x600)
    vec2 iResolution = vec2(800.0, 600.0);

    // Normalized screen coordinates (-1 to 1)
    vec2 screenCoords = (gl_FragCoord.xy * 2.0 - iResolution) / iResolution;

    // Aspect ratio correction
    float aspectRatio = iResolution.x / iResolution.y;
    screenCoords.x *= aspectRatio;

    // Ray origin (camera position)
    vec3 cameraPosition = vec3(0.0, 0.0, 3.0);

    // Ray direction (pointing from camera to screen coordinates)
    ray r;
    r.origin = cameraPosition;
    r.direction = normalize(vec3(screenCoords, -1.0) - cameraPosition);

    // Sphere properties (centered at the origin)
    vec3 sphereCenter = vec3(0.0, 0.0, 0.0);
    float sphereRadius = 0.5; // Adjust the sphere radius as needed

    if (hit_sphere(sphereCenter, sphereRadius, r))
    FragColor = vec4(1.0, 0.0, 0.0, 0.0); // Red if there's an intersection
    else
    FragColor = vec4(1.0, 1.0, 1.0, 0.0); // White otherwise
}