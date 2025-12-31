import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map } from 'rxjs';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

export interface Tile {
  id: string;
  originalString: string;
  imageUrl: string;
  position: number;
  rotation?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mapStringSubject = new BehaviorSubject<string>('');
  private tilesSubject = new BehaviorSubject<Tile[]>([]);

  tiles$ = this.tilesSubject.asObservable();

  constructor(private firestore: Firestore) { }

  getSystemTilesData(): Observable<any[]> {
    const col = collection(this.firestore, 'system-tiles');
    return from(getDocs(col)).pipe(
      map(snapshot => snapshot.docs.map(d => d.data()))
    );
  }

  setMapString(mapString: string) {
    this.mapStringSubject.next(mapString);
    this.parseMapString(mapString);
  }

  private parseMapString(mapString: string) {
    // Split by space
    const tokens = mapString.trim().split(/\s+/);

    const tiles: Tile[] = tokens.map((token, index) => {
      // Regex to capture ID and optional Rotation
      // Matches: "117", "85A4" -> Group 1: "85A", Group 2: "4"
      // Assumes rotation is a single digit 0-5 at the end if the ID is complex or if explicitly provided (though std tiles usually don't have rot in this string format unless it's a specific generator).
      // However, the user provided "85A4". 85A is the tile, 4 is rotation.

      let id = token;
      let rotation = 0;

      // Check for Hyperlane/Rotated pattern (e.g., 85A4)
      // We look for a pattern where an ID is followed by a single digit rotation
      // IDs are typically number + optional letter.
      const match = token.match(/^(\d+[A-Za-z]?)(\d)?$/);

      if (match) {
        id = match[1];
        if (match[2]) {
          rotation = parseInt(match[2], 10);
        }
      }

      // Handle "0" as generic empty/placeholder
      let imageUrl = '';
      if (id !== '0') {
        let urlId = id;

        // Remove leading zero if present (e.g. '05' -> '5')
        if (urlId.startsWith('0') && urlId.length > 1) {
          urlId = urlId.substring(1);
        }

        // Using the user provided URL structure
        imageUrl = `https://milty.shenanigans.be/img/tiles/ST_${urlId}.png`;
      }

      return {
        id: id,
        originalString: token,
        imageUrl: imageUrl,
        position: index,
        rotation: rotation
      } as Tile;
    });

    this.tilesSubject.next(tiles);
  }
}
