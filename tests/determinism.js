const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const out=[];
for(let i=0;i<2;i++){const ctx=await b.newContext();const pg=await ctx.newPage();await pg.goto('http://localhost:8765/?simdate=2026-03-10');await pg.waitForSelector('#loading.hidden',{state:'attached'});
out.push(await pg.evaluate(()=>{const n=SIMDATA.now.day;return JSON.stringify([SIMDATA.dayAppts(n).map(v=>v.id+v.pid+v.start+SIMDATA.apptStatus(v)).join(),SIMDATA.inboxCounts('P1'),SIMDATA.claimsWindow(n-30,n).length]).length+':'+JSON.stringify(SIMDATA.inboxCounts('P1'));}));await ctx.close();}
console.log(out[0]===out[1]?'DETERMINISTIC':'DIFF',out);await b.close();})();
