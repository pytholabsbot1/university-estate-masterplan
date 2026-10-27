// usage: node render.js out.png [out.pdf]   (headless Chromium via Playwright)
const {chromium}=require('playwright');const path=require('path');
(async()=>{
  const [png,pdf]=process.argv.slice(2);
  const b=await chromium.launch({args:['--allow-file-access-from-files']});
  const pg=await b.newPage({viewport:{width:2245,height:1587},deviceScaleFactor:+(process.env.SCALE||2)});
  await pg.goto('file://'+path.join(__dirname,'master2.html'));
  await pg.waitForFunction('window.__done===true');
  if(png)await pg.screenshot({path:png});
  if(pdf)await pg.pdf({path:pdf,format:'A2',landscape:true,printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
  await b.close();
})();
