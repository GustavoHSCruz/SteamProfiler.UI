# SteamProfiler.UI

The components [steamprofiler.org](https://steamprofiler.org), the bench and
[Duo](https://duo.steamprofiler.org) are drawn with: one set of tokens, one
stylesheet of `sp-` classes, and thin React wrappers over those classes.

Open `index.html` from disk to see every component. Nothing on it needs the
network.

```
css/tokens.css      --bg --panel --line --text --dim --accent ... the palette and the type
css/components.css  .sp-btn .sp-pill .sp-chip .sp-tag .sp-seg .sp-field .sp-input
                    .sp-select .sp-notice .sp-panel .sp-stat .sp-row .sp-display ...
react/              Button Pill Chip Tag Segmented Field Input Select Notice Panel
                    Stat Row Display Eyebrow Lede Dot Wordmark Skeleton
fonts/              Bricolage Grotesque, Archivo, IBM Plex Mono (OFL)
```

## Two layers, one source of truth

The CSS is the library. A page with no build step, which is what
steamprofiler.org is, uses the classes directly:

```html
<button class="sp-btn sp-btn--primary">Look it up</button>
<span class="sp-tag" data-tone="good">done</span>
```

The React layer only writes those classes, so a component and the static markup
for it can never drift apart: `tools/check-classes.mjs` fails when a wrapper
emits a class the CSS does not define, or the CSS defines one nothing shows.

```tsx
import { Button, Panel, PanelGo, Tag } from './ui-kit/react';

<Panel title="Library" action={<PanelGo href="/library">see all</PanelGo>}>
  <Button variant="primary">Save</Button> <Tag tone="accent">doing</Tag>
</Panel>
```

## Tokens keep their old names

The variables are `--bg`, `--panel`, `--accent`, unprefixed, because they are
the names the site has always used. A game page on steamprofiler.org restyles
itself by redefining exactly those variables, and every component on it
follows. The classes are prefixed; the tokens are not.

Nothing is `!important` and nothing is in a cascade layer. A front that loads
its own stylesheet after this one wins every tie. A front whose CSS is layered
(Tailwind v4) imports the file into its `components` layer, so its utilities
still win:

```css
@import "./ui-kit/steamprofiler-ui.css" layer(components);
```

Densities that differ between fronts are custom properties, not variants:
`--sp-panel-pad`, `--sp-bar-pad`, `--sp-input-pad`, `--sp-display-size`,
`--sp-lede-size`, `--sp-stat-size`.

## How the fronts get it

Like [SteamProfiler.i18n](https://github.com/GustavoHSCruz/SteamProfiler.i18n),
this repository writes a built copy into each consumer, and each consumer
commits it, so a clone renders without having seen this repo.

```
node sync.mjs            writes, with the fronts checked out beside this repo:
  steamprofiler-front/site/ui.css
  steamprofiler-front/next/src/ui-kit/steamprofiler-ui.css + react/
  steamprofiler-duo-front/src/ui-kit/steamprofiler-ui.css + react/
node sync.mjs --check    exits 1 when any copy is behind
```

Every copy starts with a line naming the version and commit it came from. Edit
here, never the copy: the next sync overwrites it.

## Checks

```
npm install
./check.sh               types, class parity, build
./check.sh --synced      and every sibling front holds the current copy
git config core.hooksPath .githooks
```

MIT.
