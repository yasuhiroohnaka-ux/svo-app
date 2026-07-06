# Phonics Asset Map

PDF pages are first exported to `public/images/phonics/generated`, then copied by explicit mapping to `public/images/phonics/cards`.

## Source PDFs

- `public/images/phonics/フォニックスフラッシュカード (1).pdf`
- `public/images/phonics/【2回】フォニックス.pdf`

## Card Mapping

| Card | Source PNG | Source PDF page | Audio |
| --- | --- | --- | --- |
| a | `cards/a.png` | `フォニックスフラッシュカード (1).pdf` page 1 | `audio/phonics/a.m4a` |
| b | `cards/b.png` | `フォニックスフラッシュカード (1).pdf` page 2 | `audio/phonics/b.m4a` |
| c | `cards/c.png` | `フォニックスフラッシュカード (1).pdf` page 3 | `audio/phonics/c_k_q.m4a` |
| d | `cards/d.png` | `フォニックスフラッシュカード (1).pdf` page 4 | `audio/phonics/d.m4a` |
| e | `cards/e.png` | `フォニックスフラッシュカード (1).pdf` page 5 | `audio/phonics/e.m4a` |
| f | `cards/f.png` | `フォニックスフラッシュカード (1).pdf` page 6 | `audio/phonics/f.m4a` |
| g | `cards/g.png` | `フォニックスフラッシュカード (1).pdf` page 7 | `audio/phonics/g.m4a` |
| h | `cards/h.png` | `フォニックスフラッシュカード (1).pdf` page 8 | `audio/phonics/h.m4a` |
| i | `cards/i.png` | `フォニックスフラッシュカード (1).pdf` page 9 | `audio/phonics/i.m4a` |
| j | `cards/j.png` | `フォニックスフラッシュカード (1).pdf` page 10 | `audio/phonics/j.m4a` |
| k | `cards/k.png` | `フォニックスフラッシュカード (1).pdf` page 11 | `audio/phonics/c_k_q.m4a` |
| l | `cards/l.png` | `フォニックスフラッシュカード (1).pdf` page 12 | `audio/phonics/l.m4a` |
| m | `cards/m.png` | `フォニックスフラッシュカード (1).pdf` page 13 | `audio/phonics/m.m4a` |
| n | `cards/n.png` | `【2回】フォニックス.pdf` page 9 | `audio/phonics/n.m4a` |
| o | `cards/o.png` | `フォニックスフラッシュカード (1).pdf` page 14 | `audio/phonics/o.m4a` |
| p | `cards/p.png` | `フォニックスフラッシュカード (1).pdf` page 15 | `audio/phonics/p.m4a` |
| q | `cards/q.png` | `フォニックスフラッシュカード (1).pdf` page 16 | `audio/phonics/c_k_q.m4a` |
| r | `cards/r.png` | `フォニックスフラッシュカード (1).pdf` page 17 | `audio/phonics/r.m4a` |
| s | `cards/s.png` | `フォニックスフラッシュカード (1).pdf` page 18 | `audio/phonics/s.m4a` |
| t | `cards/t.png` | `フォニックスフラッシュカード (1).pdf` page 19 | `audio/phonics/t.m4a` |
| u | `cards/u.png` | `フォニックスフラッシュカード (1).pdf` page 20 | `audio/phonics/u.m4a` |
| v | `cards/v.png` | `フォニックスフラッシュカード (1).pdf` page 21 | `audio/phonics/v.m4a` |
| w | `cards/w.png` | `フォニックスフラッシュカード (1).pdf` page 22 | `audio/phonics/w.m4a` |
| x | `cards/x.png` | `フォニックスフラッシュカード (1).pdf` page 23 | `audio/phonics/x.m4a` |
| y | `cards/y.png` | `フォニックスフラッシュカード (1).pdf` page 24 | `audio/phonics/y.m4a` |
| z | `cards/z.png` | `フォニックスフラッシュカード (1).pdf` page 25 | `audio/phonics/z.m4a` |

## Pattern Cards (2026-07, illustrator-supplied PNGs)

Two-letter (and `ear`) pattern cards were supplied directly as PNGs by the illustrator (入江さん), not extracted from the PDFs. The same batch also included re-exports of `d/g/j/l/r/v/w`, which replaced the PDF-extracted versions of those letter cards.

| Card | Source PNG | Audio |
| --- | --- | --- |
| ar | `cards/ar.png` | none — TTS fallback (`pronunciation: "ar"`) |
| ir | `cards/ir.png` (from `ir (1).png`) | none — TTS fallback (`pronunciation: "er"`) |
| ear | `cards/ear.png` | none — TTS fallback (`pronunciation: "ear"`) |
| oo | `cards/oo.png` | `audio/phonics/oo_long.m4a` |
| ow | `cards/ow.png` (from `ow_アートボード 1.png`) | `audio/phonics/ou_ow.m4a` |
| th | `cards/th.png` | `audio/phonics/th_breath.m4a` (voiceless th) |
| wh | `cards/wh.png` | `audio/phonics/w.m4a` (taught as /w/) |
| ph | `cards/ph.png` | `audio/phonics/f.m4a` (ph = /f/) |

## Notes

- The flashcard PDF appears to skip `n`; `n.png` is deliberately taken from `【2回】フォニックス.pdf` page 9.
- The current mapping is table-driven on purpose. It does not use OCR or image recognition.
- Long vowels and remaining blended sounds (`a_long`, `e_long`, `i_long`, `o_long`, `u_long`, `ch`, `oo_short`, `th_sound`) have audio files but no dedicated card images yet.
- Dedicated recordings for `ar`, `ir`, and `ear` are still missing; those cards currently fall back to speech synthesis.
