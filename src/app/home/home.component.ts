import { Component } from "@angular/core";
import { AngularFireDatabase } from "@angular/fire/database";
import { Router } from '@angular/router';

@Component({
    selector: "home",
    templateUrl: "./home.component.html"
})
export class HomeComponent {
    public roomName: string = "123";

    constructor(public db: AngularFireDatabase, private _router: Router){
        this.createRoom();
    }

    public async createRoom(){
        let roomRef = `/rooms/${this.roomName}`;
        try{
          let roomCheck = await this.db.database.ref(roomRef).once("value");
          let roomRecord = roomCheck.val();
          console.log("room", roomCheck);
          if(roomRecord){
            console.log("ya")
            let users = await this.db.database.ref(`${roomRef}/users`).once('value');
            let usersCount = Object.keys(users.val()).length;
            if(usersCount < 2){
                let newUserId = this.db.database.ref(`/rooms/${this.roomName}/users`).push().key;
                this.db.database.ref(`/rooms/${this.roomName}/users/${newUserId}`).set({active: true});
                if((usersCount + 1) == 2){
                    this.db.database.ref(`/rooms/${this.roomName}/ready`).set(true);
                }
                this._navigateToRoom(this.roomName, newUserId);
            }else{
                console.log("Room is full~!!!!!!!");
            }
            console.log("users", users.val());
          }else{
            let newUserId = this.db.database.ref(`/rooms/${this.roomName}/users`).push().key;
            let updates = {};
            updates[`/rooms/${this.roomName}/ready`] = false;
            updates[`/rooms/${this.roomName}/users/${newUserId}`] = { active: true };
            // await this.db.database.ref(`/rooms/${this.roomName}/ready`).set(false);
            // await this.db.database.ref(`/rooms/${this.roomName}/users`).push({active: true}).key;
            await this.db.database.ref().update(updates);
            this._navigateToRoom(this.roomName, newUserId);
          }
        }catch(err){
          console.error("error", err);
        }
    }

    private _navigateToRoom(roomId: string, userId: string){
        this._router.navigate(['room', roomId, {uid: userId}]);
    }
}