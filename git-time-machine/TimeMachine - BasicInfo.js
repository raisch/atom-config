import React from 'react';
import { Link } from 'react-router';
import Session  from '../../middleware/Session';
import { browserHistory } from 'react-router';

export default class BasicInfo extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            ready: false,
            validationErrorMsg: '',
            birthday: '',
            typedInEmail: false
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleEnter = this.handleEnter.bind(this);
        this.updateBirthday = this.updateBirthday.bind(this);
        this.getAge = this.getAge.bind(this);
        this.validateBirthday = this.validateBirthday.bind(this);
        this.EMAIL_ERROR_MSG = 'Please enter a valid .edu email address';
        this.BIRTHDAY_ERROR_MSG = 'Please enter a birthday in the format mm/dd/yyyy';
        this.EMAIL_AND_BIRTHDAY_ERROR_MSG = 'Please enter a valid .edu email address and a birthday in the format mm/dd/yyyy';
        this.EMAIL_EXISTS_MSG = 'An account with that email already exists';
    }

    componentDidMount() {
        $('.basic-info-container').hide().fadeIn(this.props.fadeTime);
    }

    handleEnter(e){
        if(e.key === 'Enter'){
            this.handleClick();
        }
    }

    handleClick() {
        let errorMsg = '';
        let _this = this;
        if (this.validateEmail() && this.validateBirthday()) {
            var emailField = $('#email-field').val();
            var zipField = $('#zip-field').val();
            var bdayField = $('#birthday-field').val();

            $.ajax({
                url: '/validate-email',
                method: 'POST',
                data: { email: emailField },
                dataType: 'JSON',

                success: function(data) {
                    if (data) {
                        _this.setState({
                            validationErrorMsg: _this.EMAIL_EXISTS_MSG
                        });
                    } else {
                        $('.fade-section').fadeOut(_this.props.fadeTime, () => {
                            let user = Session.getSession('prg_lg');
                            user.status = 4;
                            user.emailField = emailField;
                            user.zipField = zipField;
                            user.bdayField = bdayField;
                            Session.createSession('prg_lg', user);
                            browserHistory.push('/sign-up');
                        });

                    }
                },
                error: function(message) {
                    console.log(message);
                }
            });

        } else if (!this.validateEmail() && !this.validateBirthday()) {
            errorMsg = this.EMAIL_AND_BIRTHDAY_ERROR_MSG;
        } else if (!this.validateEmail()) {
            errorMsg = this.EMAIL_ERROR_MSG;
        } else if (!this.validateBirthday()) {
            errorMsg = this.BIRTHDAY_ERROR_MSG;
        }

        this.setState({
            validationErrorMsg: errorMsg
        });
    }

    validateEmail() {
        let email = $('#email-field').val();
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email) && email.endsWith('.edu');
    }

    validateBirthday() {
        let birthday = $('#birthday-field').val();
        let re = /[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9]$/;
        let parsedBirthday = Date.parse(birthday);

        if (re.test(birthday) && !isNaN(parsedBirthday)) {
            let age = this.getAge();
            let birthDate = new Date(parsedBirthday);
            let year = birthDate.getFullYear();

            return year >= 1900 && age >= 0;
        } else {
            return false;
        }
    }

    getAge() {
        let birthDate = new Date(this.state.birthday);
        let today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        let m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }


    updateBirthday(e) {
        let currentTarget = e.currentTarget;
        this.setState({
            birthday: $(currentTarget).val(),
            validationErrorMsg: ''
        });
    }

    render() {
        let user = Session.getSession('prg_lg');
        let name = user.firstName;

        return(
            <div className="basic-info-container" onKeyDown={this.handleEnter}>

                <div className="content-area">
                    <img className="ambi-eyes" src="/images/signup/ambi-eyes-no-mouth.png"/>
                    <div className="info-box">
                        <div className="fade-section">
                            <h1 className="header-text">okay, {name},<br/>let's start with the basics:</h1>
                            <p className="input-question">what is your email address?</p>
                            <input id="email-field" type="text" className="input-field detail-below" placeholder="superstar1@babson.edu"
                                onInput={() => this.setState({validationErrorMsg: '', typedInEmail: true})}/>
                            <p className="detail-text">(don't worry – we won't share it)</p>

                            { this.state.typedInEmail ?
                                <div>
                                    <p className="input-question">how about your ZIP code?</p>
                                    <input id="zip-field" type="text" className="input-field small-line" placeholder="02457"/>
                                    <p className="input-question">and what magical day were you born on?</p>
                                    <input id="birthday-field" type="text" className="input-field small-line"
                                           placeholder="10/04/1999" onInput={this.updateBirthday}/>
                                </div>
                                :
                                null
                            }

                            { this.validateBirthday() ?
                                <p className={this.state.validationErrorMsg.length > 0 ? 'birthday-text small-margin' : 'birthday-text'}>
                                    ah, {this.getAge()}... what a time to be alive!
                                    <br/>
                                    okay, a few more questions. ready?
                                </p>
                                :
                                null
                            }

                            { this.state.validationErrorMsg.length > 0 ?
                                <p className="validation-error-msg">{this.state.validationErrorMsg}</p>
                                :
                                null
                            }

                            <img className="progress-dots" src="/images/signup/dots-group-one.png"/>
                            <Link
                                  className={this.validateEmail() && this.validateBirthday() ? 'enter-button highlighted' : 'enter-button'}
                                  onClick={this.handleClick}>
                                yup!
                            </Link>
                        </div>
                    </div>

                </div>



            </div>
        );
    }
}
