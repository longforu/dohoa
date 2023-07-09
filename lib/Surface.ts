import { Cross, Dot, Normalize, Vec2, Vec3, Vec4, VectorAdd, VectorMultiplyScalar } from "./LinearAlgebra";

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

  color(point:Vec4):Vec4 {
    return [0,0,0,0]
  }

  mesh():Triangle[] {
    return []
  }
}``

export class Triangle extends Surface {
  vertices: [Vec3, Vec3, Vec3];
  surfaceColor: Vec4;

  constructor(vertices: [Vec3, Vec3, Vec3], color: Vec4) {
    super();
    this.vertices = vertices;
    this.surfaceColor = color;

  }

  normal(){
    const v1 = VectorAdd(this.vertices[0], VectorMultiplyScalar(this.vertices[1],-1)) as Vec3;
    const v2 = VectorAdd(this.vertices[0], VectorMultiplyScalar(this.vertices[2],-1)) as Vec3;
    return Normalize(Cross(v1,v2)) as Vec3;
  }

  mesh(){
    return [this];
  }

  color(){
    return this.surfaceColor;
  }
}

export class Sphere extends Surface {
  center: Vec3;
  radius: number;
  surfaceColor: Vec4;
  triangleMesh: Triangle[]


  constructor(center: Vec3, radius: number, color : Vec4, detail:number) {
    super();
    this.center = center;
    this.surfaceColor = color;
    this.radius = radius;

    // calculate mesh 
    const x_angles = Array(detail*2).fill(1).map((_,i) => i*(2*Math.PI)/(detail*2));
    const y_angles = Array(detail).fill(1).map((_,i) => (-1/2)*Math.PI + i*(Math.PI/(detail)))

    const angleVertices:[Vec2,Vec2,Vec2][] = [];

    for(let x = 0; x < x_angles.length; x++){
      const x_angle = x_angles[x];
      const x_next = x_angles[(x + 1) % x_angles.length];

      for(let y = 1; y < y_angles.length - 1; y++){
        const y_angle = y_angles[y];
        const y_next = y_angles[(y + 1) % y_angles.length];

        angleVertices.push(
          [
            [
              x_angle,
              y_angle
            ],
            [
              x_angle,
              y_next
            ],
            [
              x_next,
              y_angle
            ]
          ],
          [
            [
              x_next,
              y_angle
            ],
            [
              x_angle,
              y_next
            ],
            [
              x_next,
              y_next
            ]
          ]
        )
      }

      const y_first = y_angles[1];
      const y_penultimate = y_angles[y_angles.length - 2];

      angleVertices.push(
        [
          [x_angle, y_first],
          [x_next, y_first],
          [0,-Math.PI/2]
        ],
        [
          [x_angle,y_penultimate],
          [x_next, y_penultimate],
          [0,Math.PI/2]
        ]
      )
    }

    // convert it to coordinates using spherical
    const triangleCoords = angleVertices.map((v) => v.map(([theta,phi]) => VectorAdd([
      radius*Math.cos(phi)*Math.cos(theta),
      radius*Math.cos(phi)*Math.sin(theta),
      radius*Math.sin(phi)
    ],center) as Vec3) as [Vec3,Vec3,Vec3]);

    this.triangleMesh = triangleCoords.map(c => new Triangle(c, this.surfaceColor));
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

  mesh(){
    return this.triangleMesh;
  }
}