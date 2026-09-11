import * as T from 'three';

const PALETTES={
 spring:{flowers:['#eaa6b8','#f4d79c','#c7addb'],leaves:['#75915c','#90a66c']},
 summer:{flowers:['#e7bc62','#df8d83','#eee0b4'],leaves:['#567953','#72905d']},
 autumn:{flowers:['#cf8455','#dfb56d','#b46756'],leaves:['#9b8050','#bba066']},
 winter:{flowers:['#b8c8ce','#e6e1d8','#c9c1cb'],leaves:['#819490','#a5b4ab']},
};

// Everything is allocated once. Seasonal updates only replace instance colors.
export class PlanetGardens{
 constructor(view){
  this.view=view;this.batches={};this.color=new T.Color();
  const material=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
  const batch=(name,geo,mat,capacity)=>this.batches[name]=view.batch(geo,mat,capacity);
  const box=new T.BoxGeometry(1,1,1);
  batch('gardenStone',new T.CylinderGeometry(1,1,1,12),material('#c9c2ae'),180);
  batch('gardenWood',box,material('#a18462'),200);
  batch('gardenFence',box,material('#e2dbc7'),220);
  batch('gardenSoil',new T.CylinderGeometry(1,1,1,12),material('#776954'),30);
  batch('gardenLeaves',new T.IcosahedronGeometry(1,0),material('#ffffff'),300);
  batch('gardenFlowers',new T.IcosahedronGeometry(1,0),material('#ffffff'),480);
  batch('gardenRings',new T.TorusGeometry(1,.09,5,24).rotateX(-Math.PI/2),material('#d3cbb7'),24);
  batch('gardenWater',new T.CylinderGeometry(1,1,1,24),new T.MeshStandardMaterial({color:'#79a8ae',roughness:.23,metalness:.2}),8);
  batch('gardenSnow',new T.IcosahedronGeometry(1,0),material('#e6ebea'),100);
  const sail=new T.BufferGeometry();sail.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,1.35,0,.85,.12,0],3));sail.computeVertexNormals();
  batch('gardenSails',sail,new T.MeshStandardMaterial({color:'#e9d6b6',roughness:.82,side:T.DoubleSide}),2);
  this.place=(name,x,t,h,sx,sy,sz,yaw=0)=>view.stamp(this.batches[name],x,t,h,sx,sy,sz,yaw);
  for(const [side,sector] of [[-1,0],[1,2],[-1,4],[1,6],[-1,8],[1,10]]){
   this.pocket(side,sector*Math.PI/6+(side>0?.38:.27));
  }
  this.fountain(-6.7,-1.32);
  this.dock(12.25,-.72);
  this.dock(12.25,2.18);
  this.setSeason('spring');
  for(const mesh of Object.values(this.batches)){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 pocket(side,t){
  const p=this.place,R=this.view.radius,x=side*6.65;
  // Radial stepping stones make the pocket read as a destination off the pavement.
  for(let j=0;j<6;j++)p('gardenStone',side*(4.35+j*.43),t,.11,.23,.08,.28,(j%2-.5)*.12);
  for(const dz of [-.57,.57]){
   const tt=t+dz/R;
   p('gardenSoil',x,tt,.13,.65,.15,.35);
   p('gardenRings',x,tt,.2,.65,.8,.35);
   for(let j=0;j<9;j++){
    const a=j*Math.PI*2/9,xx=x+Math.cos(a)*.45,tj=tt+Math.sin(a)*.19/R;
    p('gardenLeaves',xx,tj,.27,.2,.18,.17);
    for(let k=0;k<3;k++)p('gardenFlowers',xx+(k-1)*.09,tj,.43+(k%2)*.08,.11,.09,.11);
   }
   p('gardenSnow',x,tt,.33,.54,.05,.26);
  }
  // An open, low picket fence frames the back; the path remains open.
  for(let j=0;j<9;j++){
   const tj=t+(j-4)*.21/R;
   p('gardenFence',side*7.63,tj,.36,.09,.65,.075);
   p('gardenSnow',side*7.63,tj,.71,.08,.025,.08);
  }
  for(const h of [.25,.5])p('gardenFence',side*7.63,t,h,.07,.075,1.84);
  // A handmade bench faces the flower beds.
  p('gardenWood',side*7.1,t,.52,.38,.1,.8);
  p('gardenWood',side*7.31,t,.76,.07,.43,.8);
  for(const dz of [-.27,.27])p('gardenWood',side*7.1,t+dz/R,.27,.26,.43,.09);
 }
 fountain(x,t){
  const p=this.place,R=this.view.radius;
  for(let j=0;j<8;j++)p('gardenStone',-4.35-j*.34,t,.1,.23,.07,.27);
  p('gardenStone',x,t,.12,1.15,.12,1.15);
  p('gardenStone',x,t,.24,.83,.2,.83);
  p('gardenRings',x,t,.36,.82,1.3,.82);
  p('gardenWater',x,t,.35,.73,.03,.73);
  p('gardenStone',x,t,.63,.13,.6,.13);
  p('gardenStone',x,t,.89,.38,.09,.38);
  p('gardenWater',x,t,.94,.32,.02,.32);
  p('gardenRings',x,t,.95,.36,.6,.36);
  for(let j=0;j<12;j++){
   const a=j*Math.PI/6;
   p('gardenStone',x+Math.cos(a)*1.02,t+Math.sin(a)*1.02/R,.2,.17,.09,.16);
  }
  p('gardenSnow',x,t,.98,.32,.035,.32);
 }
 dock(x,t){
  const p=this.place,R=this.view.radius;
  // Each plank has its own tangent frame so the pier follows the globe.
  for(let j=0;j<13;j++)p('gardenWood',x+j*.19,t,.24,.16,.1,.85);
  for(const dx of [.18,1.12,2.24])for(const dz of [-.42,.42]){
   p('gardenWood',x+dx,t+dz/R,.26,.11,.8,.11);
   p('gardenFence',x+dx,t+dz/R,.63,.14,.08,.14);
  }
  const bx=x+2.2,bt=t+.12;
  // A narrow hull, two gunwales and a cream sail give a legible toy sailboat.
  p('gardenWood',bx,bt,.14,.57,.18,1.15,.18);
  for(const dx of [-.27,.27])p('gardenWood',bx+dx,bt,.3,.08,.24,1.14,.18);
  for(const dz of [-.49,.49])p('gardenWood',bx,bt+dz/R,.26,.5,.2,.12,.18);
  p('gardenWood',bx,bt,.89,.055,1.35,.055);
  p('gardenSails',bx,bt,.46,1,1,1,-.55);
 }
 setSeason(key){
  const palette=PALETTES[key]||PALETTES.spring;
  for(const [name,colors] of [['gardenLeaves',palette.leaves],['gardenFlowers',palette.flowers]]){
   const mesh=this.batches[name];for(let i=0;i<mesh.count;i++)mesh.setColorAt(i,this.color.set(colors[i%colors.length]));
   mesh.instanceColor.needsUpdate=true;
  }
  this.batches.gardenSnow.visible=key==='winter';
  this.batches.gardenWater.material.color.set(key==='winter'?'#bed2d8':'#79a8ae');
 }
}
