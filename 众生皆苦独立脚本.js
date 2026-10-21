/* 众生皆苦 · 可选的纯显示动效。无网络、变量读写、生成锁与提示词注入。 */
(()=>{
  'use strict';
  let host=window;
  try{if(window.parent?.document)host=window.parent;}catch{}
  const doc=host.document,key='__zsjkDialogueEffects',scope='.custom-zsjk';
  host[key]?.dispose?.();
  const colors={yi:['#619d92','#bddbcf'],zhu:['#e5af65','#e5824a'],hui:['#b99bdf','#75ada9'],yun:['#9c5262','#9da9b8']};
  const roots=new Set(),visibility=new WeakMap(),surfaces=new Map(),active=new Set(),stops=[];
  const media=host.matchMedia('(prefers-reduced-motion:reduce)');
  let stopped=false,frame=0,last=0,pointerFrame=0,pending=null,down=null;
  const reduced=()=>stopped||media.matches||doc.hidden;
  const getRoot=target=>target?.nodeType===1?target.closest(scope):target?.parentElement?.closest(scope);
  function listen(target,name,fn,options){target.addEventListener(name,fn,options);stops.push(()=>target.removeEventListener(name,fn,options));}
  function destroy(surface){
    active.delete(surface);surfaces.delete(surface.root);resizeObserver?.unobserve(surface.message);
    surface.message.style.removeProperty('--zsjk-x');surface.message.style.removeProperty('--zsjk-y');surface.canvas.remove();
  }
  function clear(){
    if(frame)host.cancelAnimationFrame(frame);frame=0;last=0;
    if(pointerFrame)host.cancelAnimationFrame(pointerFrame);pointerFrame=0;pending=null;
    for(const surface of [...surfaces.values()])destroy(surface);
    for(const root of roots)root.querySelectorAll('.custom-zsjk-ripple').forEach(node=>node.remove());
    active.clear();
  }
  function resize(surface){
    if(!surface.root.isConnected){destroy(surface);return;}
    const box=surface.message.getBoundingClientRect(),dpr=Math.min(host.devicePixelRatio||1,2);
    surface.width=surface.message.clientWidth;surface.height=surface.message.clientHeight;
    surface.canvas.width=Math.round(surface.width*dpr);surface.canvas.height=Math.round(surface.height*dpr);
    surface.ctx.setTransform(dpr,0,0,dpr,0,0);surface.box=box;
  }
  const resizeObserver=typeof host.ResizeObserver==='function'?new host.ResizeObserver(entries=>{
    for(const entry of entries){const surface=surfaces.get(getRoot(entry.target));if(surface)resize(surface);}
  }):null;
  const intersection=typeof host.IntersectionObserver==='function'?new host.IntersectionObserver(entries=>{
    for(const entry of entries){visibility.set(entry.target,entry.isIntersecting);entry.target.classList.toggle('custom-zsjk-paused',!entry.isIntersecting||doc.hidden);}
  }):null;
  function register(root){if(roots.has(root))return;roots.add(root);intersection?.observe(root);}
  function collect(node){
    if(node.nodeType!==1)return;
    if(node.matches(scope))register(node);
    node.querySelectorAll(scope).forEach(register);
  }
  const observer=new host.MutationObserver(records=>{
    let removed=false;
    for(const record of records){for(const node of record.addedNodes)collect(node);if(record.removedNodes.length)removed=true;}
    if(removed)for(const root of roots)if(!root.isConnected){roots.delete(root);intersection?.unobserve(root);const surface=surfaces.get(root);if(surface)destroy(surface);}
  });
  doc.querySelectorAll(scope).forEach(register);observer.observe(doc.body||doc.documentElement,{childList:true,subtree:true});
  function surfaceFor(root){
    let surface=surfaces.get(root);if(surface)return surface;
    const message=root.querySelector('.custom-zsjk-message'),id=root.dataset.zsjkSpeaker;
    if(!message||!Object.hasOwn(colors,id))return null;
    const canvas=doc.createElement('canvas');canvas.className='custom-zsjk-canvas';canvas.setAttribute('aria-hidden','true');
    const ctx=canvas.getContext('2d');if(!ctx)return null;
    message.appendChild(canvas);surface={root,message,id,canvas,ctx,colors:colors[id],width:0,height:0,particles:[],lastSpawn:0,hover:false};
    surfaces.set(root,surface);resize(surface);resizeObserver?.observe(message);return surface;
  }
  function spawn(surface,x,y,burst){
    if(reduced())return;
    const now=host.performance.now();if(!burst&&now-surface.lastSpawn<38)return;surface.lastSpawn=now;
    for(let i=0;i<(burst?13:2);i++){
      const angle=Math.random()*Math.PI*2,speed=burst?.3+Math.random()*1.4:.2+Math.random()*.45;
      surface.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(surface.id==='zhu'?.6:0),life:1,size:1+Math.random()*1.8,spin:Math.random()*Math.PI,color:surface.colors[i%2],drift:Math.random()*.02-.01});
    }
    if(surface.particles.length>60)surface.particles.splice(0,surface.particles.length-60);
    active.add(surface);if(!frame){last=0;frame=host.requestAnimationFrame(tick);}
  }
  function tick(time){
    frame=0;if(reduced()){clear();return;}
    if(last&&time-last<25){frame=host.requestAnimationFrame(tick);return;}
    const dt=last?Math.min((time-last)/16.7,2.5):1;last=time;
    for(const surface of active){
      if(!surface.root.isConnected){destroy(surface);continue;}
      const {ctx,id,width,height}=surface;ctx.clearRect(0,0,width,height);
      surface.particles=surface.particles.filter(p=>p.life>.02);
      for(const p of surface.particles){
        p.life-=.025*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx+=p.drift*dt;
        if(id==='yi'){p.x+=.4*dt;p.y-=.18*dt;}if(id==='yun')p.y+=.28*dt;if(id==='hui')p.spin+=.035*dt;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.spin);ctx.globalAlpha=Math.max(0,p.life)*.65;ctx.fillStyle=p.color;ctx.strokeStyle=p.color;
        if(id==='yi'){ctx.beginPath();ctx.ellipse(0,0,p.size*.5,p.size*2,.6,0,Math.PI*2);ctx.fill();}
        else if(id==='hui'){ctx.beginPath();ctx.moveTo(0,-p.size*1.7);ctx.lineTo(p.size,0);ctx.lineTo(0,p.size*1.7);ctx.lineTo(-p.size,0);ctx.closePath();ctx.stroke();}
        else if(id==='yun'){ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-p.size*2,0);ctx.lineTo(p.size*2,0);ctx.stroke();}
        else{ctx.shadowColor=p.color;ctx.shadowBlur=5;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);}
        ctx.restore();
      }
      if(!surface.particles.length){ctx.clearRect(0,0,width,height);active.delete(surface);if(!surface.hover)destroy(surface);}
    }
    if(active.size)frame=host.requestAnimationFrame(tick);
  }
  listen(doc,'pointermove',event=>{
    if(reduced()||event.pointerType==='touch')return;
    const root=getRoot(event.target);if(!root)return;
    pending={root,x:event.clientX,y:event.clientY};
    if(!pointerFrame)pointerFrame=host.requestAnimationFrame(()=>{
      pointerFrame=0;if(!pending||!pending.root.isConnected||reduced())return;
      const {root,x,y}=pending;pending=null;const surface=surfaceFor(root);if(!surface)return;
      const box=surface.message.getBoundingClientRect(),px=x-box.left,py=y-box.top;surface.hover=true;
      surface.message.style.setProperty('--zsjk-x',px+'px');surface.message.style.setProperty('--zsjk-y',py+'px');spawn(surface,px,py,false);
    });
  },{passive:true});
  listen(doc,'pointerout',event=>{
    const root=getRoot(event.target);if(!root||root===getRoot(event.relatedTarget))return;
    if(pending?.root===root)pending=null;
    const surface=surfaces.get(root);if(!surface)return;
    surface.hover=false;surface.message.style.removeProperty('--zsjk-x');surface.message.style.removeProperty('--zsjk-y');
    if(!active.has(surface))destroy(surface);
  },{passive:true});
  listen(doc,'pointerdown',event=>{down={root:getRoot(event.target),x:event.clientX,y:event.clientY};},{passive:true});
  listen(doc,'pointercancel',()=>{down=null;},{passive:true});
  listen(doc,'pointerup',event=>{
    const start=down;down=null;
    if(reduced()||!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)>10||doc.getSelection()?.toString().trim())return;
    if(event.target?.closest?.('a,button,input,textarea,select,summary'))return;
    const root=getRoot(event.target);if(!root||root!==start.root)return;
    const surface=surfaceFor(root);if(!surface)return;
    const box=surface.message.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;spawn(surface,x,y,true);
    const ripple=doc.createElement('span');ripple.className='custom-zsjk-ripple';ripple.setAttribute('aria-hidden','true');ripple.style.left=x+'px';ripple.style.top=y+'px';surface.message.appendChild(ripple);
    if(typeof ripple.animate==='function')ripple.animate([{opacity:.5,transform:'translate(-50%,-50%) scale(.1)'},{opacity:0,transform:'translate(-50%,-50%) scale(5)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.then(()=>ripple.remove(),()=>ripple.remove());else ripple.remove();
  },{passive:true});
  listen(doc,'visibilitychange',()=>{if(doc.hidden)clear();for(const root of roots)root.classList.toggle('custom-zsjk-paused',doc.hidden||visibility.get(root)===false);});
  listen(media,'change',()=>{if(media.matches)clear();});
  function dispose(){
    if(stopped)return;stopped=true;clear();observer.disconnect();intersection?.disconnect();resizeObserver?.disconnect();
    for(const stop of stops)stop();for(const root of roots)root.classList.remove('custom-zsjk-paused');roots.clear();
    if(host[key]?.dispose===dispose)delete host[key];
  }
  host[key]={version:'1.0.0',dispose,health:()=>({cards:roots.size,surfaces:surfaces.size,active:active.size})};
  listen(window,'pagehide',dispose,{once:true});listen(window,'beforeunload',dispose,{once:true});
})();
