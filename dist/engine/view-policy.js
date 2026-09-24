export function gridOpacity(distance,enabled=true){if(!enabled||distance>=80)return 0;if(distance<=48)return .23;const t=(distance-48)/32;return .23*(1-t*t*(3-2*t));}
export function hoverDecision(now,lastSample,zoomUntil,moving){return now<zoomUntil||moving?"hide":now-lastSample<60?"keep":"sample";}
