#shader vertex
#version 430 core
layout (location=0) in vec2 vertexPos;
layout (location = 1) in vec2 texCoords;

out vec2 textureCoordinates;

void main() {
    textureCoordinates = texCoords;
    gl_Position = vec4(vertexPos.xy, 1.0, 1.0);
}

#shader fragment
#version 330 core

#define PI  3.1415926535
#define SAMPLING_DEPTH 16
#define NO_OF_OBJECTS 8
#define RENDER_DISTANCE 99999

//material properties
#define ROUGH_SURFACE 0
#define METALLIC_SURFACE 1
#define DIELECTRIC 2

out vec4 FragColor;
in vec2 textureCoordinates;

uniform float sphereRadius[5];// Adjust the sphere radius as needed
//uniform float sphereRadius1;
uniform vec2 iResolution;//Resolution
uniform vec3 cameraPosition;
uniform mat4 rotationMatrix;
uniform sampler2D screenTexture;

//for seeding pseudo random variable more properly
uniform float seed;

//if 0 means it's buffer so does ray tracing work and adds to previous frame
//if 1/true means averages number of frame passes and use to present in screen
uniform bool screenOrBuffer;

// to know how many previous frames are stored in our buffer
uniform int unitsOfFrame;

struct MaterialProperties
{
    vec3  albedo;
    int surfaceType;
    float fuzz;
    float refractive_index;

    bool isLightSource;
    float specularProbability;
};


struct Object {
    vec3 center;
    float radius;
    MaterialProperties material;
};

struct ray {
    vec3 origin;
    vec3 direction;
};
struct hit_record {
    float t;
    vec3 p;
    vec3 normal;

    MaterialProperties material;

    bool front_face;
    // bool didHitLight;
};


Object objectList[NO_OF_OBJECTS];

void initializeScene(int objectNo , Object obj)
{
    objectList[objectNo] = Object(obj.center, obj.radius, obj.material);
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

            //For backface and frontface recognition
            rec.front_face = (dot(rec.normal, r.direction) < 0)? true:false;

            rec.normal = (rec.front_face)?rec.normal: -rec.normal;

            rec.material.albedo = sphere.material.albedo;
            rec.material.surfaceType = sphere.material.surfaceType;
            rec.material.fuzz = sphere.material.fuzz;
            rec.material.refractive_index = sphere.material.refractive_index;

            rec.material.specularProbability = sphere.material.specularProbability;
            rec.material.isLightSource = sphere.material.isLightSource;
            return true;
        }
        temp=(-b+sqrt(discriminant))/a;
        if(temp<t_max&&temp>t_min)
        {
            rec.t=temp;
            rec.p=r.origin+rec.t*r.direction;
            rec.normal=(rec.p-sphere.center)/sphere.radius;

            rec.front_face = (dot(rec.normal, r.direction) < 0)? true:false;
            rec.normal = (rec.front_face)?rec.normal: -rec.normal;
            rec.material.albedo = sphere.material.albedo;
            rec.material.surfaceType = sphere.material.surfaceType;
            rec.material.fuzz = sphere.material.fuzz;
            rec.material.refractive_index = sphere.material.refractive_index;
            
            rec.material.specularProbability = sphere.material.specularProbability;
            rec.material.isLightSource = sphere.material.isLightSource;
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

vec3 random_in_unit_sphere() {
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

vec3 random_in_hemisphere(vec3 normal){
    vec3 random_unit = normalize(random_in_unit_sphere());
    if(dot(random_unit, normal) > 0.0)
        return random_unit;
    else
        return -random_unit;
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

            // //record if the ray hit a light source
            // if(temp_rec.material.isLightSource){
            //     rec.didHitLight
            // }
        }
    }
    return hit_anything;
}


//DERIVE REFLECTED RAY FROM INCIDENT RAY
//
vec3 reflectRay(vec3 incidentRay, vec3 normalRay)
{
    return incidentRay - (2.0* dot(incidentRay,normalRay)*normalRay);
}


//ASSUMING NORMALIZED VALUES ARE SENT
vec3 refraction(vec3 rDirection, vec3 normal, float u1_u2)
{
    float cosTheta = clamp(dot(-rDirection, normal), 0.0, 1.0f);
    vec3 refrac_perpendicular = u1_u2 * (rDirection + cosTheta*normal);
    vec3 refrac_parallel = -sqrt(abs(1.0-dot(refrac_perpendicular,refrac_perpendicular)))*normal;
    return refrac_perpendicular + refrac_parallel;
}

//Schlick's Approximation for angles reflection
float schlickReflectance(float cosTheta, float refIndex)
{
    float r0 = (1-refIndex)/(1+refIndex);
    r0 = pow(r0,2.0);
    return r0 + (1-r0)*pow((1-cosTheta),5.0);
}

//Bidirectional scattering distribution function
bool material_bsdf(hit_record isectInfo, ray origin, out ray nori, out vec3 attenuation, int seedVariability)
{
    int materialNature = isectInfo.material.surfaceType;
        if(materialNature == ROUGH_SURFACE)
        {
            vec2 coordSeed = vec2(gl_FragCoord.x + seedVariability, gl_FragCoord.y + seedVariability*2.0); 

            // vec2 coordSeed = vec2(gl_FragCoord.x + 0, gl_FragCoord.y); 


            //TRYING DIFFERENT DIFFUSION METHOD
            vec3 target=isectInfo.p+isectInfo.normal+random_in_unit_sphere();
            // vec3 target=isectInfo.p+isectInfo.normal+random_in_hemisphere(isectInfo.normal);
            
            nori.origin=isectInfo.p;
            nori.direction=target-isectInfo.p;
            attenuation=isectInfo.material.albedo;
            return true;
        }
        else if( isectInfo.material.surfaceType == METALLIC_SURFACE)
        {
            nori.origin = isectInfo.p;
            vec3 actualReflected = reflectRay(normalize(origin.direction), normalize(isectInfo.normal));
            
            nori.direction = actualReflected + isectInfo.material.fuzz*random_in_unit_sphere();
            // nori.direction = actualReflected + isectInfo.material.fuzz*random_in_hemisphere(isectInfo.normal);
            
            attenuation = isectInfo.material.albedo;

            return (dot(nori.direction, isectInfo.normal) > 0.0f);
        }
        else if( isectInfo.material.surfaceType == DIELECTRIC)
        {
            nori.origin = isectInfo.p;
            attenuation = vec3(1.0,1.0,1.0);
            float rRatio = (isectInfo.front_face)?1.0/isectInfo.material.refractive_index: isectInfo.material.refractive_index;
            

            //if directions and normal are already normalized remove the normalization part
            vec3 unitRayDir = normalize(origin.direction);
            vec3 unitNormal = normalize(isectInfo.normal);

            float cosTheta = clamp(dot(-unitRayDir, unitNormal), 0.0, 1.0);
            float sinTheta = sqrt(1.0 - cosTheta*cosTheta);

            bool cannotRefract = rRatio * sinTheta > 1.0;

            if(cannotRefract || (schlickReflectance(cosTheta, rRatio) > rand())){
                nori.direction = reflectRay(unitRayDir, unitNormal);
            }
            else{
                nori.direction = refraction(unitRayDir, unitNormal, rRatio);
            }

            return true;
        }
    return false;
}




vec3 skyColor(ray r)
{
    vec3 unit_direction = normalize(r.direction);
    float t = 0.5 * (unit_direction.y + 1.0);
    return (1.0 - t) * vec3(0.4627, 0.651, 1.0) + t * vec3(1.0, 0.9647, 0.4941);
}

vec3 rayColor(ray r) {
    vec3 col = vec3(1.0);
  
    hit_record rec;

    for(int i=0;i<SAMPLING_DEPTH;i++){
        //nori = new origin ray info        

        
        bool didIntersectScene = intersectScene(r, 0.001, RENDER_DISTANCE, rec) ;
        if(didIntersectScene && !rec.material.isLightSource)
        {
            ray nori;
            vec3 attenuation;

            bool isSpecular = false;
            if(rec.material.surfaceType == METALLIC_SURFACE){
                isSpecular = rec.material.specularProbability >= rand();
                rec.material.surfaceType = isSpecular? METALLIC_SURFACE: ROUGH_SURFACE;
            }

            bool wasScattered=material_bsdf(rec, r, nori, attenuation, i);

            r.origin= nori.origin;
            r.direction= nori.direction;

            if(wasScattered)
            {
                if(!isSpecular){
                    col*=attenuation;
                }
                else{
                    col *= vec3(1.0);//specular color
                }

            }
            // else
            // {
            //     col*=vec3(0.f,0.f,0.f);
            //     break;
            // }
        }
        else if(didIntersectScene && rec.material.isLightSource)
        {
            break;
        }
        else
        {
            col *= vec3(0.0);
            // col*=skyColor(r);
            break;
        }
        if(i == SAMPLING_DEPTH-1)
        {

            col *= vec3(0.0, 0.0, 0.0);
            break;
        }
    }
    return col;
}



void main()
{
    
    if(screenOrBuffer){
        FragColor=texture(screenTexture,textureCoordinates);
        FragColor.xyz = FragColor.xyz/float(unitsOfFrame);
    }
    else{
        // Normalized screen coordinates (-1 to 1)
        vec2 screenCoords=(gl_FragCoord.xy*2.-iResolution)/iResolution;
        
        // Aspect ratio correction
        float aspectRatio=iResolution.x/iResolution.y;
        screenCoords.x*=aspectRatio;
        
        //>>>> CAMERA CHANGES
        ray r;
        r.origin=cameraPosition;
        
        vec3 try=vec3(screenCoords,-1.)-cameraPosition;
        r.direction=(normalize(vec4(try,0.))*rotationMatrix).xyz;
        
        //////TEMP TEMP TEMp
        float y_offset=.03f;
        
        // Sphere properties (centered at the origin)
        vec3 sphereCenter=vec3(0.,.0500000+y_offset,1.);
        float radiusNormalized=((3.1415)*sphereRadius[0]*sphereRadius[0])/(iResolution.x*iResolution.y);
        
        //HARDCODED VALUE FROM WHICH GENERAL PROPERTIES ARE DEFINED
        float mFuzz=0.0;
        float refractive_index=1.5;
        bool isLightSource=false;
        
        MaterialProperties materialProp;
        materialProp.albedo=vec3(1.,1.,1.);
        materialProp.surfaceType=DIELECTRIC;
        materialProp.fuzz=mFuzz;
        materialProp.refractive_index=refractive_index;
        materialProp.isLightSource=isLightSource;
        materialProp.specularProbability = 0.5;
        Object obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(0,obj);
        
        //sphere 1
        sphereCenter=vec3(.4,.1,1.f);
        radiusNormalized=((3.1415)*sphereRadius[1]*sphereRadius[1])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(1.,.465652,.665070);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz=0.f;
        materialProp.specularProbability = 0.2;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(1,obj);
        //sphere 2
        sphereCenter=vec3(.4,.1,1.f);
        radiusNormalized-=.005;
        materialProp.albedo=vec3(1.,.465652,.665070);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz=0;
        materialProp.specularProbability = 0.4;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(2,obj);
        
        //sphere 3
        sphereCenter=vec3(.6,.1,1.f);
        radiusNormalized=((3.1415)*sphereRadius[2]*sphereRadius[2])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(.1922,.8588,.6588);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz = 0;
        materialProp.specularProbability = 0.14;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(3,obj);
        
        //sphere 4
        sphereCenter=vec3(-.4,.1,1.f);
        radiusNormalized=((3.1415)*sphereRadius[3]*sphereRadius[3])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(.8196,.6353,.9725);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz=0;
        materialProp.specularProbability = 0.3;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(4,obj);
        
        //sphere 5
        sphereCenter=vec3(.2,.1,1.f);
        radiusNormalized=((3.1415)*sphereRadius[4]*sphereRadius[4])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(1.,1.,1.);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz=.0f;
        materialProp.specularProbability = 0.1;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(5,obj);
        

        //light source
        sphereCenter=vec3(0.,4,1.);
        radiusNormalized=3;
        materialProp.albedo=vec3(.0627,0.,.9608);
        materialProp.surfaceType=DIELECTRIC;
        materialProp.fuzz=mFuzz;
        materialProp.refractive_index=refractive_index;
        materialProp.isLightSource=true;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(6,obj);
        
        // Initialize background sphere (backgroundCenter with backgroundRadius)
        materialProp.albedo=vec3(.5);
        materialProp.surfaceType=ROUGH_SURFACE;
        materialProp.fuzz=mFuzz+.3f;
        materialProp.isLightSource=false;
        vec3 backgroundCenter=vec3(0.,-1000,0.);
        float backgroundRadius=1000;
        obj=Object(backgroundCenter,backgroundRadius,materialProp);
        initializeScene(NO_OF_OBJECTS-1,obj);
        
        //seed is shitty
        vec2 seedNum=vec2(seed,1.)+gl_FragCoord.xy;
        co.xy=seedNum.xy/iResolution.xy;
        // co.xy = gl_FragCoord.xy/iResolution.xy;
        
        vec3 fcolor=vec3(0.f);
        int SAMPLES_PER_PIXEL=42;
        for(int i=0;i<SAMPLES_PER_PIXEL;i++){
            fcolor+=vec3(rayColor(r));
        }
        fcolor/=SAMPLES_PER_PIXEL;
        
        //gamma correction
        fcolor=vec3(sqrt(fcolor.x),sqrt(fcolor.y),sqrt(fcolor.z));
        // FragColor = vec4(fcolor,1.0f);
        if(unitsOfFrame>0){
            vec3 tcol=texture(screenTexture,textureCoordinates).rgb;
            FragColor=vec4(fcolor,1.f)+vec4(tcol,1.);// add present calculations for later use
            // FragColor = vec4(1.0);
        }//if this if doesn't run previous calculations are as you can see discarded
        else{
            FragColor=vec4(fcolor,1.f);
        }
    }
}