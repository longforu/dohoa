import { MUL,Mat,T, Tensor, Vec2, Vec3, Vec4 } from "./LinearAlgebra"
import { CameraView, OrthographicView, Viewport, PerspectiveView } from "./Transformation"

export type Line = [Vec3,Vec3]

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

  lines: Line[]
}

const drawPixel = (image:Tensor, x:number, y:number, color:Vec4):Tensor => {
  const x_int = Math.round(x);
  const y_int = image.length - Math.round(y);

  if(x_int > 0 && y_int > 0 && y_int < image.length && x_int < image[0].length) (image[x_int][y_int] = color)

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

export type Render = (scene:Scene, width: number, height:number) => Tensor;

export const OrthographicRender:Render = (scene,width,height) => {
  const VP = Viewport(width, height);

  const Orth = OrthographicView(scene.viewVolume.left,scene.viewVolume.right,scene.viewVolume.bottom,scene.viewVolume.top,scene.viewVolume.near,scene.viewVolume.far);

  const Cam = CameraView(scene.camera.origin,scene.camera.direction,scene.camera.top);

  const M = MUL(MUL(VP,Orth),Cam);  

  let image = Array(height).fill('').map((_,i) => Array(width).fill('').map((_,j) => [0,0,0,255]));

  for(const [v1,v2] of scene.lines){
    const [x_p,y_p,z_p,w_p] = T(MUL(M,T([[...v1,1]] as Mat)))[0] as Vec4;
    const [x_q,y_q,z_q,w_q] = T(MUL(M,T([[...v2,1]] as Mat)))[0] as Vec4;

    image = drawLine(image, [x_p/w_p,y_p/w_p], [x_q/w_q,y_q/w_q], [255,0,255,255]);
  }

  return image;
}

export const PerspectiveRender:Render = (scene,width,height) => {
  const VP = Viewport(width, height);

  const Per = PerspectiveView(scene.viewVolume.left,scene.viewVolume.right,scene.viewVolume.bottom,scene.viewVolume.top,scene.viewVolume.near,scene.viewVolume.far);

  const Cam = CameraView(scene.camera.origin,scene.camera.direction,scene.camera.top);

  const M = MUL(MUL(VP,Per),Cam);

  let image = Array(height).fill('').map((_,i) => Array(width).fill('').map((_,j) => [0,0,0,255]));

  for(const [v1,v2] of scene.lines){
    const [x_p,y_p,z_p,w_p] = T(MUL(M,T([[...v1,1]] as Mat)))[0] as Vec4;
    const [x_q,y_q,z_q,w_q] = T(MUL(M,T([[...v2,1]] as Mat)))[0] as Vec4;

    image = drawLine(image, [x_p/w_p,y_p/w_p], [x_q/w_q,y_q/w_q], [255,0,255,255]);
  }

  return image;
}