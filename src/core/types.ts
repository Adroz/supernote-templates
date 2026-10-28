export type Value = number | boolean | string;
export type Settings = Record<string, Value>;

type Base<S> = { key: keyof S & string; label: string };

export type Field<S> =
  | (Base<S> & { type: 'range'; min: number; max: number; step: number; unit?: string })
  | (Base<S> & { type: 'check' })
  | (Base<S> & { type: 'text'; maxLength?: number })
  | (Base<S> & { type: 'choice'; options: { value: number | string; label: string }[] });

export type Summary = { text: string; error?: boolean };

/**
 * A page template. Add one by writing a module that exports this shape and
 * listing it in `templates/index.ts`; the editor builds its controls from `groups`.
 */
export interface Template<S extends Settings> {
  id: string;
  name: string;
  description: string;
  defaults: S;
  groups: { title: string; fields: Field<S>[] }[];
  /** Paint the whole page. The canvas is PAGE.width × PAGE.height and already white. */
  draw(ctx: CanvasRenderingContext2D, s: S): void;
  /** One-line status under the preview, e.g. row counts or a layout error. */
  summary?(s: S): Summary;
  fileName?(s: S): string;
}

export type AnyTemplate = Template<Settings>;

/**
 * Erase a template's settings type for the registry. Sound because the editor only
 * ever hands a template settings built by merging over that template's own defaults.
 */
export const defineTemplate = <S extends Settings>(t: Template<S>): AnyTemplate => t as unknown as AnyTemplate;
