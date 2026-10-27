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
const BELT=C.belt??3, PD=27.432, D25=22.86, W={'500':15.24,'400':12.192,'250':9.144};   // exact ft -> m
const W60=18.29,W40=12.19,W30=9.14,W100=30.48,LANE=6;
// column sequence west->east (u widths). type: plot rows carry size + facing
const seq=C.seq||[['A',PD,'500','E'],['R1',W60],['B',PD,'500','W'],['C',PD,'500','E'],['R2',W40],['D',PD,'400','W'],['E',PD,'400','E'],['R3',W40],['F',D25,'250','W'],['G',D25,'250','E'],['R4',W40],['H',D25,'250','W']];
const col={};let u=uS;seq.forEach(s=>{col[s[0]]={u0:u,u1:u+s[1],t:s[2],f:s[3]};u+=s[1];});
const VN=2;                                  // enclave starts south of the arm
const cross=C.cross||[165,348,512];          // cross-street v (north edge of street)
const park=C.park||{cols:["B","C"],v0:cross[1]+W40,v1:cross[1]+W40+86};
const UC=(col.R1.u0+col.R1.u1)/2;            // arrival axis: boulevard, roundabout and 60 ft avenue share it
const RB={c:[UC,-22],r:17};
// inward offset of a run of boundary vertices (for roads that follow the boundary)
const SGN=Math.sign(Q.reduce((a,p,i)=>{const q=Q[(i+1)%Q.length];return a+p[0]*q[1]-q[0]*p[1];},0));
const offLine=(ids,d)=>{const L=[];for(let i=0;i<ids.length-1;i++){const a=Q[ids[i]],b=Q[ids[i+1]],l=Math.hypot(b[0]-a[0],b[1]-a[1]),t=[(b[0]-a[0])/l,(b[1]-a[1])/l],n=[-t[1]*SGN,t[0]*SGN];L.push({p:[a[0]+n[0]*d,a[1]+n[1]*d],t});}
  const pts=[L[0].p];for(let i=1;i<L.length;i++){const A=L[i-1],B=L[i],den=A.t[0]*B.t[1]-A.t[1]*B.t[0],s=((B.p[0]-A.p[0])*B.t[1]-(B.p[1]-A.p[1])*B.t[0])/den;pts.push([A.p[0]+A.t[0]*s,A.p[1]+A.t[1]*s]);}
  const z=L[L.length-1],a=Q[ids[ids.length-2]],e=Q[ids[ids.length-1]];pts.push([z.p[0]+e[0]-a[0],z.p[1]+e[1]-a[1]]);return pts;};
const vAt=(pts,uu)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if((uu-a[0])*(uu-b[0])<=0)return a[1]+(uu-a[0])/(b[0]-a[0])*(b[1]-a[1]);}return null;};
// ---------------- layout ----------------
const out={roads:[],plots:[],zones:[],uS,UNI,Q,col,RB,cross,UC};
const addRoad=(p,kind)=>{if(p.length>2)out.roads.push({pts:p,kind});return p;};
const roadRect=(u0,u1,v0,v1,kind)=>addRoad(clipRect(Q,u0,u1,v0,v1),kind);
// south loop: 40 ft road along the south boundary ties the ends of every north-south road together
const SL=[22,23,24],slIn=offLine(SL,BELT),slOut=offLine(SL,BELT+W40),slMid=offLine(SL,BELT+W40/2);
out.loopV=u=>vAt(slMid,u);out.loop=addRoad(clipHalf(clipHalf([...slIn,...slOut.reverse()],p=>p[0]-col.R1.u0),p=>col.R4.u1-p[0]),'40');
// vertical road from v0 down to the centre line of the south loop (or the boundary if the loop is not under it)
const vRoad=(k,v0,kind)=>{const c=col[k],a=vAt(slMid,c.u0),b=vAt(slMid,c.u1);let r=clipRect(Q,c.u0,c.u1,v0,800);
  if(a!==null&&b!==null)r=clipHalf(r,p=>a+(p[0]-c.u0)*(b-a)/(c.u1-c.u0)-p[1]);addRoad(r,kind);};
// north link: 40 ft road across the top of the enclave, R1 -> R3, so R2/R3 are not dead ends
const NL=C.northLink??[13.5,13.5+W40];out.NL=NL;
vRoad('R1',RB.c[1],'60');
vRoad('R2',NL[0],'40');vRoad('R3',NL[0],'40');vRoad('R4',C.r4start??279,'40');
roadRect(col.R1.u1,col.R3.u1,NL[0],NL[1],'40');
cross.forEach(v=>roadRect(col.R1.u1,400,v,v+W40,'40'));
// park
const inPark=p=>park.cols.some(k=>p[0]>=col[k].u0-0.01&&p[0]<=col[k].u1+0.01)&&p[1]>=park.v0-0.01&&p[1]<=park.v1+0.01;
const inRoad=p=>out.roads.some(r=>inPoly(p,r.pts));
const okPt=p=>inTown(p)&&edgeDist(p)>=BELT-0.01&&p[1]>=VN&&!inPark(p)&&!(Math.hypot(p[0]-RB.c[0],p[1]-RB.c[1])<RB.r+3);
seq.filter(s=>s[2]).forEach(([k,w,t,f])=>{
  const c=col[k];const pw=W[t];
  let v=VN;
  while(v<800){
    const r=R(c.u0,c.u1,v,v+pw),e=0.2,um=(c.u0+c.u1)/2,vm=v+pw/2;
    const probe=[[c.u0+e,v+e],[c.u1-e,v+e],[c.u1-e,v+pw-e],[c.u0+e,v+pw-e],[um,vm],[um,v+e],[um,v+pw-e],[c.u0+e,vm],[c.u1-e,vm]];
    if(probe.some(inRoad)){v+=0.5;continue;}
    if(r.every(okPt)){out.plots.push({r,t,f,col:k});v+=pw;} else v+=0.5;
  }
});
// ---------------- arrival arm ----------------
// straight 100 ft boulevard on the UC axis: gate plaza -> roundabout. Shops face it across a parking forecourt.
const H100=W100/2,FC=6,SCO_W=9.144,SCO_D=18.288,gateV=-236;
out.gateV=gateV;
out.gate=addRoad(clipRect(Q,UC-26,UC+26,-400,gateV),'100');
out.blvdPoly=addRoad(clipRect(Q,UC-H100,UC+H100,gateV,RB.c[1]),'100');
out.spur=addRoad(clipRect(Q,uS-14,UC,RB.c[1]-4.5,RB.c[1]+4.5),'40');
out.com=[];
const lotOK=r=>r.every(p=>inPoly(p,Q)&&edgeDist(p)>=BELT);
// west high street (two terraces with a pedestrian plaza between), east terrace where the arm is wide enough
const terr=(side,v0,v1)=>{const a=side<0?UC-H100-FC-SCO_D:UC+H100+FC;let n=0;for(let v=v0;v+SCO_W<=v1+1e-6;v+=SCO_W){const r=R(a,a+SCO_D,v,v+SCO_W);if(lotOK(r)){out.com.push({r,side});n++;}}return n;};
const WP=[-230,-150.5,-138.5,-62];             // west terraces: -230..-150.5 and -138.5..-62, plaza between
terr(-1,WP[0],WP[1]);out.plaza=R(UC-H100-FC-SCO_D,UC-H100-FC,WP[1],WP[2]);terr(-1,WP[2],WP[3]);
terr(1,-230,-120);
const comV=s=>{const v=out.com.filter(c=>c.side===s).map(c=>[c.r[0][1],c.r[2][1]]);return v.length?[Math.min(...v.map(x=>x[0])),Math.max(...v.map(x=>x[1]))]:null;};
const wv=comV(-1),ev=comV(1);
out.fcW=addRoad(clipRect(Q,UC-H100-FC,UC-H100,wv[0],wv[1]),'park');
if(ev)out.fcE=addRoad(clipRect(Q,UC+H100,UC+H100+FC,ev[0],ev[1]),'park');
// service lane behind the west shops, feeding the commercial hub
const back=UC-H100-FC-SCO_D-LANE;
out.lane=addRoad(clipRect(Q,back,UC-H100-FC-SCO_D,wv[0]-LANE,wv[1]+LANE),'lane');
// lane joins the boulevard at both ends of the terrace, so service traffic loops instead of reversing
addRoad(clipRect(Q,back,UC-H100,wv[0]-LANE,wv[0]),'lane');addRoad(clipRect(Q,back,UC-H100,wv[1],wv[1]+LANE),'lane');
out.hub=clipRect(Q,-400,back,-200,wv[1]+LANE);
out.inst=clipRect(Q,-400,UC-H100,wv[1]+LANE+3,RB.c[1]-4.5);
out.campusSpur=[[RB.c[0]-RB.r,RB.c[1]],[uS-14,RB.c[1]]];
out.campusGate=[uS-14,VU];
out.arrival=clipRect(Q,UC+H100,400,(ev?ev[1]:-230)+4,VN);
out.park=R(col[park.cols[0]].u0,col[park.cols[park.cols.length-1]].u1,park.v0,park.v1);
out.club=R(out.park[0][0]+3,out.park[1][0]-3,park.v0+2,park.v0+37);
// ---------------- area statement ----------------
// Plots and shop lots are exact rectangles at their sold size. Zones are exact polygon areas.
// Roads overlap at junctions, so they are measured on a 0.5 m grid. Open space is the balance.
const rectA=r=>(r[1][0]-r[0][0])*(r[2][1]-r[0][1]);
const A={};
A.uni=areaPoly(UNI)/1e4*K;
A.plot={};['500','400','250'].forEach(t=>A.plot[t]=out.plots.filter(p=>p.t===t).reduce((s,p)=>s+rectA(p.r),0)/1e4);
A.sco=out.com.reduce((s,c)=>s+rectA(c.r),0)/1e4;
A.hub=areaPoly(out.hub)/1e4*K;A.inst=areaPoly(out.inst)/1e4*K;A.club=rectA(out.club)/1e4*K;
A.park=(rectA(out.park)-rectA(out.club))/1e4*K;
const rc={'100':0,'60':0,'40':0,'lane':0,'park':0},s=C.grid??0.5;
let bb=[1e9,1e9,-1e9,-1e9];Q.forEach(p=>{bb=[Math.min(bb[0],p[0]),Math.min(bb[1],p[1]),Math.max(bb[2],p[0]),Math.max(bb[3],p[1])];});
const rb=out.roads.map(r=>{let b=[1e9,1e9,-1e9,-1e9];r.pts.forEach(p=>{b=[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])];});return b;});
const ORD=['100','60','40','lane','park'];
for(let uu=bb[0];uu<bb[2];uu+=s)for(let vv=bb[1];vv<bb[3];vv+=s){const p=[uu+s/2,vv+s/2];
  if(Math.hypot(p[0]-RB.c[0],p[1]-RB.c[1])<=RB.r){if(inPoly(p,Q))rc['100']++;continue;}
  let k=null;for(let i=0;i<out.roads.length;i++){const b=rb[i];if(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3])continue;if(inPoly(p,out.roads[i].pts)){const kk=out.roads[i].kind;if(k===null||ORD.indexOf(kk)<ORD.indexOf(k))k=kk;}}
  if(k&&inTown(p))rc[k]++;}
A.road={};for(const k in rc)A.road[k]=rc[k]*s*s/1e4*K;
A.net=SITE_HA-A.uni;
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
A.green=A.net-sum(A.plot)-A.sco-A.hub-A.inst-A.club-A.park-sum(A.road);
out.A=A;out.NET=A.net;
const n={};['500','400','250'].forEach(t=>n[t]=out.plots.filter(p=>p.t===t).length);out.n=n;
// legacy summary used by run.js
out.ha={plot:sum(A.plot),road:sum(A.road),green:A.green+A.park,com:A.sco+A.hub,amen:A.inst+A.club,uni:A.uni};
out.plotHaExact=sum(A.plot);
G.LAYOUT=out;G.GEO={xy,toUV,Q,R,inPoly,edgeDist,inTown,uS,UNI,K,clipHalf,clipRect,areaPoly,VU,BELT};
})(typeof window!=='undefined'?window:globalThis);
