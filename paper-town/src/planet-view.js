import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SEASONS,environmentAt,normalizeSeason,normalizeHour} from './planet-environment.js';
import {PlanetGardens} from './planet-gardens.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {surfacePoint,TAU} from './planet-motion.js';
import {rng,stoneTexture,roadMaterial,groundMaterial,addSky,assetMaterial} from './planet-materials.js';
export class PlanetView{
 constructor(canvas,motion,assets){
  this.season='spring';this.hour=20.6;this.environmentUniforms={day:{value:0},night:{value:1},dusk:{value:0},snow:{value:0}};this.motion=motion;this.radius=motion.radius;this.scene=new T.Scene();this.root=new T.Group();this.scene.add(this.root);this.assets=assets;this.wheels=[];this.config={zoom:.94,tilt:0,bloom:.42};
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.info.autoReset=false;
  this.camera=new T.PerspectiveCamera(58,9/16,.1,180);
  this.hemi=new T.HemisphereLight('#9dbbef','#2b2016',.38);this.scene.add(this.hemi);const key=new T.DirectionalLight('#b5ceff',.85);key.position.set(-18,32,-20);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-20,right:20,top:22,bottom:-22,near:1,far:90});key.shadow.normalBias=.025;key.shadow.bias=-.0001;this.scene.add(key);this.key=key;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  const warm=new T.DirectionalLight('#ffb44f',.48);warm.position.set(16,10,-20);this.scene.add(warm);this.warm=warm;
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.19;room.dispose();pmrem.dispose();
  this.sky=addSky(this.scene,this.environmentUniforms);this.glowMap=this.sky.glow;this.mats=[assetMaterial(0,this.environmentUniforms),assetMaterial(1,this.environmentUniforms)];this.tmp=new T.Matrix4();this.local=new T.Matrix4();this.dummy=new T.Object3D();this.v1=new T.Vector3();this.v2=new T.Vector3();this.v3=new T.Vector3();
  this.sphere=new T.Mesh(new T.SphereGeometry(this.radius,96,64),groundMaterial());this.sphere.receiveShadow=true;this.root.add(this.sphere);
  this.road=new T.Mesh(this.band(-2.8,2.8,.035),roadMaterial(this.environmentUniforms));this.road.receiveShadow=true;this.root.add(this.road);
  const stone=stoneTexture(),sideMat=new T.MeshStandardMaterial({map:stone,roughness:.68,color:'#c1bba8'});
  for(const side of [-1,1]){const walk=new T.Mesh(this.band(side<0?-4.15:2.85,side<0?-2.85:4.15,.065),sideMat);walk.receiveShadow=true;this.root.add(walk);}
  this.batches={};for(const [name,parts] of Object.entries(assets)){if(name==='bus')continue;this.batches[name]=[0,1].map(glow=>{const gs=parts.filter(p=>p.glow===glow).map(p=>p.geometry);if(!gs.length)return null;const g=mergeGeometries(gs);const mesh=new T.InstancedMesh(g,this.mats[glow],80);mesh.count=0;mesh.castShadow=!glow;mesh.receiveShadow=true;mesh.frustumCulled=false;this.root.add(mesh);return mesh;});}
  this.populate();this.gardens=new PlanetGardens(this);this.makeBus();this.makeFeedback();
  this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(450,800),.42,.5,.85);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());this.resize();this.makeControls();this.setSeason('spring');this.setTime(20.6);this.update(0);
 }
 frame(x,theta,height=0,yaw=0,scale=1){const lat=x/this.radius,c=Math.cos(lat),s=Math.sin(lat),ct=Math.cos(theta),st=Math.sin(theta);this.v1.set(c,-s*ct,-s*st);this.v2.set(s,c*ct,c*st);this.v3.set(0,-st,ct);this.tmp.makeBasis(this.v1,this.v2,this.v3);this.tmp.setPosition(this.v2.x*(this.radius+height),this.v2.y*(this.radius+height),this.v2.z*(this.radius+height));if(yaw)this.tmp.multiply(this.local.makeRotationY(yaw));if(scale!==1)this.tmp.multiply(this.local.makeScale(scale,scale,scale));return this.tmp;}
 band(x0,x1,h=0,start=0,end=TAU){const p=[],n=[],uv=[],ix=[],rows=256,cols=8;for(let i=0;i<=rows;i++){const t=start+(end-start)*i/rows;for(let j=0;j<=cols;j++){const v=surfacePoint((x0+(x1-x0)*j/cols)/this.radius,t,this.radius+h);p.push(...v);n.push(...v.map(a=>a/(this.radius+h)));uv.push(j/cols,i/rows);if(i<rows&&j<cols){const a=i*(cols+1)+j;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);return g;}
 asset(name,x,t,scale=1,yaw=0){const mat=this.frame(x,t,.08,yaw,scale);for(const m of this.batches[name]||[]){if(!m)continue;if(m.count>=80)throw Error('planet asset capacity');m.setMatrixAt(m.count++,mat);}}
 batch(geo,mat,count){const m=new T.InstancedMesh(geo,mat,count);m.count=0;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;this.root.add(m);return m;}
 stamp(mesh,x,t,h,sx,sy,sz,yaw=0,color=null){const base=this.frame(x,t,h,yaw);base.multiply(this.local.makeScale(sx,sy,sz));mesh.setMatrixAt(mesh.count,base);if(color)mesh.setColorAt(mesh.count,new T.Color(color));mesh.count++;}
 populate(){const r=rng(23813),R=this.radius;
  const curb=this.batch(new RoundedBoxGeometry(.28,.18,.48,1,.025),new T.MeshStandardMaterial({color:'#a9a28c',roughness:.72}),720);
  for(let i=0;i<170;i++)for(const side of [-1,1])this.stamp(curb,side*2.86,i/170*TAU,.09,1,1,1,0,['#aca48f','#918c7e','#b8ac97'][i%3]);
  for(let i=0;i<20;i++){const t=i/20*TAU;for(const side of [-1,1])this.asset('planet_lamp',side*3.68,t,.88,side*Math.PI/2);}
  // Shops leave planted pockets between facades, instead of a continuous display wall.
  for(let i=0;i<12;i++)for(const side of [-1,1]){const t=i/12*TAU+(side>0?.12:0);const name=['bakery','cafe','florist'][(i+(side>0?1:0))%3];this.asset(name,side*(5.8+r()*.8),t,.7+r()*.17,side*Math.PI/2+(r()-.5)*.22);if(i%2===0)this.asset('Bench',side*4.6,t+.2,.82,side*Math.PI/2);this.asset(i%2?'FlowerPot_A':'FlowerPot_B',side*4.45,t-.15,.7,0);}
  this.asset('planet_church',9,.3,1.2,.6);this.asset('planet_windmill',-10,.03,1.2,-.7);this.asset('planet_lighthouse',-15,-.65,1.15,-.2);this.asset('planet_umbrella',5.6,-1.1,1.1,.2);this.asset('planet_church',-10,3.5,1.05,1);this.asset('planet_windmill',11,3.1,1.1,-1);this.asset('planet_lighthouse',16,2.7,1.05,0);this.asset('planet_umbrella',-5.6,2.1,1,.2);
  const rock=this.batch(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#788081',roughness:.94,flatShading:true}),250);
  for(let i=0;i<220;i++){const side=i%2?-1:1,x=side*(7.5+r()*10),t=r()*TAU;this.stamp(rock,x,t,-.13,.3+r()*.8,.3+r()*.65,.3+r()*.9,r()*TAU,['#72796c','#8f9288','#777d80'][i%3]);}
  const trunk=this.batch(new T.CylinderGeometry(.07,.14,1,7).translate(0,.5,0),new T.MeshStandardMaterial({color:'#63513b',roughness:1}),900);
  const leaf=this.batch(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:.88}),22000);
  const blossom=this.batch(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:.78}),5500);
  this.foliage=leaf;this.blossoms=blossom;
  // Tree crowns are many small overlapping leaves, with visible branching trunks.
  for(let i=0;i<86;i++){const side=i%2?-1:1;let x=side*(7.8+r()*9.8),t=r()*TAU;const cherry=i<3;if(cherry){x=7.7+i*.36;t=-1.17+i*.085;}
   const height=cherry?2.5:1.5+r()*1.8;this.stamp(trunk,x,t,0,1,height,1,r()*TAU);
   for(let j=0;j<5;j++){const a=j*2.4,dx=Math.cos(a)*.4,dz=Math.sin(a)*.4;const base=this.frame(x+dx,t+dz/R,height*.48,a);base.multiply(this.local.makeRotationZ(.5)).multiply(this.local.makeScale(.5,height*.65,.5));trunk.setMatrixAt(trunk.count++,base);}
   const count=cherry?280:110;for(let j=0;j<count;j++){const a=r()*TAU,z=r()*2-1,w=Math.sqrt(1-z*z),rr=Math.cbrt(r());const dx=Math.cos(a)*w*rr*(cherry?1.5:1.15),dz=Math.sin(a)*w*rr*1.05,dy=z*rr*.65;const size=cherry?.07+r()*.075:.16+r()*.12;this.stamp(cherry?blossom:leaf,x+dx,t+dz/R,height+.3+dy,size*1.3,size*.65,size,r()*TAU,cherry?['#eaa8b1','#f6c1c4','#d98f9e'][j%3]:['#526237','#677644','#3c542c','#849052'][j%4]);}
  }
  for(let i=0;i<1900;i++){const side=i%2?-1:1;const x=side*(4.6+r()*13),t=r()*TAU;this.stamp(leaf,x,t,.1,.13+r()*.16,.13+r()*.25,.12+r()*.16,r()*TAU,['#687747','#536b3c','#899655'][i%3]);if(i%2===0)this.stamp(blossom,x+.08,t,.32,.06,.06,.06,0,['#e3b5aa','#d8c681','#c48091'][i%3]);}
  // Low stone boundaries give the landscape a terraced diorama silhouette.
  const wall=this.batch(new RoundedBoxGeometry(.55,.32,.5,1,.04),new T.MeshStandardMaterial({color:'#8e8a76',roughness:.85}),420);
  for(let i=0;i<160;i++)for(const side of [-1,1])this.stamp(wall,side*(9.2+.4*Math.sin(i*.5)),i/160*TAU,.12,1,1,1,0);
  const debris=this.batch(new T.CircleGeometry(1,5).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:'#b69b67',side:T.DoubleSide,roughness:.9}),900);debris.castShadow=false;
  for(let i=0;i<800;i++)this.stamp(debris,(r()>.5?1:-1)*(1.6+r()*1.13),r()*TAU,.055,.025+r()*.04,1,.04+r()*.05,r()*TAU,['#b7995c','#c78974','#bbac77'][i%3]);
  // Subtle blue water beside the lighthouse, bounded to one side of the globe.
  const waterMat=this.waterMaterial=new T.MeshStandardMaterial({color:'#305d72',roughness:.24,metalness:.32});const lake=new T.Mesh(this.band(12.5,19.5,.02,-1.35,.2),waterMat);lake.receiveShadow=true;this.root.add(lake);const lake2=new T.Mesh(this.band(12.5,19.5,.02,1.8,3.35),waterMat);this.root.add(lake2);
  // Ground halos sit under every lamp, conforming to the same sphere.
  const pools=this.batch(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),new T.MeshBasicMaterial({map:this.glowMap,color:'#ffbb62',transparent:true,opacity:.66,depthWrite:false,blending:T.AdditiveBlending}),40);pools.castShadow=false;this.lampPools=pools;
  for(let i=0;i<20;i++)for(const side of [-1,1])this.stamp(pools,side*3.2,i/20*TAU,.13,2.7,1,3.6);
  this.root.traverse(o=>{if(o.isInstancedMesh){o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;}});
 }
 makeBus(){this.bus=new T.Group();const wheelmap=new Map();for(const p of this.assets.bus){const m=new T.Mesh(p.geometry,this.mats[p.glow]);m.castShadow=true;m.receiveShadow=true;if(p.name.startsWith('Wheel')){let w=wheelmap.get(p.name);if(!w){w=new T.Group();w.position.copy(p.pivot);this.bus.add(w);wheelmap.set(p.name,w);}m.position.copy(p.pivot).negate();w.add(m);}else this.bus.add(m);}this.wheels=[...wheelmap.values()];this.bus.matrixAutoUpdate=false;this.busTheta=-1.25;this.bus.matrix.copy(this.frame(.2,this.busTheta,.12,0,1.02));this.scene.add(this.bus);
  const head=new T.SpotLight('#ffe0a0',32,12,.45,.8,1.5);head.position.set(0,1,2);head.target.position.set(0,0,8);this.bus.add(head,head.target);this.head=head;
  const near=new T.PointLight('#ffb451',9,13,1.3);near.position.copy(new T.Vector3(...surfacePoint(-.22,-1.05,this.radius+2.8)));this.scene.add(near);const near2=new T.PointLight('#ffc275',9,13,1.3);near2.position.copy(new T.Vector3(...surfacePoint(.22,-1.5,this.radius+2.8)));this.scene.add(near2);this.streetLights=[near,near2];
 }
 makeFeedback(){this.waterHits=0;this.reflections=[];for(const [x,t,color,sx,sz] of [[-.6,-1.42,'#ff2511',.7,1.8],[1.,-1.42,'#ff2511',.7,1.8],[-.6,-1.03,'#ffd890',1.3,2.2],[1.,-1.03,'#ffd890',1.3,2.2]]){const mesh=new T.Mesh(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),new T.MeshBasicMaterial({map:this.glowMap,color,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));mesh.matrixAutoUpdate=false;mesh.matrix.copy(this.frame(x,t,.11)).multiply(this.local.makeScale(sx,1,sz));this.scene.add(mesh);this.reflections.push(mesh);}}
 update(dt){this.root.rotation.x=-this.motion.angle;for(const w of this.wheels)w.rotation.x=(w.rotation.x+this.motion.speed*dt/.4)%TAU;
 }
 reset(){this.motion.reset();this.waterHits=0;for(const w of this.wheels)w.rotation.x=0;this.update(0);}
 makeControls(){this.controls=new OrbitControls(this.camera,this.renderer.domElement);const c=this.controls;c.enablePan=false;c.enableDamping=true;c.dampingFactor=.09;c.rotateSpeed=.45;c.zoomSpeed=.65;c.minPolarAngle=.86;c.maxPolarAngle=1.55;c.minAzimuthAngle=Math.PI-.42;c.maxAzimuthAngle=Math.PI+.42;c.minDistance=this.fitDistance*.8;c.maxDistance=this.fitDistance*1.2;this.resetCamera();}
 resetCamera(){const c=this.controls;if(!c)return;c.enableDamping=false;c.reset();c.target.set(0,0,0);this.camera.position.setFromSphericalCoords(this.fitDistance,1.3,Math.PI);c.update();c.saveState();c.enableDamping=true;}
 resize(){const box=this.renderer.domElement.parentElement.getBoundingClientRect();this.renderer.setSize(box.width,box.height,false);this.camera.aspect=box.width/box.height;const half=Math.atan(Math.tan(58*Math.PI/360)*Math.min(1,this.camera.aspect));const d=(this.radius+2.7)/Math.sin(half)/this.config.zoom;
  if(this.controls){const c=this.controls,ratio=d/this.fitDistance;this.camera.position.sub(c.target).multiplyScalar(ratio).add(c.target);c.minDistance=d*.8;c.maxDistance=d*1.2;c.update();}else{this.camera.position.setFromSphericalCoords(d,1.3,Math.PI);this.camera.lookAt(0,0,0);}this.fitDistance=d;this.camera.updateProjectionMatrix();if(this.composer)this.composer.setSize(box.width,box.height);
 }
 setSeason(value){this.season=normalizeSeason(value);const p=SEASONS[this.season];this.environmentUniforms.snow.value=this.season==='winter'?1:0;this.sphere.material.color.set(p.ground);this.waterMaterial.color.set(p.water);this.waterMaterial.roughness=this.season==='winter'?.52:.24;
  const color=this.seasonColor||(this.seasonColor=new T.Color());for(let i=0;i<this.foliage.count;i++){color.set(p.leaves[i%p.leaves.length]);this.foliage.setColorAt(i,color);}this.foliage.instanceColor.needsUpdate=true;
  for(let i=0;i<this.blossoms.count;i++){const palette=i<840&&this.season==='summer'?p.leaves:p.flowers;color.set(palette[i%palette.length]);this.blossoms.setColorAt(i,color);}this.blossoms.instanceColor.needsUpdate=true;this.gardens.setSeason(this.season);this.update(0);
 }
 setTime(value){this.hour=normalizeHour(value);const e=environmentAt(this.hour);for(const key of ['day','night','dusk'])this.environmentUniforms[key].value=e[key];this.hemi.intensity=.35+e.day*1.25;this.hemi.color.set(e.day>.5?'#c0ddf0':'#91acd3');this.key.intensity=.75+e.day*1.9;this.key.color.set(e.dusk>.4?'#ffc580':e.day>.5?'#fff2d3':'#a8c6ef');this.warm.intensity=.2+e.dusk*.8;this.renderer.toneMappingExposure=1.08-e.day*.18;this.scene.environmentIntensity=.19+e.day*.15;
  this.sky.moon.material.opacity=e.night*(1-e.dusk*.7);this.sky.moon.material.transparent=true;this.sky.halo.material.opacity=.25*e.night;for(const cloud of this.sky.clouds)cloud.material.opacity=.22+.36*e.day;
  this.lampPools.material.opacity=.06+.6*e.night;this.head.intensity=2+30*e.night;for(const light of this.streetLights)light.intensity=.3+8.7*e.night;for(const glow of this.reflections)glow.material.opacity=.05+.65*e.night;this.bloom.strength=.18+.24*e.night;
 }
 render(){this.controls?.update();this.renderer.info.reset();this.composer.render();}
 stats(){let objects=0,meshes=0;this.scene.traverse(o=>{objects++;if(o.isMesh)meshes++;});const i=this.renderer.info;return {objects,meshes,geometries:i.memory.geometries,textures:i.memory.textures,programs:i.programs?.length||0,drawCalls:i.render.calls,triangles:i.render.triangles,dpr:this.renderer.getPixelRatio(),angle:this.motion.angle,laps:this.motion.laps,elapsed:this.motion.elapsed,radius:this.radius,waterHits:this.waterHits,season:this.season,hour:this.hour,cameraPolar:this.controls?.getPolarAngle(),cameraAzimuth:this.controls?.getAzimuthalAngle()};}
}
