/* SIMULATION core utilities: seeded RNG + day-number dates. All data fictitious. */
(function(G){
  function xmur3(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
    return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return (h^=h>>>16)>>>0;};}
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^(a>>>15),1|a);t=t+Math.imul(t^(t>>>7),61|t)^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function R(key){const f=mulberry32(xmur3(String(key))());
    const r={f:f,int:(a,b)=>a+Math.floor(f()*(b-a+1)),range:(a,b)=>a+f()*(b-a),pick:a=>a[Math.floor(f()*a.length)],chance:p=>f()<p,
      wpick:list=>{let t=0;for(const [w] of list)t+=w;let x=f()*t;for(const [w,v] of list){if((x-=w)<0)return v;}return list[list.length-1][1];},
      norm:(m,s)=>{let u=0,v=0;while(!u)u=f();while(!v)v=f();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}};
    return r;}
  function h01(key){return mulberry32(xmur3(String(key))())();}
  // day numbers (UTC days since 1970-01-01)
  const DAY=864e5;
  function dn(y,m,d){return Math.floor(Date.UTC(y,m-1,d)/DAY);}
  function dnFromDate(dt){return dn(dt.getFullYear(),dt.getMonth()+1,dt.getDate());}
  function toDate(n){return new Date(n*DAY);} // UTC
  function ymd(n){const d=toDate(n);return {y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate(),w:d.getUTCDay()};}
  const p2=x=>String(x).padStart(2,'0');
  function mdy(n){const t=ymd(n);return p2(t.m)+'-'+p2(t.d)+'-'+t.y;}
  function mdySlash(n){const t=ymd(n);return p2(t.m)+'/'+p2(t.d)+'/'+t.y;}
  function iso(n){const t=ymd(n);return t.y+'-'+p2(t.m)+'-'+p2(t.d);}
  function fromIso(s){const [y,m,d]=s.split('-').map(Number);return dn(y,m,d);}
  const DOW=['SUN','MON','TUE','WED','THU','FRI','SAT'],DOWL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONS=MON.map(m=>m.slice(0,3));
  function md(n){const t=ymd(n);return t.m+'/'+t.d;}
  function longDate(n){const t=ymd(n);return DOWL[t.w]+', '+MON[t.m-1]+' '+t.d+', '+t.y;}
  function shortLong(n){const t=ymd(n);return DOW[t.w].charAt(0)+DOW[t.w].slice(1).toLowerCase()+' '+MONS[t.m-1]+' '+t.d+' '+t.y;}
  function dow(n){return ymd(n).w;}
  function isWeekend(n){const w=dow(n);return w===0||w===6;}
  function fmtTime(min){let h=Math.floor(min/60),m=min%60;const ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+p2(m)+' '+ap;}
  function fmtTimeC(min){return fmtTime(min).replace(' ','');}
  function ageAt(dobN,n){const a=ymd(dobN),b=ymd(n);let y=b.y-a.y;if(b.m<a.m||(b.m===a.m&&b.d<a.d))y--;return y;}
  function money(x){return '$'+x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function ga(lmp,n){const d=n-lmp;return {w:Math.floor(d/7),d:d%7,days:d,str:Math.floor(d/7)+'w'+(d%7)+'d'};}
  G.SIMCORE={R,h01,dn,dnFromDate,toDate,ymd,mdy,mdySlash,iso,fromIso,md,longDate,shortLong,dow,isWeekend,fmtTime,fmtTimeC,ageAt,money,esc,ga,DOW,DOWL,MON,MONS,p2};
})(window);
