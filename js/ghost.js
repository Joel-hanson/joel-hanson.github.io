
window.onload=function(){var e=false;var t=0;setInterval(function(){if(!e){t=Math.round(Math.max(0,t-Math.max(t/3,1)))}var n=(255-t*2).toString(16);document.body.style.backgroundColor="#ff"+n+""+n},1e3);var n=null;document.onkeydown=function(){t=Math.min(128,t+2);e=true;clearTimeout(n);n=setTimeout(function(){e=false},1500)}}
