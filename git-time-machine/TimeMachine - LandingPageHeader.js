import React from 'react';
import CommunicationsProvider from '../../middleware/CommunicationsProvider';
import Fingerprint2 from "fingerprintjs2";
import Session  from '../../middleware/Session';

export default class LandingPageHeader extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currentScrollPos: window.pageYOffset,
            lastMovement: new Date().getTime(),
            mouseOnNavbar: false,
            displayNavbar: true,
            activeLink: -1,
            currentlyMoving: false,
            loginValidationErrorMessage: '',
            rememberMe: false,
        };

        this.timeToKeepNavbar = 3000;
        this.checkMovementIntervalLength = 100;

        this.checkMovement = this.checkMovement.bind(this);
        this.updateJustMoved = this.updateJustMoved.bind(this);
        this.submitData = this.submitData.bind(this);
    }

    componentDidMount() {
        var $root = $('body');
        var topOffset = 0;

        $('body').mousemove(this.updateJustMoved);

        var self = this;
        $('a.scroll-link').click(function(event) {
            event.preventDefault();
            var itemNum = $(event.currentTarget).attr('data-listnum');
            if (itemNum != self.state.activeLink && !self.state.currentlyMoving) {
                self.setState({
                    currentlyMoving: true,
                    activeLink: itemNum
                });
                $root.animate({
                    scrollTop: $( $.attr(this, 'href') ).offset().top - topOffset
                }, 500, function() {
                    self.setState({
                        currentlyMoving: false
                    });
                });
            }
        });

        var featuresPage = $('#features');
        var whyPage = $('#whyUs');
        var aboutUsPage = $('#aboutUs');
        var privacyPage = $('#privacy');

        this.whyPagePos = whyPage.offset().top;
        this.featurePagePos = featuresPage.offset().top;
        this.aboutUsPagePos = aboutUsPage.offset().top;
        this.privacyPagePos = privacyPage.offset().top;

        this.checkMovementInterval = setInterval(this.checkMovement, this.checkMovementIntervalLength);
    }

    componentWillUnmount() {
        clearInterval(this.checkMovementInterval);
        $('body').off('mousemove');
    }

    updateJustMoved(event) {

        if (event) {
            if (event.clientY < 75) {
                this.setState({
                    mouseOnNavbar: true
                });
                return;
            }
        }

        this.setState({
            lastMovement: new Date().getTime(),
            mouseOnNavbar: false
        });
    }

    checkMovement() {
        // update current scroll position
        if (this.state.currentScrollPos !== window.pageYOffset) {
            this.updateJustMoved();
            this.setState({
                currentScrollPos: window.pageYOffset
            });
        }

        // decide to display navbar or not
        var currentTime = new Date().getTime();
        var timeSinceLastMovement = currentTime - this.state.lastMovement;
        var enoughTimePassed = timeSinceLastMovement < this.timeToKeepNavbar;

        this.setState({
            displayNavbar: enoughTimePassed || this.state.currentScrollPos === 0 || this.state.mouseOnNavbar
        });

        // update underline of links
        var activeLink = -1;
        var linkPositions = [this.featurePagePos, this.whyPagePos, this.aboutUsPagePos, this.privacyPagePos];

        for (var i = 0; i < linkPositions.length; i++) {
            if (this.state.currentScrollPos + 75 > linkPositions[i]) {
                activeLink = i;
            }
        }

        if (!this.state.currentlyMoving) {
            this.setState({
                activeLink: activeLink
            });
        }
    }

    getLinkClasses() {
        var singleClass = '';
        var classes = [];

        for (var i = 0; i < 4; i++) {
            singleClass = 'scroll-link';
            if (i == this.state.activeLink) {
                singleClass += ' selected';
            }
            classes.push(singleClass);
        }
        return classes;
    }

    submitData(){
        let _this = this;
        let username = $('#emailField').val();
        let password = $('#passwordField').val();
        let data = {
            uname: username,
            password: password,
        };

        const fingerPrint = true;
        let deviceFingerPrint = new Promise(
            (resolve, reject) => {
                if(fingerPrint) {
                    new Fingerprint2().get((result) => {
                        resolve(result);
                    });
                } else {
                    const rejectedReason = new Error('SignupHeader: unable to get device fingerprint');
                    reject(rejectedReason);
                }
            }
        ).then((deviceFingerPrint) => {
            $.ajax({
                url: '/doSignin',
                method: "POST",
                data: data,
                dataType: "JSON",

                success: function (data, text) {
                    if (data.status.code === 200) {
                        Session.createSession("prg_lg", data.user);

                        if(_this.state.rememberMe){
                            Session.createSession("prg_rm", {rememberMe:_this.state.rememberMe});
                        }

                        let tokenRequestBody = {
                            deviceId: deviceFingerPrint,
                            identity: data.user.user_name
                        };

                        // Get an access token for Twilio Chat and Twilio Video services.
                        $.ajax({
                            url: "/chat/token/generate",
                            method: "POST",
                            data: tokenRequestBody,
                            dataType: "JSON",
                            success: function (chatTokenData) {
                                Session.createSession("twilio-chat-token", chatTokenData);

                                $.ajax({
                                    url: "/video/token/generate",
                                    method: "POST",
                                    data: tokenRequestBody,
                                    dataType: "JSON",
                                    success: function (videoTokenData) {
                                        Session.createSession("twilio-video-token", videoTokenData);

                                        // Initialize the Twilio chat provider
                                        let chatProvider = CommunicationsProvider.getChatProvider();
                                        var chatClient = null;

                                        // initializeVideoClient the chat client here.
                                        // No further initialization needed for the video client now that we have an access token
                                        // NOTE: This might not be necessary, and can be replaced by the initialization in ConversationList.
                                        chatProvider.initializeChatClient()
                                            .then((chatClientResult) => {
                                                chatClient = chatClientResult;

                                                // Done signing in, take user to the home page.
                                                location.href = "/";
                                            });
                                    },
                                    error: function (request, status, error) {
                                        // TODO: Use a proper logging framework here.
                                        console.log("Error getting Twilio video token Ajax.", error);
                                    }
                                });
                            },
                            error: function (request, status, error) {
                                // TODO: Use a proper logging framework here.
                                console.log("Error getting Twilio chat Token Ajax.", error);
                            }
                        });
                    }

                },
                error: function (request, status, error) {
                    _this.setState({
                        loginValidationErrorMessage: 'Invalid username or password'
                    });
                    console.log("Error signing user in", error);
                }
            });
        }).catch((err) => {
                console.log("SignupHeader error getting deviceFingerPrint: ", err);
            });
    }



    render() {

        var navbarClasses = 'navbar navbar-default navbar-fixed-top' +
            (this.state.currentScrollPos === 0 ? '' : ' navbar-shadow') +
            (this.state.displayNavbar ? '' : ' navbar-hide');

        var linkClasses = this.getLinkClasses();

        return (
            <div className="lp-header-wrapper">
                <nav className={navbarClasses}>
                    <div className="container-fluid">
                        <div className="navbar-header">
                            <a className="navbar-brand" href="/">
                                <img src="/images/landingPage/ambi.svg"/>
                            </a>
                            <img className="beta-brand" src="/images/landingPage/beta-logo.png"/>
                        </div>

                        <ul className="nav navbar-nav">
                            <li><a className={linkClasses[0]} data-listnum={0} href="#features">features</a></li>
                            <li><a className={linkClasses[1]} data-listnum={1} href="#whyUs">why?</a></li>
                            <li><a className={linkClasses[2]} data-listnum={2} href="#aboutUs">about us</a></li>
                            <li><a className={linkClasses[3]} data-listnum={3} href="#privacy">privacy</a></li>
                        </ul>

                        <ul className="nav navbar-nav navbar-right">
                            <span className="validation-error-msg">{this.state.loginValidationErrorMessage}</span>
                            <li className="text-input">
                                <input id="emailField" type="text" placeholder="email address" onInput={() => this.setState({loginValidationErrorMessage: ''})}/>
                                <label><input id="checkboxField" type="checkbox"
                                              onChange={() => this.setState({rememberMe: $('#checkboxField').is(':checked')})}/>remember me</label>
                            </li>
                            <li className="text-input">
                                <input id="passwordField" type="password" placeholder="secret password" onInput={() => this.setState({loginValidationErrorMessage: ''})}/>
                                <a href="#">forgot it?</a>
                            </li>
                            <li className="button-input"><button type="button" className="btn" onClick={this.submitData}>enter</button></li>
                        </ul>
                    </div>
                </nav>
            </div>
        )
    }
}
