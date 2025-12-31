const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'assets/data/system-tiles.json');
const tiles = require(filePath);

// Logic for filename generation
tiles.forEach(tile => {
    let id = tile.id;
    let filenameId = id; // Default to ID

    // Rule for 83-91: Upper Case
    // Check if ID starts with 83...91 and has letters
    const num = parseInt(id);
    const hasLetter = /[a-z]/i.test(id);

    if (num >= 83 && num <= 91) {
        if (hasLetter) {
            filenameId = id.toUpperCase();
        }
    }
    // Rule for 119-124: Lower Case
    else if (num >= 119 && num <= 124) {
        if (hasLetter) {
            filenameId = id.toLowerCase();
        }
    }
    // Rule for 00 -> ST_0.png
    else if (id === '00') {
        filenameId = '0';
    }
    // Standard rule: if ID has '05' -> '5' (strip leading zero if numeric-ish)
    // But tile-data.ts had: if (urlId.startsWith('0') && urlId.length > 1) urlId = urlId.substring(1);
    else {
        if (id.startsWith('0') && id.length > 1 && !isNaN(parseInt(id))) {
            filenameId = id.substring(1);
        }
        // Ensure default logic (UPPERCASE for standard tiles?? The request said "remove the upper/lowercase for the ids").
        // User said: "remove the upper/lowercase logic" inside the APP.
        // And "Add property... with filename".
        // So whatever I write here becomes the strict filename.
        // Most milty tiles are UPPERCASE (ST_1.png... ST_83A.png).
        // So default fallback should probably be toUpperCase?
        // User explicitly said: 119-124 use lower case.
        // Implicitly, others use Upper Case? Or As Is?
        // Existing logic was `id.toUpperCase()`.
        // So I should preserve that for others.
        if (num < 119 || num > 124) {
            filenameId = filenameId.toUpperCase();
        }
    }

    tile.filename = `ST_${filenameId}.png`;
});

fs.writeFileSync(filePath, JSON.stringify(tiles, null, 4));
console.log('Updated system-tiles.json with filename property.');
