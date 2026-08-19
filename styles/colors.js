// DEPRECATED compatibility shim. The pre-Terrace key names are kept only so the
// files still importing them keep rendering; each one now resolves to its
// nearest Terrace token. New code must import from ./tokens instead — these
// keys will be removed once the screen sweep retires the last importer.
import { colors as terrace } from "./tokens";

export const colors = {
  background: terrace.paper,
  primary: terrace.accent,
  text: terrace.ink,
  textSecondary: terrace.inkSecondary,
  card: terrace.surface,
  surface: terrace.surface,
  white: terrace.surface,
  success: terrace.success,
  error: terrace.danger,
  gray100: terrace.paper,
  gray200: terrace.surfaceSunken,
  gray300: terrace.borderStrong,
  gray400: terrace.inkMuted,
  gray500: terrace.inkSecondary,
  gray600: terrace.ink,
};

export default colors;
