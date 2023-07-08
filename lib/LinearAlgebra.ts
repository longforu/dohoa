export type Mat = number[][];

export type Transpose = (mat: Mat) => Mat;

export type Zeroes = (n: number, m: number) => Mat;

export type Identity = (n: number) => Mat;

export type GetDimension = (mat: Mat) => [number, number];

export type Compare = (mat1: Mat, mat2: Mat) => boolean;

export type Add = (mat1: Mat, mat2: Mat) => Mat;

export type Multiply = (mat1: Mat, mat2: Mat) => Mat;

export type MultiplyScalar = (mat: Mat, scalar: number) => Mat;

export type Determinant = (mat: Mat) => number;

export const Z:Zeroes = (n, m) => {
  const mat:Mat = [];
  for (let i = 0; i < n; i++) {
    mat.push([]);
    for (let j = 0; j < m; j++) {
      mat[i].push(0);
    }
  }
  return mat;
}

export const I:Identity = (n) => {
  const mat:Mat = Z(n, n);
  for (let i = 0; i < n; i++) {
    mat[i][i] = 1;
  }
  return mat;
}

export const D:GetDimension = (mat) => {
  return [mat.length, mat[0].length];
}

export const T:Transpose = (mat) => {
  const [y,x] = D(mat);
  
  const newMat:Mat = Z(x,y);
  for (let i = 0; i < mat.length; i++) {
    for (let j = 0; j < mat[0].length; j++) {
      newMat[j][i] = mat[i][j];
    }
  }
  return newMat;
}

export const C:Compare = (mat1, mat2) => {
  if (D(mat1)[0] !== D(mat2)[0] || D(mat1)[1] !== D(mat2)[1]) {
    return false;
  }
  for (let i = 0; i < D(mat1)[0]; i++) {
    for (let j = 0; j < D(mat1)[1]; j++) {
      if (mat1[i][j] !== mat2[i][j]) {
        return false;
      }
    }
  }
  return true;
}

export const A:Add = (mat1, mat2) => {
  if(mat1.length !== mat2.length || mat1[0].length !== mat2[0].length ) {
    throw new Error('Matrices must be of the same dimension');
  }
  const newMat:Mat = Z(...D(mat1));
  for (let i = 0; i < D(mat1)[0]; i++) {
    for (let j = 0; j < D(mat1)[1]; j++) {
      newMat[i][j] = mat1[i][j] + mat2[i][j];
    }
  }
  return newMat;
}

export const MUL:Multiply = (mat1, mat2) => {
  if (D(mat1)[1] !== D(mat2)[0]) {
    throw new Error('Matrices must be of the same dimension');
  }
  const newMat:Mat = Z(D(mat1)[0], D(mat2)[1]);
  for (let i = 0; i < D(mat1)[0]; i++) {
    for (let j = 0; j < D(mat2)[1]; j++) {
      for (let k = 0; k < D(mat1)[1]; k++) {
        newMat[i][j] += mat1[i][k] * mat2[k][j];
      }
    }
  }
  return newMat;
}

export const MULS:MultiplyScalar = (mat, scalar) => {
  const newMat:Mat = Z(...D(mat));
  for (let i = 0; i < D(mat)[0]; i++) {
    for (let j = 0; j < D(mat)[1]; j++) {
      newMat[i][j] = mat[i][j] * scalar;
    }
  }
  return newMat;
}

export const DET:Determinant = (mat) => {
  if (D(mat)[0] !== D(mat)[1]) {
    throw new Error('Matrix must be square');
  }
  if (D(mat)[0] === 1) {
    return mat[0][0];
  }
  let det = 0;
  for (let i = 0; i < D(mat)[0]; i++) {
    const subMat:Mat = Z(D(mat)[0] - 1, D(mat)[1] - 1);
    for (let j = 1; j < D(mat)[0]; j++) {
      for (let k = 0; k < D(mat)[0]; k++) {
        if (k < i) {
          subMat[j - 1][k] = mat[j][k];
        } else if (k > i) {
          subMat[j - 1][k - 1] = mat[j][k];
        }
      }
    }
    det += (i % 2 === 0 ? 1 : -1) * mat[0][i] * DET(subMat);
  }
  return det;
}

export type HademardProduct = (mat1:Mat, mat2:Mat) => Mat;

export const Hademard:HademardProduct = (mat1:Mat, mat2:Mat) => {
  if(!C([D(mat1)] as Mat,[D(mat2)] as Mat)) throw new Error('Matrix does not have the same dimension');

  return mat1.map((v,i) => v.map((d,j) => d*mat2[i][j]));
}

export type Vec2 = [number, number];

export type Vec3 = [number, number, number];

export type Vec4 = [number, number, number, number];

export type Mat2 = [Vec2, Vec2];

export type Mat3 = [Vec3, Vec3, Vec3];

export type Mat4 = [Vec4, Vec4, Vec4, Vec4];

export type Vec = Vec2 | Vec3 | Vec4;

export type DotVector = (vec1: Vec, vec2: Vec) => number;

export const Dot:DotVector = (vec1, vec2) => {
  const M1 = [vec1] as Mat;
  const M2 = [vec2] as Mat;
  
  return MUL(M1, T(M2))[0][0];
}

export type CrossVector = (vec1: Vec3, vec2: Vec3) => Vec;

export const Cross:CrossVector = (vec1, vec2) => {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must be of the same dimension');
  }
  if (vec1.length < 3) {
    throw new Error('Vectors must be at least 3 dimensional');
  }
  const newVec:Vec = [0, 0, 0];
  newVec[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
  newVec[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
  newVec[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];
  return newVec;
}

export type NormVector = (vec: Vec) => number;

export const Norm:NormVector = (vec) => {
  return Math.sqrt(Dot(vec, vec));
}

export type NormalizeVector = (vec: Vec) => Vec;

export const Normalize:NormalizeVector = (vec) => {
  return MULS([vec] as Mat, 1 / Norm(vec))[0] as Vec;
}

export type AngleVector = (vec1: Vec, vec2: Vec) => number;

export const Angle:AngleVector = (vec1, vec2) => {
  return Math.acos(Dot(vec1, vec2) / (Norm(vec1) * Norm(vec2)));
}

export type AddVector = (vec1: Vec, vec2: Vec) => Vec;

export const VectorAdd:AddVector = (vec1,vec2) => {
  if(vec1.length !== vec2.length) throw new Error('Vectors does not have the same dimension.');

  return vec1.map((v,i) => v + vec2[i]) as Vec;
}

export type MultiplyScalarVector = (vec:Vec, c:number) => Vec;

export const VectorMultiplyScalar:MultiplyScalarVector = (vec, c) => {
  return vec.map((v:number) => v*c) as Vec;
}

export type HademardVector = (vec1:Vec, vec2:Vec) => Vec;

export const HademardV:HademardVector = (vec1,vec2) => {
  return Hademard([vec1] as Mat, [vec2] as Mat)[0] as Vec;
}

export type Tensor = Mat[];

export type ZeroesTensor = (n: number, m: number, o: number) => Tensor;

export type DimensionTensor = (tensor: Tensor) => [number, number, number];

export type CompareTensor = (tensor1: Tensor, tensor2: Tensor) => boolean;

export type AddTensor = (tensor1: Tensor, tensor2: Tensor) => Tensor;

export const ZT:ZeroesTensor = (n, m, o) => {
  const tensor:Tensor = [];
  for (let i = 0; i < n; i++) {
    tensor.push(Z(m, o));
  }
  return tensor;
}

export const DT:DimensionTensor = (tensor) => {
  return [tensor.length, tensor[0].length, tensor[0][0].length];
}

export const CT:CompareTensor = (tensor1, tensor2) => {
  if (DT(tensor1)[0] !== DT(tensor2)[0] || DT(tensor1)[1] !== DT(tensor2)[1] || DT(tensor1)[2] !== DT(tensor2)[2]) {
    return false;
  }
  for (let i = 0; i < DT(tensor1)[0]; i++) {
    for (let j = 0; j < DT(tensor1)[1]; j++) {
      for (let k = 0; k < DT(tensor1)[2]; k++) {
        if (tensor1[i][j][k] !== tensor2[i][j][k]) {
          return false;
        }
      }
    }
  }
  return true;
}

export const AT:AddTensor = (tensor1, tensor2) => {
  if (DT(tensor1)[0] !== DT(tensor2)[0] || DT(tensor1)[1] !== DT(tensor2)[1] || DT(tensor1)[2] !== DT(tensor2)[2]) {
    throw new Error('Tensors must be of the same dimension');
  }
  const tensor:Tensor = ZT(...DT(tensor1));
  for (let i = 0; i < DT(tensor1)[0]; i++) {
    for (let j = 0; j < DT(tensor1)[1]; j++) {
      for (let k = 0; k < DT(tensor1)[2]; k++) {
        tensor[i][j][k] = tensor1[i][j][k] + tensor2[i][j][k];
      }
    }
  }
  return tensor;
}