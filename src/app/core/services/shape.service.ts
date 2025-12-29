import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

export interface MapShape {
    id: string; // Document ID (could be the name or generated)
    name: string;
    indices: number[];
    createdBy: string; // User UID
    createdAt: any; // Timestamp
}

@Injectable({
    providedIn: 'root'
})
export class ShapeService {
    private firestore: Firestore = inject(Firestore);
    private collectionName = 'map-shapes';

    constructor() { }

    /**
     * Defines a new shape or updates an existing one.
     * If shapeId is not provided, it will use the name as ID (slugified) or generate one.
     */
    async saveShape(name: string, indices: number[], userId: string): Promise<void> {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const shapeDoc = doc(this.firestore, this.collectionName, slug);

        // We overwrite if exists, or simple create new.
        // User wants to "make their new shape, give them a name, and save them".
        const shapeData: MapShape = {
            id: slug,
            name: name,
            indices: indices,
            createdBy: userId,
            createdAt: Timestamp.now()
        };

        return setDoc(shapeDoc, shapeData);
    }

    getShapes(): Observable<MapShape[]> {
        const shapesCol = collection(this.firestore, this.collectionName);
        return from(getDocs(shapesCol)).pipe(
            map(snapshot => {
                return snapshot.docs.map(doc => doc.data() as MapShape);
            })
        );
    }

    async deleteShape(id: string): Promise<void> {
        const shapeDoc = doc(this.firestore, this.collectionName, id);
        return deleteDoc(shapeDoc);
    }
}
