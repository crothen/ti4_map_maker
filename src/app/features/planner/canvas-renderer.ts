export class HexRenderer {
    private ctx: CanvasRenderingContext2D;
    private images: Map<string, HTMLImageElement> = new Map();

    // Viewport State
    private scale = 0.8;
    private offsetX = 0;
    private offsetY = 0;

    // Interaction State
    private isMouseDown = false;
    private isDragging = false;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private dragStartX = 0;
    private dragStartY = 0;
    private hoveredHex: { q: number, r: number } | null = null;

    // Callback
    public onHexClick: ((tile: any) => void) | null = null;
    public onHexRightClick: ((tile: any, x: number, y: number) => void) | null = null;

    // Hex Config
    private hexSize = 150; // Base size
    public showTileIds = false;

    // Data
    private tiles: any[] = [];
    private units: any[] = [];
    private activeSystemId: string | null = null;

    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.setupEvents();
        this.centerView();
    }

    resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.draw();
    }

    setData(tiles: any[]) {
        this.tiles = tiles;
        this.preloadImages().then(() => this.draw());
    }

    setUnits(units: any[]) {
        this.units = units;
        const unitUrls = new Set<string>();
        units.forEach(u => {
            if (u.imageUrl) unitUrls.add(u.imageUrl);
        });

        if (unitUrls.size > 0) {
            this.preloadImages(Array.from(unitUrls)).then(() => this.draw());
        } else {
            this.draw();
        }
    }

    setActiveSystem(systemId: string | null) {
        this.activeSystemId = systemId;
        this.draw();
    }

    private centerView() {
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }

    destroy() {
        // Clean up listeners if stored references were kept, but since we used anonymous functions directly in addEventListener, 
        // we can't easily remove them unless we stored the bound functions.
        // So we need to refactor setupEvents to store the function references.
    }

    private wheelHandler: (e: WheelEvent) => void = () => { };
    private mouseDownHandler: (e: MouseEvent) => void = () => { };
    private mouseMoveHandler: (e: MouseEvent) => void = () => { };
    private mouseUpHandler: (e: MouseEvent) => void = () => { };
    private contextMenuHandler: (e: MouseEvent) => void = () => { };

    private setupEvents() {
        // Zoom
        this.wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, this.scale + delta), 3);
            this.scale = newScale;
            this.draw();
        };
        this.canvas.addEventListener('wheel', this.wheelHandler);

        // Pan
        this.mouseDownHandler = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            this.checkHover(e.clientX - rect.left, e.clientY - rect.top);

            this.isMouseDown = true;
            this.isDragging = false; // Reset drag state
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        };
        this.canvas.addEventListener('mousedown', this.mouseDownHandler);

        this.mouseMoveHandler = (e: MouseEvent) => {
            if (this.isMouseDown) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;

                // Check move threshold to consider it a drag
                if (!this.isDragging && (Math.abs(e.clientX - this.dragStartX) > 5 || Math.abs(e.clientY - this.dragStartY) > 5)) {
                    this.isDragging = true;
                }

                if (this.isDragging) {
                    this.offsetX += dx;
                    this.offsetY += dy;
                    this.draw();
                }

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }

            // Hover Check
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.checkHover(mouseX, mouseY);
        };
        window.addEventListener('mousemove', this.mouseMoveHandler);

        this.mouseUpHandler = (e: MouseEvent) => {
            if (!this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                this.checkHover(e.clientX - rect.left, e.clientY - rect.top);
            }

            if (!this.isDragging && this.hoveredHex && this.isMouseDown) {
                // Identify Hex ID
                const tile = this.tiles.find(t => t.q === this.hoveredHex!.q && t.r === this.hoveredHex!.r);
                if (tile) {
                    // Check button: 0 = Left, 2 = Right
                    if (e.button === 2 && this.onHexRightClick) {
                        this.onHexRightClick(tile, e.clientX, e.clientY);
                    } else if (e.button === 0 && this.onHexClick) {
                        this.onHexClick(tile);
                    }
                }
            }
            this.isMouseDown = false;
            this.isDragging = false;
        };
        window.addEventListener('mouseup', this.mouseUpHandler);

        this.contextMenuHandler = (e: MouseEvent) => {
            e.preventDefault(); // Block default browser menu
        };
        this.canvas.addEventListener('contextmenu', this.contextMenuHandler);
    }

    public dispose() {
        this.canvas.removeEventListener('wheel', this.wheelHandler);
        this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        window.removeEventListener('mousemove', this.mouseMoveHandler);
        window.removeEventListener('mouseup', this.mouseUpHandler);
        this.canvas.removeEventListener('contextmenu', this.contextMenuHandler);
    }

    private checkHover(mouseX: number, mouseY: number) {
        // Inverse transform to get world coordinates
        const worldX = (mouseX - this.offsetX) / this.scale;
        const worldY = (mouseY - this.offsetY) / this.scale;

        // Flat Top Hex Pixel to Axial:
        const q = (2 / 3 * worldX) / this.hexSize;
        const r = (-1 / 3 * worldX + Math.sqrt(3) / 3 * worldY) / this.hexSize;

        const hex = this.axialRound(q, r);

        if (!this.hoveredHex || this.hoveredHex.q !== hex.q || this.hoveredHex.r !== hex.r) {
            this.hoveredHex = hex;
            this.draw();
        }
    }

    private axialRound(q: number, r: number) {
        let x = q;
        let z = r;
        let y = -x - z;

        let rx = Math.round(x);
        let ry = Math.round(y);
        let rz = Math.round(z);

        const x_diff = Math.abs(rx - x);
        const y_diff = Math.abs(ry - y);
        const z_diff = Math.abs(rz - z);

        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry - rz;
        } else if (y_diff > z_diff) {
            ry = -rx - rz;
        } else {
            rz = -rx - ry;
        }

        return { q: rx, r: rz };
    }

    private async preloadImages(extraUrls: string[] = []) {
        const promises = this.tiles.map(tile => {
            if (!tile.imageUrl) return Promise.resolve();
            if (this.images.has(tile.imageUrl)) return Promise.resolve();

            return new Promise<void>((resolve) => {
                const img = new Image();
                img.src = tile.imageUrl;
                img.onload = () => {
                    this.images.set(tile.imageUrl, img);
                    resolve();
                };
                img.onerror = () => resolve();
            });
        });

        // Load extra URLs (Units)
        extraUrls.forEach(url => {
            if (this.images.has(url)) return;
            promises.push(new Promise<void>((resolve) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    this.images.set(url, img);
                    resolve();
                };
                img.onerror = () => resolve();
            }));
        });

        await Promise.all(promises);
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // Draw Tiles
        this.tiles.forEach(tile => {
            // Check for isInShape property
            // If explicit property is false, draw with low opacity or not at all?
            // User requested: "everythin except mecatol shoul not be there, only when i click shoul a hex appear."
            // This means ghost tiles should be VERY subtle or invisible until hovered?
            // Let's make them very subtle outlines.

            if (tile.isInShape === false) {
                this.ctx.globalAlpha = 0.1; // Very faint
            } else {
                this.ctx.globalAlpha = 1.0;
            }

            this.drawHexTile(tile);

            this.ctx.globalAlpha = 1.0; // Reset
        });

        // Draw Highlight
        if (this.hoveredHex) {
            this.drawHexHighlight(this.hoveredHex);
        }

        // Draw Active System
        this.drawActiveSystem();

        // Draw Units
        this.drawUnits();

        this.ctx.restore();
    }

    private drawHexTile(tile: any) {
        const { x, y } = this.axialToPixel(tile.q, tile.r);
        const size = this.hexSize;

        this.ctx.save();
        this.ctx.translate(x, y);

        // 1. Draw Hex Shape for Clipping
        this.createHexPath(0, 0, size - 2);

        // If tile is a ghost (not in shape), just fill background or stroke. 
        // DO NOT Draw Image for ghost tiles to keep it "completely empty"
        const isGhost = tile.isInShape === false;

        if (isGhost) {
            // Draw a stroke for grid reference
            this.ctx.strokeStyle = '#334155';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Interaction: Fill transparently to catch clicks?
            // Already handled by alpha in 'draw()'.
            // Just font if we want coord debug
        } else {
            this.ctx.clip(); // Clip images for real tiles

            // 2. Draw Image
            if (tile.imageUrl && this.images.has(tile.imageUrl)) {
                const img = this.images.get(tile.imageUrl)!;
                const rot = tile.rotation || 0;
                this.ctx.rotate(rot * 60 * Math.PI / 180);

                const aspect = img.width / img.height;
                const targetSize = size * 2;
                let drawW = targetSize;
                let drawH = targetSize;

                if (aspect > 1) {
                    drawH = targetSize / aspect;
                } else {
                    drawW = targetSize * aspect;
                }

                this.ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
                // Highlight Center (Mecatol) with a distinct color if image is missing/hidden (e.g. Shape Editor)
                if (tile.q === 0 && tile.r === 0) {
                    this.ctx.fillStyle = '#4f46e5'; // Indigo/Purple for Center
                } else {
                    this.ctx.fillStyle = '#334155';
                }

                this.ctx.fill();
                this.ctx.fillStyle = '#94a3b8';
                this.ctx.font = '20px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(tile.id, 0, 0);
            }

            // 3. Optional ID Overlay
            if (this.showTileIds) {
                this.ctx.font = 'bold 80px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                // Black border (Stroke)
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.lineWidth = 4;
                this.ctx.strokeText(tile.id, 0, 0);

                // White text (Fill)
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.fillText(tile.id, 0, 0);
            }
        }

        this.ctx.restore();
    }

    private drawHexHighlight(hex: { q: number, r: number }) {
        const { x, y } = this.axialToPixel(hex.q, hex.r);
        this.ctx.save();
        this.ctx.translate(x, y);
        this.createHexPath(0, 0, this.hexSize);
        this.ctx.strokeStyle = '#60a5fa'; // Blue highlight
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawActiveSystem() {
        if (!this.activeSystemId) return;
        const tile = this.tiles.find(t => t.id === this.activeSystemId);
        if (tile) {
            const { x, y } = this.axialToPixel(tile.q, tile.r);
            this.ctx.save();
            this.ctx.translate(x, y);
            this.createHexPath(0, 0, this.hexSize);
            this.ctx.strokeStyle = '#22c55e'; // Green Active Highlight
            this.ctx.lineWidth = 6;
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    private drawUnits() {
        if (!this.units || this.units.length === 0) return;

        // Group by System ID
        const unitsBySystem = new Map<string, any[]>();
        this.units.forEach(u => {
            if (!unitsBySystem.has(u.systemId)) {
                unitsBySystem.set(u.systemId, []);
            }
            unitsBySystem.get(u.systemId)!.push(u);
        });

        unitsBySystem.forEach((units, systemId) => {
            const tile = this.tiles.find(t => t.id === systemId);
            if (tile) {
                const { x, y } = this.axialToPixel(tile.q, tile.r);
                this.drawUnitsOnTile(units, x, y);
            }
        });
    }

    private drawUnitsOnTile(units: any[], tileX: number, tileY: number) {
        // Simple Grid Layout
        // Start top-left of the tile center
        const startX = -40;
        const startY = -40;
        const spacing = 25;
        const cols = 4;

        units.forEach((unit, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const dx = tileX + startX + (col * spacing);
            const dy = tileY + startY + (row * spacing);

            this.ctx.save();
            this.ctx.translate(dx, dy);

            if (unit.imageUrl && this.images.has(unit.imageUrl)) {
                const img = this.images.get(unit.imageUrl)!;
                // Draw unit icon small
                this.ctx.drawImage(img, -15, -15, 30, 30);
            } else {
                // Fallback circle
                this.ctx.fillStyle = '#ef4444';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = 'white';
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    private createHexPath(x: number, y: number, size: number) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle_deg = 0 + 60 * i;
            const angle_rad = Math.PI / 180 * angle_deg;
            const px = x + size * Math.cos(angle_rad);
            const py = y + size * Math.sin(angle_rad);
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
    }

    private axialToPixel(q: number, r: number) {
        const size = this.hexSize;
        const x = size * 3 / 2 * q;
        const y = size * Math.sqrt(3) * (r + q / 2);
        return { x, y };
    }
}

