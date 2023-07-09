import Jimp from "jimp";
import { Render, Scene } from "./lib/Rasterize";
import { GifFrame, GifUtil, GifCodec } from 'gifwrap';
import { Cross, Normalize, Vec2, Vec3, Vec4, VectorMultiplyScalar } from "./lib/LinearAlgebra";
import { Sphere, Triangle } from "./lib/Surface";

const SCREEN_RATIO = 16/9;
const HEIGHT = 500;
const WIDTH = HEIGHT;
const FPS = 48;

const exportSceneOrthographic = (scene:Scene, name: string) => {
  const imageBlock = Render(scene, WIDTH, HEIGHT,'orthographic');

  const image = new Jimp(WIDTH,HEIGHT, 'black');
  
  // we have to clamp this
  
  for(let i = 0; i < HEIGHT; i++){
    for(let j = 0; j < WIDTH; j++){
      const pixel = imageBlock[i][j];
  
      for(let d = 0; d < pixel.length; d ++){
        pixel[d] = Math.min(pixel[d],255)
      }
  
      image.setPixelColor(Jimp.rgbaToInt(...(pixel as Vec4)),j,i);
    }
  }
  image.write(name+'_ltortho.'+image.getExtension());
}

const exportScenePerspective = (scene:Scene, name: string) => {
  const imageBlock = Render(scene, WIDTH, HEIGHT);

  const image = new Jimp(WIDTH,HEIGHT, 'black');
  
  // we have to clamp this
  
  for(let i = 0; i < HEIGHT; i++){
    for(let j = 0; j < WIDTH; j++){
      const pixel = imageBlock[i][j];
  
      for(let d = 0; d < pixel.length; d ++){
        pixel[d] = Math.min(pixel[d],255)
      }
  
      image.setPixelColor(Jimp.rgbaToInt(...(pixel as Vec4)),j,i);
    }
  }
  image.write(name+'_ltperspective.'+image.getExtension());
}

const exportGifZAxisRotation = (filename:string,scene:Scene, radius: number, duration: number, type:"perspective"|"orthographic" = "perspective") => {
  const pixelDelta = (1/(FPS*duration))*(2*Math.PI);
  const angles = Array(duration*FPS).fill('').map((_,i) => i*pixelDelta);
  const origin = angles.map((a) => ([radius*Math.cos(a), radius*Math.sin(a),0] as Vec3));
  const direction = origin.map(o => VectorMultiplyScalar(o, -1) as Vec3);
  const up = direction.map(d => Cross([0,0,1],d) as Vec3);

  const frames = up.map((u,i) => {
    console.log('Rendering Frame ' + i + ' of ' + duration*FPS);
    
    const e = origin[i];
    const d = direction[i];

    scene.camera.origin = e;
    scene.camera.direction = d;
    scene.camera.top = u;
    
    let data = Render(scene, WIDTH, HEIGHT,type).flat(3);

    for(let i = 0; i < data.length; i++){
      const c = data[i];

      if(c < 0 || c > 255 || c !== Math.trunc(c)) throw new Error("Bad data " + i);
    }

    const frame = new GifFrame(WIDTH, HEIGHT, new Buffer(data), {delayCentisecs: (1/FPS)*1000});

    return frame;
  })

  console.log('Writing to files...');
  GifUtil.write(filename + `_lt_rotation_${type}.gif`, frames, {loops:0});
}

const VVS = 10

const viewVolume = {
  left: -VVS,
  right: VVS,
  bottom: -VVS,
  top: VVS,
  near: -VVS,
  far: VVS
}

// const Cube:Scene = {
//   viewVolume,

//   camera: {
//     origin: [0,0,0],
//     direction: [0,0,0],
//     top: [0,0,0]
//   },

//   lines: [
//     // top face
//     [
//       [5,5,5],
//       [-5,5,5]
//     ],
//     [
//       [5,5,5],
//       [5,-5,5]
//     ],
//     [
//       [-5,5,5],
//       [-5,-5,5]
//     ],
//     [
//       [-5,-5,5],
//       [5,-5,5]
//     ],
//     //bottom face
//     [
//       [5,5,-5],
//       [-5,5,-5]
//     ],
//     [
//       [5,5,-5],
//       [5,-5,-5]
//     ],
//     [
//       [-5,5,-5],
//       [-5,-5,-5]
//     ],
    
//     [
//       [-5,-5,-5],
//       [5,-5,-5]
//     ],
//     //suport
//     [
//       [5,5,5],
//       [5,5,-5]
//     ],
//     [
//       [-5,5,5],
//       [-5,5,-5]
//     ],
//     [
//       [-5,-5,5],
//       [-5,-5,-5]
//     ],
//     [
//       [5,-5,5],
//       [5,-5,-5]
//     ]
//   ],
//   surfaces:[]
// }

const sphere = new Sphere(
  [0,0,0],
  5,
  [255,255,0,255],
  16
)

const sphere2 = new Sphere(
  [0,8,0],
  2,
  [0,0,255,255],
  16
)

// console.log(sphere.mesh().map(e => e.vertices));

const sphereScene = {
  viewVolume,

  camera: {
    origin: [0,-10,0] as Vec3,
    direction: [0,1,0] as Vec3,
    top: [1,0,0] as Vec3
  },

  lines: [],
  surfaces:[
    sphere,
    sphere2
  ],
  lightConfig: {
    lights: [
      {
        origin: [10,10,10] as Vec3,
        intensity:[0.7,0.7,0.7,1] as Vec4
      }
    ],
    ambientConstant: 0.4,
    phongExponent: 2
  }
}

console.profile();
exportGifZAxisRotation('sphere',sphereScene, 15,2);
// exportScenePerspective(sphereScene, 'testSphere')
// exportSceneOrthographic(sphereScene, 'testSphere')
console.profileEnd();

// why does it get darker (revert to ambience) as the details of the thing increase
// pallete problem (related to detail size)