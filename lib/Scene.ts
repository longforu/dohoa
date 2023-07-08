import { Cross, Normalize, Tensor, Vec2, Vec3, Vec4, VectorAdd as VA, VectorMultiplyScalar as MV, HademardV, Dot, Z } from "./LinearAlgebra";
import { Ray, Surface } from "./Surface";

export type RGBColor = [number, number, number, number];

export type Light = {
  origin: Vec3;
  intensity: Vec3;
}

export type Scene = {
  eye: {
    origin: Vec3;
    direction: Vec3;
    normal: Vec3;
  },

  surfaces: Surface[];

  lights: Light[];

  ambientIntensity: Vec3;

  phongExponent: number;

  planeDistance: number;
}

export type LightSurface = (light:Light, surface:Surface, point:Vec3) => number;

export type LightPoint = (ray: Ray, scene: Scene) =>Vec4;

const WHITE = [255,255,255] as Vec3;

const BLACK = [0,0,0] as Vec3;

export const light:LightPoint = (ray, scene) => {
  const hits = scene.surfaces.map(s => [s,s.hit(ray)] as [Surface,number]).filter(([_,r]) => r > 0);

  if(hits.length !== 0){
    console.log('hit');
    
    const least = hits.sort((a,b) => a[1] - b[1])[0];
    const p = VA(ray.origin, MV(ray.direction, least[1])) as Vec3;
    const surface = least[0];

    const v = Normalize(VA(scene.eye.origin, MV(p,-1)));

    const color = surface.color(p);
    const specularColor = [255,255,255] as Vec3;
    const normal = surface.normal(p);

    let c = VA(BLACK,(HademardV(color, scene.ambientIntensity) as Vec4));

    for(let i = 0; i < scene.lights.length; i++){
      const currentLight = scene.lights[i];

      const l = Normalize(VA(currentLight.origin, MV(p, -1))) as Vec3;

      // apply Lambertian shading
      c = VA(c, MV(HademardV(color, currentLight.intensity), Math.max(0, Dot(normal, l))))

      // apply Phong shading
      const h = Normalize(VA(v,l))

      c = VA(c, MV(HademardV(specularColor, currentLight.intensity), Math.pow(Math.max(0, Dot(normal,h)),scene.phongExponent)))
    }

    return [...c,255] as Vec4;
  }

  return [...BLACK,255] as Vec4;
}

export type Render = (scene:Scene, dim: Vec2) => Tensor;

export const Orthographic:Render = (scene, dim) => {
  const [width, height] = dim;

  // we first need to find the view plane
  const v1 = scene.eye.normal;

  const v2 = Cross(scene.eye.normal, scene.eye.direction);
  
  // normalize them

  const n1 = Normalize(v1);

  const n2 = Normalize(v2);

  // screen space

  const screenSpace = Z(height, width).map((v,i) => v.map((_,j) => [i - height/2, j - width/2]));

  const worldSpace = screenSpace.map((v) => v.map(([y,x]) => VA(MV(n1,y), MV(n2,x))));

  const worldRay:Ray[][] = worldSpace.map((v) => v.map(o => ({origin: o, direction: scene.eye.direction} as Ray)))

  return worldRay.map((v) => v.map(r => light(r, scene)));
}

export const Perspective:Render = (scene, dim) => {
  const [width, height] = dim;

  // we first need to find the view plane
  const v1 = scene.eye.normal;

  const v2 = Cross(scene.eye.normal, scene.eye.direction);
  
  // normalize them

  const n1 = Normalize(v1);

  const n2 = Normalize(v2);

  // screen space

  const screenSpace = Z(height, width).map((v,i) => v.map((_,j) => [i - height/2, j - width/2]));

  const worldSpace = screenSpace.map((v) => v.map(([y,x]) => VA(VA(MV(n1,y), MV(n2,x)), MV(scene.eye.direction,scene.planeDistance))));

  const worldRay:Ray[][] = worldSpace.map((v) => v.map(o => ({origin: scene.eye.origin, direction: Normalize(o)} as Ray)))

  return worldRay.map((v) => v.map(r => light(r, scene)));
}