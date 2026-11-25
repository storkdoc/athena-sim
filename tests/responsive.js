// Responsive test: no horizontal page overflow, nothing sticking out past the viewport, no console errors.
const {chromium}=require('playwright');const BASE=process.env.BASE||'http://localhost:8765/';
const W=[390,768,1024,1280,1440,1920,2560];const SHOTS=process.env.SHOTS;
(async()=>{const b=await chromium.launch();let fail=0;
 for(const w of W){const pg=await b.newPage({viewport:{width:w,height:w<800?844:w<1300?800:w<2000?1000:1300}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await pg.goto(BASE+'?simdate=2026-11-25#/dashboard');await pg.waitForSelector('#loading.hidden',{state:'attached'});
  const ids=await pg.evaluate(()=>{const p=SIMDATA.patients.find(p=>SIMDATA.pregAt(p,SIMDATA.now.day)&&SIMHIST.get(p).docs.length>2);const h=SIMHIST.get(p);const r=SIMDATA.patientResults(p);return {p:p.id,v:h.visits[h.visits.length-1].id,l:r.find(x=>x.kind==='Lab').id,i:r.find(x=>x.kind==='Imaging').id,d:SIMDATA.patientDocs(p)[0].id};});
  const routes=['#/dashboard','#/schedule','#/inbox','#/claims','#/report','#/dashboard-practice','#/recall','#/openslots','#/obpatients','#/chart/'+ids.p,'#/chart/'+ids.p+'/visits','#/chart/'+ids.p+'/visits/'+ids.v,'#/chart/'+ids.p+'/results/'+ids.l,'#/chart/'+ids.p+'/results/'+ids.i,'#/chart/'+ids.p+'/history/'+ids.d,'#/chart/'+ids.p+'/vitals','#/chart/'+ids.p+'/history'];
  for(const r of routes){await pg.evaluate(h=>location.hash=h,r);await pg.waitForTimeout(250);
   const res=await pg.evaluate(()=>{const vw=document.documentElement.clientWidth;const bad=[];
    const scrollers=el=>{for(let a=el.parentElement;a;a=a.parentElement){const s=getComputedStyle(a);if(/(auto|scroll|hidden|clip)/.test(s.overflowX)&&a!==document.body&&a!==document.documentElement&&a.id!=='main')return a;}return null;};
    for(const el of document.querySelectorAll('body *')){const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||s.position==='fixed')continue;const rc=el.getBoundingClientRect();if(!rc.width||!rc.height)continue;
     if(rc.right>vw+1||rc.left<-1){const sc=scrollers(el);if(sc){const sr=sc.getBoundingClientRect();if(sr.right<=vw+1&&sr.left>=-1)continue;}bad.push((el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+[...el.classList].join('.'))+' '+Math.round(rc.left)+'-'+Math.round(rc.right));}}
    const m=document.getElementById('main');return {sw:document.documentElement.scrollWidth,vw,main:m?m.scrollWidth-m.clientWidth:0,bad:bad.slice(0,6),nb:bad.length};});
   const ok=res.sw<=res.vw&&res.main<=1&&res.nb===0;if(!ok){fail++;console.log('FAIL',w,r,JSON.stringify(res));}
   if(SHOTS&&SHOTS.split(',').includes(String(w)))await pg.screenshot({path:'/tmp/r_'+w+'_'+r.replace(/[#\/:]/g,'_').slice(0,40)+'.png'});}
  if(errs.length){fail++;console.log('ERR',w,errs.slice(0,3));}
  console.log('width',w,'done');await pg.close();}
 console.log(fail?'FAILED '+fail:'ALL PASSED');await b.close();process.exit(fail?1:0);})();
