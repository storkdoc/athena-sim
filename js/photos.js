/* AI-generated headshots of people who do not exist (SIMULATION). Assigned deterministically by sex + age band. */
(function(G){
const POOLS={"F_y": ["f_y_01.webp", "f_y_02.webp", "f_y_03.webp", "f_y_04.webp", "f_y_05.webp", "f_y_06.webp", "f_y_07.webp", "f_y_08.webp"], "F_m": ["f_m_01.webp", "f_m_02.webp", "f_m_03.webp", "f_m_04.webp", "f_m_05.webp", "f_m_06.webp", "f_m_07.webp", "f_m_08.webp", "f_m_09.webp", "f_m_10.webp", "f_m_11.webp", "f_m_12.webp", "f_m_13.webp", "f_m_14.webp", "f_m_15.webp", "f_m_16.webp"], "F_mid": ["f_mid_01.webp", "f_mid_02.webp", "f_mid_03.webp", "f_mid_04.webp", "f_mid_05.webp", "f_mid_06.webp", "f_mid_07.webp", "f_mid_08.webp"], "F_o": ["f_o_01.webp", "f_o_02.webp", "f_o_03.webp", "f_o_04.webp", "f_o_05.webp", "f_o_06.webp", "f_o_07.webp", "f_o_08.webp"], "F_teen": ["f_teen_01.webp", "f_teen_02.webp", "f_teen_03.webp", "f_teen_04.webp"], "F_e": ["f_e_01.webp", "f_e_02.webp", "f_e_03.webp", "f_e_04.webp", "f_e_05.webp", "f_e_06.webp", "f_e_07.webp", "f_e_08.webp"], "M_y": ["m_y_01.webp", "m_y_02.webp", "m_y_03.webp", "m_y_04.webp"], "M_m": ["m_m_01.webp", "m_m_02.webp", "m_m_03.webp", "m_m_04.webp"], "M_o": ["m_o_01.webp", "m_o_02.webp", "m_o_03.webp", "m_o_04.webp"]};
const C=G.SIMCORE;
const REF=C.dn(2026,1,1);
function band(sex,age){if(sex==='M')return age<35?'M_y':age<50?'M_m':'M_o';
 return age<20?'F_teen':age<30?'F_y':age<40?'F_m':age<50?'F_mid':age<62?'F_o':'F_e';}
const NEAR={F_teen:['F_y'],F_y:['F_teen','F_m'],F_m:['F_y','F_mid'],F_mid:['F_m','F_o'],F_o:['F_mid','F_e'],F_e:['F_o'],M_y:['M_m'],M_m:['M_y','M_o'],M_o:['M_m']};
function pick(sex,age,key){const b=band(sex,age);let pool=POOLS[b]||[];
 // mix in a neighbouring band now and then so a band never looks repetitive
 if(C.h01(key+':nb')<0.25&&NEAR[b])pool=pool.concat(POOLS[NEAR[b][0]]||[]);
 return 'photos/'+pool[Math.floor(C.h01(key+':ph')*pool.length)];}
// mode: 'photo' | 'silhouette' | 'initials'
function forPatient(p){const h=C.h01('photo:'+p.id);if(h<0.17)return {mode:'silhouette'};if(h<0.23)return {mode:'initials'};
 return {mode:'photo',src:pick(p.sex||'F',C.ageAt(p.dob,REF),'pt:'+p.id)};}
const MFIRST=['Marcus','Daniel','Jamal','Luis','Arjun','Kwame','Ethan','Omar','Minh','Tesfaye','Carlos','Brian','Samuel','Hassan','Kevin','Andre','Ricardo','Joseph','Nikhil','Paul'];
function partnerFor(p){const r=C.R('partner:'+p.id);const age=C.ageAt(p.dob,REF);if(age>60||!r.chance(0.55))return null;
 const pa=Math.max(19,age+r.int(-3,7));return {first:r.pick(MFIRST),last:r.chance(0.6)?p.last:r.pick(['Okoro','Mendez','Hale','Park','Rahman','Bishop','Castillo','Nguyen']),age:pa,rel:r.pick(['Spouse','Partner','Husband']),
  phone:'(555) '+r.int(201,989)+'-01'+C.p2(r.int(0,99)),src:pick('M',pa,'partner:'+p.id)};}
G.SIMPHOTO={POOLS,forPatient,partnerFor,count:Object.values(POOLS).reduce((a,b)=>a+b.length,0)};
})(window);
