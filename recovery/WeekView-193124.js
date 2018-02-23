/**
 * Week view of the calender
 */
import React from 'react';
import Session from '../../middleware/Session';
import moment from 'moment-timezone';
import Socket  from '../../middleware/Socket';
import WeekDayEventPopUp from './WeekDayEventPopUp';
import {convertFromRaw, convertToRaw} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';
import SharedUsers from './SharedUsers';
import GroupArray from 'group-array';

export default class WeekView extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            currentWeek:0,
            events:[],
            weekStartDate:'',
            weekEndDate:'',
            groupCall:this.props.groupCall
        }
        this.loggedUser =  Session.getSession('prg_lg');
        this.currentWeek = 0;
    }

    componentWillReceiveProps(nextProps) {
        if(typeof nextProps.myGroup != 'undefined' && nextProps.myGroup) {
            this.setState({groupCall: nextProps.groupCall});
        }
    }

    componentDidMount() {

        let weeksCount = this.getChangedWeekCount(moment());

        this.currentWeek = weeksCount;

        let week_start = moment().startOf('week').day("Sunday").format('YYYY-MM-DD');
        let week_end = moment().startOf('week').day("Sunday").weekday(7).format('YYYY-MM-DD');

        let postData = {
            start_date:week_start,
            end_date:week_end
        };

        this.setState({currentWeek:this.currentWeek, weekStartDate:postData.start_date, weekEndDate:postData.end_date});

        this.processDataCall(postData);
    }

    getChangedWeekCount(_Date) {
        let weeks = 0;
        let sunday = moment(_Date).startOf('month').day("Sunday");
        let m_date = moment(_Date);

        while(m_date >= sunday) {
            sunday = sunday.weekday(7);
            weeks++;
        }

        if(m_date == sunday) {
            return weeks;
        }
        return weeks - 1;
    }

    nextWeek() {

        let week_start = moment(this.state.weekEndDate).format('YYYY-MM-DD');
        let week_end = moment(this.state.weekEndDate).weekday(7).format('YYYY-MM-DD');

        let curWeekOfMonth = this.getChangedWeekCount(week_start);

        let postData = {
            start_date:week_start,
            end_date:week_end
        };

        this.currentWeek = curWeekOfMonth;
        this.setState({currentWeek:this.currentWeek, weekStartDate:postData.start_date, weekEndDate:postData.end_date});

        this.processDataCall(postData);

    }

    prevWeek() {

        let week_start = moment(this.state.weekStartDate).weekday(-7).format('YYYY-MM-DD');
        let week_end = moment(this.state.weekStartDate).format('YYYY-MM-DD');

        let curWeekOfMonth = this.getChangedWeekCount(week_start);

        let postData = {
            start_date:week_start,
            end_date:week_end
        };

        this.currentWeek = curWeekOfMonth;
        this.setState({currentWeek:this.currentWeek, weekStartDate:postData.start_date, weekEndDate:postData.end_date});

        this.processDataCall(postData);

    }

    processDataCall(postData) {

        if(this.state.groupCall.isGroupCall){
            postData['isGroupCall'] = this.state.groupCall.isGroupCall;
            postData['groupId'] = this.state.groupCall.groupId;
            postData['calendarOrigin'] = this.props.calendarOrigin;
        }

        $.ajax({
            url: '/calendar/events/date_range',
            method: "GET",
            dataType: "JSON",
            data: postData,
            headers: { 'prg-auth-header':this.loggedUser.token }
        }).done( function (data, text) {
            if(data.status.code == 200){
                this.setState({events: data.events});
            }
        }.bind(this));
    }

    render() {
        return (

            <section className="calender-body">
                <div className="calendar-main-row">
                    <div className="calender-week-view">
                        <div className="view-header">
                            <div className="col-sm-3 remove-padding">
                                <div className="date-wrapper">
                                    <div className="date-nav">
                                        <i className="fa fa-angle-left" aria-hidden="true" onClick={() => this.prevWeek()}></i>
                                    </div>
                                    <div className="date">
                                        <p> week {this.state.currentWeek} </p>
                                    </div>
                                    <div className="date-nav">
                                        <i className="fa fa-angle-right" aria-hidden="true" onClick={() => this.nextWeek()}></i>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-9 calender-date  remove-padding">
                                <p className="date-title">{moment(this.state.weekStartDate).format('MMM, YYYY')}</p>
                            </div>
                        </div>

                        <WeekDays
                            week_startDt={this.state.weekStartDate}
                            events={this.state.events}
                            loadData={this.processDataCall.bind(this)}
                            isGroupCall={this.state.groupCall.isGroupCall}
                            calendarOrigin={this.props.calendarOrigin}
                            groupId={(this.props.calendarOrigin == 2) ? this.props.groupId : null} // Only group calendar have group id
                            />
                    </div>
                </div>
            </section>
        );
    }
}

export class WeekDays extends React.Component {
    constructor(props) {
        super(props);
        let user = Session.getSession('prg_lg');
        this.state = {
        }
    }

    render() {

        let days = [];

        for (let i = 0; i <= 7; i++) {
            let dateObj = moment(this.props.week_startDt);
            if(i > 0) {
                dateObj = moment(this.props.week_startDt).add(i,"days");
            }
            days.push(<LoadDayList
                current_date={dateObj}
                weekly_events={this.props.events}
                loadData={this.props.loadData}
                week_startDt={this.props.week_startDt}
                key={i} isGroupCall={this.props.isGroupCall}
                calendarOrigin={this.props.calendarOrigin}
                groupId={(this.props.calendarOrigin == 2) ? this.props.groupId : null} // Only group calendar have group id
                />);

        }

        return (
            <div className="view-tile-area">
                <div className="week-tiles">
                    {days}
                </div>
            </div>
        );
    }
}

export class LoadDayList extends React.Component {

    constructor(props) {
        super(props);
        let user = Session.getSession('prg_lg');
        this.state = {
            showDailyPopUp: false,
            cardSelected: false,
            editEventId:'',
            editOn: false
        }
    }

    getEventsForTheDay() {
        let _events = [];
        let c_date = moment(this.props.current_date).format('YYYY-MM-DD');
        for(let c in this.props.weekly_events) {
            let e_date = moment(this.props.weekly_events[c].start_date_time).format('YYYY-MM-DD');
            if(c_date == e_date) {
                _events.push(this.props.weekly_events[c]);
            }
        }
        return _events;
    }

    handleClose() {
        this.setState({showDailyPopUp: false, cardSelected: false, editOn:false, editEventId:''});
    }

    handleClick() {
        this.setState({showDailyPopUp: true, cardSelected: true});
    }

    isWeekEnd() {
        let currDt = moment(this.props.current_date).format('dddd');
        return (currDt == 'Sunday' || currDt == 'Saturday') ? true : false;
    }

    onLoadEventPopup(eID){
        this.setState({editEventId:eID, editOn:true, showDailyPopUp : true});
    }

    render() {
        let currDt = moment(this.props.current_date);
        let startDateTime = moment(this.props.current_date).format('YYYY-MM-DD');
        let isCurrentToday = moment().format('YYYY-MM-DD') == startDateTime;

        return(
            <div className={isCurrentToday ? "day-tile selected" : "day-tile"}>
                <div className="day-tile-header selected">
                    <h3 className="date">{Number(currDt.format('DD'))}</h3>
                    <h3 className="day">{currDt.format('dddd')}</h3>
                    {
                        (startDateTime >= moment().format('YYYY-MM-DD'))?
                            <div className="add-events-btn" onClick={() => this.handleClick()}>
                                <i className="fa fa-plus"></i>
                            </div>
                        :
                            null
                    }
                </div>
                <div className= {this.isWeekEnd() ? "day-tile-body weekend" : "day-tile-body"}>
                    {<DailyEvents daily_events={this.getEventsForTheDay()} isGroupCall={this.props.isGroupCall} loadEventPopup={this.onLoadEventPopup.bind(this)} />}
                </div>
                {this.state.showDailyPopUp ?
                    <WeekDayEventPopUp
                        handleClose={this.handleClose.bind(this)}
                        loadData={this.props.loadData}
                        curr_date={currDt}
                        week_startDt={this.props.week_startDt}
                        isGroupCall={this.props.isGroupCall}
                        calendarOrigin={this.props.calendarOrigin}
                        groupId={(this.props.calendarOrigin == 2) ? this.props.groupId : null} // Only group calendar have group id
                        editEventId={this.state.editEventId}
                        editOn={this.state.editOn}
                    />
                    : null
                }
            </div>
        );
    }
}

export class DailyEvents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}

        this.loggedUser = Session.getSession('prg_lg');
        this.isPending = this.isPending.bind(this);
        this.trimText = this.trimText.bind(this);
        this.getSharedUsers = this.getSharedUsers.bind(this);
    }

    isPending(event) {
        if(event.user_id == this.loggedUser.id) {
            return false;
        }
        for(let _suser in event.shared_users) {
            if(event.shared_users[_suser].user_id == this.loggedUser.id && event.shared_users[_suser].shared_status == 1) {
                return true;
            }
        }
        return false;
    }


    createMarkup(htmlScript) {
        return (
        {__html: htmlScript}
        );
    }

    onEventClick(eID, userId){
        if(this.loggedUser.id == userId){
            this.props.loadEventPopup(eID);
        }
    }

    trimText(text){
            if(text.length > 15){
                text = text.slice(0,15) + "...";
            }
            return text;
    }

    getSharedUsers(shared_users){
       if(shared_users.length > 0){
           let names = shared_users.map((user, i) => {
               let name = user.name.split(' ')[0]; 
               let user_profile = '/profile/'+ user.shared_user_name;
               return <p key={i}><a href={user_profile}>{name}</a></p>
           });
           return names;
       }else{
           return <p>Just me</p>
       }
    }

    render() {
        let groupedEvents = GroupArray(this.props.daily_events, 'type');
        let _events = null,_todos = null,_tasks = null, _this = this;

        if(typeof groupedEvents['1'] !== "undefined"){
            _events = groupedEvents['1'].map(function(event, key){
                let rawDescription = event.description;
                if(rawDescription.hasOwnProperty("entityMap") == false){
                    rawDescription.entityMap = [];
                }
                let eventTime = moment(event.start_date_time).format('h:mm a'); 
                return(
                    <li className={!_this.isPending(event) ? "events clearfix" : "events pending"} key={key}>
                        {!_this.isPending(event) ?
                            <div>
                                <div onClick={(e) => _this.onEventClick(event._id, event.user_id)}
                                     style={(_this.loggedUser.id == event.user_id) ? {"cursor": "pointer"} : {"cursor": "default"}}>
                                    <p className="item">{_this.trimText(event.plain_text)}</p>
                                    <p className="item-time">{eventTime}</p>
                                </div>
                                <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                            </div>
                            :
                           <div>
                                <div onClick={(e) => _this.onEventClick(event._id, event.user_id)}
                                     style={(_this.loggedUser.id == event.user_id) ? {"cursor": "pointer"} : {"cursor": "default"}}>
                                    <p className="item">{_this.trimText(event.plain_text)}</p>
                                    <p className="item-time">{eventTime}</p>
                                </div>
                                <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                            </div>
                        }
                    </li>
                );
            });
        }
        if(typeof groupedEvents['2'] != "undefined"){
            _todos = groupedEvents['2'].map(function(event, key){

                let rawDescription = event.description;
                let startDateTime = moment(event.start_date_time).format('YYYY-MM-DD HH:mm');

                if(rawDescription.hasOwnProperty("entityMap") == false){
                    rawDescription.entityMap = [];
                }
                let eventTime = moment(event.start_date_time).format('h:mm a');

                let classes = "events clearfix";

                if(_this.isPending(event)){
                    classes = classes.concat(' pending ');
                }

                if(startDateTime < moment().format('YYYY-MM-DD HH:mm')){
                    classes = classes.concat(' disabled ');
                }

                return(
                    <li className={!_this.isPending(event) ? "events clearfix" : "events pending"} key={key}>
                        {!_this.isPending(event) ?
                            <div>
                                <div onClick={(e) => _this.onEventClick(event._id, event.user_id)} style={(_this.loggedUser.id == event.user_id) ? {"cursor": "pointer"} : {"cursor": "default"}}>
                                    <p className="item">{_this.trimText(event.plain_text)}</p>
                                    <p className="item-time">{eventTime}</p>
                                </div>
                                <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                            </div>
                            :
                            <div>
                                <div onClick={(e) => _this.onEventClick(event._id, event.user_id)} style={(_this.loggedUser.id == event.user_id) ? {"cursor": "pointer"} : {"cursor": "default"}}>
                                    <p className="item">{_this.trimText(event.plain_text)}</p>
                                    <p className="item-time">{eventTime}</p>
                                </div>
                                <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                            </div>
                        }
                    </li>
                );
            });
        }
        if(typeof groupedEvents['3'] != "undefined"){
            _tasks = groupedEvents['3'].map(function(event, key){
                let startDateTime = moment(event.start_date_time).format('YYYY-MM-DD HH:mm');
                let rawDescription = event.description;
                if(rawDescription.hasOwnProperty("entityMap") == false){
                    rawDescription.entityMap = [];
                }
                let eventTime = moment(event.start_date_time).format('h:mm a');
                let classes = "events clearfix";
                
                if(_this.isPending(event)){
                    classes = classes.concat(' pending ');
                }

                if(startDateTime < moment().format('YYYY-MM-DD HH:mm')){
                    classes = classes.concat(' disabled ');
                }

                return(
                    <li className={classes} key={key}>
                    {
                        (startDateTime < moment().format('YYYY-MM-DD HH:mm'))?
                            <div>
                                {!_this.isPending(event) ?
                                    <div>
                                        <div>
                                            <p className="item">{_this.trimText(event.plain_text)}</p>
                                            <p className="item-time">{eventTime}</p>
                                        </div>
                                        <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                                    </div>
                                    :
                                    <div>
                                        <div>
                                            <p className="item">{_this.trimText(event.plain_text)}</p>
                                            <p className="item-time">{eventTime}</p>
                                        </div>
                                        <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                                    </div>
                                }
                            </div>
                            :

                            <div onClick={(e) => _this.onEventClick(event._id, event.user_id)} style={(_this.loggedUser.id == event.user_id) ? {"cursor": "pointer"} : {"cursor": "default"}}>
                                {!_this.isPending(event) ?
                                    <div>
                                        <div>
                                            <p className="item">{_this.trimText(event.plain_text)}</p>
                                            <p className="item-time">{eventTime}</p>
                                        </div>
                                        <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                                    </div>
                                    :
                                    <div>
                                        <div>
                                            <p className="item">{_this.trimText(event.plain_text)}</p>
                                            <p className="item-time">{eventTime}</p>
                                        </div>
                                        <div className="shared-names">{_this.getSharedUsers(event.shared_users)}</div>
                                </div>
                                }
                            </div>
                    }
                    </li>
                );
            });
        }

        return(
            <div>
                <div className="content-wrapper events">
                    <div className="header-wrapper">
                        <img src="/images/calender/icon-events.png"/>
                            <p>Events</p>
                    </div>
                    <div className="body-wrapper">
                        <ul className="list-items">
                            {_events}
                        </ul>
                    </div>
                </div>
                {this.props.isGroupCall == false ?
                    <div className="content-wrapper todos">
                        <div className="header-wrapper">
                            <img src="/images/calender/icon-to-do.png"/>
                            <p>Todo	&rsquo;s</p>
                        </div>
                        <div className="body-wrapper">
                            <ul className="list-items">
                                {_todos}
                            </ul>
                        </div>
                    </div>
                    :
                    <div className="content-wrapper task">
                        <div className="header-wrapper">
                            <img src="/images/calender/icon-to-do.png"/>
                            <p>Tasks</p>
                        </div>
                        <div className="body-wrapper">
                            <ul className="list-items">
                                {_tasks}
                            </ul>
                        </div>
                    </div>
                }

            </div>
        );
    }
}
