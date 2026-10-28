import type { Settings, Value } from '../core/types';

/**
 * Settings live in the URL hash as `#<template-id>?key=value&…`, holding only the
 * values that differ from the template's defaults, so a copied link reproduces a page.
 */
export function encodeHash(id: string, settings: Settings, defaults: Settings): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(settings)) {
    if (k in defaults && v !== defaults[k]) params.set(k, String(v));
  }
  const q = params.toString();
  return `#${id}${q ? `?${q}` : ''}`;
}

export function decodeHash(hash: string): { id: string; params: Record<string, string> } {
  const body = hash.replace(/^#/, '');
  const i = body.indexOf('?');
  const id = decodeURIComponent(i < 0 ? body : body.slice(0, i));
  const params = Object.fromEntries(new URLSearchParams(i < 0 ? '' : body.slice(i + 1)));
  return { id, params };
}

/** Parse a raw value to the type of its default. Returns undefined when it does not fit. */
function coerce(raw: unknown, fallback: Value): Value | undefined {
  if (typeof fallback === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) && raw !== '' ? n : undefined;
  }
  if (typeof fallback === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    return raw === 'true' ? true : raw === 'false' ? false : undefined;
  }
  return typeof raw === 'string' ? raw : undefined;
}

/** Defaults overlaid with whatever in `overrides` matches a known key and type. */
export function merge<S extends Settings>(defaults: S, overrides: Record<string, unknown>): S {
  const out: Settings = { ...defaults };
  for (const [k, raw] of Object.entries(overrides)) {
    const fallback = defaults[k];
    if (fallback === undefined) continue;
    const v = coerce(raw, fallback);
    if (v !== undefined) out[k] = v;
  }
  return out as S;
}
