export const TAU=Math.PI*2;
export function surfacePoint(latitude,theta,radius){return [radius*Math.sin(latitude),radius*Math.cos(latitude)*Math.cos(theta),radius*Math.cos(latitude)*Math.sin(theta)];}
export class PlanetMotion{
 constructor(radius=13,speed=2){this.radius=radius;this.speed=speed;this.angle=0;this.laps=0;this.elapsed=0;}
 update(dt){if(!Number.isFinite(dt)||dt<=0)return;this.elapsed+=dt;const next=this.angle+this.speed*dt/this.radius;const turns=Math.floor((next+1e-12)/TAU);this.laps+=turns;this.angle=next-turns*TAU;if(this.angle<0)this.angle=0;}
 reset(){this.angle=0;this.laps=0;this.elapsed=0;}
}
