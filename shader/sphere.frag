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
#version 430 core

#define PI  3.1415926535
#define SAMPLING_DEPTH 64
#define NO_OF_OBJECTS 8
#define NO_OF_QUADS 2

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
uniform sampler2D skyTexture;
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
struct Quad{
    vec3 Q;
    vec3 u;
    vec3 v;

    float D;
    vec3 normal;
    vec3 w;
    MaterialProperties material;
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
    float u;
    float v;
    // bool didHitLight;
};

Quad quadList[NO_OF_QUADS];
Object objectList[NO_OF_OBJECTS];

void initializeScene(int objectNo , Object obj)
{
    objectList[objectNo] = Object(obj.center, obj.radius, obj.material);
}



void initializeQuad(int quadNo , Quad obj)
{
    vec3 n  = cross(obj.u, obj.v);
    vec3 normal = normalize(n);
    float D = dot(normal, obj.Q);
    vec3 w = n / dot(n,n);
    quadList[quadNo] = Quad(obj.Q, obj.u, obj.v, D, normal, w ,obj.material);
}

bool isInterior(float a, float b, out hit_record rec){
    
    if ((a < 0) || (1 < a) || (b < 0) || (1 < b)){
        return false;
    }
    
    rec.u = a;
    rec.v = b;
    return true;
}

bool hit_box(const Quad plane, const ray r,float t_min, float t_max ,out hit_record rec){
    float denom = dot(plane.normal, r.direction);
    if(abs(denom) < 0.0001)
    {
        return false;
    }
    float t = (plane.D - dot(plane.normal, r.origin))/denom;

    if( !(t >= t_min && t <= t_max) ){
        return false;
    }
    vec3 intersection = r.origin + t*r.direction;
    vec3 planeHitPoint = intersection - plane.Q;
    float alpha = dot(plane.w, cross(planeHitPoint, plane.v));
    float beta = dot(plane.w , cross(plane.u , planeHitPoint));
    
    if(!isInterior(alpha, beta, rec)){
        return false;
    }

    rec.t = t;
    rec.p = intersection;
    rec.normal= plane.normal;
    rec.front_face=(dot(rec.normal,r.direction)<0)?true:false;
    rec.normal=(rec.front_face)?rec.normal:-rec.normal;

    //record materialproperties
    //is rec.material = plane.material enough to substitute for all these lines
    rec.material.albedo=plane.material.albedo;
    rec.material.surfaceType=plane.material.surfaceType;
    rec.material.fuzz=plane.material.fuzz;
    rec.material.refractive_index=plane.material.refractive_index;
    rec.material.specularProbability = plane.material.specularProbability;
    rec.material.isLightSource = plane.material.isLightSource;

    return true;
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

            // rec.material.albedo = sphere.material.albedo;
            // rec.material.surfaceType = sphere.material.surfaceType;
            // rec.material.fuzz = sphere.material.fuzz;
            // rec.material.refractive_index = sphere.material.refractive_index;

            // rec.material.specularProbability = sphere.material.specularProbability;
            // rec.material.isLightSource = sphere.material.isLightSource;
            rec.material = sphere.material;
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
            // rec.material.albedo = sphere.material.albedo;
            // rec.material.surfaceType = sphere.material.surfaceType;
            // rec.material.fuzz = sphere.material.fuzz;
            // rec.material.refractive_index = sphere.material.refractive_index;
            
            // rec.material.specularProbability = sphere.material.specularProbability;
            // rec.material.isLightSource = sphere.material.isLightSource;
            
            rec.material = sphere.material;
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

        }
    }
    for (int i = 0; i < quadList.length(); i++)
    {
        Quad plane = quadList[i];
        if (hit_box(plane, r, t_min, closest_so_far, temp_rec))
        {
            hit_anything   = true;
            closest_so_far = temp_rec.t;
            rec            = temp_rec;

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
bool material_bsdf(hit_record isectInfo, ray origin, out ray nori, out vec3 attenuation)
{
    int materialNature = isectInfo.material.surfaceType;
        if(materialNature == ROUGH_SURFACE)
        {
    
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
vec3 skyBoxColor(vec3 d)
{
    return clamp(texture(skyTexture, vec2(0.5 + atan(d.x, d.z)/(2*PI), 0.5 + asin(-d.y)/PI)).rgb, 0, 1.0f);
    // return texture(skyTexture, vec2(0.5 + atan(d.x, d.z)/(2*PI), 0.5 + asin(-d.y)/PI)).rgb;
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
                isSpecular = rec.material.specularProbability >= abs(rand());
                rec.material.surfaceType = isSpecular? METALLIC_SURFACE: ROUGH_SURFACE;
            }

            bool wasScattered=material_bsdf(rec, r, nori, attenuation);

            r.origin= nori.origin;
            r.direction= nori.direction;

            if(wasScattered)
            {
                if(!isSpecular){
                    col*=attenuation;
                }
                else{
                    col *= vec3(1.0);//specular color
                    // col *= rec.material.albedo;
                }

            }
            else
            {
                col*=vec3(0.f,0.f,0.f);
                break;
            }
        }
        else if(didIntersectScene && rec.material.isLightSource)
        {
            break;
        }
        else
        {
            // col *= vec3(0.0);
            col*=skyColor(r);
            // col *= ((skyBoxColor(normalize(r.direction))));
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
        
        

        // Sphere properties (centered at the origin)
        vec3 sphereCenter=vec3(0.,.0500000,1.);
        float radiusNormalized=((3.1415)*sphereRadius[0]*sphereRadius[0])/(iResolution.x*iResolution.y);
        
        //HARDCODED VALUE FROM WHICH GENERAL PROPERTIES ARE DEFINED
        float mFuzz=0.0;
        float refractive_index=1.5;
        bool isLightSource=false;
        
        MaterialProperties materialProp;
        materialProp.albedo=vec3(1.,1.,1.);
        materialProp.surfaceType=DIELECTRIC;
        materialProp.fuzz=0.03;
        materialProp.refractive_index=refractive_index;
        materialProp.isLightSource=isLightSource;
        materialProp.specularProbability = 0.5;
        Object obj=Object(sphereCenter,0.17,materialProp);
        initializeScene(0,obj);
        
        //sphere 1
        // sphereCenter=vec3(.4,.1,1.f);
        radiusNormalized=((3.1415)*sphereRadius[1]*sphereRadius[1])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(1.,.465652,.665070);
        materialProp.surfaceType=DIELECTRIC;
        materialProp.fuzz=0.4f;
        materialProp.specularProbability = 0.09;
        obj=Object(sphereCenter,-0.169,materialProp);
        initializeScene(1,obj);
        //sphere 2
        sphereCenter=vec3(.4,.1,1.f);
        radiusNormalized-=.005;
        materialProp.albedo=vec3(0.0902, 0.9412, 1.0);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz=0.1;
        materialProp.specularProbability = 0.4;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(2,obj);
        
        //sphere 3
        sphereCenter=vec3(.6,.1,1.f);
        radiusNormalized=((3.1415)*sphereRadius[2]*sphereRadius[2])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(0.6902, 0.8863, 1.0);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz = 0;
        materialProp.specularProbability = 0.14;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(3,obj);
        
        //sphere 4
        sphereCenter=vec3(-.4,.1,1.f);
        radiusNormalized=((3.1415)*sphereRadius[3]*sphereRadius[3])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(1.0, 0.851, 0.0);
        materialProp.surfaceType=DIELECTRIC;
        materialProp.fuzz=0;
        materialProp.specularProbability = 0.01;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(4,obj);
        
        //sphere 5
        sphereCenter=vec3(0.,.0500000,1.);
        radiusNormalized=((3.1415)*sphereRadius[4]*sphereRadius[4])/(iResolution.x*iResolution.y);
        materialProp.albedo=vec3(1.0, 1.0, 1.0);
        materialProp.surfaceType=METALLIC_SURFACE;
        materialProp.fuzz=.0f;
        materialProp.specularProbability = 0.02;
        obj=Object(sphereCenter,radiusNormalized,materialProp);
        initializeScene(5,obj);
        

        //light source
        sphereCenter=vec3(0.,-0.9,1.);
        radiusNormalized=3;
        materialProp.albedo=vec3(.0627,0.,.9608);
        materialProp.surfaceType=ROUGH_SURFACE;
        materialProp.fuzz=mFuzz;
        materialProp.refractive_index=refractive_index;
        materialProp.isLightSource=true;
        obj=Object(sphereCenter,0.25,materialProp);
        initializeScene(6,obj);
        
        // Initialize background sphere (backgroundCenter with backgroundRadius)
        materialProp.albedo=vec3(.5);
        materialProp.surfaceType=ROUGH_SURFACE;
        materialProp.fuzz=mFuzz+.3f;
        materialProp.isLightSource=false;
        vec3 backgroundCenter=vec3(0.,-1000,0.);
        float backgroundRadius=1;
        obj=Object(backgroundCenter,backgroundRadius,materialProp);
        initializeScene(NO_OF_OBJECTS-1,obj);

        float D = 0.0;
        vec3 normal = vec3(0.0);
        vec3 w = vec3(0.0);
        materialProp.surfaceType = METALLIC_SURFACE;
        materialProp.albedo = vec3(1.0, 0.0, 0.0);
        Quad qObj = Quad(vec3(-3,-2, 5), vec3(0, 0,-4), vec3(0, 4, 0), D, normal , w, materialProp);
        initializeQuad(0, qObj);

        materialProp.albedo = vec3(0.1686, 1.0, 0.0);
        qObj = Quad(vec3(-2,-2, 0), vec3(4, 0, 0), vec3(0, 4, 0), D, normal, w, materialProp);
        initializeQuad(1,qObj);

        // qObj = Quad(vec3( 3,-2, 1), vec3(0, 0, 4), vec3(0, 4, 0), right_blue);
        // qObj = Quad(vec3(-2, 3, 1), vec3(4, 0, 0), vec3(0, 0, 4), upper_orange);
        // qObj = Quad(vec3(-2,-3, 5), vec3(4, 0, 0), vec3(0, 0,-4), lower_teal);
        
        vec2 seedNum=vec2(seed,seed)+gl_FragCoord.xy;
        co.xy=seedNum.xy/iResolution.xy;
        
        // vec3 fcolor=vec3(0.f);
        // int SAMPLES_PER_PIXEL=1;
        // float offs = 0.001;
        // for(int i=0;i<SAMPLES_PER_PIXEL;i++){
        //     // float trand = rand();
        //     // if(trand < 0.5){
        //     //     offs = -(offs)/(SAMPLES_PER_PIXEL*trand);
        //     // }
        //     // r.origin.xy = r.origin.xy + offs;
        //     fcolor+=vec3(rayColor(r));
        // }
        // fcolor/=SAMPLES_PER_PIXEL;
    
    //NEW ANTI_ALIASING DON"T THINK IT IS UPTO THE MARK

    ray r;
    r.origin=cameraPosition;
    // vec3 try=vec3(screenCoords,-1.)-cameraPosition;
    // r.direction=(normalize(vec4(try,0.))*rotationMatrix).xyz;

    vec3 fcolor=vec3(0.f);
    int SAMPLES_PER_PIXEL=1;
    ray jitteredRay;
    for(int i=0;i<SAMPLES_PER_PIXEL;i++){
        //OFFSET within a pixel
        float u=(gl_FragCoord.x+rand())/iResolution.x;
        float v=(gl_FragCoord.y+rand())/iResolution.y;

        // Compute the ray direction based on the pixel position and offsets
        vec3 rayDir=normalize(vec3(screenCoords+(pow(-1,i)*vec2(u,v)) ,-1.) - cameraPosition);

        // Create the ray with the new direction
        jitteredRay.origin = r.origin;
        jitteredRay.direction=(normalize(vec4(rayDir,0.))*rotationMatrix).xyz;

        fcolor+=vec3(rayColor(jitteredRay));
    }
        fcolor/=SAMPLES_PER_PIXEL;


        //gamma correction
        fcolor=vec3(sqrt(fcolor.x),sqrt(fcolor.y),sqrt(fcolor.z));
        

        //If true buffer get overwritten with previous
        if(unitsOfFrame>0){
            vec3 tcol=texture(screenTexture,textureCoordinates).rgb;
            FragColor=(vec4(fcolor,1.f)+vec4(tcol,1.));// add present calculations for later use
        }
        else{//else previous texture/buffer data is discarded
            FragColor=vec4(fcolor,1.f);
        }
    }
}