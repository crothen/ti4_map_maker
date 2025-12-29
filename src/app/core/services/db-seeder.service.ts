import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, setDoc, writeBatch } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DbSeederService {

    constructor(
        private http: HttpClient,
        private firestore: Firestore
    ) { }

    async seedSystemTiles() {
        try {
            // Load the JSON data
            const tiles = await firstValueFrom(this.http.get<any[]>('/assets/data/system-tiles.json'));

            console.log(`Loaded ${tiles.length} tiles from JSON. Starting upload...`);

            // Firestore batch has a limit of 500 operations. We chunk it.
            const batchSize = 400;
            const chunks = [];
            for (let i = 0; i < tiles.length; i += batchSize) {
                chunks.push(tiles.slice(i, i + batchSize));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(this.firestore);
                chunk.forEach(tile => {
                    const docRef = doc(this.firestore, 'system-tiles', tile.id);
                    batch.set(docRef, tile);
                });
                await batch.commit();
                console.log(`Committed batch of ${chunk.length} tiles.`);
            }

            console.log('System tiles seeding complete!');
            alert('System tiles updated in Firebase!');

        } catch (error) {
            console.error('Error seeding system tiles:', error);
            alert('Error seeding tiles. Check console.');
        }
    }
}
