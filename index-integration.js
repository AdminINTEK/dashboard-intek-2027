/* INTEK Smart Portal 2027 — Admin Panel V17 integration
 * Set API_URL to the public Apps Script web-app deployment URL ending in /exec.
 * Keep this file beside index.html in the GitHub Pages repository.
 */
(function(){
  'use strict';
  const API_URL = 'PASTE_PUBLIC_API_DEPLOYMENT_URL_HERE';
  if (!/^https:\/\/script\.google\.com\/macros\/s\//.test(API_URL)) {
    console.warn('INTEK Portal API belum dikonfigurasi. Kandungan statik dikekalkan.');
    return;
  }
  function fetchPortalData(){
    return new Promise((resolve,reject)=>{
      const cb='intekPortalCb_'+Date.now()+'_'+Math.floor(Math.random()*10000);
      const script=document.createElement('script');
      const timer=setTimeout(()=>{cleanup();reject(new Error('Portal API timeout'));},12000);
      function cleanup(){clearTimeout(timer);try{delete window[cb]}catch(e){window[cb]=undefined}if(script.parentNode)script.parentNode.removeChild(script)}
      window[cb]=payload=>{cleanup();if(payload&&payload.ok&&payload.data)resolve(payload.data);else reject(new Error('Respons API tidak sah'))};
      script.onerror=()=>{cleanup();reject(new Error('Tidak dapat menghubungi Portal API'))};
      script.src=API_URL+(API_URL.includes('?')?'&':'?')+'api=1&callback='+encodeURIComponent(cb)+'&_='+Date.now();
      document.head.appendChild(script);
    });
  }
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const months=['JAN','FEB','MAC','APR','MEI','JUN','JUL','OGO','SEP','OKT','NOV','DIS'];
  function dateBadge(iso){const d=new Date(iso+'T00:00:00+08:00');return {day:String(d.getDate()).padStart(2,'0'),month:months[d.getMonth()]||''}}
  function renderEnrolment(data){
    const body=document.querySelector('#enrolBody');
    if(body&&Array.isArray(data.enrolment)){
      body.innerHTML=data.enrolment.map(e=>`<tr><td>${esc(e.form)}</td><td>${Number(e.boys)||0}</td><td>${Number(e.girls)||0}</td><td>${(Number(e.boys)||0)+(Number(e.girls)||0)}</td></tr>`).join('');
      const b=data.enrolment.reduce((s,e)=>s+(Number(e.boys)||0),0),g=data.enrolment.reduce((s,e)=>s+(Number(e.girls)||0),0);
      const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
      set('totalB',b);set('totalG',g);set('totalAll',b+g);set('enrolUpdated','Tarikh kemas kini: '+(data.updatedAt||'—'));
    }
    const staff=data.staff||{};
    const values=[staff.classes,(data.enrolment||[]).reduce((s,e)=>s+(Number(e.boys)||0)+(Number(e.girls)||0),0),staff.teachers,staff.panitia,staff.akp??19,staff.dorm??21];
    document.querySelectorAll('.statsrow .stat strong').forEach((el,i)=>{if(values[i]!==undefined&&values[i]!==null)el.textContent=values[i]});
  }
  function renderAnnouncements(data){
    const panel=document.querySelector('.dashboard-grid article.panel.searchable-panel');if(!panel)return;
    panel.querySelectorAll('.item.searchable').forEach(n=>n.remove());
    const items=(data.announcements||[]).filter(x=>x.active!==false);
    items.forEach(a=>{
      const d=dateBadge(a.date),item=document.createElement('div');item.className='item searchable';
      item.innerHTML=`<div class="datebadge"><strong>${d.day}</strong><span>${d.month}</span></div><div><h4>${a.important?'<span class="important badge-penting">PENTING</span> ':''}${esc(a.title)}</h4><p>${esc(a.description||'')}</p></div><span class="arrow">›</span>`;
      panel.appendChild(item);
    });
  }
  function renderCountdowns(data){
    const panel=document.querySelector('.count-panel .count-grid');if(!panel)return;
    panel.innerHTML=(data.countdowns||[]).filter(x=>x.active!==false).map(x=>{
      const d=dateBadge(x.date);
      return `<div class="count-card" data-date="${esc(x.date)}T00:00:00+08:00"><div class="cicon">${esc(x.icon||'📅')}</div><div><small>${d.day} ${d.month} ${x.date.slice(0,4)}</small><strong>${esc(x.title)}</strong><span class="count-number">—</span><div class="count-status">HARI LAGI</div></div></div>`;
    }).join('');
    if(typeof window.updateCountdowns==='function')window.updateCountdowns();
  }
  function renderTicker(data){
    const ticker=document.querySelector('.ticker-text');if(!ticker)return;
    const text=esc(data.tickerText||'');
    ticker.innerHTML=`<span>${text}</span><span aria-hidden="true">${text}</span>`;
  }
  function renderSlides(data){
    const slider=document.querySelector('#slider');if(!slider)return;
    const items=(data.slides||[]).filter(x=>x.active!==false&&x.imageUrl);
    const dots=slider.querySelector('.slider-dots');
    slider.querySelectorAll('figure.slide').forEach(n=>n.remove());
    if(dots)dots.innerHTML='';
    let current=0;
    function setSlide(i){current=i;slider.querySelectorAll('figure.slide').forEach((x,j)=>x.classList.toggle('active',j===i));if(dots)dots.querySelectorAll('button').forEach((x,j)=>x.classList.toggle('active',j===i));}
    items.forEach((s,i)=>{
      const fig=document.createElement('figure');fig.className='slide'+(i===0?' active':'');
      const img=document.createElement('img');img.src=s.imageUrl;img.alt=s.caption||'Foto INTEK';img.loading=i===0?'eager':'lazy';
      const cap=document.createElement('figcaption');cap.textContent=s.caption||'';fig.append(img,cap);slider.insertBefore(fig,dots||null);
      if(dots){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Foto '+(i+1));if(i===0)b.classList.add('active');b.addEventListener('click',()=>setSlide(i));dots.appendChild(b)}
    });
    if(window.__intekAdminSliderTimer)clearInterval(window.__intekAdminSliderTimer);
    window.__intekAdminSliderTimer=setInterval(()=>{if(items.length>1)setSlide((current+1)%items.length)},5000);
  }
  fetchPortalData().then(data=>{
    renderEnrolment(data);renderAnnouncements(data);renderCountdowns(data);renderTicker(data);renderSlides(data);
    console.info('INTEK Smart Portal: kandungan dinamik dimuatkan.');
  }).catch(err=>console.warn('INTEK Portal API:',err.message));
})();
