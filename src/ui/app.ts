import { LABEL_FONT } from '../core/draw';
import { PAGE } from '../core/page';
import type { AnyTemplate, Field, Settings } from '../core/types';
import { decodeHash, encodeHash, merge } from './state';

const storageKey = (id: string) => `supernote-templates:${id}`;

function loadStored(id: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
function store(id: string, s: Settings): void {
  try { localStorage.setItem(storageKey(id), JSON.stringify(s)); } catch { /* storage unavailable */ }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
}

function formatValue(f: Extract<Field<Settings>, { type: 'range' }>, v: number): string {
  const n = f.step < 1 ? v.toFixed(1) : String(v);
  return f.unit ? `${n} ${f.unit}` : n;
}

export function startApp(templates: AnyTemplate[]): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const picker = $<HTMLSelectElement>('template');
  const controls = $<HTMLDivElement>('controls');
  const canvas = $<HTMLCanvasElement>('page');
  const status = $<HTMLDivElement>('status');
  const blurb = $<HTMLParagraphElement>('blurb');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  canvas.width = PAGE.width;
  canvas.height = PAGE.height;

  const first = templates[0];
  if (!first) throw new Error('No templates registered.');
  let tpl: AnyTemplate = first;
  let s: Settings = { ...first.defaults };

  for (const t of templates) picker.append(el('option', { value: t.id, textContent: t.name }));
  picker.hidden = templates.length < 2;

  function render(): void {
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.fillStyle = '#fff';
    ctx!.fillRect(0, 0, PAGE.width, PAGE.height);
    tpl.draw(ctx!, s);
    const sum = tpl.summary?.(s);
    status.textContent = sum?.text ?? '';
    status.classList.toggle('error', !!sum?.error);
    store(tpl.id, s);
    history.replaceState(null, '', encodeHash(tpl.id, s, tpl.defaults));
  }

  function set(key: string, v: Settings[string]): void {
    s = { ...s, [key]: v };
    render();
  }

  function buildControls(): void {
    controls.replaceChildren();
    for (const group of tpl.groups) {
      const fs = el('fieldset', {}, el('legend', { textContent: group.title }));
      for (const f of group.fields) fs.append(fieldRow(f));
      controls.append(fs);
    }
  }

  function fieldRow(f: Field<Settings>): HTMLElement {
    const id = `f-${f.key}`;
    const v = s[f.key];
    switch (f.type) {
      case 'range': {
        const out = el('output', { id: `${id}-out`, textContent: formatValue(f, Number(v)) });
        const input = el('input', { id, type: 'range', min: String(f.min), max: String(f.max), step: String(f.step), value: String(v) });
        input.addEventListener('input', () => { out.textContent = formatValue(f, input.valueAsNumber); set(f.key, input.valueAsNumber); });
        return el('div', { className: 'row' }, el('label', { htmlFor: id, textContent: f.label }), out, input);
      }
      case 'check': {
        const input = el('input', { id, type: 'checkbox', checked: v === true });
        input.addEventListener('change', () => set(f.key, input.checked));
        return el('div', { className: 'row check' }, input, el('label', { htmlFor: id, textContent: f.label }));
      }
      case 'text': {
        const input = el('input', { id, type: 'text', value: String(v) });
        if (f.maxLength) input.maxLength = f.maxLength;
        input.addEventListener('input', () => set(f.key, input.value));
        return el('div', { className: 'row' }, el('label', { htmlFor: id, textContent: f.label }), input);
      }
      case 'choice': {
        const seg = el('div', { className: 'seg', role: 'group' });
        seg.setAttribute('aria-label', f.label);
        for (const o of f.options) {
          const b = el('button', { type: 'button', id: `${id}-${o.value}`, textContent: o.label });
          b.setAttribute('aria-pressed', String(v === o.value));
          b.addEventListener('click', () => {
            seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
            set(f.key, o.value);
          });
          seg.append(b);
        }
        return el('div', { className: 'row' }, el('span', { className: 'row-label', textContent: f.label }), seg);
      }
    }
  }

  /** Switch template. URL parameters, when present, describe the page completely. */
  function open(t: AnyTemplate, params: Record<string, string> | null): void {
    tpl = t;
    s = merge(t.defaults, params && Object.keys(params).length ? params : loadStored(t.id));
    picker.value = t.id;
    blurb.textContent = t.description;
    document.title = `${t.name} · Supernote Templates`;
    buildControls();
    render();
  }

  picker.addEventListener('change', () => {
    const t = templates.find(x => x.id === picker.value);
    if (t) open(t, null);
  });

  $<HTMLButtonElement>('reset').addEventListener('click', () => { s = { ...tpl.defaults }; buildControls(); render(); });

  $<HTMLButtonElement>('zoom').addEventListener('click', e => {
    const btn = e.currentTarget as HTMLButtonElement;
    const on = $('device').classList.toggle('actual');
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Fit to window' : 'Actual size';
  });

  const copyBtn = $<HTMLButtonElement>('copy');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyBtn.textContent = 'Link copied';
    } catch {
      copyBtn.textContent = 'Copy failed: use the address bar';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy link'; }, 1600);
  });

  $<HTMLButtonElement>('export').addEventListener('click', () => {
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = el('a', { href: URL.createObjectURL(blob), download: tpl.fileName?.(s) ?? `${tpl.id}.png` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  });

  const { id, params } = decodeHash(location.hash);
  open(templates.find(t => t.id === id) ?? first, params);

  // Labels are drawn with a web font the canvas does not request by itself.
  document.fonts.load(`600 28px ${LABEL_FONT}`).then(render, render);
}
