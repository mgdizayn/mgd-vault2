(function(){var c=document.getElementById('noise'),ctx=c.getContext('2d'),W,H,img,f=0;
function r(){W=c.width=window.innerWidth;H=c.height=window.innerHeight;img=ctx.createImageData(W,H);}
function g(){var d=img.data;for(var i=0;i<d.length;i+=4){var v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}ctx.putImageData(img,0,0);}
function l(){if(++f%4===0)g();requestAnimationFrame(l);}
r();g();l();window.addEventListener('resize',r);})();
