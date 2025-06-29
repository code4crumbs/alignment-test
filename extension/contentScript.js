// contentScript.js
// Injects a React overlay and streams bilingual subtitle cues to it.

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

/* --------------------------- main ------------------------------ */
(async () => {
  // 1. Ensure we’re on a playback page with a video tag
  const video = await waitForVideo();

  // 2. Inject a root node for our overlay
  const root = document.createElement('div');
  root.id = 'bilingual-subs-root';
  document.body.appendChild(root);

  // 3. Dynamically load the React overlay bundle produced by Vite
  //    (`npm run build` outputs extension/overlay/bundle.js)
  await import(chrome.runtime.getURL('overlay/bundle.js'));

  /* 4. Wire up subtitle tracks → custom event for React overlay */
  const tracks = Array.from(video.textTracks || []);
  const enTrack = tracks.find(t => t.language.startsWith('en'));
  const koTrack = tracks.find(t => t.language.startsWith('ko'));

  if (!enTrack || !koTrack) {
    console.warn('[BilingualSubs] EN or KO track missing');
    return;
  }

  const dispatchCue = () => {
    const enCue = enTrack.activeCues[0];
    const koCue = koTrack.activeCues[0];
    if (!(enCue && koCue)) return;

    const payload = {
      id: enCue.id || Date.now(),   // unique cue id for alignment lookup
      en: enCue.text || '',
      ko: koCue.text || ''
    };
    window.dispatchEvent(new CustomEvent('BILINGUAL_CUE', { detail: payload }));
  };

  enTrack.addEventListener('cuechange', dispatchCue);
  koTrack.addEventListener('cuechange', dispatchCue);
})();
