import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Authored GLB nodes remain editable in Blender. Runtime geometry is merged once
// per animation layer and surface class; no GLB clones enter the moving world.
export async function loadAssets(names){
  const loader=new GLTFLoader(),assets={};
  for(const name of names){
    const gltf=await loader.loadAsync(`/assets/${name}.glb`);gltf.scene.updateMatrixWorld(true);
    const root=gltf.scene.children[0],parts=[];
    for(const node of root.children){
      const groups=[[],[]];
      node.traverse(o=>{if(!o.isMesh)return;
        const m=o.material,g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
        for(const attr of Object.keys(g.attributes))if(!['position','normal'].includes(attr))g.deleteAttribute(attr);
        const count=g.attributes.position.count,colors=new Float32Array(count*3),surface=new Float32Array(count*2);
        const glow=m.emissive&&m.emissive.getHex()>0,color=glow?m.emissive.clone().multiplyScalar(m.emissiveIntensity):m.color;
        for(let i=0;i<count;i++){color.toArray(colors,i*3);surface[i*2]=m.roughness;surface[i*2+1]=m.metalness;}
        g.setAttribute('color',new T.BufferAttribute(colors,3));g.setAttribute('surface',new T.BufferAttribute(surface,2));groups[glow?1:0].push(g);
      });
      const pivot=new T.Vector3().setFromMatrixPosition(node.matrixWorld);
      groups.forEach((list,glow)=>{if(!list.length)return;const geometry=mergeGeometries(list);list.forEach(g=>g.dispose());parts.push({name:node.name,pivot,geometry,glow});});
    }
    const disposed=new Set();gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(!disposed.has(o.material)){disposed.add(o.material);o.material.dispose();}}});assets[name]=parts;
  }
  return assets;
}
