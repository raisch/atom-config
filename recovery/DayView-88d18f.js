/**
 * Day view of the calender
 */

'use strict';

import React, { Component } from 'react';
import moment from 'moment-timezone';
import Datetime from 'react-datetime';
import Session from '../../middleware/Session';
import MiniCalender from './MiniCalender';
import DayEventsList from './DayEventsList';
import DayTodosList from './DayTodosList';
import DayTasksList from './DayTasksList';
import SharedUsers from './SharedUsers';
import TimePicker from './TimePicker';
import EditorField from './EditorField';
import Socket  from '../../middleware/Socket';

import { Modal, Button } from 'react-bootstrap';

import { Popover, OverlayTrigger } from 'react-bootstrap';
import { EditorState, RichUtils, ContentState, convertFromRaw, convertToRaw, Modifier } from 'draft-js';
import Editor, { createEditorStateWithText } from 'draft-js-plugins-editor';

import { fromJS } from 'immutable';

import forEach from 'lodash.foreach';

import 'rc-time-picker/assets/index.css';
import '../../../css/react-datetime.css';
//import TimePicker from 'rc-time-picker';

export default class DayView extends Component {

    constructor(props) {
        super(props);
        let user =  Session.getSession('prg_lg');

        this.state = {
            currentDay : this.props.dayDate,
            defaultType : 'event',
            defaultEventType : this.props.eventType,
            defaultEventTime : moment(this.props.dayDate).format('YYYY-MM-DD HH:mm'),
            defaultEventEndTime : moment(this.props.dayDate).format('YYYY-MM-DD HH:mm'),
            events : [],
            user : user,
            showTimePanel : '',
            showUserPanel : '',
            editOn : false,
            editEventId : '',
            showTimePanelWindow : false,
            showUserPanelWindow : false,
            sharedWithIds:[],
            sharedWithNames: [],
            msgOn : false,
            errorMsg : '',
            showModal : false,
            deleteEventId : '',
            isButtonDisabled : false,
            tagged: '',
            editorTimeSet:false,
            taskPriority:0
        };

        this.sharedWithIds = [];
        this.sharedWithNames = [];
        this.selectedEvent = this.props.selectedEvent;
        this.currentDay = this.state.currentDay;
        this.loggedUser = user;

        this.addEvent = this.addEvent.bind(this);
        this.updateEvent = this.updateEvent.bind(this);
        this.nextDay = this.nextDay.bind(this);
        this.changeType = this.changeType.bind(this);
        this.handleTimeChange = this.handleTimeChange.bind(this);
        this.toggleMsg = this.toggleMsg.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.openModal = this.openModal.bind(this);
        this.delete = this.delete.bind(this);
        this.doColorChange = this.doColorChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({currentDay : nextProps.dayDate});
        this.currentDay = nextProps.dayDate;
        this.loadEvents();
    }

    _onHashClick() {
        // this.SharedUserField.nameInput.focus();
        // let showUserPanel = this.state.showUserPanel;
        this.refs.timepicker_overlay.hide();
        let showUserPanelWindow = this.state.showUserPanelWindow;
        this.setState({showUserPanelWindow : (showUserPanelWindow == true ? false : true), showTimePanelWindow: false });
    }

    _onAtClick() {
        console.log("this.state.showTimePanelWindow >>", this.state.showTimePanelWindow)
        if(this.state.showTimePanelWindow == true) {
            this.refs.timepicker_overlay.hide();
            this.setState({showTimePanelWindow : false});
        } else {
            this.refs.timepicker_overlay.show();
            this.setState({showTimePanelWindow : true});
        }
    }

    componentDidMount() {
        this.loadEvents();
    }

    loadEvents() {
        var data = {
            day : this.currentDay,
            calendar_origin : this.props.calendarOrigin, // PERSONAL_CALENDAR || GROUP_CALENDAR
        };
        if(this.props.calendarOrigin == 2) {
            data['group_id'] = this.props.groupId
        }

        $.ajax({
            url : '/calendar/day/all',
            method : "POST",
            data : data,
            dataType : "JSON",
            headers : { "prg-auth-header" : this.state.user.token },
            success : function (data, text) {
                if (data.status.code == 200) {
                    this.setState({events: data.events});
                }
            }.bind(this),
            error: function (request, status, error) {
                console.log(error);
            }
        });
    }

    resetEventForm() {
        if(this.state.showUserPanelWindow) {
            this.refs.SharedUserField.sharedWithNames = [];
            this.refs.SharedUserField.sharedWithIds = [];
        }

        this.setState({
            sharedWithNames: [],
            sharedWithIds: [],
            showUserPanel:'',
            showTimePanel:'',
            showUserPanelWindow: false,
            showTimePanelWindow: false,
            defaultEventTime: moment(this.state.currentDay).format('YYYY-MM-DD HH:mm'),
            defaultEventEndTime: moment(this.state.currentDay).format('YYYY-MM-DD HH:mm'),
            editOn : false,
            isButtonDisabled: false,
            editorTimeSet:false,
            taskPriority:0
        });
        this.sharedWithIds = [];
        this.sharedWithNames = [];
        this.refs.timepicker_overlay.hide();
    }

    toggleMsg() {
        this.setState({ msgOn: !this.state.msgOn });
    }

    addEvent(event) {

        const strDate = moment(this.state.currentDay).format('YYYY-MM-DD');
        const strTime = moment(this.state.defaultEventTime).format('HH:mm');
        const endTime = moment(this.state.defaultEventEndTime).format('HH:mm');
        const dateWithTime = moment(strDate + ' ' + strTime, "YYYY-MM-DD HH:mm").format('YYYY-MM-DD HH:mm');
        const endDateWithTime = moment(strDate + ' ' + endTime, "YYYY-MM-DD HH:mm").format('YYYY-MM-DD HH:mm');

        const Editor = this.refs.EditorFieldValues.state.editorState;
        const contentState = this.refs.EditorFieldValues.state.editorState.getCurrentContent();
        const editorContentRaw = convertToRaw(contentState);
        const plainText = contentState.getPlainText();

        // front-end alidations
        if(!plainText) {
            this.setState({errorMsg : 'Please add the event description'});
            this.toggleMsg();
            setTimeout(this.toggleMsg, 3000);
            return;
        }

        if(endDateWithTime < dateWithTime) {
            this.setState({errorMsg : 'Event end time should be greater then start time'});
            this.toggleMsg();
            setTimeout(this.toggleMsg, 3000);
            return;
        }

        let _priority = this.state.taskPriority;
        if(this.state.defaultType == 'task' && this.state.taskPriority == 0  && plainText.indexOf('!') != -1) {
            if(plainText.includes("!1")) {
                _priority = 1;
            }
            if(plainText.includes("!2")) {
                _priority = 2;
            }
            if(plainText.includes("!3")) {
                _priority = 3;
            }
        }

        console.log(moment(dateWithTime).format('HH:mm'));

        // get shared users from SharedUsers field
        const sharedUsers = this.sharedWithIds;
        const postData = {
            description : editorContentRaw,
            plain_text : plainText,
            type : this.state.defaultType,
            apply_date : dateWithTime,
            end_date : endDateWithTime,
            event_time : moment(dateWithTime).format('HH:mm'),
            event_end_time : moment(endDateWithTime).format('HH:mm'),
            event_timezone : moment.tz.guess(),
            shared_users : sharedUsers,
            calendar_origin : this.props.calendarOrigin,
            group_id : (this.props.calendarOrigin == 2) ? this.props.groupId : null, // Only group calendar have group id,
            //priority : priority
            priority : this.state.defaultType == 'task' ? _priority : 0
        };

        // the button dissabled untill the response comes
        this.setState({ isButtonDisabled: true});

        $.ajax({
            url: '/calendar/event/add',
            method: "POST",
            dataType: "JSON",
            data: JSON.stringify(postData),
            headers : { "prg-auth-header" : this.state.user.token },
            contentType: "application/json; charset=utf-8",
        }).done(function (data, text) {
            if(data.status.code === 200){

                if(typeof sharedUsers != 'undefined' && sharedUsers.length > 0) {
                    let _notificationData = {
                        cal_event_id:data.events._id,
                        notification_type:"calendar_share_notification",
                        notification_sender:this.loggedUser,
                        notification_receivers:data.shared_users
                    };

                    Socket.sendCalendarShareNotification(_notificationData);
                }

                const editorState = EditorState.push(this.refs.EditorFieldValues.state.editorState, ContentState.createFromText(''));
                this.refs.EditorFieldValues.setState({editorState});
                this.resetEventForm();
                this.loadEvents();
                this.setTagged();
            }
        }.bind(this));
    }

    /*
     * update a given event or a todo.
    */
    updateEvent() {

        const strDate = moment(this.state.currentDay).format('YYYY-MM-DD');
        const strTime = moment(this.state.defaultEventTime).format('HH:mm');
        const endTime = moment(this.state.defaultEventEndTime).format('HH:mm');
        const dateWithTime = moment(strDate + ' ' + strTime, "YYYY-MM-DD HH:mm").format('YYYY-MM-DD HH:mm');
        const endDateWithTime = moment(strDate + ' ' + endTime, "YYYY-MM-DD HH:mm").format('YYYY-MM-DD HH:mm');
        const Editor = this.refs.EditorFieldValues.state.editorState;
        const contentState = this.refs.EditorFieldValues.state.editorState.getCurrentContent();
        const editorContentRaw = convertToRaw(contentState);
        const plainText = contentState.getPlainText();

        // front-end alidations
        if(!plainText) {
            this.setState({errorMsg : 'Please add the event description'});
            this.toggleMsg();
            setTimeout(this.toggleMsg, 3000);
            return;
        }

        if(endDateWithTime < dateWithTime) {
            this.setState({errorMsg : 'Event end time should be greater than start time'});
            this.toggleMsg();
            setTimeout(this.toggleMsg, 3000);
            return;
        }

        let _priority = this.state.taskPriority;
        if(this.state.defaultType === 'task' && plainText.indexOf('!') != -1) {
            if(plainText.includes("!1") && _priority != 1) {
                _priority = 1;
            }
            if(plainText.includes("!2") && _priority != 2) {
                _priority = 2;
            }
            if(plainText.includes("!3") && _priority != 3) {
                _priority = 3;
            }
        }

        // get shared users from SharedUsers field
        const sharedUsers = this.sharedWithIds;
        const postData = {
            description : editorContentRaw,
            plain_text : plainText,
            type : this.state.defaultType,
            apply_date : dateWithTime,
            event_time : moment(dateWithTime).format('HH:mm'),
            event_end_time : moment(endDateWithTime).format('HH:mm'),
            shared_users : sharedUsers,
            id : this.state.editEventId,
            priority : this.state.defaultType == 'task' ? _priority : 0
        };

        $.ajax({
            url: '/calendar/update',
            method: "POST",
            dataType: "JSON",
            data: JSON.stringify(postData),
            headers : { "prg-auth-header" : this.state.user.token },
            contentType: "application/json; charset=utf-8",
        }).done(function (data, text) {
            if(data.status.code === 200){

                const editorState = EditorState.push(this.refs.EditorFieldValues.state.editorState, ContentState.createFromText(''));
                this.refs.EditorFieldValues.setState({editorState});

                if(typeof sharedUsers != 'undefined' && sharedUsers.length > 0) {
                    let _notificationData = {
                        cal_event_id:postData.id,
                        notification_type:data.event_time.isTimeChanged == true ? "calendar_schedule_time_changed" : "calendar_schedule_updated",
                        notification_sender:this.loggedUser,
                        notification_receivers:data.shared_users
                    };

                    Socket.sendCalendarShareNotification(_notificationData);
                }

                this.resetEventForm();
                this.loadEvents();
                this.setTagged();
            }
        }.bind(this));
    }

    /*
     * delete a given event or a todo.
    */
    delete() {

        $.ajax({
            url : '/calendar/delete',
            method : "POST",
            data : { event_id : this.state.deleteEventId },
            dataType : "JSON",
            headers : { "prg-auth-header" : this.state.user.token},
            success : function (data, text) {
                if (data.status.code == 200) {
                    this.setState({deleteEventId: ''});
                    this.closeModal();
                    this.loadEvents();
                }
            }.bind(this),
            error: function (request, status, error) {
                console.log(error);
            }
        });
    }

    markTodo(eventId, status) {

        let user =  Session.getSession('prg_lg');
        var postData = {
            id : eventId,
            status : (status === 1 ? 2 : 1 )
        }

        $.ajax({
            url: '/calendar/event/completion',
            method: "POST",
            dataType: "JSON",
            data: postData,
            headers : { "prg-auth-header" : user.token },
        }).done(function (data, text) {
            if(data.status.code == 200){
                this.loadEvents();
            }
        }.bind(this));
    }

    taskCompletion(_event) {

        let user =  this.state.user;

        if(_event.user_id === user.id) {
            this.taskFullCompletion(_event, user.token);
        } else {
            this.taskSharedCompletion(_event, user.token);
        }

    }

    taskFullCompletion(_event, _token) {

        let user =  Session.getSession('prg_lg');
        var postData = {
            id : _event._id,
            status : (_event.status === 1 ? 2 : 1 )  //1 - PENDING STATUS, 2 - COMPLETED STATUS
        }

        $.ajax({
            url: '/calendar/event/completion',
            method: "POST",
            dataType: "JSON",
            data: postData,
            headers : { "prg-auth-header" : _token },
        }).done(function (data, text) {
            if(data.status.code === 200){
                this.loadEvents();
            }
        }.bind(this));
    }

    taskSharedCompletion(_event, _token) {

        let user =  Session.getSession('prg_lg');
        var postData = {
            id : _event._id,
            shared_user_id:user.user_id,
            status : 4 //TASK COMPLETED STATUS
        }
        $.ajax({
            url: '/calendar/shared/event/completion',
            method: "POST",
            dataType: "JSON",
            data: postData,
            headers : { "prg-auth-header" : _token },
        }).done(function (data, text) {
            if(data.status.code === 200){
                this.loadEvents();
            }
        }.bind(this));
    }

    clickEdit(eventId) {
        $.ajax({
            url : '/calendar/event/get',
            method : "POST",
            data : { eventId : eventId },
            dataType : "JSON",
            headers : { "prg-auth-header" : this.state.user.token },
            success : function (data, text) {
                if (data.status.code === 200) {

                    var rawContent = data.event.description;
                    if(typeof(rawContent.entityMap) === 'undefined' || rawContent.entityMap === null ) {
                        rawContent.entityMap = {};
                    }
                    forEach(rawContent.entityMap, function(value, key) {
                        value.data.mention = fromJS(value.data.mention)
                    });

                    const contentState = convertFromRaw(rawContent);
                    const toUpdateEditorState = EditorState.createWithContent(contentState);
                    const editorState = EditorState.push(this.refs.EditorFieldValues.state.editorState, contentState);

                    this.refs.EditorFieldValues.setState({ editorState });
                    this.sharedWithIds = data.event.sharedWithIds;
                    this.sharedWithNames = data.event.sharedWithNames;
                    this.setState({
                        sharedWithNames: data.event.sharedWithNames,
                        sharedWithIds: data.event.sharedWithIds,
                        editorTimeSet: true,
                        taskPriority: data.event.priority
                    });
                    var eventType = 'event';
                    switch(data.event.type) {
                        case 2:
                            eventType = 'todo';
                            break;
                        case 3:
                            eventType = 'task';
                            break;
                        default:
                            eventType = 'event';
                    }
                    this.setState({
                        editOn : true,
                        editEventId : eventId,
                        defaultType : eventType
                    });
                    this.handleTimeChange(data.event.start_date_time, data.event.event_end_time);
                }
            }.bind(this),
            error: function (request, status, error) {
                console.log(error);
            }
        });
    }

    nextDay() {
        let nextDay = moment(this.state.currentDay).add(1,'days').format('YYYY-MM-DD');
        this.currentDay = nextDay;
        this.setState({currentDay : nextDay, defaultEventTime: moment(this.currentDay).format('YYYY-MM-DD HH:mm'), defaultEventEndTime: moment(this.currentDay).format('YYYY-MM-DD HH:mm')});
        this.loadEvents();
        this.resetEditor();
    }

    previousDay() {
        let prevDay = moment(this.state.currentDay).add(-1, 'days').format('YYYY-MM-DD');
        this.currentDay = prevDay;
        this.setState({currentDay : prevDay, defaultEventTime: moment(this.currentDay).format('YYYY-MM-DD HH:mm'), defaultEventEndTime: moment(this.currentDay).format('YYYY-MM-DD HH:mm')});
        this.loadEvents();
        this.resetEditor();
    }

    changeType(eventType) {
        this.setState({defaultType : eventType, editOn : false});
    }

    calenderClick(day) {
        let clickedDay =  moment(day.date).format('YYYY-MM-DD');
        this.currentDay = clickedDay;
        this.setState({currentDay : clickedDay, defaultEventTime: moment(this.currentDay).format('YYYY-MM-DD HH:mm'), defaultEventEndTime: moment(this.currentDay).format('YYYY-MM-DD HH:mm')});
        this.loadEvents();
        this.resetEditor();
    }

    resetEditor() {
        // rest editor.
        const editorState = EditorState.push(this.refs.EditorFieldValues.state.editorState, ContentState.createFromText(''));
        this.refs.EditorFieldValues.setState({editorState});
        this.setState({editOn : false});
        this.resetEventForm();
    }

    handleTimeChange(_stime, _etime) {
        let _strDate = moment(_stime).format('YYYY-MM-DD');
        const endDateWithTime = moment(_strDate + ' ' + _etime, "YYYY-MM-DD HH:mm").format('YYYY-MM-DD HH:mm');
        this.setState({ defaultEventTime: _stime, defaultEventEndTime: endDateWithTime, showTimePanelWindow : true});
        this.refs.timepicker_overlay.show();
    }

    _onBoldClick() {
        this.refs.EditorFieldValues.onChange(RichUtils.toggleInlineStyle(this.refs.EditorFieldValues.state.editorState, 'BOLD'));
    }

    _onItalicClick() {
        this.refs.EditorFieldValues.onChange(RichUtils.toggleInlineStyle(this.refs.EditorFieldValues.state.editorState, 'ITALIC'));
    }

    _onUnderLineClick() {
        this.refs.EditorFieldValues.onChange(RichUtils.toggleInlineStyle(this.refs.EditorFieldValues.state.editorState, 'UNDERLINE'));
    }

    setSharedUsers(selected) {
        var arrEntries = selected._root.entries;
        if(this.sharedWithIds.indexOf(arrEntries[3][1]) === -1){
            this.sharedWithIds.push(arrEntries[3][1]);
            this.sharedWithNames.push(arrEntries[0][1]);
            this.setState({sharedWithIds:this.sharedWithIds, sharedWithNames:this.sharedWithNames, isAlreadySelected:false})
        } else{
            this.setState({isAlreadySelected:true});
            console.log("already selected" + this.state.isAlreadySelected)
        }
    }

    setSharedUsersFromDropDown(selected) {

        if(this.sharedWithIds.indexOf(selected.user_id)==-1){
            this.sharedWithIds.push(selected.user_id);
            this.sharedWithNames.push(selected.first_name+" "+selected.last_name);
            this.setState({sharedWithIds:this.sharedWithIds, sharedWithNames:this.sharedWithNames, isAlreadySelected:false});

        } else{
            this.setState({isAlreadySelected:true});
            console.log("already selected" + this.state.isAlreadySelected)
        }
        this.setTagged();
        return "";
    }

    removeUser(key, name){

        // removing the mention text
        const contentState = this.refs.EditorFieldValues.state.editorState.getCurrentContent();
        const rawContent = convertToRaw(contentState);
        const plainText = contentState.getPlainText();

        const startingAt = plainText.indexOf(name);
        const endingAt = startingAt+name.length;
        if(startingAt != -1){
            const newSelection = this.refs.EditorFieldValues.state.editorState.getSelection().merge({
                anchorOffset: startingAt,
                focusOffset: endingAt
            });
            const newContent = Modifier.removeRange(contentState, newSelection, 'backward');

            const editorState = EditorState.push(this.refs.EditorFieldValues.state.editorState, newContent);
            this.refs.EditorFieldValues.setState({editorState});
        }
        // removing name and the id from the list.
        this.sharedWithIds.splice(key,1);
        this.sharedWithNames.splice(key,1);
        this.setState({sharedWithIds : this.sharedWithIds, sharedWithNames : this.sharedWithNames});
        this.setTagged();
    }

    setTagged() {
        if(this.sharedWithIds.length > 0) {
            this.setState({'tagged' : 'tagged'});
        } else {
            this.setState({'tagged' : ''});
        }
    }

    removeUsersByName(arrUsers) {

        var arrKeysToBeRemoved = [];
        for (var i = 0; i < arrUsers.length; i++) {
            arrKeysToBeRemoved.push(this.sharedWithNames.indexOf(arrUsers[i]));

            // indexOf returnes the key of the matching value
            // splice removes the given key form the array.
            this.sharedWithIds.splice(this.sharedWithIds.indexOf(arrUsers[i]),1);
            this.sharedWithNames.splice(this.sharedWithNames.indexOf(arrUsers[i]),1);

            if(i === (arrUsers.length - 1)) {
                this.setState({sharedWithIds : this.sharedWithIds, sharedWithNames : this.sharedWithNames});
            }
        }

    }

    setTime(selected) {

        let arrEntries = selected._root.entries;
        let strTime = arrEntries[1][1];
        let endTime = arrEntries[2][1];
        const strDate = moment(this.state.currentDay).format('YYYY-MM-DD');
        const dateWithTime = moment(strDate + ' ' + strTime, "YYYY-MM-DD HH:mm").format('YYYY-MM-DD HH:mm');
        const endDateWithTime = moment(strDate + ' ' + endTime, "YYYY-MM-DD HH:mm").format('YYYY-MM-DD HH:mm');

        this.setState({ defaultEventTime: dateWithTime, defaultEventEndTime:endDateWithTime, editorTimeSet : true });
        //this.refs.timepicker_overlay.show();

        //setTimeout(this.doColorChange, 500);

    }

    /**
     * this part will highlight the time by RED coour
     */
    doColorChange() {
        const contentState = this.refs.EditorFieldValues.state.editorState.getCurrentContent();
        const plainText = contentState.getPlainText();

        const startingAt = plainText.indexOf("@");
        const endingAt = startingAt+20;
        if(startingAt != -1) {
            const newSelection = this.refs.EditorFieldValues.state.editorState.getSelection().merge({
                anchorOffset: startingAt,
                focusOffset: endingAt
            });

            const newContent = Modifier.applyInlineStyle(contentState, newSelection, 'RED');
            const editorState = EditorState.push(this.refs.EditorFieldValues.state.editorState, newContent);
            this.refs.EditorFieldValues.setState({editorState});
        }
    }

    closeModal() {
        this.setState({showModal: false });
    }

    openModal(eventId) {
        this.setState({showModal: true , deleteEventId: eventId});
    }

    overlayHide() {
        this.refs.timepicker_overlay.hide();
        this.setState({showTimePanelWindow : false});
    }

    setTimePickerTimeChange(_Data, _type) {

        const contentState = this.refs.EditorFieldValues.state.editorState.getCurrentContent();
        const selectionState = this.refs.EditorFieldValues.state.editorState.getSelection();
        //const rawContent = convertToRaw(contentState);
        const plainText = contentState.getPlainText();


        const startingAt = plainText.indexOf("@");
        const endingAt = startingAt+20;
        if(startingAt != -1){

            const newSelection = selectionState.merge({
                anchorOffset: startingAt,
                focusOffset: endingAt,
                //hasFocus:true
            });

            //var anchorKey = newSelection.getAnchorKey();
            //console.log("anchorKey >", anchorKey)
            //const newContent = Modifier.removeRange(contentState, newSelection, 'backward');
            //const newContent = Modifier.replaceText(contentState, newSelection, 'Forward', 'BOLD');
            //const newContent = Modifier.applyInlineStyle(contentState, newSelection, 'RED');
            //const newContent = Modifier.replaceText(contentState, newSelection, 'wow', 'BOLD', entityKey);
            //const block = contentState.getBlockForKey(newSelection.getAnchorKey());
            //const word = block.getText();
            const word1 = plainText.slice(startingAt, endingAt);
            const _dtStr = moment(_Data).format('hh:mm A');

            const str1 = _type == "start-time" ? _dtStr : word1.slice(1, 9);
            const str2 = _type == "start-time" ? word1.slice(12, word1.length) : _dtStr;

            let replacedText = "@"+ str1 + " - " + str2;

            const contentReplaced = Modifier.replaceText(
                contentState,
                newSelection,
                replacedText);

            const editorState = EditorState.push(
                this.refs.EditorFieldValues.state.editorState,
                contentReplaced,
                'replace-text'
            );

            this.refs.EditorFieldValues.setState({editorState});

            //setTimeout(this.doColorChange, 500);

        }

        if(_type == "start-time"){
            this.setState({ defaultEventTime: _Data, editorTimeSet: true});
        } else {
            this.setState({defaultEventEndTime:_Data, editorTimeSet: true});
        }

    }

    doTimePickerValidation(_val) {

        let _msg = _val == "invalid_time" ? 'End time should be greter then start time' : 'Please add a future time';

        if(_msg != '') {
            this.setState({errorMsg : _msg});
            this.toggleMsg();
            setTimeout(this.toggleMsg, 3000);
            return;
        }

    }

    setTaskPriority(priorityNumber) {
        this.setState({taskPriority:priorityNumber});
    }

    render() {

        let shared_with_list = [];
        let _class = (this.props.calendarOrigin == 2) ? "task" : "to-do";
        if(this.state.sharedWithNames.length > 0){
            shared_with_list = this.state.sharedWithNames.map((name,key)=>{
                // return <span key={key} className="user selected-users">{name}<i className="fa fa-times" aria-hidden="true" onClick={(event)=>{this.removeUser(key, name)}}></i></span>
                return <span key={key} className="person">{name}<i className="fa fa-times close-btn" aria-hidden="true" onClick={(event)=>{this.removeUser(key, name)}}></i></span>
            });
        // } else {
        //     // shared_with_list = <span className="user-label">Only me</span>
        //     shared_with_list = <span className="person">Only me</span>
        }

        /*
         this loads editor font styling popover
         */
        const typoPopover = (
            <Popover id="calendar-popover-typo">
                <div className="menu-ico">
                    <p>
                        <span className="bold" onClick={this._onBoldClick.bind(this)}>B</span>
                    </p>
                </div>
                <div className="menu-ico">
                    <p>
                        <span className="italic" onClick={this._onItalicClick.bind(this)}>I</span>
                    </p>
                </div>
                <div className="menu-ico">
                    <p>
                        <span className="underline" onClick={this._onUnderLineClick.bind(this)}>U</span>
                    </p>
                </div>
            </Popover>
        );

        /*
        this loads start time and end time popover
        */
        const timePopover = (
            <Popover id="calendar-time-popover">
                <TimePicker
                    overlayHide={this.overlayHide.bind(this)}
                    setTimePickerTimeChange={this.setTimePickerTimeChange.bind(this)}
                    doTimePickerValidation={this.doTimePickerValidation.bind(this)}
                    defaultEventTime={this.state.defaultEventTime}
                    defaultEventEndTime={this.state.defaultEventEndTime}
                />
            </Popover>
        );

        let _sTime = moment(this.state.defaultEventTime).format('hh:mm a');
        let _eTime = moment(this.state.defaultEventEndTime).format('hh:mm a');

        return (

            <section className="calender-body day-view">
                <div className="row">
                    <div className="col-sm-9">
                        <div className="calender-view">
                            <div className="view-header" style={{backgroundColor:'#000f75'}}>
                                <div className="col-sm-3">
                                    <div className="date-wrapper">
                                        <div className="date-nav" onClick={() => this.previousDay()}>
                                            <i className="fa fa-angle-left" aria-hidden="true"></i>
                                        </div>
                                        <div className="date">
                                            <p>{moment(this.state.currentDay).format('Do')}</p>
                                        </div>
                                        <div className="date-nav" onClick={() => this.nextDay()}>
                                            <i className="fa fa-angle-right" aria-hidden="true"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-9 calender-date">
                                    <p>{moment(this.state.currentDay).format('dddd')}</p>
                                </div>
                            </div>
                            <div className="row calender-input clearfix">
                                <div className="col-sm-12">
                                    <div className="input">
                                        <EditorField
                                            ref="EditorFieldValues"
                                            setTime={this.setTime.bind(this)}
                                            setSharedUsers={this.setSharedUsers.bind(this)}
                                            removeUsersByName={this.removeUsersByName.bind(this)}
                                            calendarOrigin={this.props.calendarOrigin}
                                            groupId={this.props.groupId}
                                            eventType={this.state.defaultType}
                                            setTaskPriority={this.setTaskPriority.bind(this)}
                                        />
                                    </div>

                                    <div className="tag-wrapper clearfix">
                                        <div className={this.state.tagged + " people-wrapper"}  >
                                            <p className="title" onClick={this._onHashClick.bind(this)}>People in the {this.state.defaultType} &#58;</p>
                                            <div className="people-container">
                                                {shared_with_list}
                                                {this.state.showUserPanelWindow ?
                                                    <SharedUsers
                                                        ref="SharedUserField"
                                                        setSharedUsersFromDropDown={this.setSharedUsersFromDropDown.bind(this)}
                                                        removeUser={this.removeUser}
                                                        sharedWithIds={this.state.sharedWithIds}
                                                        sharedWithNames={this.state.sharedWithNames}
                                                        calendarOrigin={this.props.calendarOrigin}
                                                        groupId={this.props.groupId}
                                                    />
                                                :
                                                    null
                                                }
                                            </div>
                                        </div>
                                        <div className="time-wrapper" >
                                            {/*<p className="title"  onClick={this._onAtClick.bind(this)}>Insert time &#58;</p>*/}
                                            {/*<Datetime*/}
                                                {/*dateFormat={false}*/}
                                                {/*onChange={this.handleTimeChange}*/}
                                                {/*value={moment(this.state.defaultEventTime).format('LT')}/>*/}
                                            <div className="main-div">
                                                <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={timePopover} ref="timepicker_overlay">
                                                    {this.state.editorTimeSet == true ?
                                                        <p className="selected-time">{_sTime} - {_eTime}</p> :
                                                        <p className="title"  onClick={this._onAtClick.bind(this)}>Insert time &#58;</p>
                                                    }
                                                </OverlayTrigger>
                                            </div>
                                            {
                                                (this.state.defaultType == "task" && this.state.taskPriority > 0 && this.state.taskPriority <= 3) ?
                                                    <div className="main-div">
                                                        <p className="title">Task Priority &#58; <span style={{"color": "#ff0000"}}>&#33;{this.state.taskPriority}</span></p>
                                                    </div> : null
                                            }

                                        </div>
                                    </div>
                                    <div className={this.state.defaultType + " calender-input-type"}>
                                        <p>{this.state.defaultType}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="row input-menu">
                                <div className="col-sm-12">
                                    <div className="items-wrapper">
                                        <ul className="input-items-wrapper">
                                            <li>
                                                <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={typoPopover}>
                                                    <span className="ico font_style">B</span>
                                                </OverlayTrigger>
                                            </li>
                                            <li  onClick={this._onHashClick.bind(this)}>
                                                <span className="ico tag">#</span>
                                            </li>

                                            <li onClick={this._onAtClick.bind(this)}>
                                                <span  >
                                                    <i className="fa fa-at  ico time" aria-hidden="true"></i>
                                                </span>
                                            </li>
                                            <li className="btn-group">
                                                <button
                                                    type="button"
                                                    className={"btn event "+(this.state.defaultType == 'event' ? "active" : null)}
                                                    onClick={() => this.changeType('event')}
                                                    >
                                                    <i className="fa fa-calendar" aria-hidden="true"></i> Event
                                                </button>
                                                {(this.props.calendarOrigin == 1) ?
                                                    <button
                                                        type="button"
                                                        className={"btn todo "+(this.state.defaultType == 'todo' ? "active" : null)}
                                                        onClick={() => this.changeType('todo')}
                                                        >
                                                        <i className="fa fa-wpforms" aria-hidden="true"></i> To-do
                                                    </button>
                                                :
                                                    <button
                                                        type="button"
                                                        className={"btn task "+(this.state.defaultType == 'task' ? "active" : null)}
                                                        onClick={() => this.changeType('task')}
                                                        >
                                                        <i className="fa fa-wpforms" aria-hidden="true"></i> Tasks
                                                    </button>
                                                }
                                            </li>
                                            <li className="post">
                                                { this.state.editOn == false ?
                                                    <button className="menu-ico-txt btn" disabled={this.state.isButtonDisabled} onClick={this.addEvent}>
                                                        <span className="fly-ico"></span> Enter
                                                    </button>
                                                    :
                                                    <div className="menu-ico-txt btn" onClick={this.updateEvent}>
                                                        <i className="fa fa-paper-plane" aria-hidden="true"></i> Update
                                                    </div>
                                                }
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {this.state.msgOn ?
                                <div className="msg-holder pull-left"><p className="text-danger">{this.state.errorMsg}</p></div>
                            : null }

                            <div className="list-area row events-list-area">
                                <div className="col-sm-12">
                                    <div className="list-area-content events-list-area-content">
                                        <div className="events-list-area-content-title">
                                            <img src="/images/calender/icon-events.png" />
                                            <span>events</span>
                                        </div>
                                        <div className="events-list-area-content-title-hr"></div>
                                        <DayEventsList
                                            events={this.state.events}
                                            clickEdit={this.clickEdit.bind(this)}
                                            selectedEvent={this.selectedEvent}
                                            delete={this.openModal.bind(this)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={"list-area row " + _class + "-list-area"}>
                                <div className="col-sm-12">
                                    <div className={_class + "-list-area-content list-area-content"}>
                                        <div className={_class + "-list-area-content-title"}>
                                            <img src="/images/calender/icon-to-do.png" />
                                            {(this.props.calendarOrigin == 2) ?
                                                <span>Tasks</span>
                                            :
                                                <span>To-Do&rsquo;s</span>
                                            }
                                        </div>
                                        <div className={_class+ "-list-area-content-title-hr"}></div>
                                        {(this.props.calendarOrigin == 2) ?
                                            <DayTasksList
                                                events={this.state.events}
                                                onClickItem={this.taskCompletion.bind(this)}
                                                clickEdit={this.clickEdit.bind(this)}
                                                selectedEvent={this.selectedEvent}
                                                delete={this.openModal.bind(this)} />
                                        :
                                            <DayTodosList
                                                events={this.state.events}
                                                onClickItem={this.markTodo.bind(this)}
                                                clickEdit={this.clickEdit.bind(this)}
                                                selectedEvent={this.selectedEvent}
                                                delete={this.openModal.bind(this)} />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-3">
                        <MiniCalender selected={moment(this.currentDay)} changeDay={this.calenderClick.bind(this)} />
                    </div>
                </div>
                <Modal show={this.state.showModal} onHide={this.closeModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Are you sure. You want to delete this event</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>This will delete all the associated data, like notifications, shared users.</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.closeModal}>Close</Button>
                        <Button bsStyle="primary" onClick={this.delete}>Delete</Button>
                    </Modal.Footer>
                </Modal>
            </section>
        );
    }
}
