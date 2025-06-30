// SubtitleOverlay.jsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const COLORS = [
  '#B08CFF', '#7ED957', '#FFB27E', '#FF7097',
  '#57D1FF', '#FFE66D', '#FF9CEE', '#A5F3FC'
];

export default function SubtitleOverlay() {
  const [cue, setCue] = useState({ en: '', ko: '', id: null });
  const [mapping, setMapping] = useState({});

  // Load precomputed alignment JSON from Dropbox (manual test)
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/code4crumbs/alignment-test/main/81262746.json")
      .then(r => r.json())
      .then(setMapping)
      .catch(() => console.warn('Alignment JSON not found'));
  }, []);

  // Listen for custom cue events
  useEffect(() => {
    const handler = e => setCue(e.detail);
    window.addEventListener('BILINGUAL_CUE', handler);
    return () => window.removeEventListener('BILINGUAL_CUE', handler);
  }, []);

  const renderSpans = (text, tokens, lang) => {
    const words = text.split(/\s+/);
    return words.map((word, idx) => {
      const match = tokens.find(t => t[lang] === idx);
      const color = match ? COLORS[match.color] : undefined;
      return (
        <span key={idx} style={{ color: color || 'white' }}>
          {word + ' '}
        </span>
      );
    });
  };

  const alignedTokens = mapping[cue.id] || [];

  return (
    <div id="bilingual-subs-root">
      <div className="line">{renderSpans(cue.en, alignedTokens, 'en')}</div>
      <div className="line">{renderSpans(cue.ko, alignedTokens, 'ko')}</div>
    </div>
  );
}

// Mount immediately if run directly
const container = document.getElementById('bilingual-subs-root');
if (container) {
  const root = createRoot(container);
  root.render(<SubtitleOverlay />);
}
