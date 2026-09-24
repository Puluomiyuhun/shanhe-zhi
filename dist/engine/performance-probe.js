export function createPerformanceProbe({start,aim,restore}){
 const button=document.getElementById('zoomBenchmark'),result=document.getElementById('zoomBenchmarkResult');
 let begin=0,last=0,samples=[],cpu=[],saved=null;
 const percentile=(a,p)=>[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]||0;
 button.onclick=()=>{if(begin)return;saved=start();samples=[];cpu=[];begin=performance.now();last=0;document.getElementById('guide').close();button.disabled=true;result.textContent='正在测量：18 秒往返缩放，期间请勿操作地图。';};
 return {get active(){return !!begin;},tick(now){if(!begin)return;const elapsed=now-begin;if(elapsed>=18000){begin=0;restore(saved);button.disabled=false;const mean=samples.reduce((s,x)=>s+x,0)/samples.length;result.textContent=JSON.stringify({samples:samples.length,fps:+(1000/mean).toFixed(1),p50:+percentile(samples,.5).toFixed(2),p95:+percentile(samples,.95).toFixed(2),p99:+percentile(samples,.99).toFixed(2),max:+Math.max(...samples).toFixed(2),over33:samples.filter(x=>x>33.4).length,cpuP95:+percentile(cpu,.95).toFixed(2)},null,2);document.getElementById('guide').showModal();return;}if(elapsed>1500&&last)samples.push(now-last);last=now;aim(200+160*Math.sin(elapsed/1800));},frameCost(ms){if(begin)cpu.push(ms);}};
}
