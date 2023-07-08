import Jimp from "jimp";
import { OrthographicRender, PerspectiveRender, Scene } from "./lib/Rasterize";
import { GifFrame, GifUtil, GifCodec } from 'gifwrap';
import { Cross, Normalize, Vec2, Vec3, Vec4, VectorMultiplyScalar } from "./lib/LinearAlgebra";

const SCREEN_RATIO = 16/9;
const HEIGHT = 500;
const WIDTH = HEIGHT;
const FPS = 48;

const exportSceneOrthographic = (scene:Scene, name: string) => {
  const imageBlock = OrthographicRender(scene, WIDTH, HEIGHT);

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
  const imageBlock = PerspectiveRender(scene, WIDTH, HEIGHT);

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

const exportGifZAxisRotation = (filename:string,scene:Scene, radius: number, duration: number) => {
  const pixelDelta = (1/(FPS*duration))*(2*Math.PI);
  const angles = Array(duration*FPS).fill('').map((_,i) => i*pixelDelta);
  const origin = angles.map((a) => ([radius*Math.cos(a), radius*Math.sin(a),0] as Vec3));
  const direction = origin.map(o => VectorMultiplyScalar(o, -1) as Vec3);
  const up = direction.map(d => Cross(d,[0,0,1]) as Vec3);

  const frames = up.map((u,i) => {
    console.log('Rendering Frame ' + i + ' of ' + duration*FPS);
    
    const e = origin[i];
    const d = direction[i];

    scene.camera.origin = e;
    scene.camera.direction = d;
    scene.camera.top = u;
    
    const orthoData = new Buffer(OrthographicRender(scene, WIDTH, HEIGHT).flat(3));
    const perspectiveData = new Buffer(PerspectiveRender(scene,WIDTH,HEIGHT).flat(3));

    const orthoFrame = new GifFrame(WIDTH, HEIGHT, orthoData, {delayCentisecs: (1/FPS)*1000});
    const perspectiveFrame = new GifFrame(WIDTH, HEIGHT, perspectiveData, {delayCentisecs: (1/FPS)*1000});

    return [orthoFrame, perspectiveFrame];
  })

  const orthoFrames = frames.map(e => e[0]);
  const perspectiveFrames = frames.map(e => e[1]);

  console.log('Writing to files...');
  GifUtil.write(filename + '_ltortho_rotation.gif', orthoFrames, {loops:0});
  GifUtil.write(filename + '_ltperspective_rotation.gif', perspectiveFrames, {loops:0});
}

const angle = (1/12)*Math.PI;

const coords = Array(24).fill('').map((_,i) => [5*Math.cos(angle*i), 5*Math.sin(angle*i)])

const VVS = 10

const viewVolume = {
  left: -VVS,
  right: VVS,
  bottom: -VVS,
  top: VVS,
  near: VVS,
  far: -VVS
}

const Star:Scene = {
  viewVolume,

  camera: {
    origin: [-100,0,0],
    direction: [-1,0,0],
    top: [0,1,0]
  },

  lines: coords.map(([x,y]) => [
    [0,0,0],
    [0,x,y]
  ])
}

const Cube:Scene = {
  viewVolume,

  camera: {
    origin: [0,0,0],
    direction: [0,0,0],
    top: [0,0,0]
  },

  lines: [
    // top face
    [
      [5,5,5],
      [-5,5,5]
    ],
    [
      [5,5,5],
      [5,-5,5]
    ],
    [
      [-5,5,5],
      [-5,-5,5]
    ],
    [
      [-5,-5,5],
      [5,-5,5]
    ],
    //bottom face
    [
      [5,5,-5],
      [-5,5,-5]
    ],
    [
      [5,5,-5],
      [5,-5,-5]
    ],
    [
      [-5,5,-5],
      [-5,-5,-5]
    ],
    
    [
      [-5,-5,-5],
      [5,-5,-5]
    ],
    //suport
    [
      [5,5,5],
      [5,5,-5]
    ],
    [
      [-5,5,5],
      [-5,5,-5]
    ],
    [
      [-5,-5,5],
      [-5,-5,-5]
    ],
    [
      [5,-5,5],
      [5,-5,-5]
    ]
  ]
}

console.profile();
exportGifZAxisRotation('cube',Cube, 15,2);
console.profileEnd();