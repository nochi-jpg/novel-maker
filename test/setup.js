(() => {
  window.__overflow = () => {
    const out = [], st = document.getElementById('stage');
    const W = st.offsetWidth;
    for (const el of st.querySelectorAll('button,.btn,.card,.bcard,.ln,.lcard,.mcard,.dlg,.tag,.bp-k,.wz-l,.set-l,.wk-l,.hint,.fx-lab,.pg-n,.bnav-l,.dlg-title,.sc-title,.slot')) {
      if (!el.offsetParent || el.closest('.map-scroll')) continue;
      const r = el.getBoundingClientRect(), s = st.getBoundingClientRect(), sc = s.width / W;
      if (r.left < s.left - 1 || r.right > s.right + 1 || r.top < s.top - 1 || r.bottom > s.bottom + 1) out.push('OUT:' + (el.className + ' ' + el.textContent).slice(0, 40));
      if (el.scrollWidth > el.clientWidth + 2 && !el.matches('.card,.bcard,.ln,.lcard,.mcard,.slot,.dlg')) out.push('CLIP-W:' + (el.className + ' ' + el.textContent).slice(0, 40) + ` ${el.scrollWidth}>${el.clientWidth}`);
      if (el.scrollHeight > el.clientHeight + 2 && el.matches('.btn,button,.dlg')) out.push('CLIP-H:' + (el.className + ' ' + el.textContent).slice(0, 40) + ` ${el.scrollHeight}>${el.clientHeight}`);
    }
    return out;
  };
  window.__mkimg = (w, hh, color, ch) => {
    const c = document.createElement('canvas'); c.width = w; c.height = hh; const g = c.getContext('2d');
    if (ch) { g.fillStyle = color; g.beginPath(); g.arc(w / 2, hh * 0.25, w * 0.22, 0, 7); g.fill(); g.fillRect(w * 0.2, hh * 0.45, w * 0.6, hh * 0.55); }
    else { const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, color); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); g.fillStyle = '#0004'; g.fillRect(0, hh * 0.7, w, hh * 0.3); }
    return c.toDataURL(ch ? 'image/png' : 'image/jpeg');
  };
})();
