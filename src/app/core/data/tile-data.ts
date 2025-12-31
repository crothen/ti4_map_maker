export const TILE_IDS = [
    // Base Game System Tiles
    ...Array.from({ length: 50 }, (_, i) => (i + 1).toString()),
    // PoK System Tiles (51-82)
    ...Array.from({ length: 32 }, (_, i) => (51 + i).toString()),
    // Hyperlanes (Common ones)
    '83A', '83B', '84A', '84B', '85A', '85B', '86A', '86B', '87A', '87B', '88A', '88B', '89A', '89B', '90A', '90B',
    // Thunder's Edge Expansion (92-128)
    ...Array.from({ length: 37 }, (_, i) => (92 + i).toString()),
    // Home System Placeholders (generic)
    '00'
];

export function getTileImageUrl(id: string): string {
    if (!id || id === '-1' || id === '0') return '';

    let urlId = id.toUpperCase();
    // Remove leading zero if present and string is numeric-ish (e.g. '05' -> '5')
    if (urlId.startsWith('0') && urlId.length > 1) {
        urlId = urlId.substring(1);
    }

    return `https://milty.shenanigans.be/img/tiles/ST_${urlId}.png`;
}
