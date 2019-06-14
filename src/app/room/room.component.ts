import { Component } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { AngularFireDatabase } from "@angular/fire/database";
import { combineLatest } from 'rxjs';
import { ConstantPool } from '@angular/compiler';

@Component({
    selector: "room",
    templateUrl: "./room.component.html"
})
export class RoomComponent{
    public roomId: string;
    public userId: string;
    private _peerConnection: RTCPeerConnection;
    private _dataChannel: RTCDataChannel;
    private _initiator: boolean;
    private _roomRef: string;

    constructor(private _activatedRoute: ActivatedRoute, public db: AngularFireDatabase){
        let urlParams = combineLatest(
            this._activatedRoute.params,
            this._activatedRoute.queryParams,
            (params, queryParams) => {return {...params, ...queryParams}}
        );

        urlParams.subscribe((data) => {
            console.log("data", data);
            this.roomId = data['id'];
            this.userId = data['uid'];
            this._roomRef = `/rooms/${this.roomId}`;
            this._listenToParticipants();
        });
    }

    private _listenToParticipants(){
        this.db.database.ref(`/rooms/${this.roomId}/ready`).on('value', (snapshot) => {
            console.log("changessssssss")
            let readyFlag = snapshot.val();
            if(!readyFlag){
                this._initiator = true;
            }
            if(readyFlag){
                this._createPeerConnection();
            }
            
        })
    }

    private _listenToEvents(){
        this.db.database.ref(`${this._roomRef}/events`).on('child_added', (snapshot) => {
            console.log("event changes", snapshot.val());
            let eventVal = snapshot.val();
            let eventType = eventVal['type'];
            let message = JSON.parse(eventVal['message']);
            if(this.userId != eventVal['userId']){
                if(eventType == "offer"){
                    this._peerConnection.setRemoteDescription(new RTCSessionDescription(message));
                    this._peerConnection.createAnswer().then((desc) => {
                        this._onAnswerCreation(desc);
                    }).catch(this._logError);
                }else if(eventType == "answer"){
                    this._peerConnection.setRemoteDescription(new RTCSessionDescription(message));
                }else if(eventType == "candidate"){
                    this._peerConnection.addIceCandidate(new RTCIceCandidate(message))
                }
            }
            
        })
        // this.db.database.ref().endAt().limitToLast(1).valueChanges(["child_added"]).subscribe((snapshot) => {
        //     console.log(snapshot.)
        // })
    }

    private _createPeerConnection(){
        console.log("create peer connection");
        this._peerConnection = new RTCPeerConnection({
            'iceServers': [{
            'urls': 'stun:stun.l.google.com:19302'
            }]
        });

        this._peerConnection.onicecandidate = (event) => {
            if(event.candidate){
                this.db.database.ref(`${this._roomRef}/events`).push({
                    userId: this.userId,
                    message: JSON.stringify(event.candidate),
                    type: "candidate"
                })
            }
        };

        this._listenToEvents();
        if(this._initiator){
            console.log("Initiator create channels");
            this._dataChannel = this._peerConnection.createDataChannel('messages');
            this._dataChannel.onopen = () => {
                if(this._dataChannel.readyState == "open"){
                    this._dataChannel.send("hi test message")
                }
            }
            this._peerConnection.createOffer().then((desc) => {
                this._onOfferCreation(desc);
            }).catch(this._logError);
        }else{
            this._peerConnection.ondatachannel = (event) => {
                this._dataChannel = event.channel;
                this._dataChannel.onmessage = (data) => {
                    console.log('message received', data);
                }
            }
        }
    }

    private _logError(err){
        console.error(err)
    }

    private _onOfferCreation(desc){
        console.log("offer creation success");
        this._peerConnection.setLocalDescription(desc);
        this.db.database.ref(`${this._roomRef}/events`).push({
            userId: this.userId,
            message: JSON.stringify(desc),
            type: "offer"
        })
    }

    private _onAnswerCreation(desc){
        this._peerConnection.setLocalDescription(desc).then(() => {
            this.db.database.ref(`${this._roomRef}/events`).push({
                userId: this.userId,
                message: JSON.stringify(desc),
                type: "answer"
            })
        }).catch(this._logError);
    }
}