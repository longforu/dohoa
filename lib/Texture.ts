import { Vec, Vec2, Vec3 } from "./LinearAlgebra";
import Jimp from 'jimp';

export class Sprite {
  path: string;
  width: number;
  height: number;
  loaded: boolean;
  image: Jimp | null;

  constructor(path:string,onload: ()=>void){
    this.loaded = false;
    this.height = 0;
    this.width = 0;
    this.image = null;
    this.path = path;

    Jimp.read(path, (err, image) => {
      if (err){
        console.log(err);
        throw new Error("Error when loading sprite.")
      }
      else {
        this.loaded = true;
        this.image = image;
        this.height = image.getHeight();
        this.width = image.getWidth();
        onload();
      }
    })
  }

  getPixel(x:number,y:number){
    if(this.image === null) throw new Error("Image not loaded");
    const {r,g,b} =  Jimp.intToRGBA(this.image.getPixelColor(x,y));
    return [r,g,b] as Vec3;
  }
}

export class Texture {
  backgroundColor: Vec3;

  constructor(color: Vec3){
    this.backgroundColor = color;
  }

  color(point:Vec3):Vec3{
    return this.backgroundColor;
  }
}

export class TextureImage extends Texture {
  image: Sprite;

  constructor(color: Vec3, image: Sprite){
    super(color);
    this.image = image;
  }

  // remember that the texture image is a unit square
  getPixelImage(u:number,v:number){
    // check the padding
    const {width,height} = this.image;

    let xPadding = 0, yPadding = 0;
    if(width > height) {
      yPadding = (width - height)/2; 
    }
    else if(height > width){
      xPadding = (height - width)/2;
    }

    const sideLength = Math.max(height,width);
    const [coordX,coordY] = [u,v].map(i => Math.trunc(i*sideLength));

    if(coordX < xPadding || coordX > xPadding + width) return this.backgroundColor;
    if(coordY < yPadding || coordY > yPadding + height) return this.backgroundColor;

    return this.image.getPixel(coordX - xPadding, coordY - yPadding);
  }

  getPixel(u:number,v:number){
    return this.image.getPixel(u,v);
  }
}

export class SphericalMap extends TextureImage {
  center: Vec3;
  radius: number;

  constructor(center:Vec3, radius:number, color:Vec3, textureImage:Sprite){
    super(color,textureImage);
    this.center = center;
    this.radius = radius;
  }

  getUV(point:Vec3){
    const [x,y,z] = point;
    const [x_c,y_c,z_c] = this.center;
    const theta = Math.acos((z - z_c)/this.radius);
    const phi = Math.atan2(y - y_c, x - x_c) + Math.PI;

    const u = (phi)/(2*Math.PI);
    const v = (Math.PI - theta)/(Math.PI);
    return [u,v] as Vec2;
  }

  color(point: Vec3){
    return this.getPixelImage(...this.getUV(point));
  }
}

export class Fragment {
  vertices: [Vec2, Vec2, Vec2];
  color: [Vec3,Vec3,Vec3];

  constructor(vertices: [Vec2,Vec2,Vec2], color: [Vec3,Vec3,Vec3]){
    this.vertices = vertices;
    this.color = color;
  }
} 