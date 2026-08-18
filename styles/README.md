# Styles — the "Terrace" design tokens

`tokens.js` is the single source of truth for the app's visual language: warm
paper backgrounds, a clay accent, soft rounded forms. It is pure data — it
imports nothing but `Platform`, so anything may import it.

## The rule

**Never hardcode a hex, a spacing number, or a radius in a component.** If a
value is missing from the tokens, add it there and import it. A colour that only
exists inline is a colour nobody can restyle.

## Token groups

| Group        | What it is for                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `colors`     | Surfaces (`paper` for screen backgrounds, `surface`/`surfaceRaised` for cards, `surfaceSunken` for garment tiles and inset areas), the ink ramp for text, the clay `accent` family for actions, `border` lines, status colours, and the `tag*` pairs (`{ bg, fg }`) for chips. |
| `spacing`    | Padding, margins and gaps. `xs` 4 → `xxxl` 40. Layout numbers come from here, not from arithmetic on other numbers.                                                                                                                                                            |
| `radius`     | Corner rounding. `xl` is the card radius; `pill` fully rounds a control.                                                                                                                                                                                                       |
| `typography` | `fontFamily` / `fontSize` / `fontWeight` primitives, plus composed styles (`itemName`, `brand`, `price`, `sectionTitle`, `screenTitle`, `bodyText`, `caption`) that already carry line height and ink colour. Prefer a composed style; fall back to the primitives.            |
| `shadow`     | `sm` / `md` / `lg` React Native shadow objects, warm-tinted rather than black, with matching Android `elevation`. Spread one into a style: `...shadow.md`.                                                                                                                     |

## The other files here

- `colors.js` — **deprecated compatibility shim.** It re-exports the old key
  names (`background`, `primary`, `text`, `gray100`…) mapped onto their nearest
  Terrace token so untouched screens keep rendering. Do not import it in new
  code; it goes away once the last importer is swept.
- `typography.js`, `global.js`, `card.js` — existing style sheets, now built
  from tokens. Their exported names and shapes are unchanged.

## Adding a token

1. Add it to the right group in `tokens.js`, next to its siblings.
2. Colours must be uppercase 6-digit hex. If it is a text colour, check it
   against its background in `__tests__/tokens.test.js` — the suite enforces
   4.5:1 for every text-on-surface and tag pair, and a new pair should be added
   to that assertion list.
3. Spacing and radius entries must keep their scale strictly ascending.
4. Run `npx jest __tests__/tokens.test.js`.
