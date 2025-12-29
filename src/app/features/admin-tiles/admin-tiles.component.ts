
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapService } from '../../core/services/map';
import { DbSeederService } from '../../core/services/db-seeder.service';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { getTileImageUrl } from '../../core/data/tile-data';

@Component({
    selector: 'app-admin-tiles',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './admin-tiles.component.html',
    styles: [`
    .admin-container { padding: 20px; display: flex; flex-direction: column; gap: 20px; height: 100vh; box-sizing: border-box; background: #0f172a; color: #e2e8f0; }
    .toolbar { display: flex; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid #334155; }
    .content { display: flex; gap: 20px; flex: 1; min-height: 0; }
    .list-panel { width: 300px; overflow-y: auto; background: #1e293b; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
    .editor-panel { flex: 1; display: flex; flex-direction: column; gap: 10px; background: #1e293b; border-radius: 8px; padding: 20px; }
    .editor-body { display: flex; gap: 20px; flex: 1; min-height: 0; }
    .json-column { flex: 1; display: flex; flex-direction: column; }
    .preview-column { width: 350px; background: #000; border: 1px solid #334155; border-radius: 4px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 10px; overflow-y: auto; }
    .preview-img { width: 100%; height: auto; object-fit: contain; border: 1px solid #334155; }
    .tile-item { padding: 8px; cursor: pointer; border-radius: 4px; font-size: 0.9rem; }
    .tile-item:hover { background: #334155; }
    .tile-item.selected { background: #3b82f6; color: white; }
    .json-editor { flex: 1; background: #0f172a; color: #a5f3fc; font-family: monospace; padding: 10px; border: 1px solid #334155; border-radius: 4px; resize: none; }
    button { padding: 8px 16px; border-radius: 4px; border: none; font-weight: bold; cursor: pointer; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-warning { background: #f59e0b; color: white; }
  `]
})
export class AdminTilesComponent implements OnInit {
    tiles: any[] = [];
    selectedTile: any = null;
    jsonString = '';
    filter = '';

    constructor(
        private mapService: MapService,
        private dbSeeder: DbSeederService,
        private firestore: Firestore
    ) { }

    ngOnInit() {
        this.refreshTiles();
    }

    refreshTiles() {
        this.mapService.getSystemTilesData().subscribe(tiles => {
            this.tiles = tiles.sort((a, b) => {
                const aId = parseInt(a.id) || 999;
                const bId = parseInt(b.id) || 999;
                return aId - bId;
            });
            // Reselect if possible
            if (this.selectedTile) {
                const found = this.tiles.find(t => t.id === this.selectedTile.id);
                if (found) this.selectTile(found);
            }
        });
    }

    selectTile(tile: any) {
        this.selectedTile = tile;
        this.jsonString = JSON.stringify(tile, null, 4);
    }

    get filteredTiles() {
        if (!this.filter) return this.tiles;
        const lower = this.filter.toLowerCase();
        return this.tiles.filter(t =>
            t.id.toLowerCase().includes(lower) ||
            (t.name && t.name.toLowerCase().includes(lower))
        );
    }

    async saveChanges() {
        if (!this.selectedTile) return;
        try {
            const data = JSON.parse(this.jsonString);
            if (data.id !== this.selectedTile.id) {
                alert('Changing ID is not supported via this simple editor (requires delete + recreate). Reverting ID.');
                data.id = this.selectedTile.id;
                this.jsonString = JSON.stringify(data, null, 4);
            }

            const docRef = doc(this.firestore, 'system-tiles', this.selectedTile.id);
            await updateDoc(docRef, data);
            alert('Tile updated!');
            this.refreshTiles();
        } catch (e) {
            alert('Invalid JSON or Save Error: ' + e);
        }
    }

    async importFromAssets() {
        if (confirm('This will OVERWRITE the database with the content of assets/data/system-tiles.json. Continue?')) {
            await this.dbSeeder.seedSystemTiles();
            this.refreshTiles();
        }
    }

    getTileImageUrl(id: string) {
        return getTileImageUrl(id);
    }
}
