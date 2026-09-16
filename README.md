# SteamProfiler.UI

The components [steamprofiler.org](https://steamprofiler.org), the bench and
[Duo](https://duo.steamprofiler.org) are drawn with: one set of tokens, one
stylesheet of `sp-` classes, and thin React wrappers over those classes.

Open `index.html` from disk to browse the documentation. It includes installation,
tokens and a page for each component, with live previews, HTML/React examples,
copy buttons and search (`Ctrl/Cmd K`). Nothing on it needs the network.

Run `npm run dev` to serve the documentation on `0.0.0.0:5190`. Set `PORT` or
`HOST` to change the address. Point the reverse proxy for
`https://devs.steamprofiler.org` at `http://127.0.0.1:5190` (or this
machine's address when the proxy runs elsewhere).

The documentation shell is in `docs/index.template.html` and `css/docs.css`. It uses hash
routes (for example `#/buttons`) so links work from disk and behind a static
reverse proxy without route rewrites. The previews use the real library CSS.

The root SteamProfiler application defines the visual standard for the ecosystem.
The documentation header follows its 42px height, wordmark typography, compact
controls and responsive horizontal padding. Update it against the root application
when those measurements change.

Documentation strings are authored in the sibling **SteamProfiler.i18n** repo,
under `locales/ui/{en,pt,ru}.json`. Run `python3 build.py --consumer ui` there
to generate this repo's `index.html`. The generated page includes every supported
dictionary and works offline. English is the fallback; PT-BR and Russian must
each cover 100% of the English keys, including code examples and accessible labels.
Use the language picker or `?lang=en`, `?lang=pt-BR`, `?lang=ru`. The page
remembers the choice in `sp-lang` and detects the browser language on a first visit.
Chinese documentation is deferred until its dictionaries are added to i18n.

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
