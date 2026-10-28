/** Supernote Nomad (A6 X2) screen: 7.8" portrait at 300 ppi. */
export const PAGE = { width: 1404, height: 1872, ppi: 300 } as const;

export const PX_PER_MM = PAGE.ppi / 25.4;
export const mm = (v: number): number => v * PX_PER_MM;
export const toMm = (px: number): number => px / PX_PER_MM;
