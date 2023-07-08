import { MUL, Cross, Mat, Mat4, Normalize, Vec, Vec3, VectorMultiplyScalar } from "./LinearAlgebra";

export type ViewportTransformation = (n_x:number, n_y:number) => Mat;

export const Viewport:ViewportTransformation = (nx,ny) => {
  return [
    [nx/2, 0, 0, (nx-1)/2],
    [0, ny/2, 0, (ny-1)/2],
    [0,0,1,0],
    [0,0,0,1]
  ]
}

export type ViewTransformation = (l:number,r:number,b:number,t:number,n:number,f:number) => Mat;

export const OrthographicView:ViewTransformation = (l,r,b,t,n,f) => ([
  [2/(r - l),0,0,-(r+l)/(r-l)],
  [0,2/(t-b),0,-(t+b)/(t-b)],
  [0,0,2/(n-f),-(n+f)/(n-f)],
  [0,0,0,1]
])

export const PerspectiveView:ViewTransformation = (l,r,b,t,n,f) => MUL(
  OrthographicView(l,r,b,t,n,f)
  ,[
  [n,0,0,0],
  [0,n,0,0],
  [0,0,n+f,-f*n],
  [0,0,1,0]
])

export type CameraTransformation = (e: Vec3, g: Vec3, t: Vec3) => Mat4;

export const CameraView:CameraTransformation = (e,g,t) => {
  const w = VectorMultiplyScalar(Normalize(g),-1) as Vec3;
  const u = Normalize(Cross(t,w)) as Vec3;
  const v = Cross(w,u) as Vec3;

  const [x_u,y_u,z_u] = u;
  const [x_v,y_v,z_v] = v;
  const [x_w,y_w,z_w] = w;
  const [x_e,y_e,z_e] = e;

  return MUL(
    [
      [x_u, y_u, z_u, 0],
      [x_v, y_v, z_v, 0],
      [x_w, y_w, z_w, 0],
      [0,0,0,1]
    ],
    [
      [1,0,0,-x_e],
      [0,1,0,-y_e],
      [0,0,1,-z_e],
      [0,0,0,1]
    ]
  ) as Mat4;
}