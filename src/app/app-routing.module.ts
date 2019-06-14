import { NgModule } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RoomComponent } from './room/room.component';

const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "room/:id", component: RoomComponent}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    FormsModule
  ],
  exports: [
    RouterModule
  ],
  declarations: [
    HomeComponent,
    RoomComponent
  ]
})
export class AppRoutingModule { }
