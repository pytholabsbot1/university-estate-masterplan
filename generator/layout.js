// shared geometry + layout (browser and node)
(function(G){
const Praw=[[699606.75,3061125.50],[699714.25,3061105.00],[699671.25,3061010.00],[699608.25,3060851.00],[699676.25,3060822.50],[699745.25,3060804.00],[699715.75,3060745.50],[699691.25,3060669.50],[699691.25,3060653.50],[699641.25,3060551.50],[699747.25,3060520.50],[699734.75,3060470.00],[699726.25,3060470.00],[699721.25,3060463.00],[699657.75,3060342.00],[699658.75,3060337.00],[699684.25,3060324.50],[699667.75,3060297.50],[699651.75,3060303.00],[699641.25,3060285.50],[699641.75,3060279.00],[699653.25,3060274.00],[699592.25,3060149.00],[699467.75,3060237.50],[699337.75,3060320.50],[699300.25,3060356.00],[699232.25,3060447.50],[699194.25,3060485.00],[699248.75,3060598.00],[699271.25,3060593.50],[699317.25,3060681.50],[699383.25,3060864.00],[699412.75,3060922.00],[699416.25,3060926.00],[699498.75,3060895.50],[699538.75,3060996.50]];
const P=Praw.map(([x,y])=>[x-699164,3061155.75-y]);
const TH=17*Math.PI/180,CU=Math.cos(TH),SU=Math.sin(TH),B0=[390,285];
const xy=(u,v)=>[B0[0]+u*CU-v*SU,B0[1]+u*SU+v*CU];
const toUV=([x,y])=>{const dx=x-B0[0],dy=y-B0[1];return[dx*CU+dy*SU,-dx*SU+dy*CU];};
const Q=P.map(toUV);
const R=(u0,u1,v0,v1)=>[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
const areaPoly=pts=>{let a=0;for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];a+=p[0]*q[1]-q[0]*p[1];}return Math.abs(a)/2;};
const clipHalf=(pts,f)=>{const o=[];for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length],fp=f(p),fq=f(q);if(fp>=0)o.push(p);if((fp>=0)!==(fq>=0)){const t=fp/(fp-fq);o.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return o;};
const clipRect=(pts,u0,u1,v0,v1)=>clipHalf(clipHalf(clipHalf(clipHalf(pts,p=>p[0]-u0),p=>u1-p[0]),p=>p[1]-v0),p=>v1-p[1]);
const inPoly=(pt,pts)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if(((a[1]>pt[1])!==(b[1]>pt[1]))&&(pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;};
const segD=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1];let t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy);t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
const edgeDist=pt=>{let m=1e9;for(let i=0;i<Q.length;i++)m=Math.min(m,segD(pt,Q[i],Q[(i+1)%Q.length]));return m;};
const SITE_HA=28.40,K=SITE_HA/(areaPoly(Q)/1e4);
const UNI_HA=25*0.40468564, VU=-16;
const uniPoly=us=>clipHalf(clipHalf(Q,p=>us-p[0]),p=>p[1]-VU);
let lo=-150,hi=150;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(areaPoly(uniPoly(m))/1e4*K<UNI_HA)lo=m;else hi=m;}const uS=(lo+hi)/2;
const UNI=uniPoly(uS);
const inTown=p=>inPoly(p,Q)&&!(p[0]<uS&&p[1]>VU);

// ---------------- parameters ----------------
const C=G.CFG||{};
const BELT=C.belt??3, PD=27.43, D25=22.86, W={'500':15.24,'400':12.19,'250':9.14};
const W60=18.29,W40=12.19,W30=9.14,W100=30.48;
// column sequence west->east (u widths). type: plot rows carry size + facing
const seq=C.seq||[['A',PD,'500','E'],['R1',W60],['B',PD,'500','W'],['C',PD,'500','E'],['R2',W40],['D',PD,'400','W'],['E',PD,'400','E'],['R3',W40],['F',D25,'250','W'],['G',D25,'250','E'],['R4',W40],['H',D25,'250','W']];
const col={};let u=uS;seq.forEach(s=>{col[s[0]]={u0:u,u1:u+s[1],t:s[2],f:s[3]};u+=s[1];});
const VN=2;                                  // enclave starts south of the arm
const cross=C.cross||[170,342,520];          // cross-street v (north edge of street)
const park=C.park||{cols:["B","C"],v0:342+W40,v1:440};
const RB={c:[(col.R1.u0+col.R1.u1)/2,-22],r:17};
// ---------------- layout ----------------
const out={roads:[],plots:[],zones:[],uS,UNI,Q,col,RB,cross};
const roadRect=(u0,u1,v0,v1,kind)=>{const p=clipRect(Q,u0,u1,v0,v1);if(p.length>2)out.roads.push({pts:p,kind});};
// vertical roads
const vEnd=700;
roadRect(col.R1.u0,col.R1.u1,RB.c[1],vEnd,'60');
['R2','R3','R4'].forEach(k=>col[k]&&roadRect(col[k].u0,col[k].u1,C.vstart?.[k]??(VN+BELT),vEnd,'40'));
cross.forEach(v=>roadRect(col.R1.u1,400,v,v+W40,'40'));
// north link road along the top of the enclave (frontage + access to R2..)
if(C.north===true) roadRect(col.R1.u1,400,VN+BELT,VN+BELT+W40,'40');
// park
const inPark=p=>park.cols.some(k=>p[0]>=col[k].u0-0.01&&p[0]<=col[k].u1+0.01)&&p[1]>=park.v0-0.01&&p[1]<=park.v1+0.01;
const inRoad=p=>out.roads.some(r=>inPoly(p,r.pts));
const okPt=p=>inTown(p)&&edgeDist(p)>=BELT-0.01&&p[1]>=VN&&!inPark(p)&&!(Math.hypot(p[0]-RB.c[0],p[1]-RB.c[1])<RB.r+3);
const roadSet=()=>out.roads;
seq.filter(s=>s[2]).forEach(([k,w,t,f])=>{
  const c=col[k];const pw=W[t];
  // walk down v, skipping roads
  let v=VN;
  while(v<vEnd){
    const r=R(c.u0,c.u1,v,v+pw);
    const mid=[[c.u0+0.2,v+0.2],[c.u1-0.2,v+0.2],[c.u1-0.2,v+pw-0.2],[c.u0+0.2,v+pw-0.2],[(c.u0+c.u1)/2,v+pw/2]];
    if(mid.some(p=>inRoad(p))){v+=0.5;continue;}
    if(r.every(okPt)){out.plots.push({r,t,f,col:k});v+=pw;} else v+=0.5;
  }
});
// arm: boulevard, gate, commercial, institutional
const gateV=-258;
const BL=[[34,gateV-6],[RB.c[0],RB.c[1]]];
out.blvd=BL;
const bu=v=>BL[0][0]+(v-BL[0][1])*(BL[1][0]-BL[0][0])/(BL[1][1]-BL[0][1]);
out.blvdPoly=clipHalf(clipHalf(clipHalf(Q,p=>p[1]-(gateV-10)),p=>RB.c[1]-p[1]),p=>W100/2-Math.abs(p[0]-bu(p[1])));
out.gate=clipHalf(clipHalf(Q,p=>gateV+22-p[1]),p=>18-Math.abs(p[0]-bu(p[1])));
// commercial lots (SCO): 6 m forecourt then 9.14 m wide x 18 m deep, both sides
out.com=[];
for(const side of [-1,1]){for(let v=-236;v<-64;v+=9.14+0.0){
  const a=bu(v)+side*(W100/2+6), b=a+side*18; const r=R(Math.min(a,b),Math.max(a,b),v,v+9.14);
  if(r.every(p=>inPoly(p,Q)&&edgeDist(p)>=BELT))out.com.push({r,side});}}
// zones in the arm (drawn as backgrounds)
out.armCom=clipHalf(clipHalf(Q,p=>p[1]-(gateV+22)),p=>-60-p[1]);
out.inst=clipHalf(clipHalf(clipHalf(Q,p=>p[1]+60),p=>VU-p[1]),p=>bu(p[1])-W100/2-p[0]);
out.arrival=clipHalf(clipHalf(clipHalf(Q,p=>p[1]+60),p=>VN-p[1]),p=>p[0]-bu(p[1])-W100/2);
out.park=R(col[park.cols[0]].u0,col[park.cols[park.cols.length-1]].u1,park.v0,park.v1);
out.campusSpur=[[RB.c[0]-RB.r,RB.c[1]],[uS-14,RB.c[1]]];
// ---------------- accounting by sampling ----------------
const s=1.0;const cnt={plot:0,road:0,green:0,com:0,amen:0,uni:0};let tot=0;
const plotSet=out.plots.map(p=>p.r);
for(let uu=-260;uu<320;uu+=s)for(let vv=-300;vv<720;vv+=s){const p=[uu+s/2,vv+s/2];if(!inPoly(p,Q))continue;tot++;
  if(!inTown(p)){cnt.uni++;continue;}
  if(Math.hypot(p[0]-RB.c[0],p[1]-RB.c[1])<=RB.r||inPoly(p,out.blvdPoly)||inPoly(p,out.gate)||inRoad(p)||(p[1]>RB.c[1]-4.5&&p[1]<RB.c[1]+4.5&&p[0]<RB.c[0]&&p[0]>uS-14)){cnt.road++;continue;}
  if(plotSet.some(r=>p[0]>=r[0][0]&&p[0]<=r[1][0]&&p[1]>=r[0][1]&&p[1]<=r[2][1])){cnt.plot++;continue;}
  if(inPoly(p,out.armCom)||inPoly(p,out.inst)){cnt.com++;continue;}
  if(inPark(p)&&p[1]<park.v0+40){cnt.amen++;continue;} // clubhouse pad
  cnt.green++;}
const ha={};for(const k in cnt)ha[k]=cnt[k]/tot*SITE_HA;out.ha=ha;out.NET=SITE_HA-ha.uni;
const n={};['500','400','250'].forEach(t=>n[t]=out.plots.filter(p=>p.t===t).length);out.n=n;
out.plotHaExact=(n['500']*W['500']*PD+n['400']*W['400']*PD+n['250']*W['250']*D25)/1e4*K;
G.LAYOUT=out;G.GEO={xy,toUV,Q,R,inPoly,edgeDist,inTown,uS,UNI,K,clipHalf};
})(typeof window!=='undefined'?window:globalThis);
