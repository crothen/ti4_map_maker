import { Routes } from '@angular/router';
import { PlannerComponent } from './features/planner/planner';
import { AdminTilesComponent } from './features/admin-tiles/admin-tiles.component';

import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    { path: 'admin', component: AdminTilesComponent, canActivate: [adminGuard] },
    { path: 'map/:id', component: PlannerComponent },
    { path: '', component: PlannerComponent }
];
