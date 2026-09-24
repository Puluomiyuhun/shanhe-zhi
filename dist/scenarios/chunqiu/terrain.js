export function terrainHeight(x,z,{noise2,smooth,hills}){
 const ridge=(d,w)=>Math.exp(-((d/w)**2));
 const qinling=ridge(z-6-Math.sin(x*.07)*2,6)*smooth(-98,-70,x)*(1-smooth(-32,-17,x))*13;
 const taihang=ridge(x+13+Math.sin(z*.08)*3,5)*smooth(-85,-60,z)*(1-smooth(-24,-12,z))*12;
 const yanshan=ridge(z+78-Math.sin(x*.045)*3,6)*smooth(-8,16,x)*(1-smooth(78,98,x))*12;
 const sichuan=ridge(x+87+Math.sin(z*.07)*4,10)*smooth(17,40,z)*24;
 const daba=ridge(z-39-Math.sin(x*.07)*3,6)*smooth(-84,-68,x)*(1-smooth(-30,-18,x))*13;
 const wushan=ridge(x+31+Math.sin(z*.12)*3,5)*smooth(35,48,z)*(1-smooth(69,80,z))*11;
 const longshan=ridge(x+83+Math.sin(z*.08)*2,7)*(1-smooth(-3,18,z))*10;
 const fangcheng=ridge(z-23+x*.22,4)*smooth(-29,-17,x)*(1-smooth(8,20,x))*7;
 const hill=hills.reduce((n,h)=>n+h.peak*Math.exp(-(((x-h.x)/h.rx)**2+((z-h.z)/h.rz)**2)),0);
 const mountain=hill+qinling+taihang+yanshan+sichuan+daba+wushan+longshan+fangcheng;
 const wx=x+(noise2(x*.035,z*.035)-.5)*6,wz=z+(noise2(x*.04+27,z*.04)-.5)*6;
 const fold=f=>1-Math.abs(noise2(wx*f,wz*f)*2-1);
 let base=.55+mountain*(.48+.3*fold(.13)+.15*fold(.29)+.07*fold(.6))+.22*(noise2(x*.13,z*.13)-.5);
 return base;
}
