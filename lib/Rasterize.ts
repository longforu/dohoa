import { Dot, HademardV, MUL,Mat,Normalize,T, Tensor, Vec2, Vec3, Vec4, VectorAdd, VectorMultiplyScalar, Z, ZT } from "./LinearAlgebra"
import { Surface, Triangle } from "./Surface"
import { CameraView, OrthographicView, Viewport, PerspectiveView } from "./Transformation"

export type Line = [Vec3,Vec3];

export type Light = {
  origin: Vec3,
  intensity: Vec4,
}

export type LightConfig = {
  lights: Light[],
  ambientConstant: number,
  phongExponent: number,
}

export type Scene = {
  viewVolume: {
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  },

  camera: {
    origin: Vec3,
    direction: Vec3,
    top: Vec3
  },

  lines: Line[],
  
  surfaces: Surface[],

  lightConfig: LightConfig
}

const drawPixel = (image:Tensor, x:number, y:number, color:Vec4, z?:number, zBuffer?:Mat):Tensor => {
  // see if it's int
  if(x !== Math.ceil(x)){
    drawPixel(image, Math.ceil(x), y, color, z, zBuffer);
    drawPixel(image, Math.floor(x),y,color, z, zBuffer);
    return image;
  }
  if(y !== Math.ceil(y)){
    drawPixel(image, x, Math.ceil(y),color, z, zBuffer);
    drawPixel(image,x,Math.floor(y),color, z, zBuffer);
    return image;
  }
  const x_int = Math.round(x);
  const y_int = image.length - Math.round(y);

  if(x_int > 0 && y_int > 0 && y_int < image.length && x_int < image[0].length) {
    if(!zBuffer || z === undefined){
      image[x_int][y_int] = color.map(i => Math.trunc(i)).map(i => Math.min(i,255)).map(i => Math.max(i,0));
    }
    else if(zBuffer[x_int][y_int] < z){
      image[x_int][y_int] = color.map(i => Math.trunc(i)).map(i => Math.min(i,255)).map(i => Math.max(i,0));
      zBuffer[x_int][y_int] = z;
    }
  }
  return image;
}

export const drawLine = (image: Tensor, p1: Vec2, p2: Vec2, color: Vec4):Tensor => {
  
  const [x_0,y_0] = p1;
  const [x_1,y_1] = p2;

  if(x_0 > x_1) return drawLine(image, p2, p1, color); 

  const dy = y_1 - y_0;
  const dx = x_1 - x_0;

  if(Math.abs(dx) <= 0.0001){
    const ys = Math.min(y_0,y_1);
    const ye = Math.max(y_0,y_1);
    for(let y = ys; y < ye; y++){
      drawPixel(image,x_0,y,color);
    }
    return image;
  }

  if(Math.abs(dy) <= 0.0001){
    for(let x = x_0; x < x_1; x++){
      drawPixel(image,x,y_0,color);
    }
    return image;
  }

  const m = dy/dx;

  const f = (x:number,y:number) => -dy*x + dx*y + x_0*y_1 - x_1*y_0;

  if(m >= 0 && m <= 1){
    let y = y_0;
    let d = f(x_0 + 1, y_0 + 0.5);
    for(let x = x_0; x < x_1; x++){
      drawPixel(image,x,y,color);
      if(d < 0){
        y = y + 1;
        // this is equivalent to f(x + 1, y + 1)
        d = d + dx - dy;
      }
      else {
        // this is equivalent to f(x+ 1, y)
        d = d - dy
      }
    }
  }

  if(m > 1) {
    let x = x_0;
    let d = f(x_0 + 0.5, y_0 + 1);
    for(let y = y_0; y < y_1; y++){
      drawPixel(image,x,y,color);
      if(d > 0){
        x = x + 1;
        d = d + dx - dy;
      }
      else {
        d = d + dx;
      }
    }
  }

  if(m < 0 && m > -1){
    let y = y_0;
    let d = f(x_0 + 1, y_0 - 0.5);
    for(let x = x_0; x < x_1; x++){
      drawPixel(image,x,y,color);
      if(d > 0){
        y = y - 1;
        // this is equivalent to f(x + 1, y - 1)
        d = d - dx - dy;
      }
      else {
        // this is equivalent to f(x+ 1, y)
        d = d - dy
      }
    }
  }


  if(m <= -1) {
    let x = x_0;
    let d = f(x_0 + 0.5, y_0 - 1);
    for(let y = y_0; y > y_1; y--){
      drawPixel(image,x,y,color);
      if(d < 0){
        x = x + 1;
        d = d - dx - dy;
      }
      else {
        d = d - dx;
      }
    }
  }
  return image;
}

export const drawTriangle = (image: Tensor, vertices: [Vec3, Vec3, Vec3], colors: [Vec4,Vec4,Vec4], zBuffer: Mat) => {
  const x_min = Math.floor(Math.min(...vertices.map(([x])=>x)));
  const x_max = Math.ceil(Math.max(...vertices.map(([x])=>x)));

  const y_min = Math.floor(Math.min(...vertices.map(([_,y]) => y)));
  const y_max = Math.floor(Math.max(...vertices.map(([_,y]) => y)));

  const [[x_0,y_0,z_0],[x_1,y_1,z_1],[x_2,y_2,z_2]] = vertices;
  const [c_0,c_1,c_2] = colors; 

  const f_01 = (x:number,y:number) => (y_0 - y_1)*x + (x_1 - x_0)*y + x_0*y_1 - x_1*y_0;
  const f_12 = (x:number,y:number) => (y_1 - y_2)*x + (x_2 - x_1)*y + x_1*y_2 - x_2*y_1;
  const f_20 = (x:number,y:number) => (y_2 - y_0)*x + (x_0 - x_2)*y + x_2*y_0 - x_0*y_2; 

  const f_alpha = f_12(x_0,y_0);
  const f_beta = f_20(x_1,y_1);
  const f_gamma = f_01(x_2,y_2);

  for(let y = y_min; y < y_max; y++){
    for(let x = x_min; x < x_max;x++){
      const alpha = f_12(x,y)/f_alpha;
      const beta = f_20(x,y)/f_beta;
      const gamma = f_01(x,y)/f_gamma;

      if(alpha >= 0 && beta >= 0 && gamma >= 0) {
        if(
          (alpha > 0 || f_alpha * f_12(-1,-1) > 0) &&
          (beta > 0 || f_beta * f_20(-1,-1) > 0) &&
          (gamma > 0 || f_gamma * f_01(-1,-1) > 0)
        ){
          const c = VectorAdd(
            VectorMultiplyScalar(c_0,alpha),
            VectorAdd(
              VectorMultiplyScalar(c_1,beta),
              VectorMultiplyScalar(c_2,gamma)
            )
          ) as Vec4;

          const z = z_0*alpha + z_1*beta + z_2*gamma;
          drawPixel(image,x,y,c,z, zBuffer);
        }
      }
    }
  }
  return image;
}

export const lightPoint = (point: Vec3, normal: Vec3, color: Vec4, config: LightConfig, eyeOrigin: Vec3):Vec4 => {
  const {lights, ambientConstant, phongExponent} = config;

  const c_o = color.slice(0,3) as Vec3;

  let c  = VectorMultiplyScalar(c_o,ambientConstant) as Vec3;

  for(const light of lights){
    const {origin, intensity} = light;

    const l = Normalize(VectorAdd(origin, VectorMultiplyScalar(point,-1)));

    const cl = HademardV(c_o, intensity.slice(0,3) as Vec3);
    
    // why is it just the ambient here

    // lambertian shading
    c = VectorAdd(c, VectorMultiplyScalar(cl, Math.max(0, Dot(normal,l)))) as Vec3;
    
    // phong shading
    const h = Normalize(VectorAdd(eyeOrigin,l));
    c = VectorAdd(c, VectorMultiplyScalar(intensity.slice(0,3) as Vec3, Math.pow(Dot(h,normal),phongExponent))) as Vec3;
  }
  return [...c,255] as Vec4;
}

export type Render = (scene:Scene, width: number, height:number, type?: ("perspective"|"orthographic")) => Tensor;

export const Render:Render = (scene,width,height,type="perspective") => {
  const VP = Viewport(width, height);

  const Per = ((type === "perspective") ? PerspectiveView : OrthographicView)(scene.viewVolume.left,scene.viewVolume.right,scene.viewVolume.bottom,scene.viewVolume.top,scene.viewVolume.near,scene.viewVolume.far) ;

  const Cam = CameraView(scene.camera.origin,scene.camera.direction,scene.camera.top);

  const M = MUL(MUL(VP,Per),Cam);

  const transform = (v:Vec4) => T(MUL(M,T([v] as Mat)))[0] as Vec4

  let image = Array(width).fill('').map((_,i) => Array(height).fill('').map((_,j) => [0,0,0,255]));

  for(const [v1,v2] of scene.lines){
    const [x_p,y_p,z_p,w_p] = transform([...v1,1]);
    const [x_q,y_q,z_q,w_q] = transform([...v2,1]);

    image = drawLine(image, [x_p/w_p,y_p/w_p], [x_q/w_q,y_q/w_q], [255,0,255,255]);
  }

  const zBuffer = Array(width).fill(1).map((_,i) => Array(height).fill(1).map(()=>-10000000));

  for(const surface of scene.surfaces){
    const mesh = surface.mesh();
    for(const triangle of mesh){
      const {vertices} = triangle;
      const color = triangle.color();
      const normal = triangle.normal();

      const [[x_0,y_0,z_0,w_0],[x_1,y_1,z_1,w_1],[x_2,y_2,z_2,w_2]] = vertices.map((v) => transform([...v,1]));

      const [c_1,c_2,c_3] = vertices.map(v => lightPoint(v, normal, color, scene.lightConfig, scene.camera.origin));
      
      drawTriangle(image, [
        [x_0/w_0, y_0/w_0,z_0/w_0],
        [x_1/w_1,y_1/w_1,z_1/w_1],
        [x_2/w_2,y_2/w_2,z_2/w_2]
      ], [c_1,c_2,c_3], zBuffer);
    }
  }

  return image;
}