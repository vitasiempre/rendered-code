
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("getStartedButton")
    .addEventListener("click", (e) => {
      const wfIx = Webflow.require("ix3");
      wfIx.emit("getStarted");
      console.log("click");
    });
});


//////////////////////////////

(() => {
  function sync(btn){
    const svg  = btn.querySelector('.march-btn__stroke');
    const rect = btn.querySelector('.march-btn__rect');
    if(!svg || !rect) return;

    const cs = getComputedStyle(btn);
    const w = parseFloat(cs.getPropertyValue('--w')) || 2;

    const box = btn.getBoundingClientRect();
    const width  = box.width;
    const height = box.height;

    if (width <= 0 || height <= 0) return;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const receivedRadius = btn.getAttribute('data-radius');
    let r;

    if (receivedRadius !== "90px")  {
		r = parseInt(receivedRadius);
    } else {
    	r = (height - w) / 2;
    }

    rect.setAttribute('x', w / 2);
    rect.setAttribute('y', w / 2);
    rect.setAttribute('width',  Math.max(0, width  - w));
    rect.setAttribute('height', Math.max(0, height - w));
    rect.setAttribute('stroke-linejoin', 'round');
    rect.setAttribute('rx', r);
    rect.setAttribute('ry', r);

    btn.style.border = 'none';
  }

  function init(root){
    (root || document).querySelectorAll('.march-btn').forEach(sync);
  }

  // ✅ call this after you show a hidden step
  window.marchBtnInit = init;

  // initial + resize
  window.addEventListener('load', () => init());
  window.addEventListener('resize', () => init());

  // ✅ optional: auto-fix when hidden sections become visible / change size
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => sync(entry.target));
    });
    window.addEventListener('load', () => {
      document.querySelectorAll('.march-btn').forEach((btn) => ro.observe(btn));
    });
  }
})();