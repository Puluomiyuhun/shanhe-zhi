(function(root){
'use strict';
function territories(cities,width,height){
  const radius=240;
  return cities.map(c=>{
    let polygon=Array.from({length:48},(_,i)=>[c.x+radius*Math.cos(i*Math.PI/24),c.y+radius*Math.sin(i*Math.PI/24)]);
    for(const other of cities){if(other.id===c.id)continue;const nx=other.x-c.x,ny=other.y-c.y,limit=(other.x**2+other.y**2-c.x**2-c.y**2)/2;
      const next=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=a[0]*nx+a[1]*ny-limit,db=b[0]*nx+b[1]*ny-limit;if(da<=.00001)next.push(a);if((da<0)!==(db<0)){const t=da/(da-db);next.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}polygon=next;if(!polygon.length)break;
    }
    const borders=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,dist=(x-c.x)**2+(y-c.y)**2;
      const neighbor=cities.find(o=>o.id!==c.id&&Math.abs((x-o.x)**2+(y-o.y)**2-dist)<.1);if(neighbor&&neighbor.owner!==c.owner&&c.id<neighbor.id)borders.push([a,b]);
    }return{city:c.id,owner:c.owner,polygon,borders};
  });
}
root.buildTerritories=territories;if(typeof module!=='undefined')module.exports={buildTerritories:territories};
})(typeof window==='undefined'?globalThis:window);
