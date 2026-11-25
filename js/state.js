/* SIMULATION state: user actions persisted in localStorage (reset from the banner). */
(function(G){
 const K='athenaSim.v1.';
 const S={
  get(k){try{return JSON.parse(localStorage.getItem(K+k));}catch(e){return null;}},
  set(k,v){localStorage.setItem(K+k,JSON.stringify(v));S._bump();},
  merge(k,v){S.set(k,Object.assign({},S.get(k)||{},v));},
  del(k){localStorage.removeItem(K+k);S._bump();},
  list(prefix){const out=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith(K+prefix)){try{out.push({k:key.slice(K.length),v:JSON.parse(localStorage.getItem(key))});}catch(e){}}}return out;},
  reset(){const ks=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith(K)&&!key.startsWith(K+'pref.'))ks.push(key);}ks.forEach(k=>localStorage.removeItem(k));S._bump();},
  _bump(){S.rev=(S.rev||0)+1;},rev:0};
 G.SIMSTATE=S;
})(window);
