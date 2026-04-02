// ── Page Router — horizontal swipe navigation ────────────────────
var Router = (function(){
  var PAGE_IDS = ['pgLock','pgDial','pgList','pgReader','pgEditor','pgSettings'];
  var wrap, cur = 0, history = [0];

  function idx(id){ return PAGE_IDS.indexOf(id); }

  function go(id, push){
    var i = idx(id);
    if(i < 0) return;
    wrap.style.transform = 'translateX(-' + (i * 100) + 'vw)';
    cur = i;
    if(push !== false) history.push(i);
    // Keyboard: only allow input on current page
    document.querySelectorAll('input,textarea').forEach(function(el){
      el.setAttribute('tabindex', el.closest('.page') && el.closest('.page').id === id ? '0' : '-1');
    });
  }

  function back(){
    if(history.length > 1){
      history.pop();
      var prev = history[history.length-1];
      go(PAGE_IDS[prev], false);
    }
  }

  function current(){ return PAGE_IDS[cur]; }

  // Touch swipe-back (right edge swipe)
  var tx0, ty0, swiping = false;
  function initSwipe(){
    document.addEventListener('touchstart', function(e){
      tx0 = e.touches[0].clientX;
      ty0 = e.touches[0].clientY;
      swiping = tx0 < 28; // only from left edge
    }, {passive:true});

    document.addEventListener('touchend', function(e){
      if(!swiping) return;
      var dx = e.changedTouches[0].clientX - tx0;
      var dy = Math.abs(e.changedTouches[0].clientY - ty0);
      if(dx > 60 && dy < 80){
        back();
        if(navigator.vibrate) navigator.vibrate(6);
      }
      swiping = false;
    }, {passive:true});
  }

  function init(){
    wrap = document.getElementById('pageWrap');
    initSwipe();
    go('pgLock', false);
    history = [0];
  }

  return {init, go, back, current, idx};
})();
