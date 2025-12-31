export const TILE_IDS = [
    // Base Game System Tiles
    ...Array.from({ length: 50 }, (_, i) => (i + 1).toString()),
    // PoK System Tiles (51-82)
    ...Array.from({ length: 32 }, (_, i) => (51 + i).toString()),
    // Hyperlanes (Common ones)
    '83a', '83b', '84a', '84b', '85a', '85b', '86a', '86b', '87a', '87b', '88a', '88b', '89a', '89b', '90a', '90b',
    // Thunder's Edge Expansion (92-128)
    ...Array.from({ length: 37 }, (_, i) => (92 + i).toString()),
    // Home System Placeholders (generic)
    '00'
];

export function getTileImageUrl(id: string): string {
    if (!id || id === '-1' || id === '0') return '';

    let urlId = id;

    // Remove leading zero if present and string is numeric-ish (e.g. '05' -> '5', '00' -> '0')
    if (urlId === '00') {
        urlId = '0';
    } else if (urlId.startsWith('0') && urlId.length > 1 && !isNaN(parseInt(urlId.substring(1)))) {
        urlId = urlId.substring(1);
    }

    return `https://milty.shenanigans.be/img/tiles/ST_${urlId}.png`;
}
