// ── Simple Markdown → HTML renderer ─────────────────────────────
var MD = (function(){

  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function inline(s){
    return s
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/__(.+?)__/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/_(.+?)_/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code>$1</code>')
      .replace(/~~(.+?)~~/g,'<del>$1</del>');
  }

  function render(raw){
    if(!raw) return '';
    var lines = raw.split('\n');
    var html = '';
    var inUl=false, inOl=false, inCode=false, inQuote=false;

    function closeList(){
      if(inUl){html+='</ul>';inUl=false;}
      if(inOl){html+='</ol>';inOl=false;}
    }
    function closeQuote(){
      if(inQuote){html+='</blockquote>';inQuote=false;}
    }

    lines.forEach(function(line,idx2){
      // Code block fence
      if(line.startsWith('```')){
        if(!inCode){ closeList(); closeQuote(); html+='<pre><code>'; inCode=true; }
        else{ html+='</code></pre>'; inCode=false; }
        return;
      }
      if(inCode){ html+=esc(line)+'\n'; return; }

      // HR
      if(/^---+$/.test(line.trim())){ closeList();closeQuote();html+='<hr>';return; }

      // Headings
      var hm = line.match(/^(#{1,3})\s+(.+)/);
      if(hm){ closeList();closeQuote();
        var lv=hm[1].length;
        html+='<h'+lv+'>'+inline(esc(hm[2]))+'</h'+lv+'>'; return; }

      // Blockquote
      if(line.startsWith('> ')){
        closeList();
        if(!inQuote){html+='<blockquote>';inQuote=true;}
        html+=inline(esc(line.slice(2)))+'<br>'; return;
      } else { closeQuote(); }

      // Todo
      var todo = line.match(/^\[( |x)\]\s+(.*)/i);
      if(todo){
        closeList();closeQuote();
        var done = todo[1].toLowerCase()==='x';
        html+='<div class="todo-item'+(done?' done':'')+'" onclick="this.classList.toggle(\'done\')">'+
          '<div class="todo-box"><svg class="todo-box-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>'+
          '<div class="todo-text">'+inline(esc(todo[2]))+'</div></div>';
        return;
      }

      // UL
      var ulm = line.match(/^[-*+]\s+(.*)/);
      if(ulm){ closeQuote();
        if(!inUl){if(inOl){html+='</ol>';inOl=false;}html+='<ul>';inUl=true;}
        html+='<li>'+inline(esc(ulm[1]))+'</li>'; return;
      }

      // OL
      var olm = line.match(/^\d+\.\s+(.*)/);
      if(olm){ closeQuote();
        if(!inOl){if(inUl){html+='</ul>';inUl=false;}html+='<ol>';inOl=true;}
        html+='<li>'+inline(esc(olm[1]))+'</li>'; return;
      }

      // Empty line
      closeList();
      if(line.trim()===''){
        if(inQuote){html+='</blockquote>';inQuote=false;}
        return;
      }

      html+='<p>'+inline(esc(line))+'</p>';
    });

    closeList(); closeQuote();
    if(inCode) html+='</code></pre>';
    return html;
  }

  function wordCount(text){
    if(!text||!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(function(w){return w.length>0;}).length;
  }

  return {render, wordCount, esc};
})();
