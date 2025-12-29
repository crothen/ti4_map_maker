import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Unit {
    id: string; // Unique ID for unit instance
    type: string; // 'Carrier', 'Fighter', etc.
    factionId: string;
    systemId: string; // Tile ID where unit is located
    imageUrl?: string;
    // State for drag
    isDragging?: boolean;
    x?: number; // visual x in system
    y?: number; // visual y in system
}

export interface GameState {
    currentTurn: number;
    activeSystemId: string | null;
    units: Unit[];
    tacticPool: number;
    fleetPool: number;
    strategyPool: number;
}

@Injectable({
    providedIn: 'root'
})
export class GameSimulationService {

    private state: GameState = {
        currentTurn: 1,
        activeSystemId: null,
        units: [],
        tacticPool: 3,
        fleetPool: 3,
        strategyPool: 2
    };

    private stateSubject = new BehaviorSubject<GameState>(this.state);
    state$ = this.stateSubject.asObservable();

    constructor() { }

    initializeFaction(factionId: string, homeSystemId: string, startingUnits: any[]) {
        const units: Unit[] = [];

        startingUnits.forEach(u => {
            for (let i = 0; i < u.count; i++) {
                units.push({
                    id: `${factionId}_${u.name}_${Math.random().toString(36).substr(2, 9)}`,
                    type: u.name,
                    factionId: factionId,
                    systemId: homeSystemId,
                    imageUrl: u.imageUrl
                });
            }
        });

        this.state.units = units;
        this.emitState();
    }

    activateSystem(systemId: string) {
        if (this.state.tacticPool > 0) {
            this.state.tacticPool--;
            this.state.activeSystemId = systemId;
            this.emitState();
            return true;
        }
        return false;
    }

    moveUnit(unitId: string, targetSystemId: string) {
        // Only allow move if target is active system (Simplified rule for now)
        if (this.state.activeSystemId === targetSystemId) {
            const unit = this.state.units.find(u => u.id === unitId);
            if (unit) {
                unit.systemId = targetSystemId;
                this.emitState();
            }
        }
    }

    endTurn() {
        this.state.activeSystemId = null;
        this.state.currentTurn++;
        this.emitState();
    }

    private emitState() {
        this.stateSubject.next({ ...this.state });
    }
}
