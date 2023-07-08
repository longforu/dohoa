import { Dot, Normalize, Vec3, Vec4, VectorAdd, VectorMultiplyScalar } from "./LinearAlgebra";

export type Ray = {
  origin: Vec3;
  direction: Vec3;
}

export class Surface {
  hit(ray:Ray):number{
    return -1;
  }

  normal(point:Vec3):Vec3 {
    return [0, 0, 0];
  }

  color(point:Vec3):Vec3 {
    return [0,0,0]
  }
}

export class Sphere extends Surface {
  center: Vec3;
  radius: number;
  surfaceColor: Vec3;

  constructor(center: Vec3, radius: number, color : Vec3) {
    super();
    this.center = center;
    this.surfaceColor = color;
    this.radius = radius;
  }

  color(){
    return this.surfaceColor;
  }

  normal(point:Vec3):Vec3 {
    return Normalize(point.map((p, i) => p - this.center[i]) as Vec3) as Vec3;
  }

  hit(ray:Ray) {
    const e = ray.origin;
    const d = ray.direction;

    const c = this.center;

    const discriminant = Math.pow(Dot(d, VectorAdd(e, VectorMultiplyScalar(c, -1))),2) - (Dot(d,d))*(Dot(VectorAdd(e,VectorMultiplyScalar(c,-1)),VectorAdd(e,VectorMultiplyScalar(c,-1))) - Math.pow(this.radius,2));

    if (discriminant >= 0) {
      const t1 = (Dot(d, c) - Dot(d, e) + Math.sqrt(discriminant)) / Dot(d, d);
      const t2 = (Dot(d, c) - Dot(d, e) - Math.sqrt(discriminant)) / Dot(d, d);

      if (t1 > 0 && t2 > 0) {
        return Math.min(t1, t2);
      } else if (t1 > 0) {
        return t1;
      } else if (t2 > 0) {
        return t2;
      }
    }

    return -1;
  }
}

export class Triangle extends Surface {
  vertices: [Vec3, Vec3, Vec3];

  constructor(vertices: [Vec3, Vec3, Vec3]) {
    super();
    this.vertices = vertices;
  }
}