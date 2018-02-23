/**
 * This class Will Handle socket.io
 */
import io from 'socket-io'
import Session  from './Session.js';
import {Config} from '../config/Config.js'

class Socket {
    constructor() {
        this.loggedUser = Session.getSession('prg_lg');
        this.socket = io.connect(Config.PROGLOBE_NOTIFICATION_APP);

        // this.socket = io.connect("https://proglobe.local");//dev
    }

    connect() {
        this.socket.emit('new user', this.loggedUser.user_name);
    }

    subscribe(data) {
        //console.log("subscribe");console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('subscribe channel', _data);
    }

    sendNotification(data) {
        //console.log("sendNotification");console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('send notification', _data);
    }

    sendNotebookNotification(data) {
        console.log("sendNotebookNotification");
        console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('notebook share notification', _data);
    }

    sendFolderNotification(data) {
        console.log("sendFolderNotification");
        console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('folder share notification', _data);
    }

    sendCalendarShareNotification(data) {
        console.log("sendCalendarShareNotification");
        console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('calendar share notification', _data);
    }

    sendCalendarShareResponseNotification(data) {
        console.log("sendCalendarShareResponseNotification");
        console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('calendar share notification', _data);
    }

    sendCalendarScheduleUpdateNotification(data) {
        console.log("sendCalendarScheduleUpdateNotification");
        console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('calendar share notification', _data);
    }

    sendCalendarScheduleTimeChangedNotification(data) {
        console.log("sendCalendarScheduleTimeChangedNotification");
        console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('calendar share notification', _data);
    }

    listenToNotification(callback) {

        this.socket.on('notification', function (data) {
            console.log("notification");
            console.log(data);
            callback(data);
        });

        this.socket.on('birthday notification', function (data) {
            //console.log("birthday notification")
            //console.log(data)
            callback(data);
        })
    }

    unsubscribe(data) {
        //console.log("unsubscribe");console.log(data)
        var _data = {
            user: this.loggedUser.user_name,
            data: data
        };
        this.socket.emit('unsubscribe channel', _data);
    }

    unsubscribeUsers(data) {
        //console.log("unsubscribeUsers");console.log(data)
        var _data = {
            data: data
        };
        this.socket.emit('unsubscribe users channel', _data);
    }

    sendWorkModeStatus(data){
        this.socket.emit('workmode_notification', data);
    }

    listenToWorkModeStatus(callback){
        this.socket.on('workmode_notification', function (data) {
            callback(data);
        });
    }

    listenToWorkModeMessage(callback){
        this.socket.on('workmode_chat', function (data) {
            callback(data);
        });
    }


}

export default new Socket;
