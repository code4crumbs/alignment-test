// contentScript.js
// Injects a React overlay and streams bilingual subtitle cues to it

/* -------- utility: wait for the Netflix <video> element -------- */
const waitForVideo = () =>
  new Promise(resolve => {
    const poll = setInterval(() => {
      const vid = document.querySelector('video');
      if (vid) {
        clearInterval(poll);
        resolve(vid);
      }
    }, 500);
  });

/* -------- utility: get subtitle lines (fallback) -------- */
const getLineByLang = code => {
  const all = [...document.querySelectorAll('.player-timedtext')];
  if (code === 'en') return all[0] || null;
  if (code === 'ko') return all[1] || null;
  return null;
};

/* --------------------------- main ------------------------------ */
(async () => {
  const video = await waitForVideo();

  // Inject overlay root
  const root = document.createElement('div');
  root.id = 'bilingual-subs-root';
  document.body.appendChild(root);

  // Load React overlay
  try {
    await import(chrome.runtime.getURL('overlay/bundle.js'));
    console.log('[BilingualSubs] Overlay injected.');
  } catch (err) {
    console.error('[BilingualSubs] Failed to load overlay bundle', err);
    return;
  }

  // Observe subtitles
  const observer = new MutationObserver(() => {
    const enEl = getLineByLang('en');
    const koEl = getLineByLang('ko');

    const enText = enEl?.innerText.trim() || '';
    const koText = koEl?.innerText.trim() || '';

    const cueId = Date.now(); // crude unique ID
    if (!enText && !koText) return;

    const payload = {
      id: cueId,
      en: enText,
      ko: koText
    };
    window.dispatchEvent(new CustomEvent('BILINGUAL_CUE', { detail: payload }));
  });

  const captionContainer = document.querySelector('.player-timedtext')?.parentElement;
  if (captionContainer) {
    observer.observe(captionContainer, { childList: true, subtree: true });
    console.log('[BilingualSubs] Observer attached, overlay active.');
  } else {
    console.warn('[BilingualSubs] Subtitle container not found.');
  }
})();
