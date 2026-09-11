import test from 'node:test';
import assert from 'node:assert/strict';
import {PlanetMotion,surfacePoint} from '../src/planet-motion.js';
test('sphere is closed and every point stays on the surface',()=>{for(let i=0;i<50;i++){const p=surfacePoint(.3,i,13),q=surfacePoint(.3,i+Math.PI*2,13);assert.ok(Math.abs(Math.hypot(...p)-13)<1e-10);p.forEach((n,j)=>assert.ok(Math.abs(n-q[j])<1e-10));}});
test('one circuit closes; angle stays bounded after long runtime',()=>{const m=new PlanetMotion(13,3);m.update(Math.PI*26/3);assert.ok(m.angle<1e-10);assert.equal(m.laps,1);for(let i=0;i<100000;i++)m.update(.2);assert.ok(m.angle>=0&&m.angle<Math.PI*2);assert.ok(m.laps>700);const a=m.angle;m.speed=0;m.update(10);assert.equal(m.angle,a);});
test('nonpositive and nonfinite deltas never rewind the planet',()=>{const m=new PlanetMotion(13,1.5);m.update(-.15);assert.equal(m.elapsed,0);assert.equal(m.laps,0);assert.equal(m.angle,0);m.update(NaN);assert.equal(m.angle,0);});
