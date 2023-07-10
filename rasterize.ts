import Jimp, {} from "jimp";
import { Render, Scene } from "./lib/Rasterize";
import { GifFrame, GifUtil, GifCodec, BitmapImage } from 'gifwrap';
import { Cross, Normalize, Vec2, Vec3, Vec4, VectorMultiplyScalar } from "./lib/LinearAlgebra";
import { Sphere, Triangle } from "./lib/Surface";
//@ts-ignore
import videoshow from 'videoshow';
import JPEG from 'jpeg-js';
import fs from 'fs';
import path from 'path';
import { SphericalMap, Sprite, Texture } from "./lib/Texture";
import { Promisify } from "./lib/Util";

Jimp.decoders['image/jpeg'] = (data) => JPEG.decode(data, {
	maxMemoryUsageInMB: 6144,
	maxResolutionInMP: 600
});

const HEIGHT = 500;
const WIDTH = HEIGHT;
const FPS = 12;

const videoshowPromise = Promisify((onload,images,videoOptions,path) => {
  videoshow(images,videoOptions).save(path).on('end', (output:any) => onload(output));
})

const spritePromise = Promisify((onload,path) => {
  const sprite = new Sprite(path, () => {
    onload(sprite);
  })
})

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

  const filePath = name + '_ltortho.' + image.getExtension();
   return new Promise((resolve) => {
    image.write(filePath, () => {
      resolve(filePath);
    })
  })
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
  const filePath = name + '_ltperspective.' + image.getExtension();
  return new Promise((resolve) => {
    image.write(filePath, () => {
      resolve(filePath);
    })
  })
}

const exportGifZAxisRotation = async (filename:string,scene:Scene, radius: number, duration: number, type:"perspective"|"orthographic" = "perspective") => {
  const pixelDelta = (1/(FPS*duration))*(2*Math.PI);
  const angles = Array(duration*FPS).fill('').map((_,i) => i*pixelDelta);
  const origin = angles.map((a) => ([radius*Math.cos(a), radius*Math.sin(a),0] as Vec3));
  const direction = origin.map(o => VectorMultiplyScalar(o, -1) as Vec3);
  const up = direction.map(d => Cross([0, 0, 1], d) as Vec3);
  
  // make temp frame folder
  if(!fs.existsSync('./temp')) fs.mkdirSync('./temp')
  if(!fs.existsSync('./temp/'+filename)) fs.mkdirSync('./temp/'+filename)


  const frames = await Promise.all(up.map((u, i) => {
    console.log('Rendering Frame ' + i + ' of ' + duration * FPS);
    
    const e = origin[i];
    const d = direction[i];

    scene.camera.origin = e;
    scene.camera.direction = d;
    scene.camera.top = u;
    
    return (type === 'perspective' ? exportScenePerspective : exportSceneOrthographic)(scene, path.join(__dirname, '/temp/', filename, `${i}`));
  }));

  console.log('Writing to files...');
  return videoshowPromise(frames, {
    fps: FPS,
    format: 'mp4',
    size: WIDTH.toString() + "x" + HEIGHT.toString(),
    transition: false,
    loop: 0.1,
  },'./exports/'+filename+'_'+type+'.mp4')
}

const VVS = 10

const viewVolume = {
  left: -VVS,
  right: VVS,
  bottom: -VVS,
  top: VVS,
  near: -VVS,
  far: VVS
};

(async () => {
  const earthSprite = await spritePromise(path.join(__dirname, './textures/earth.jpg')) as Sprite;
  const sphere = new Sphere(
    [0, 0, 0],
    7,
    new SphericalMap([0, 0, 0], 7, [255, 255, 255], earthSprite),
    300
  )
  
  const sphere2 = new Sphere(
    [0, 8, 0],
    2,
    new Texture([0, 255, 0]),
    16
  )
    
  const sphereScene = {
    viewVolume,
  
    camera: {
      origin: [0, -10, 0] as Vec3,
      direction: [0, 1, 0] as Vec3,
      top: [1, 0, 0] as Vec3
    },
  
    lines: [],
    surfaces: [
      sphere,
      // sphere2
    ],
    lightConfig: {
      lights: [
        {
          origin: [15, 15, 15] as Vec3,
          intensity: [0.5, 0.5, 0.5, 1] as Vec4
        }
      ],
      ambientConstant: 0.2,
      phongExponent: 10
    }
  }

  // exportScenePerspective(sphereScene, './exports/testSphere');
  await exportGifZAxisRotation('earth_big', sphereScene, 15, 3);
  console.log('done');
})();

// why is the x and y notation flipped? It seems wrong?