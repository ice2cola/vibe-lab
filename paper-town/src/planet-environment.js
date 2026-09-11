export const SEASONS={
 spring:{label:'春',ground:'#6d8052',leaves:['#527846','#709452','#9aae67','#466b40'],flowers:['#f2b3c6','#ffd2d7','#d98caa'],water:'#457a8d'},
 summer:{label:'夏',ground:'#4c723c',leaves:['#37663d','#4e8244','#739d52','#2e5737'],flowers:['#edc65f','#f4e5ac','#c998c2'],water:'#297c98'},
 autumn:{label:'秋',ground:'#8b784c',leaves:['#b75c32','#ce8c39','#dbc166','#82543b'],flowers:['#d8994d','#ae583e','#e3bb78'],water:'#49727a'},
 winter:{label:'冬',ground:'#d6e2e5',leaves:['#d5e3e4','#a6bbbc','#4d6b61','#dce8e9'],flowers:['#edf2ef','#d3e1e5','#e5ebee'],water:'#a3cbd9'}
};
export const normalizeSeason=key=>Object.hasOwn(SEASONS,key)?key:'spring';
export const normalizeHour=value=>{const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(24,n)):20.6;};
export function formatHour(value){const minutes=Math.round(normalizeHour(value)*60)%1440;return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}
const smooth=(lo,hi,x)=>{const t=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return t*t*(3-2*t);};
export function environmentAt(value){const h=normalizeHour(value)%24,elevation=Math.cos((h-12)*Math.PI/12),day=smooth(-.12,.38,elevation),dusk=Math.exp(-Math.pow((elevation-.02)/.23,2));return {day,night:1-day,dusk};}
