# Styles — the "Terrace" design tokens

`tokens.js` is the single source of truth for the app's visual language: warm
paper backgrounds, a clay accent, soft rounded forms. It is pure data — it
imports nothing but `Platform`, so anything may import it.

## The rule

**Never hardcode a hex, a spacing number, or a radius in a component.** If a
value is missing from the tokens, add it there and import it. A colour that only
exists inline is a colour nobody can restyle.

## Token groups

| Group        | What it is for                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`     | Surfaces (`paper` for screen backgrounds, `surface`/`surfaceRaised` for cards, `surfaceSunken` for garment tiles and inset areas, `surfaceTranslucent` for sheets that let the backdrop show through), the ink ramp for text, the clay `accent` family for actions, `border` lines, status colours, and the `tag*` pairs (`{ bg, fg }`) for chips. Every colour is an uppercase 6-digit hex except `surfaceTranslucent`, which is `rgba()` because it carries alpha. |
| `spacing`    | Padding, margins and gaps. `xs` 4 → `xxxl` 40. Layout numbers come from here, not from arithmetic on other numbers.                                                                                                                                                                                                                                                                                                                                                  |
| `radius`     | Corner rounding. `xl` is the card radius; `pill` fully rounds a control.                                                                                                                                                                                                                                                                                                                                                                                             |
| `typography` | `fontFamily` / `fontSize` / `fontWeight` primitives, plus composed styles (`itemName`, `brand`, `price`, `sectionTitle`, `screenTitle`, `bodyText`, `caption`) that already carry line height and ink colour. Prefer a composed style; fall back to the primitives.                                                                                                                                                                                                  |
| `shadow`     | `sm` / `md` / `lg` React Native shadow objects, warm-tinted rather than black, with matching Android `elevation`. Spread one into a style: `...shadow.md`. See the clipping caveat below.                                                                                                                                                                                                                                                                            |

## The other files here

- `colors.js` — **deprecated compatibility shim.** It re-exports the old key
  names (`background`, `primary`, `text`, `gray100`…) mapped onto their nearest
  Terrace token so untouched screens keep rendering. Do not import it in new
  code; it goes away once the last importer is swept.
- `typography.js`, `global.js`, `card.js` — existing style sheets, now built
  from tokens. Their exported names and shapes are unchanged, apart from the
  additional `cardElevation` entry described below.

## Shadows and clipping do not share a view

On iOS, `overflow: "hidden"` sets `clipsToBounds`, which clips the layer shadow
along with the content — a style that sets both renders its shadow on Android
only. So a clipping surface and its shadow must live on two different views.

`card.js` splits them for exactly this reason: `card` keeps
`overflow: "hidden"` and no shadow, and `cardElevation` carries `shadow.md`
with no overflow, for a wrapper view placed around the card. Wrapping
`WardrobeItemCard` and `OutfitCard` in that elevation view is the screen
sweep's job — this branch only owns the token and style layer, so those cards
currently render flat.

`cardElevation` repeats the card's `backgroundColor` and `borderRadius` on
purpose. A wrapper with a transparent background has no shape of its own, so
the shadow would be traced from whatever the children happen to composite to
rather than from the wrapper's rounded rect.

## `typography.title` omits `lineHeight` on purpose

Call sites spread the `title` alias and then override `fontSize`
(`BoardDetailsScreen` renders it at 18 and at 24). A fixed leading does not
scale with those overrides — it would box 18pt text in a 36pt line — so the
alias copies the face, size, weight and ink from `tokens.screenTitle` but
leaves leading automatic. Do not add `lineHeight` back to it. The composed
`tokens.screenTitle` style keeps its `lineHeight` for callers that use it whole
at full size; `__tests__/tokens.test.js` asserts both halves of that split.

## Adding a token

1. Add it to the right group in `tokens.js`, next to its siblings.
2. Colours must be uppercase 6-digit hex, unless the token needs alpha — then
   use `rgba()` and add its key to `ALPHA_KEYS` in `__tests__/tokens.test.js`.
   If it is a text colour, check it against its background there and add the
   new pair to the assertion list. The suite currently enforces 4.5:1 for:
   `ink` and `inkSecondary` on `paper`; `ink` on `surface` and `surfaceSunken`;
   `onAccent` on `accent` and `accentPressed`; each of `success`, `danger` and
   `warning` on both `paper` and its own `*Subtle` fill; all seven tag
   `fg`-on-`bg` pairs; and `card.js`'s chip label colour on all seven tag
   backgrounds.

   That last set is the one chips actually render today: `tagColorStyle` returns
   only `{ backgroundColor }`, and `card.js` paints every chip label with
   `tagDefault.fg`. The per-tag `fg` tokens are reserved for a later sweep that
   will wire them through, and are asserted now so they are safe when it does.

   Two deliberate gaps, neither of them asserted:

   - `inkMuted` is 2.62:1 on `paper`. It is decorative only — placeholder
     strokes, disabled affordances — and must never carry meaning or be the
     sole way information is conveyed.
   - `surfaceSunken` is only certified as a background for `ink`. Secondary
     ink (4.00:1), `accent` (3.94:1) and `warning` (4.41:1) all fall short on
     it, so put body text on `paper` or `surface` instead.

3. Spacing and radius entries must keep their scale strictly ascending.
4. Run `npx jest __tests__/tokens.test.js`.
