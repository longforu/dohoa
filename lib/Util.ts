export const max = (arr:number[])=>{
  let max = arr[0];
  for(let i = 1; i < arr.length; i++) if(arr[i]>max) max = arr[i];
  return max;
}

export const min = (arr:number[])=>{
  let min = arr[0];
  for(let i = 1; i < arr.length; i++) if(arr[i]<min) min = arr[i];
  return min;
}

export const Promisify = (f: (onload: (output:any) => void, ...args: any[]) => any) => (...args:any[]) => new Promise((resolve,reject) => {
  try {
    f((output) => {
      resolve(output);
    },...args)
  } catch (e) {
    reject(e);
  }
})