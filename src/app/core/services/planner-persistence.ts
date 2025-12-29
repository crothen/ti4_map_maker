import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

export interface SavedMap {
    id?: string;
    userId: string;
    name: string;
    playerCount: number;
    mapString: string;
    mapShape?: number[];
    factionId: string;
    pools: {
        tactic: number;
        fleet: number;
        strategy: number;
    };
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class PlannerService {
    private firestore: Firestore = inject(Firestore);
    private collectionName = 'plans'; // Keeping collection name 'plans' for backward compatibility

    constructor() { }

    async saveMap(mapData: SavedMap) {
        const mapsCol = collection(this.firestore, this.collectionName);
        // Ensure timestamp is fresh
        const data = { ...mapData, timestamp: Date.now() };
        return addDoc(mapsCol, data);
    }

    async updateMap(mapId: string, mapData: Partial<SavedMap>) {
        const docRef = doc(this.firestore, this.collectionName, mapId);
        const data = { ...mapData, timestamp: Date.now() };
        return updateDoc(docRef, data);
    }

    async getMap(mapId: string): Promise<SavedMap | undefined> {
        const docRef = doc(this.firestore, this.collectionName, mapId);
        const snapshot = await getDocs(query(collection(this.firestore, this.collectionName), where('__name__', '==', mapId)));
        if (!snapshot.empty) {
            const d = snapshot.docs[0];
            return { id: d.id, ...d.data() } as SavedMap;
        }
        return undefined;
    }

    getMaps(userId: string): Observable<SavedMap[]> {
        const mapsCol = collection(this.firestore, this.collectionName);
        const q = query(mapsCol, where('userId', '==', userId), orderBy('timestamp', 'desc'));

        return from(getDocs(q)).pipe(
            map(snapshot => {
                return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedMap));
            })
        );
    }

    async deleteMap(mapId: string) {
        const docRef = doc(this.firestore, this.collectionName, mapId);
        return deleteDoc(docRef);
    }
}
