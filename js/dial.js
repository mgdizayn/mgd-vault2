// ── Vault Dial + Flyout + Connectors ────────────────────────────
var Dial = (function(){

  var CX=150,CY=150,RO=138,RI=82,RICON=111,GAP=6;

  var SEGS=[
    {id:'notes',    label:'Notlar',   color:'#e8893b',icon:'notes'},
    {id:'agenda',   label:'Ajanda',   color:'#60a5fa',icon:'cal'},
    {id:'pinned',   label:'Sabitler', color:'#f472b6',icon:'pin'},
    {id:'search',   label:'Arama',    color:'#a78bfa',icon:'search'},
    {id:'vault',    label:'Vault',    color:'#34d399',icon:'lock'},
    {id:'settings', label:'Ayarlar',  color:'#94a3b8',icon:'cog'},
  ];

  var RI_CONS={
    notes:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="C" stroke-width="1.6" fill="none" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke="C" stroke-width="1.6" fill="none"/><line x1="16" y1="13" x2="8" y2="13" stroke="C" stroke-width="1.4" stroke-linecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="C" stroke-width="1.4" stroke-linecap="round"/>',
    cal:'<rect x="3" y="4" width="18" height="18" rx="2" stroke="C" stroke-width="1.6" fill="none"/><line x1="3" y1="10" x2="21" y2="10" stroke="C" stroke-width="1.4"/><line x1="8" y1="2" x2="8" y2="6" stroke="C" stroke-width="1.6" stroke-linecap="round"/>',
    pin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="C" stroke-width="1.6" fill="none"/><circle cx="12" cy="10" r="3" stroke="C" stroke-width="1.5" fill="none"/>',
    search:'<circle cx="11" cy="11" r="7" stroke="C" stroke-width="1.6" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="C" stroke-width="1.6" stroke-linecap="round"/>',
    lock:'<rect x="3" y="11" width="18" height="11" rx="2" stroke="C" stroke-width="1.6" fill="none"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="C" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="12" cy="16" r="1.5" fill="C"/>',
    cog:'<circle cx="12" cy="12" r="3" stroke="C" stroke-width="1.5" fill="none"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="C" stroke-width="1.4" fill="none"/>',
  };

  var FI_ICONS={
    doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    hash:'<line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="10" y1="3" x2="8" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="16" y1="3" x2="14" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    cal:'<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    pin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.4" fill="none"/>',
    lock:'<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
    search:'<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    cog:'<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  };

  var FD={
    notes:[
      {id:'all',     icon:'doc',   label:'Tüm Notlar',     cat:'notes'},
      {id:'recent',  icon:'hash',  label:'Son Eklenenler',  cat:'notes'},
      {id:'ideas',   icon:'doc',   label:'Fikirler',        cat:'notes'},
      {id:'work',    icon:'doc',   label:'İş Notları',      cat:'notes'},
      {id:'personal',icon:'doc',   label:'Kişisel',         cat:'notes'},
    ],
    agenda:[
      {id:'today',   icon:'cal',   label:'Bugün',           cat:'agenda'},
      {id:'week',    icon:'cal',   label:'Bu Hafta',        cat:'agenda'},
      {id:'month',   icon:'cal',   label:'Bu Ay',           cat:'agenda'},
    ],
    pinned:[
      {id:'pinall',  icon:'pin',   label:'Sabitlenmiş',     cat:'pinned'},
      {id:'pinimp',  icon:'pin',   label:'Önemli',          cat:'pinned'},
    ],
    search:[
      {id:'srchall', icon:'search',label:'Tümünde Ara',     cat:'search'},
      {id:'srchday', icon:'search',label:'Bugünkiler',      cat:'search'},
    ],
    vault:[
      {id:'vlt1',    icon:'lock',  label:'Gizli Notlar',    cat:'vault'},
      {id:'vlt2',    icon:'lock',  label:'Şifreler',        cat:'vault'},
    ],
    settings:[
      {id:'st1',     icon:'hash',  label:'Hesap',           cat:'settings'},
      {id:'st2',     icon:'cog',   label:'Güvenlik',        cat:'settings'},
    ],
  };

  var activeIdx=0, activeFiIdx=0;
  var onSegCb=null, onItemCb=null;
  var segG,glowG,iconG,flyoutList,connSvg;

  function d2r(d){return d*Math.PI/180;}
  function polar(r,a){var rad=d2r(a-90);return{x:CX+r*Math.cos(rad),y:CY+r*Math.sin(rad)};}
  function ns(tag,a){var el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(var k in a)el.setAttribute(k,a[k]);return el;}

  function arcPath(ro,ri,s,e){
    var sg=s+GAP/2,eg=e-GAP/2;
    var p1=polar(ro,sg),p2=polar(ro,eg),p3=polar(ri,eg),p4=polar(ri,sg);
    var la=(eg-sg>180)?1:0;
    return['M',p1.x.toFixed(2),p1.y.toFixed(2),'A',ro,ro,0,la,1,p2.x.toFixed(2),p2.y.toFixed(2),
           'L',p3.x.toFixed(2),p3.y.toFixed(2),'A',ri,ri,0,la,0,p4.x.toFixed(2),p4.y.toFixed(2),'Z'].join(' ');
  }

  function renderRing(){
    segG.innerHTML=glowG.innerHTML=iconG.innerHTML='';
    var step=360/SEGS.length;
    SEGS.forEach(function(seg,i){
      var s=i*step,e=s+step,mid=(s+e)/2,act=i===activeIdx;
      var d=arcPath(RO,RI,s,e);
      var path=ns('path',{d:d,
        fill:act?'rgba(255,255,255,0.085)':'rgba(255,255,255,0.028)',
        stroke:act?'rgba(255,255,255,0.13)':'rgba(255,255,255,0.045)',
        'stroke-width':'0.6'});
      segG.appendChild(path);
      var hit=ns('path',{d:d,fill:'transparent',style:'cursor:pointer'});
      hit.addEventListener('touchend',function(ev){ev.preventDefault();setActive(i);},{passive:false});
      hit.addEventListener('click',function(){setActive(i);});
      hit.addEventListener('mouseenter',function(){if(!act)path.setAttribute('fill','rgba(255,255,255,0.055)');});
      hit.addEventListener('mouseleave',function(){if(!act)path.setAttribute('fill','rgba(255,255,255,0.028)');});
      segG.appendChild(hit);

      if(act){
        var col=seg.color;
        var sg2=s+GAP/2+1,eg2=e-GAP/2-1;
        var gp1=polar(RO-1,sg2),gp2=polar(RO-1,eg2);
        var la=(eg2-sg2>180)?1:0;
        var gd=['M',gp1.x,gp1.y,'A',(RO-1),(RO-1),0,la,1,gp2.x,gp2.y].join(' ');
        glowG.appendChild(ns('path',{d:gd,fill:'none',stroke:col+'99','stroke-width':'6','stroke-linecap':'round',filter:'url(#fo)'}));
        glowG.appendChild(ns('path',{d:gd,fill:'none',stroke:col,'stroke-width':'1.8','stroke-linecap':'round'}));
        var ip1=polar(RI+2,sg2),ip2=polar(RI+2,eg2);
        glowG.appendChild(ns('path',{d:['M',ip1.x,ip1.y,'A',(RI+2),(RI+2),0,la,1,ip2.x,ip2.y].join(' '),
          fill:'none',stroke:col+'33','stroke-width':'3','stroke-linecap':'round'}));
      }

      var ip=polar(RICON,mid),sz=13;
      var colStr=act?seg.color:'rgba(255,255,255,0.5)';
      var g2=ns('g',{transform:'translate('+(ip.x-sz/2).toFixed(1)+','+(ip.y-sz/2).toFixed(1)+')',
        opacity:act?'0.92':'0.28',style:'cursor:pointer'});
      var s2=document.createElementNS('http://www.w3.org/2000/svg','svg');
      s2.setAttribute('width',sz);s2.setAttribute('height',sz);s2.setAttribute('viewBox','0 0 24 24');
      s2.style.overflow='visible';
      s2.innerHTML=RI_CONS[seg.icon].replace(/stroke="C"/g,'stroke="'+colStr+'"').replace(/fill="C"/g,'fill="'+colStr+'"');
      g2.appendChild(s2);
      g2.addEventListener('click',function(){setActive(i);});
      g2.addEventListener('touchend',function(ev){ev.preventDefault();setActive(i);},{passive:false});
      iconG.appendChild(g2);
    });
  }

  function renderFlyout(segId){
    flyoutList.innerHTML='';
    var items=FD[segId]||[];
    var n=items.length,center=Math.floor(n/2);
    activeFiIdx=center;

    items.forEach(function(item,i){
      var el=document.createElement('div');
      el.className='fi';
      var off=i-center;
      var tilt=off*7,scale=1-Math.abs(off)*0.038,tz=-Math.abs(off)*10;
      el.style.cssText='transform:perspective(550px) rotateX('+tilt+'deg) scale('+scale+') translateZ('+tz+'px);transform-origin:left center;';
      if(i===center) el.classList.add('active');

      var ic=document.createElement('div');
      ic.className='fi-icon';
      ic.innerHTML='<svg viewBox="0 0 24 24">'+(FI_ICONS[item.icon]||FI_ICONS.doc)+'</svg>';
      var lb=document.createElement('div');
      lb.className='fi-label';
      lb.textContent=item.label;
      el.appendChild(ic);el.appendChild(lb);

      function activate(){
        flyoutList.querySelectorAll('.fi').forEach(function(x){x.classList.remove('active');});
        el.classList.add('active');
        activeFiIdx=i;
        setTimeout(drawConnectors,30);
        if(onItemCb) onItemCb(item);
        if(navigator.vibrate) navigator.vibrate(4);
      }
      el.addEventListener('click',activate);
      el.addEventListener('touchend',function(ev){ev.preventDefault();activate();},{passive:false});
      flyoutList.appendChild(el);
    });

    // Staggered slide-in
    var fis=flyoutList.querySelectorAll('.fi');
    fis.forEach(function(el,i){
      el.style.opacity='0';
      setTimeout(function(){el.classList.add('animating');el.style.opacity='1';
        setTimeout(function(){el.classList.remove('animating');},350);},i*42+15);
    });
    setTimeout(drawConnectors,130);
  }

  function drawConnectors(){
    if(!connSvg) return;
    connSvg.innerHTML='';
    var stage=document.getElementById('dialStage');
    var dialEl=document.getElementById('dialWrap');
    if(!stage||!dialEl) return;
    var sr=stage.getBoundingClientRect();
    var dr=dialEl.getBoundingClientRect();
    var fis=flyoutList.querySelectorAll('.fi');
    if(!fis.length) return;

    var ox=dr.right-sr.left-6;
    var oy=dr.top+dr.height/2-sr.top;

    // Origin dot
    connSvg.appendChild(mkNs('circle',{cx:ox,cy:oy,r:'3.5',
      fill:'rgba(255,255,255,0.1)',stroke:'rgba(255,255,255,0.18)','stroke-width':'0.8'}));

    fis.forEach(function(item){
      var ir=item.getBoundingClientRect();
      var ey=ir.top+ir.height/2-sr.top;
      var ex=ir.left-sr.left-3;
      var act=item.classList.contains('active');
      var cpx=ox+(ex-ox)*0.52;
      var d='M '+ox+' '+oy+' C '+cpx+' '+oy+','+cpx+' '+ey+','+ex+' '+ey;
      connSvg.appendChild(mkNs('path',{d:d,fill:'none',
        stroke:act?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.06)',
        'stroke-width':act?'1.1':'0.6','stroke-linecap':'round'}));
      connSvg.appendChild(mkNs('circle',{cx:ex,cy:ey,
        r:act?'2.8':'1.5',fill:act?'rgba(255,255,255,0.38)':'rgba(255,255,255,0.1)'}));
    });
  }

  function mkNs(tag,a){var el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(var k in a)el.setAttribute(k,a[k]);return el;}

  function updatePill(){
    var pill=document.getElementById('dialSegPill');
    if(!pill) return;
    var seg=SEGS[activeIdx];
    pill.textContent=seg.label;
    pill.style.color=seg.color;
    pill.style.borderColor=seg.color+'44';
  }

  function renderDots(){
    var dots=document.getElementById('segDots');
    if(!dots) return;
    dots.innerHTML='';
    SEGS.forEach(function(_,i){
      var d=document.createElement('div');
      d.className='seg-dot'+(i===activeIdx?' active':'');
      d.addEventListener('click',function(){setActive(i);});
      dots.appendChild(d);
    });
  }

  function setActive(i,silent){
    activeIdx=((i%SEGS.length)+SEGS.length)%SEGS.length;
    renderRing();renderDots();updatePill();
    renderFlyout(SEGS[activeIdx].id);
    if(!silent&&onSegCb) onSegCb(SEGS[activeIdx]);
    if(navigator.vibrate) navigator.vibrate(5);
  }

  var _ta=null,_ti=0;
  function initTouch(){
    var wrap=document.getElementById('dialWrap');
    if(!wrap) return;
    wrap.addEventListener('touchstart',function(e){
      var t=e.touches[0],r=wrap.getBoundingClientRect();
      _ta=Math.atan2(t.clientY-(r.top+r.height/2),t.clientX-(r.left+r.width/2))*(180/Math.PI);
      _ti=activeIdx;
    },{passive:true});
    wrap.addEventListener('touchend',function(e){
      if(_ta===null) return;
      var t=e.changedTouches[0],r=wrap.getBoundingClientRect();
      var ea=Math.atan2(t.clientY-(r.top+r.height/2),t.clientX-(r.left+r.width/2))*(180/Math.PI);
      if(Math.abs(ea-_ta)>22) setActive(_ti+(ea-_ta>0?1:-1));
      _ta=null;
    },{passive:true});
  }

  function init(cfg){
    segG=document.getElementById('gSegs');
    glowG=document.getElementById('gGlow');
    iconG=document.getElementById('gIcons');
    flyoutList=document.getElementById('flyoutList');
    connSvg=document.getElementById('connSvg');
    if(cfg&&cfg.onSelect)     onSegCb=cfg.onSelect;
    if(cfg&&cfg.onItemSelect) onItemCb=cfg.onItemSelect;
    renderRing();renderDots();updatePill();renderFlyout(SEGS[0].id);
    initTouch();
    var kb=document.getElementById('knobBtn');
    if(kb) kb.addEventListener('click',function(){setActive(activeIdx+1);});
    window.addEventListener('resize',function(){setTimeout(drawConnectors,100);});
  }

  function getActive(){return SEGS[activeIdx];}
  function getActiveFlyoutItem(){var items=FD[SEGS[activeIdx].id]||[];return items[activeFiIdx]||items[0];}

  return{init,setActive,getActive,getActiveFlyoutItem,SEGS,drawConnectors};
})();
