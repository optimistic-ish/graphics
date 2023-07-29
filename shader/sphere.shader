#shader vertex
#version 330 core
layout (location=0) in vec2 vertexPos;

void main() {	
	gl_Position = vec4(vertexPos.xy, 1.0, 1.0);
}

#shader fragment
#version 330 core

#define PI  3.1415926535
#define SAMPLING_DEPTH 5
out vec4 FragColor;
uniform float sphereRadius; // Adjust the sphere radius as needed
uniform vec2 iResolution; // Resolution as per the changes by user
uniform vec2 random;
uniform vec3 cameraPosition;
uniform mat4 rotationMatrix;

struct Object {	
	vec3 center;
	vec3 radius;	
};

struct ray {
	vec3 origin;
	vec3 direction;
};


float hit_sphere(const vec3 center, float radius, const ray r) {
    vec3 oc = r.origin - center;
    float a = dot(r.direction, r.direction);
    float b = dot(oc, r.direction);//half b
    float c = dot(oc, oc) - radius*radius;
    float discriminant = b*b - a*c;
    if (discriminant < 0) {
        return -1.0;
    } else {
        return (-b - sqrt(discriminant) ) / a;
    }
}

float rand(vec2 co){
  co.x =  fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  co.y =  fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  return co.x;
}

vec3 random_in_unit_sphere(vec2 seed) {
    float phi = 2.0 * PI * rand(seed);
    float cosTheta = 2.0 * rand(seed) - 1.0;
    float u = rand(seed);

    float theta = acos(cosTheta);
    float r = pow(u, 1.0 / 3.0);

    float x = r * sin(theta) * cos(phi);
    float y = r * sin(theta) * sin(phi);
    float z = r * cos(theta);

    return vec3(x, y, z);
}
vec3 computeColor(vec3 P , vec3 n)
{
    vec3 target = P + n + random_in_unit_sphere(P.xy);
    return vec3(target.xyz);
}

void main() 
{
    // Manual resolution (800x600)
    

    // Normalized screen coordinates (-1 to 1)
    vec2 screenCoords = (gl_FragCoord.xy * 2.0 - iResolution) / iResolution;

    // Aspect ratio correction
    float aspectRatio = iResolution.x / iResolution.y;
    screenCoords.x *= aspectRatio;

    // Ray origin (camera position)
    // cameraPosition = vec3(0.0, 0.0, 10.0);

    // Ray direction (pointing from camera to screen coordinates)
    ray r;
    r.origin = cameraPosition;
    vec3 try=vec3(screenCoords, -1.0) - cameraPosition;
    r.direction=(normalize(vec4(try, 0.0)) * rotationMatrix).xyz;
    // r.direction = normalize(vec3(screenCoords, -1.0) - cameraPosition);

    // Sphere properties (centered at the origin)
    vec3 sphereCenter = vec3(0.0, 0.0, 0.0);
    //Background sphere
    vec3 backgroundCenter=vec3(0.0,-2.7,0.0);
    float backgroundRadius=2.8;

    float t= hit_sphere(backgroundCenter, backgroundRadius, r);
    if(t>0.0){
        vec3 P = r.origin+r.direction*t;
        vec3 N = normalize(P- sphereCenter);

        vec4 temp = vec4(computeColor(P, N),1.0);
        FragColor = vec4(temp.x,temp.y+0.9,temp.z,1.0);
    }
    else
        FragColor = vec4(1.0, 1.0, 1.0, 0.0); // White otherwise

    float radiusNormalized=((3.1415)*sphereRadius*sphereRadius)/(iResolution.x*iResolution.y);

    t = hit_sphere(sphereCenter, radiusNormalized, r);
    if (t > 0.0) {
        vec3 P = r.origin+r.direction*t;
        vec3 N = normalize(P- sphereCenter);

        FragColor = vec4(computeColor(P, N),1.0);
    }
    
    
}