#shader vertex
#version 330 core
layout (location=0) in vec2 vertexPos;

void main() {
    gl_Position = vec4(vertexPos.xy, 1.0, 1.0);
}

#shader fragment
#version 330 core

#define PI  3.1415926535
#define SAMPLING_DEPTH 100
#define NO_OF_OBJECTS 3
#define RENDER_DISTANCE 99999

out vec4 FragColor;
uniform float sphereRadius; // Adjust the sphere radius as needed
uniform vec2 iResolution; //Resolution
uniform vec3 cameraPosition;
uniform mat4 rotationMatrix;

struct Object {
    vec3 center;
    float radius;

    vec3  albedo;
};

struct ray {
    vec3 origin;
    vec3 direction;
};
struct hit_record {
    float t;
    vec3 p;
    vec3 normal;

    vec3  albedo;
};


Object objectList[NO_OF_OBJECTS];

void initializeScene(int objectNo , Object obj)
{
    objectList[objectNo] = Object(obj.center, obj.radius, obj.albedo);
}

bool hit_sphere(const Object sphere, const ray r, float t_min, float t_max, out hit_record rec) {
    vec3 oc = r.origin - sphere.center;
    float a = dot(r.direction, r.direction);
    float b = dot(oc, r.direction);
    float c = dot(oc, oc) - sphere.radius * sphere.radius;
    float discriminant = b * b - a * c;

    if(discriminant>0.f)
    {
        float temp=(-b-sqrt(discriminant))/a;
        if(temp<t_max&&temp>t_min)
        {
            rec.t=temp;
            rec.p=r.origin+rec.t*r.direction;
            rec.normal=(rec.p-sphere.center)/sphere.radius;
            rec.albedo=sphere.albedo;
            return true;
        }
        temp=(-b+sqrt(discriminant))/a;
        if(temp<t_max&&temp>t_min)
        {
            rec.t=temp;
            rec.p=r.origin+rec.t*r.direction;
            rec.normal=(rec.p-sphere.center)/sphere.radius;
            rec.albedo=sphere.albedo;
            return true;
        }
    }

    return false;
}
vec2 co;
float rand(){
    co.x =  fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    co.y =  fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    return co.x;
}

vec3 random_in_unit_sphere(vec2 seed) {
    float phi = 2.0 * PI * rand();
    float cosTheta = 2.0 * rand() - 1.0;
    float u = rand();

    float theta = acos(cosTheta);
    float r = pow(u, 1.0 / 3.0);

    float x = r * sin(theta) * cos(phi);
    float y = r * sin(theta) * sin(phi);
    float z = r * cos(theta);

    return vec3(x, y, z);
}


 bool intersectScene(ray r, float t_min, float t_max, out hit_record rec)
{
    hit_record temp_rec;
    bool hit_anything = false;
    float closest_so_far = t_max;
    for (int i = 0; i < objectList.length(); i++)
    {
        Object sphere = objectList[i];
        if (hit_sphere(sphere, r, t_min, closest_so_far, temp_rec))
        {
            hit_anything   = true;
            closest_so_far = temp_rec.t;
            rec            = temp_rec;
        }
    }
    return hit_anything;
}

bool material_bsdf(hit_record isectInfo, ray origin, out ray nori, out vec3 attenuation, int seedVariability)
{
        vec2 coordSeed = vec2(gl_FragCoord.x + seedVariability, gl_FragCoord.y + seedVariability*2.0); 
        
        // vec2 coordSeed = vec2(gl_FragCoord.x + 0, gl_FragCoord.y); 
        
        vec3 target=isectInfo.p+isectInfo.normal+random_in_unit_sphere(coordSeed.xy / iResolution.xy);

        nori.origin=isectInfo.p;
        nori.direction=target-isectInfo.p;

        attenuation=isectInfo.albedo;
        return true;
}
vec3 skyColor(ray r)
{
    vec3 unit_direction = normalize(r.direction);
    float t = 0.5 * (unit_direction.y + 1.0);
    return (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);
}

vec3 rayColor(ray r) {
    vec3 col = vec3(1.0);
  
    hit_record rec;

    for(int i=0;i<SAMPLING_DEPTH;i++){
        //nori = new origin ray info        

        if(i == SAMPLING_DEPTH-1)
        {
            col *= vec3(0.0);
            break;
        }
        if(intersectScene(r, 0.001, RENDER_DISTANCE, rec))
        {
            ray nori;
            vec3 attenuation;

            bool wasScattered=material_bsdf(rec,r,nori,attenuation, i);

            r.origin= nori.origin;
            r.direction= nori.direction;

            if(wasScattered)
                col*=attenuation;
            else
            {
                col*=vec3(0.f,0.f,0.f);
                break;
            }
        }
        else
        {
            col*=skyColor(r);
            break;
        }
    }
    return col;
}



void main()
{
    // Normalized screen coordinates (-1 to 1)
    vec2 screenCoords = (gl_FragCoord.xy * 2.0 - iResolution) / iResolution;

    // Aspect ratio correction
    float aspectRatio = iResolution.x / iResolution.y;
    screenCoords.x *= aspectRatio;

    // Ray origin (camera position)
    // vec3 cameraPosition = vec3(0.0, 0.0, 10.0);

    // Ray direction (pointing from camera to screen coordinates)
    // ray r;
    // r.origin = cameraPosition;
    // r.direction = normalize(vec3(screenCoords, -1.0) - cameraPosition);


    //>>>> CAMERA CHANGES
    ray r;
    r.origin = cameraPosition;
    vec3 try=vec3(screenCoords, -1.0) - cameraPosition;
    r.direction=(normalize(vec4(try, 0.0)) * rotationMatrix).xyz;
    // Sphere properties (centered at the origin)
    vec3 sphereCenter = vec3( 0.0, 0.200000, 1.0);
    float radiusNormalized=((3.1415)*sphereRadius*sphereRadius)/(iResolution.x*iResolution.y);
    vec3 albedo = vec3(0.2353, 0.2706, 0.3137);

    Object obj = Object(sphereCenter, radiusNormalized, albedo);
    initializeScene(0, obj);
    
    sphereCenter = vec3( 0.75, 0.200000, 1.0);
    radiusNormalized=0.1;
    albedo = vec3( 1.0, 0.465652, 0.665070);

    obj = Object(sphereCenter, radiusNormalized, albedo);
    initializeScene(1, obj);
    
    // Initialize background sphere (backgroundCenter with backgroundRadius)
    albedo = vec3( 0.380012, 0.506085, 0.762437);
    vec3 backgroundCenter=vec3(0.0,-2.7,0.0);
    float backgroundRadius=2.8;
    obj = Object(backgroundCenter, backgroundRadius, albedo);
    initializeScene(2, obj);



    co.xy = gl_FragCoord.xy/iResolution.xy;

    vec3 fcolor= vec3(0.0f);
    

    for (int i = 0; i < 20; i++) {
        fcolor += vec3(rayColor(r));

        // vec2 tempSeed = vec2(gl_FragCoord.x + i, gl_FragCoord.y + i);
        // r.origin.x += rand(tempSeed.xy/iResolution.xy);
    }
    fcolor /= 20;

    //gamma correction
    fcolor = vec3( sqrt(fcolor.x), sqrt(fcolor.y), sqrt(fcolor.z) );
    FragColor = vec4(fcolor,1.0f);
}
