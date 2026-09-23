(function(){
  'use strict';
  // Decorative biomes, not reconstructed Han-era vegetation or resource simulation.
  window.createEcology=function(data,project,landPath,lakePath){
    const canvas=document.createElement('canvas');canvas.width=2600;canvas.height=2250;
    const g=canvas.getContext('2d');let seed=7183;
    const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const dry=(x,y)=>g.isPointInPath(landPath,x,y)&&!g.isPointInPath(lakePath,x,y)&&!data.cities.some(c=>Math.hypot(c.x-x,c.y-y)<23);
    g.save();g.clip(landPath);
    function wash(lon,lat,rx,ry,color){const[x,y]=project(lon,lat);g.save();g.translate(x,y);g.scale(rx,ry);const fill=g.createRadialGradient(0,0,.1,0,0,1);fill.addColorStop(0,color);fill.addColorStop(1,'#00000000');g.fillStyle=fill;g.fillRect(-1,-1,2,2);g.restore();}
    // Sandy corridor and northern pasture: translucent ink and sparse glyphs.
    wash(98,40.2,470,190,'#c0984850');wash(108,40.2,320,180,'#92a16a38');
    for(let i=0;i<730;i++){const lon=93+rand()*11,lat=38.6+rand()*3.7,[x,y]=project(lon,lat);if(!dry(x,y))continue;g.strokeStyle='#a180454b';g.lineWidth=.9;g.beginPath();g.moveTo(x-9,y+3);g.quadraticCurveTo(x-1,y-6,x+10,y+3);g.moveTo(x-1,y-3);g.lineTo(x+5,y+3);g.stroke();}
    for(let i=0;i<950;i++){const lon=103+rand()*16,lat=39.2+rand()*3.4,[x,y]=project(lon,lat);if(!dry(x,y))continue;g.strokeStyle='#7a88565c';g.lineWidth=.8;g.beginPath();g.moveTo(x-3,y);g.lineTo(x,y+3);g.lineTo(x+2,y-2);g.moveTo(x,y+3);g.lineTo(x+5,y+1);g.stroke();}
    const groves=[[104.5,28.0,1.4,1.6],[107.3,29.2,1.3,1.4],[109.5,27.3,1.7,1.5],[113.6,25.7,1.7,1.0],[116.9,27.4,1.1,1.7],[119.2,29.0,.7,1.2],[103.1,25.1,1.5,1.4],[110.5,23.1,1.7,.8],[114.5,31.4,.8,.45]];
    for(const [lon,lat,rx,ry]of groves){wash(lon,lat,rx*92,ry*92,'#6f88582c');for(let i=0;i<260;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand()),[x,y]=project(lon+Math.cos(a)*rx*r,lat+Math.sin(a)*ry*r);if(!dry(x,y))continue;const h=5+rand()*6;g.strokeStyle='#50634d83';g.fillStyle='#75885c60';g.lineWidth=.75;g.beginPath();g.moveTo(x,y+3);g.lineTo(x,y-h);g.stroke();g.beginPath();g.moveTo(x,y-h-3);g.lineTo(x-4,y);g.lineTo(x+4,y);g.closePath();g.fill();g.stroke();}}
    // Farmland and hamlets surround settled lowlands; no production mechanics implied.
    for(const c of data.cities){if(c.lon<103||c.lat>39||c.lat<23)continue;const patches=c.lat>33?4:6;for(let i=0;i<patches;i++){const a=rand()*Math.PI*2,r=28+rand()*28,x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r*.65;if(!dry(x,y))continue;g.save();g.translate(x,y);g.rotate(-.25);g.fillStyle=c.lat<33?'#82946847':'#ad994d44';g.strokeStyle='#847b4c6b';g.lineWidth=.7;g.fillRect(-8,-5,16,10);g.strokeRect(-8,-5,16,10);for(let row=-5;row<8;row+=4){g.beginPath();g.moveTo(row,-5);g.lineTo(row,5);g.stroke();}g.restore();if(i===0){g.fillStyle='#aa967161';g.strokeStyle='#756b4b80';g.fillRect(x+10,y-3,6,5);g.beginPath();g.moveTo(x+8,y-3);g.lineTo(x+13,y-7);g.lineTo(x+18,y-3);g.stroke();}}}
    // A few reed marks trace the reference lake edges.
    for(const lake of data.lakes||[]){for(const ring of lake.rings){ring.forEach((pt,i)=>{if(i%3)return;const[x,y]=project(...pt);if(data.cities.some(c=>Math.hypot(c.x-x,c.y-y)<25))return;g.strokeStyle='#6d82567a';g.lineWidth=.8;g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y-5);g.moveTo(x,y);g.lineTo(x+1,y-7);g.moveTo(x,y);g.lineTo(x+4,y-3);g.stroke();});}}
    g.globalCompositeOperation='destination-out';g.fill(lakePath);g.restore();return canvas;
  };
})();
