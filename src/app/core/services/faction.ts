import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FACTIONS, Faction } from '../data/factions';

@Injectable({
  providedIn: 'root'
})
export class FactionService {

  constructor() { }

  getFactions(): Observable<Faction[]> {
    return of(FACTIONS);
  }

  getFactionById(id: string): Observable<Faction | undefined> {
    return of(FACTIONS.find(f => f.id === id));
  }
}

