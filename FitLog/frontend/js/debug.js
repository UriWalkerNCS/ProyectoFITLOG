// debug.js - detect resource load errors and display them
(function(){
  const failed = new Set();

  window.addEventListener('error', function(e){
    try{
      const src = (e.target && (e.target.src || e.target.href)) || e.message;
      if(src) failed.add(src);
      console.log('Resource load error detected:', src, e);
      renderBanner();
    }catch(err){ console.error('debug error', err); }
  }, true);

  window.addEventListener('unhandledrejection', function(e){
    console.error('Unhandled rejection:', e);
  });

  function renderBanner(){
    let banner = document.getElementById('debug-banner');
    if(!banner){
      banner = document.createElement('div');
      banner.id = 'debug-banner';
      banner.style.position = 'fixed';
      banner.style.right = '10px';
      banner.style.bottom = '10px';
      banner.style.background = 'rgba(0,0,0,0.75)';
      banner.style.color = '#fff';
      banner.style.padding = '8px 12px';
      banner.style.fontSize = '12px';
      banner.style.zIndex = 9999;
      banner.style.maxWidth = '360px';
      banner.style.borderRadius = '6px';
      document.body.appendChild(banner);
    }
    banner.innerHTML = '<strong>Recursos fallidos:</strong><br>' + Array.from(failed).map(u=>('<div style="word-break:break-all">'+u+'</div>')).join('');
  }

})();
