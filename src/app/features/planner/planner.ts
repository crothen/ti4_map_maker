import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MapService, Tile } from '../../core/services/map';
import { Faction, FACTIONS } from '../../core/data/factions';
import { HexRenderer } from './canvas-renderer';
import { GameSimulationService } from './game-simulation.service';
import { FactionService } from '../../core/services/faction';
import { AuthService } from '../../core/services/auth';
import { PlannerService } from '../../core/services/planner-persistence';
import { ShapeService, MapShape } from '../../core/services/shape.service';
import { TILE_IDS, getTileImageUrl } from '../../core/data/tile-data';
import { firstValueFrom } from 'rxjs';
import { DbSeederService } from '../../core/services/db-seeder.service';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './planner.html',
  styleUrls: ['./planner.css']
})
export class PlannerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') mapCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  renderer!: HexRenderer;
  private resizeObserver!: ResizeObserver;

  mapString = '18'; // Default with Mecatol Rex

  tiles: (Tile & { x: number, y: number, q: number, r: number })[] = [];
  factions: Faction[] = [];
  selectedFaction: Faction | null = null;

  // Simulation State
  isTacticalMode = false;

  // Edit Mode State
  isEditMode = false; // Enabled byAuth
  availableTiles = TILE_IDS;
  tileSearchTerm = '';
  selectedBrushId: string | null = null;

  // Filter States
  filterBase = true;
  filterPok = true;
  filterExtras = true;
  filterHome = false; // Hide home systems by default to reduce clutter
  filterAnomaliesOnly = false;

  // Modal State
  isContextOpen = false;
  contextMenuPos = { x: 0, y: 0 };
  pendingTileIndex = -1;
  isTileSelectorOpen = false;

  // Shape Editor State
  // Shape Editor State
  isShapeEditMode = false;

  // View Options
  showTileIds = false;
  usedTileIds: string[] = [];
  isMenuOpen = false;
  mobileSidebarState: 'minimized' | 'default' | 'expanded' = 'minimized';
  initialSelectionDone = false;
  // List of ACTIVE index positions in the spiral grid. 
  // If empty, we default to standard full grid.
  mapShape: number[] = [];

  // Shape Loading State
  availableShapes: MapShape[] = [];
  shapeNameInput = '';
  showShapeLoadModal = false;

  // Details Panel State
  selectedHex: any | null = null;
  systemTilesMap: Map<string, any> = new Map();

  // Map Metadata
  currentMapId: string | null = null;
  mapName = 'New Map';
  playerCount = 6;
  showMapLoadModal = false;
  availableMaps: any[] = []; // Type should be SavedMap

  constructor(
    private mapService: MapService,
    private factionService: FactionService,
    public authService: AuthService,
    private plannerService: PlannerService,
    private shapeService: ShapeService,
    private simService: GameSimulationService,
    private dbSeeder: DbSeederService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.factionService.getFactions().subscribe(factions => {
      this.factions = factions;
      if (this.factions.length > 0) {
        this.selectedFaction = this.factions[0];
        this.initSim();
      }
    });

    this.loadShapes();

    this.mapService.getSystemTilesData().subscribe(tiles => {
      tiles.forEach(t => this.systemTilesMap.set(t.id, t));
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadMapByRouteId(id);
      }
    });
  }

  async loadMapByRouteId(id: string) {
    const map = await this.plannerService.getMap(id);
    if (map) {
      this.zone.run(() => {
        this.currentMapId = id;
        this.mapName = map.name;
        this.playerCount = map.playerCount;
        this.mapString = map.mapString;
        this.mapShape = map.mapShape || [];

        const faction = this.factions.find(f => f.id === map.factionId);
        if (faction) {
          this.selectedFaction = faction;
          this.initSim();
        }
        this.loadMap();


        this.cdr.detectChanges();
      });
    }
  }

  initSim() {
    if (this.selectedFaction) {
      this.simService.initializeFaction(this.selectedFaction.id, this.selectedFaction.homeSystemId, this.selectedFaction.startingUnits);
    }
  }

  ngAfterViewInit() {
    this.initCanvas();

    // Subscribe to tiles
    this.mapService.tiles$.subscribe(tiles => {
      const calculatedTiles = this.assignCoordinates(tiles);
      // tile processing usually adds pixel coords, but the renderer does that too using axial.
      this.renderer.setData(calculatedTiles);

      // Update Used Tile IDs List
      const ids = new Set(tiles.map(t => t.id).filter(id => id !== '0'));
      this.usedTileIds = Array.from(ids).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      });

      // Update selected hex reference if it exists (to show new tile image after update)
      if (this.selectedHex) {
        const updated = calculatedTiles.find(t => t.q === this.selectedHex.q && t.r === this.selectedHex.r);
        if (updated) this.selectedHex = updated;
      }

      // Auto-select Mecatol Rex (System 18) on first load
      if (!this.initialSelectionDone) {
        const mecatol = calculatedTiles.find(t => t.id === '18');
        if (mecatol) {
          this.selectedHex = mecatol;
          this.mobileSidebarState = 'minimized';
          this.initialSelectionDone = true;
        }
      }
    });

    // Subscribe to Simulation State for Unit Rendering
    this.simService.state$.subscribe(state => {
      if (this.renderer) {
        this.renderer.setUnits(state.units);
        this.renderer.setActiveSystem(state.activeSystemId);
      }
    });

    // Initial Load trigger
    this.mapService.setMapString(this.mapString);

    // Sync Edit Mode with Auth
    this.authService.user$.subscribe(user => {
      this.isEditMode = !!user;
    });

    // Setup Resize Observer
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  // Shape Editor Methods
  toggleShapeEdit() {
    // Legacy method for button click, now mapped to toggle change potentially.
    // If entering shape mode and shape is empty, initialize with just Center (Mecatol)
    if (this.isShapeEditMode && this.mapShape.length === 0) {
      this.mapShape = [0];
    }
    this.selectedHex = null; // Clear selection when switching modes
    this.loadMap();
  }

  // Method called by the new Toggle Switch
  onShapeEditModeChange() {
    if (this.isShapeEditMode && this.mapShape.length === 0) {
      this.mapShape = [0];
    }
    this.selectedHex = null;
    this.loadMap();
  }

  toggleShapeIndex(index: number) {
    if (index <= 0) return; // Prevent toggling Center (0)

    const pos = this.mapShape.indexOf(index);
    if (pos === -1) {
      // Add
      this.mapShape.push(index);
      this.mapShape.sort((a, b) => a - b);
    } else {
      // Remove
      this.mapShape.splice(pos, 1);
    }

    this.loadMap();
  }

  newMap() {
    if (confirm('Start a new map? Unsaved changes will be lost.')) {
      this.currentMapId = null;
      this.mapName = 'New Map';
      this.mapString = '';
      this.mapShape = [];
      if (this.factions.length > 0) {
        this.selectedFaction = this.factions[0];
        this.initSim();
      }
      this.loadMap();
      this.router.navigate(['/']);
    }
  }

  resetMap() {
    if (confirm('Are you sure you want to reset the entire map calculation?')) {
      // In Shape Edit Mode, we must keep the Center (0) active so it doesn't disappear.
      // In Standard Mode, [] implies "Default Full Grid".
      this.mapShape = this.isShapeEditMode ? [0] : [];
      this.mapString = '18';
      this.loadMap();
    }
  }

  toggleTileIds() {
    this.showTileIds = !this.showTileIds;
    if (this.renderer) {
      this.renderer.showTileIds = this.showTileIds;
      this.renderer.draw();
    }
  }

  toggleMobileSidebar() {
    if (this.mobileSidebarState === 'expanded') {
      this.mobileSidebarState = 'minimized';
    } else {
      this.mobileSidebarState = 'expanded';
    }
  }

  exportShape() {
    // Legacy export to console, maybe keep it?
    console.log('Current Shape Indices:', JSON.stringify(this.mapShape));
  }

  async saveShape() {
    if (!this.shapeNameInput) {
      alert('Please enter a name for the shape.');
      return;
    }
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      alert('You must be logged in to save a shape.');
      return;
    }

    try {
      await this.shapeService.saveShape(this.shapeNameInput, this.mapShape, user.uid);
      alert('Shape saved!');
      this.loadShapes(); // Refresh list
    } catch (e) {
      console.error(e);
      alert('Error saving shape.');
    }
  }

  loadShapes() {
    this.shapeService.getShapes().subscribe(shapes => {
      this.availableShapes = shapes;
    });
  }

  importShape(shape: MapShape) {
    if (confirm(`Load shape "${shape.name}"? This will overwrite your current layout.`)) {
      this.mapShape = [...shape.indices];
      this.shapeNameInput = shape.name; // optional, set name to current
      this.loadMap();
      this.showShapeLoadModal = false;
    }
  }

  deleteShape(shapeId: string) {
    if (confirm('Delete this shape permanently?')) {
      this.shapeService.deleteShape(shapeId).then(() => {
        this.loadShapes();
      });
    }
  }

  initCanvas() {
    // Dispose existing renderer if it exists to prevent event listener leaks
    if (this.renderer) {
      this.renderer.dispose();
    }
    const canvas = this.mapCanvas.nativeElement;
    this.renderer = new HexRenderer(canvas);

    // LEFT CLICK HANDLER
    this.renderer.onHexClick = (tile) => {
      this.zone.run(() => {
        if (this.isShapeEditMode) {
          // Toggle this tile in the shape
          this.toggleShapeIndex(tile.position);
        } else {
          // Standard Mode Click
          // Select the hex for details view
          this.selectedHex = tile;
          console.log('Selected Hex:', tile);

          if (this.isTacticalMode) {
            this.simService.activateSystem(tile.id);
          }
          this.cdr.detectChanges();
        }
      });
    };

    // RIGHT CLICK HANDLER
    this.renderer.onHexRightClick = (tile, clientX, clientY) => {
      this.zone.run(() => {
        if (!this.isShapeEditMode && this.isEditMode) {
          console.log('Right Click Detected on Tile:', tile);
          console.log('Event Coords:', { clientX, clientY });

          // Use dataIndex if available (custom shape mapping), otherwise fall back to position (full grid)
          const targetIndex = (tile.dataIndex !== undefined && tile.dataIndex >= 0) ? tile.dataIndex : tile.position;

          // Also set as selected
          this.selectedHex = tile;

          this.pendingTileIndex = targetIndex;
          this.contextMenuPos = { x: clientX, y: clientY };
          this.isContextOpen = true; // Set to true
          this.isTileSelectorOpen = false;

          console.log('Context state set to TRUE. Pos:', this.contextMenuPos);
          this.cdr.detectChanges(); // FORCE UI UPDATE
        } else {
          console.log('Right click ignored. EditMode:', this.isEditMode, 'ShapeMode:', this.isShapeEditMode);
        }
      });
    };

    this.handleResize();
  }

  openTileSelector() {
    this.isContextOpen = false;
    this.isTileSelectorOpen = true;
    this.tileSearchTerm = '';
  }

  openTileSelectorForSelection() {
    if (!this.selectedHex) return;
    const tile = this.selectedHex;
    const targetIndex = (tile.dataIndex !== undefined && tile.dataIndex >= 0) ? tile.dataIndex : tile.position;

    this.pendingTileIndex = targetIndex;
    this.isTileSelectorOpen = true;
    this.tileSearchTerm = '';
  }

  selectTileForPending(newId: string) {
    if (this.pendingTileIndex >= 0) {
      this.updateMapTileAt(this.pendingTileIndex, newId);
      this.isTileSelectorOpen = false;
      this.pendingTileIndex = -1;
    }
  }

  updateMapTileAt(index: number, newId: string) {
    let tokens = this.mapString.trim() ? this.mapString.trim().split(/\s+/) : [];

    // Expand map string if needed
    if (index >= tokens.length) {
      while (tokens.length <= index) {
        tokens.push('0');
      }
    }

    tokens[index] = newId;
    this.mapString = tokens.join(' ');
    this.mapService.setMapString(this.mapString);
    this.cdr.detectChanges(); // Ensure UI updates if map string changes
  }

  get filteredTiles() {
    let tiles = Array.from(this.systemTilesMap.values());

    // Fallback if map is empty (e.g. initial load delay)
    if (tiles.length === 0) {
      tiles = this.availableTiles.map(id => ({ id, name: `Tile ${id}`, type: 'Unknown' }));
    }

    // 1. Filter by Search Term
    if (this.tileSearchTerm) {
      const term = this.tileSearchTerm.toLowerCase();
      tiles = tiles.filter(t => t.id.toLowerCase().includes(term) || (t.name && t.name.toLowerCase().includes(term)));
    }

    // 2. Filter by Filters
    tiles = tiles.filter(t => {
      const idNum = parseInt(t.id);
      const isNum = !isNaN(idNum);

      // Expansion Logic
      let isBase = false;
      let isPok = false;
      let isExtra = false;

      if (t.id === '18') isBase = true; // Mecatol is base
      else if (isNum) {
        if (idNum <= 51) isBase = true;
        else if (idNum >= 52 && idNum <= 92) isPok = true;
        else isExtra = true;
      } else {
        // Non-numeric IDs or with Suffixes
        const numPart = parseInt(t.id);

        // Check for Hyperlanes (83-91 range usually)
        if (!isNaN(numPart)) {
          if (numPart <= 51) isBase = true;
          else if (numPart <= 92) isPok = true;
          else isExtra = true;
        } else {
          // Purely non-numeric like "T1" etc are Extra
          isExtra = true;
        }
      }

      // Apply Expansion Filter
      if (isBase && !this.filterBase) return false;
      if (isPok && !this.filterPok) return false;
      if (isExtra && !this.filterExtras) return false;

      // Home System Filter
      if (this.filterHome) {
        if (!(t.type === 'Home' || t.isHomeSystem)) return false;
      }

      // Anomaly Filter
      if (this.filterAnomaliesOnly && (!t.anomalies || t.anomalies.length === 0)) return false;

      return true;
    });

    // Sort: Home systems at end? ID numeric sort?
    tiles.sort((a, b) => {
      const aId = parseInt(a.id) || 9999;
      const bId = parseInt(b.id) || 9999;
      return aId - bId;
    });

    // Return just IDs as string array if that's what the template expects, 
    // BUT the template now likely wants the objects to show names?
    // The previous implementation utilized `filteredTiles` looping over `availableTiles` which was string[].
    // Let's check template usage: `*ngFor="let tid of filteredTiles"`.
    // And `{{tid}}` and `getTileUrl(tid)`.
    // So `filteredTiles` MUST return strings (IDs).

    return tiles.map(t => t.id);
  }

  getTileUrl(id: string) {
    return getTileImageUrl(id);
  }

  selectBrush(id: string) {
    this.selectedBrushId = id;
  }

  loadMap() {
    this.mapService.setMapString(this.mapString);
  }

  handleResize() {
    if (!this.renderer || !this.mapContainer) return;
    const container = this.mapContainer.nativeElement;
    this.renderer.resize(container.clientWidth, container.clientHeight);
  }

  onFactionChange(event: any) {
    const factionId = event.target.value;
    const faction = this.factions.find(f => f.id === factionId);
    if (faction) {
      this.selectedFaction = faction;
      this.initSim(); // Reset sim on faction change for now
    }
  }

  startTacticalAction() {
    this.isTacticalMode = true;
  }

  // MAP MANAGEMENT

  async saveMapState() {
    if (!this.selectedFaction) return;
    if (!this.mapName) {
      alert('Please give your map a name.');
      return;
    }

    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      alert('Please login to save');
      return;
    }

    const pools = {
      tactic: 3,
      fleet: 3,
      strategy: 2
    };

    try {
      if (this.currentMapId) {
        await this.plannerService.updateMap(this.currentMapId, {
          userId: user.uid,
          name: this.mapName,
          playerCount: this.playerCount,
          mapString: this.mapString,
          mapShape: this.mapShape,
          factionId: this.selectedFaction.id,
          pools,
          timestamp: Date.now()
        });
        alert('Map updated successfully!');
      } else {
        const docRef = await this.plannerService.saveMap({
          userId: user.uid,
          name: this.mapName,
          playerCount: this.playerCount,
          mapString: this.mapString,
          mapShape: this.mapShape,
          factionId: this.selectedFaction.id,
          pools,
          timestamp: Date.now()
        });
        this.currentMapId = docRef.id;
        alert('Map saved successfully!');
      }
    } catch (error) {
      console.error('Error saving map', error);
      alert('Error saving map');
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.loadSavedMaps(false);
    }
  }

  loadSavedMaps(openModal: boolean = true) {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.plannerService.getMaps(user.uid).subscribe(maps => {
          this.zone.run(() => {
            this.availableMaps = maps;
            if (openModal) {
              this.showMapLoadModal = true;
            }
            this.cdr.detectChanges();
          });
        });
      } else if (openModal) {
        alert('Please login to view saved maps.');
      }
    });
  }

  loadSavedMap(mapData: any) {
    if (confirm(`Load map "${mapData.name}"? Unsaved changes will be lost.`)) {
      this.showMapLoadModal = false;
      if (this.currentMapId === mapData.id) {
        this.loadMapByRouteId(mapData.id);
      } else {
        this.router.navigate(['/map', mapData.id]);
      }
    }
  }

  deleteSavedMap(mapId: string) {
    if (confirm('Delete this map?')) {
      this.plannerService.deleteMap(mapId).then(() => {
        // Refresh is a bit tricky with observables only, but simple:
        this.authService.user$.subscribe(user => {
          if (user) {
            this.plannerService.getMaps(user.uid).subscribe(p => {
              this.zone.run(() => {
                this.availableMaps = p;
                this.cdr.detectChanges();
              });
            });
          }
        });
      });
    }
  }

  private assignCoordinates(tiles: Tile[]): (Tile & { x: number, y: number, q: number, r: number, isInShape: boolean, dataIndex?: number })[] {
    const coords: { q: number, r: number }[] = [];
    coords.push({ q: 0, r: 0 }); // Center

    /*
      TI4 Standard Layout (Flat Top):
      - Center: (0, 0)
      - Ring 1 Start: North (0, -radius)
      - Direction: Clockwise (N -> NE -> SE -> S -> SW -> NW)
    */

    const walkDirs = [
      { dq: 1, dr: 0 },   // Move SE direction (visually moves N to NE)
      { dq: 0, dr: 1 },   // Move S direction (visually moves NE to SE)
      { dq: -1, dr: 1 },  // Move SW direction (visually moves SE to S)
      { dq: -1, dr: 0 },  // Move NW direction (visually moves S to SW)
      { dq: 0, dr: -1 },  // Move N direction (visually moves SW to NW)
      { dq: 1, dr: -1 }   // Move NE direction (visually moves NW to N)
    ];

    const maxRadius = 4;
    for (let radius = 1; radius <= maxRadius; radius++) {
      let q = 0;
      let r = -radius; // Start at North

      coords.push({ q, r }); // Add start of ring

      for (let dirIdx = 0; dirIdx < 6; dirIdx++) {
        const dir = walkDirs[dirIdx];
        for (let step = 0; step < radius; step++) {

          // Move logic
          q += dir.dq;
          r += dir.dr;

          // Don't add the point if it loops back to start (last step of last direction)
          const isBackToStart = (q === 0 && r === -radius);
          if (!isBackToStart) {
            coords.push({ q, r });
          }
        }
      }
    }

    // Check if the first tile is Mecatol (18). If not, prepend it so it takes the Center spot.
    // REMOVED: This causes index shifting in the Editor. The map string must explicitly contain 18 if desired.
    let finalTiles = [...tiles];

    // Determine which indices to actually use
    let indicesToUse: number[] = [];
    if (this.isShapeEditMode) {
      // Use ALL indices 0..coords.length-1
      indicesToUse = coords.map((_, i) => i);
    } else if (this.mapShape.length > 0) {
      // Use only defined shape
      indicesToUse = this.mapShape;
    } else {
      // Default: Use all (Radius 4)
      indicesToUse = coords.map((_, i) => i);
    }

    const resultTiles: (Tile & { x: number, y: number, q: number, r: number, isInShape: boolean, dataIndex?: number })[] = [];

    // In Shape Edit Mode, render ALL tiles, but mark IN-SHAPE ones
    if (this.isShapeEditMode) {
      coords.forEach((coord, index) => {
        // In Shape Mode, we want PURE GRID visualization. 
        // Force tileData to simple empty tile to HIDE SYSTEMS/PLANETS as requested.
        const tileData = { id: '', originalString: '', imageUrl: '', position: index, rotation: 0 };

        const inShape = this.mapShape.includes(index);
        resultTiles.push({
          ...tileData,
          q: coord.q,
          r: coord.r,
          x: 0,
          y: 0,
          isInShape: inShape,
          position: index, // FORCE position to be the grid index for accurate picking
          dataIndex: -1
        });
      });
    } else {
      // Standard Mode: Only render active shape indices
      indicesToUse.forEach(index => {
        if (index >= coords.length) return;

        // Map the token from the mapString (finalTiles) to this position?
        // Wait, TI4 map strings are usually just a list of tiles.
        // "Mecatol, then Ring 1 (pos 1..6), then Ring 2..."
        // If we use a CUSTOM SHAPE, the map string usually just contains the tiles FOR THAT SHAPE.
        // e.g. a 3 player map has fewer tiles than a 6 player map.
        // So if mapShape has 30 entries, mapString should have 30 entries.
        // entry[0] of map string goes to mapShape[0] position.

        // However, our `finalTiles` is just parsed from string.
        // So we should map finalTiles[i] -> coords[mapShape[i]]

        // Let's assume linear mapping for now:
        // Input Tile 0 -> Shape Position 0
        // Input Tile 1 -> Shape Position 1
        // ...

        // But `mapShape` contains the INDICES of the spiral grid.
        // e.g. [0, 1, 3, 5 ...]

        // So:
        // Tile 0 is placed at spiral index mapShape[0]
        // Tile 1 is placed at spiral index mapShape[1]

        // We need to find which Tile corresponds to this spiral index.
        // The `index` variable here IS the spiral index.
        // We need to find its index in `mapShape` to know which input tile to grab.

        let tileIndex = -1;
        if (this.mapShape.length > 0) {
          tileIndex = this.mapShape.indexOf(index);
        } else {
          tileIndex = index;
        }

        if (tileIndex === -1) return; // Should not happen since we iterate indicesToUse

        let tileData = finalTiles[tileIndex];

        // Pad if missing
        if (!tileData) {
          tileData = { id: '0', originalString: '0', imageUrl: '', position: tileIndex, rotation: 0 };
        }

        resultTiles.push({
          ...tileData,
          q: coords[index].q,
          r: coords[index].r,
          x: 0,
          y: 0,
          isInShape: true,
          position: index, // FORCE position to be the grid index
          dataIndex: tileIndex // Index in the map string
        });
      });
    }

    return resultTiles;
  }

  getSystemData(id: string) {
    return this.systemTilesMap.get(id);
  }

  seedTiles() {
    if (confirm('Are you sure you want to re-seed the system tiles database? This may overwrite existing data.')) {
      this.dbSeeder.seedSystemTiles();
    }
  }

  async cloneMap() {
    if (!this.selectedFaction) return;

    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      alert('You must be logged in to clone maps.');
      return;
    }

    const pools = {
      tactic: 3,
      fleet: 3,
      strategy: 2
    };

    const newName = `${this.mapName} - Copy`;

    try {
      const docRef = await this.plannerService.saveMap({
        userId: user.uid,
        name: newName,
        playerCount: this.playerCount,
        mapString: this.mapString,
        mapShape: this.mapShape,
        factionId: this.selectedFaction.id,
        pools,
        timestamp: Date.now()
      });

      this.currentMapId = docRef.id;
      this.mapName = newName;
      alert(`Map cloned as "${newName}"!`);

    } catch (error) {
      console.error('Error cloning map', error);
      alert('Error cloning map');
    }
  }

  shareMap() {
    if (!this.currentMapId) return;
    const url = `${window.location.origin}/map/${this.currentMapId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Map Link copied to clipboard!');
    });
  }

}
