#!/usr/bin/env python3
"""
Generate alignment JSON for a subtitle pair (EN ↔ KO).
Requires: awesome-align or fast_align installed.
"""

import argparse, json, itertools
from pathlib import Path
import webvtt

# Dummy alignment function – replace with real awesome-align output
def word_align(en_line, ko_line):
    en_words = en_line.split()
    ko_words = ko_line.split()
    # Naive 1:1 mapping up to the shortest length
    return list(zip(range(min(len(en_words), len(ko_words))), range(min(len(en_words), len(ko_words)))))

COLORS = list(range(8))  # Color indices 0–7

parser = argparse.ArgumentParser()
parser.add_argument('--en', required=True, help='English subtitle .vtt file')
parser.add_argument('--ko', required=True, help='Korean subtitle .vtt file')
parser.add_argument('--out', required=True, help='Output JSON path')
args = parser.parse_args()

en_cues = list(webvtt.read(args.en))
ko_cues = list(webvtt.read(args.ko))

if len(en_cues) != len(ko_cues):
    print(f"[WARN] Cue count mismatch: EN={len(en_cues)}, KO={len(ko_cues)}")

alignments = {}
color_cycle = itertools.cycle(COLORS)
word_to_color = {}

for cue_id, (en, ko) in enumerate(zip(en_cues, ko_cues)):
    en_words = en.text.split()
    ko_words = ko.text.split()
    pairs = word_align(en.text, ko.text)

    tokens = []
    for (i, j) in pairs:
        word = en_words[i].lower()
        if word not in word_to_color:
            word_to_color[word] = next(color_cycle)
        tokens.append({'en': i, 'ko': j, 'color': word_to_color[word]})

    alignments[cue_id] = tokens

Path(args.out).write_text(json.dumps(alignments, ensure_ascii=False, indent=2))
print(f"[Done] Wrote {args.out} with {len(alignments)} aligned cue mappings.")
