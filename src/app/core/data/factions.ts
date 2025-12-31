export interface FactionAbility {
    name: string;
    description: string;
}

export interface FactionUnit {
    name: string;
    count: number;
    imageUrl?: string;
}

export interface FactionLeader {
    name: string;
    type: 'Agent' | 'Commander' | 'Hero';
    description: string;
    unlockCondition?: string;
}

export interface Faction {
    id: string;
    name: string;
    abilities: FactionAbility[];
    commodities: number;
    startingUnits: FactionUnit[];
    startTech: string[];
    leaders: FactionLeader[];
    homeSystemId: string;
    imageUrl: string; // Faction sheet image
}

export const FACTIONS: Faction[] = [
    {
        id: 'sol',
        name: 'Federation of Sol',
        abilities: [
            { name: 'Orbital Drop', description: 'Action: Spend 1 strategy token from your strategy pool to place 2 infantry from your reinforcements on 1 planet you control.' },
            { name: 'Versatile', description: 'When you satisfy a prerequisite for a unit upgrade technology, you may exhaust this card to ignore 1 prerequisite.' }
        ],
        commodities: 4,
        startingUnits: [
            { name: 'Carrier', count: 2, imageUrl: 'assets/images/units/carrier.png' },
            { name: 'Destroyer', count: 1, imageUrl: 'assets/images/units/destroyer.png' },
            { name: 'Infantry', count: 5, imageUrl: 'assets/images/units/infantry.png' },
            { name: 'Fighter', count: 3, imageUrl: 'assets/images/units/fighter.svg' },
            { name: 'Space Dock', count: 1, imageUrl: 'assets/images/units/spacedock.png' }
        ],
        startTech: ['Neural Motivator', 'Antimass Deflectors'],
        leaders: [
            { name: 'Evelyn Delouis', type: 'Agent', description: 'Exhaust this card to choose a player; that player may place 1 infantry from their reinforcements on a planet they control.' },
            { name: 'Claire Williams', type: 'Commander', description: 'When you perform a tactical action, you may place 1 infantry from your reinforcements on a planet you control in the active system.', unlockCondition: 'Control 4 planets that each have at least 1 unit upgrade technology.' },
            { name: 'Jace X. 4th Air Legion', type: 'Hero', description: 'Action: Remove all of your infantry from the game board and place them on your faction sheet. Then, place each of those infantry on any planet you control.' }
        ],
        homeSystemId: '57',
        imageUrl: 'https://twilight-imperium.fandom.com/wiki/The_Federation_of_Sol?file=Federation_of_Sol_Faction_Sheet.jpg'
    },
    {
        id: 'hacan',
        name: 'Emirates of Hacan',
        //...
        // (skipping intermediate factions for brevity of tool call if possible, or should I replace whole block?
        // To receive full file, I will just target specific blocks one by one to avoid huge payload if not needed
        // But for safety I will try to be targeted)

        // Wait, I need to update Crimson Rebellion URL too
        // That is at the bottom.
        // I'll make two calls or one big call.
        // Let's do a targeted call for Sol first.
        abilities: [
            { name: 'Masters of Trade', description: 'You do not have to spend a command token to resolve the secondary ability of the "Trade" strategy card.' },
            { name: 'Guild Ships', description: 'You can negotiate transactions with players who are not your neighbor.' },
            { name: 'Arbiters', description: 'When you are negotiating a transaction, action cards can be exchanged as part of that transaction.' }
        ],
        commodities: 6,
        startingUnits: [
            { name: 'Carrier', count: 2 },
            { name: 'Cruiser', count: 1 },
            { name: 'Infantry', count: 4 },
            { name: 'Fighter', count: 2 },
            { name: 'Space Dock', count: 1 }
        ],
        startTech: ['Antimass Deflectors', 'Sarween Tools'],
        leaders: [
            { name: 'Carth of Golden Sands', type: 'Agent', description: 'Exhaust this card to gain 1 commodity.' },
            { name: 'Gila the Silvertongue', type: 'Commander', description: 'When you cast votes, you may spend trade goods to cast additional votes.' },
            { name: 'Harrugh Gefhara', type: 'Hero', description: 'Action: Choose a system. You may move any number of your ships from any systems to the chosen system.' }
        ],
        homeSystemId: '16',
        imageUrl: 'https://twilight-imperium.fandom.com/wiki/The_Emirates_of_Hacan?file=Emirates_of_Hacan_Faction_Sheet.jpg'
    },
    {
        id: 'letnev',
        name: 'Barony of Letnev',
        abilities: [
            { name: 'Munitions Reserves', description: 'At the start of each round of space combat, you may spend 2 trade goods to ignore the effects of 1 "Direct Hit" action card.' },
            { name: 'Armada', description: 'The maximum number of non-fighter ships you can have in each system is equal to 2 more than the number of tokens in your fleet pool.' }
        ],
        commodities: 2,
        startingUnits: [
            { name: 'Dreadnought', count: 1, imageUrl: 'assets/images/units/dreadnought.png' },
            { name: 'Carrier', count: 1 },
            { name: 'Destroyer', count: 1 },
            { name: 'Infantry', count: 3 },
            { name: 'Space Dock', count: 1 }
        ],
        startTech: ['Antimass Deflectors', 'Plasma Scoring'],
        leaders: [
            { name: 'Viscount Unlenn', type: 'Agent', description: 'Action: Choose a player. That player may produce 1 additional unit with their PRODUCTION ability.' },
            { name: 'Admiral Eurol', type: 'Commander', description: 'When a round of space combat ends, you may repair 1 of your ships in the active system.' },
            { name: 'Darktalon Treilla', type: 'Hero', description: 'Action: Place this card near the game board. Your fleet pool has no limit.' }
        ],
        homeSystemId: '10',
        imageUrl: 'https://twilight-imperium.fandom.com/wiki/The_Barony_of_Letnev?file=Barony_of_Letnev_Faction_Sheet.jpg'
    },
    {
        id: 'saar',
        name: 'Clan of Saar',
        abilities: [
            { name: 'Scavenge', description: 'When you gain control of a planet, gain 1 trade good.' },
            { name: 'Nomad', description: 'Your space docks can move and have a move value of 1.' }
        ],
        commodities: 3,
        startingUnits: [
            { name: 'Carrier', count: 2 },
            { name: 'Cruiser', count: 1 },
            { name: 'Infantry', count: 4 },
            { name: 'Fighter', count: 2 },
            { name: 'Space Dock', count: 1 } // Floating Factory
        ],
        startTech: ['Antimass Deflectors'],
        leaders: [
            { name: 'Captain Mendosa', type: 'Agent', description: 'When a player activates a system, you may increase the move value of 1 of their ships.' },
            { name: 'Rowl Sarrig', type: 'Commander', description: 'When you produce units, you may produce 1 additional unit.' },
            { name: 'Gurno Aggero', type: 'Hero', description: 'Action: Choose a system. Your ships in that system may move to any adjacent system.' }
        ],
        homeSystemId: '11',
        imageUrl: 'https://twilight-imperium.fandom.com/wiki/The_Clan_of_Saar?file=Clan_of_Saar_Faction_Sheet.jpg'
    },
    {
        id: 'jolnar',
        name: 'Universities of Jol-Nar',
        abilities: [
            { name: 'Fragile', description: 'Apply -1 to the results of your combat rolls.' },
            { name: 'Brilliant', description: 'When you spend resources for technology, you may resolve the secondary ability of the "Technology" strategy card without spending a command token.' },
            { name: 'Analytical', description: 'When you research a technology that is not a unit upgrade, you ignore 1 prerequisite.' }
        ],
        commodities: 4,
        startingUnits: [
            { name: 'Dreadnought', count: 1, imageUrl: 'assets/images/units/dreadnought.png' },
            { name: 'Carrier', count: 2 },
            { name: 'Infantry', count: 2 },
            { name: 'Fighter', count: 1 },
            { name: 'PDS', count: 2 },
            { name: 'Space Dock', count: 1 }
        ],
        startTech: ['Neural Motivator', 'Antimass Deflectors', 'Plasma Scoring', 'Sarween Tools'],
        leaders: [
            { name: 'Dr. Sucaban', type: 'Agent', description: 'When a player spends resources to research technology, you may reduce the cost by 2.' },
            { name: 'Ta Zern', type: 'Commander', description: 'After you roll dice for a unit ability, you may reroll any of those dice.' },
            { name: 'Rin The Master\'s Legacy', type: 'Hero', description: 'Action: Resolving the secondary ability of the "Technology" strategy card allows you to research 1 technology for 0 resources.' }
        ],
        homeSystemId: '12',
        imageUrl: 'https://twilight-imperium.fandom.com/wiki/The_Universities_of_Jol-Nar?file=Universities_of_Jol-Nar_Faction_Sheet.jpg'
    },
    {
        id: 'crimson',
        name: 'The Crimson Rebellion',
        abilities: [
            { name: "Custom", description: "See sheet" }
        ],
        commodities: 3,
        startingUnits: [],
        startTech: [],
        leaders: [],
        homeSystemId: '00',
        imageUrl: "https://twilight-imperium.fandom.com/wiki/The_Crimson_Rebellion"
    }
];
