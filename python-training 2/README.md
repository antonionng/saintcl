# Python Training Pack

This folder contains the full `Python for Data` training pack for AJB online delivery.

## Contents
- `index.html`: interactive browser-based training deck
- `assets/theme.css`: visual system and slide styling
- `assets/deck.js`: navigation, fragments, polls, self-checks, and timers
- `data/`: synthetic banking datasets used in the labs
- `notebooks/`: companion notebooks for each training day
- `facilitator-guide.md`: pacing, debrief prompts, and delivery notes
- `participant-workbook.md`: task prompts and reflection sheet

## Open The Deck
You can open `index.html` directly in a browser, or serve the folder locally:

```bash
cd /Users/ant/SaintClaw/python-training
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Deck Controls
- `Right Arrow` or `Space`: next fragment or next slide
- `Left Arrow`: previous fragment or previous slide
- `O`: toggle overview sidebar
- `T`: clear the active exercise timer

## Suggested Delivery Pattern
- Use the deck on the main screen.
- Keep the relevant notebook open in a second window.
- Run labs after the corresponding exercise slides.
- Use the built-in timers and self-check controls during challenge blocks.

## Output Folders
- `outputs/day1/`
- `outputs/day2/`
- `outputs/day3_pack/`

Create these folders from the notebooks as you work. The notebooks already include the required setup code.

## Branding
The deck uses a premium neutral enterprise theme so it can be re-skinned quickly if official AJB brand assets arrive later. Visual tokens live in `assets/theme.css`.

## Scope Reminder
All data and outputs in this pack are synthetic and intended for training use only. The pack supports applied learning, not production deployment.
