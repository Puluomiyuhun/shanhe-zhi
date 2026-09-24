import * as THREE from './vendor/three.module.js';
// Same full-resolution triangles, indexed into bounded chunks for pointer queries only.
// These meshes are NOT added to the scene and add no render calls or visible seams.
export function createTerrainPicker(geometry,segments=640,chunkSize=64){
 const positions=geometry.attributes.position,stride=segments+1,meshes=[],material=new THREE.MeshBasicMaterial();
 const point=new THREE.Vector3();
 for(let row=0;row<segments;row+=chunkSize)for(let col=0;col<segments;col+=chunkSize){
  const endRow=Math.min(row+chunkSize,segments),endCol=Math.min(col+chunkSize,segments),indices=[];
  const box=new THREE.Box3();
  for(let r=row;r<=endRow;r++)for(let c=col;c<=endCol;c++){point.fromBufferAttribute(positions,r*stride+c);box.expandByPoint(point);}
  for(let r=row;r<endRow;r++)for(let c=col;c<endCol;c++){const a=r*stride+c,b=(r+1)*stride+c,d=a+1,e=b+1;indices.push(a,b,d,b,e,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',positions);g.setIndex(indices);g.boundingBox=box;g.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
  const mesh=new THREE.Mesh(g,material);mesh.matrixAutoUpdate=false;meshes.push(mesh);
 }
 return {count:meshes.length,pick(raycaster,matrixWorld){for(const mesh of meshes)mesh.matrixWorld.copy(matrixWorld);return raycaster.intersectObjects(meshes,false)[0]||null;}};
}
