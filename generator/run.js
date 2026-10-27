if(process.argv[2])globalThis.CFG=JSON.parse(process.argv[2]);
require('./layout.js');const L=globalThis.LAYOUT,N=L.NET;
const pc=x=>(x/N*100).toFixed(1)+'%';
console.log('net',N.toFixed(2),'plots',L.ha.plot.toFixed(2),pc(L.ha.plot),'exact',pc(L.plotHaExact),'road',pc(L.ha.road),'green',pc(L.ha.green),'com',pc(L.ha.com+L.ha.amen),'uni',L.ha.uni.toFixed(2));
const T=L.n['500']+L.n['400']+L.n['250'];
console.log(JSON.stringify(L.n),T,'mix%',(L.n['500']/T*100).toFixed(0),(L.n['400']/T*100).toFixed(0),(L.n['250']/T*100).toFixed(0),'com lots',L.com.length);
