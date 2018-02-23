import React from 'react'
import TextField from '../../components/elements/TextField'
import SelectDateDropdown from '../../components/elements/SelectDateDropdown'
import CountryList from '../../components/elements/CountryList'
import Button from '../../components/elements/Button'
import {Alert} from '../../config/Alert'
import Session  from '../../middleware/Session';
import SecretaryThumbnail from '../../components/elements/SecretaryThumbnail'
import AboutInner from '../../components/elements/AboutInner'

let errorStyles = {
    color         : "#ed0909",
    fontSize      : "0.8em",
    margin        : '0 0 15px',
    display       : "inline-block"
}

export default class AboutCollegeAndJob extends React.Component{
	constructor(props) {
        super(props);
        this.state= {
            sesData:{},
            formData:{},
            error:{},
            invalidElements :{},
            validateAlert: ""
        };
        this.elementChangeHandler = this.elementChangeHandler.bind(this);
        this.loggedUser = Session.getSession('prg_lg');

        this.validateSchema = {};
        this.isValid = true;
        this.formData = this.loggedUser;
    }

    elementChangeHandler(key,data,status){
        this.formData[key] = data;

        let er = this.traversObject();
        this.setState({error:er})

    }

    onBack(){
        this.props.onPreviousStep()
    }

    collectData(e){
    	e.preventDefault();
        let _this = this;
        let _invalid_frm = this.formData;
        for (let err_elm in this.validateSchema){
            if(!this.formData.hasOwnProperty(err_elm))
                this.formData[err_elm] = this.validateSchema[err_elm];
        }

        let er = this.traversObject();
        this.setState({error:er})

        if(Object.keys(er).length == 0){
            let _this =  this;
            $.ajax({
                url: '/college-and-job/save',
                method: "POST",
                dataType: "JSON",
                headers: { 'prg-auth-header':this.loggedUser.token },
                data:this.formData,
                success: function (data, text) {
                    if (data.status.code == 200) {
                        Session.createSession("prg_lg", data.user);
                        _this.props.onNextStep();
                    }
                },
                error: function (request, status, error) {
                    console.log(request.responseText);
                    console.log(status);
                    console.log(error);
                }
            });
    	}
    }


    traversObject(){
        let _error = {};
       return _error;
    }


	render() {
        let session = Session.getSession('prg_lg');
        let _secretary_image = session.secretary_image_url;

        let defaultVals = this.loggedUser;
		return (
			<div className="row row-clr pgs-middle-sign-wrapper pgs-middle-about-wrapper large-container">
            	<div className="container">
                    <div className="col-xs-8 pgs-middle-sign-wrapper-inner">
                    	<div className="row signupContentHolder">
                        	<SecretaryThumbnail url={_secretary_image} />
                            <div className="col-xs-12">
                                <div className="row row-clr pgs-middle-sign-wrapper-inner-cover pgs-middle-sign-wrapper-inner-cover-secretary pgs-middle-sign-wrapper-about">
                                <img src="images/sign-left-arrow-1.png" alt="" className="img-responsive pgs-sign-left-arrow"/>
                                    <AboutInner />
                                    <div className="row row-clr pgs-middle-sign-wrapper-inner-form pgs-middle-sign-wrapper-about-inner-form">
                                    	<h6>About your college / job</h6>
                                        <form method="post" onSubmit={this.collectData.bind(this)}>
                                        <div className="row pgs-middle-about-inputs">
                                        	<TextField  name="school"
                                                        size="7"
                                                        value={this.formData.school}
                                                        label="School Name"
                                                        placeholder=""
                                                        classes="pgs-sign-inputs"
                                                        onInputChange={this.elementChangeHandler}
                                                        required={false}
                                                        validate={this.state.invalidElements.school}
                                                        error_message={this.state.error.school}/>
                                        	<SelectDateDropdown title="Graduation Date"
                                                                dateFormat="mm-yyyy"
                                                                defaultOpt={defaultVals.grad_date}
                                                                optChange={this.elementChangeHandler}
                                                                dateType="grad_date"
                                                                startYear="2004" />
                                        </div>
                                        <div className="row pgs-middle-about-inputs">
                                            <TextField  name="job_title"
                                                        size="7"
                                                        value={this.formData.job_title}
                                                        label="Current Job"
                                                        placeholder=""
                                                        classes="pgs-sign-inputs"
                                                        onInputChange={this.elementChangeHandler}
                                                        required={false}
                                                        validate={this.state.invalidElements.job_title}
                                                        error_message={this.state.error.job_title}/>
                                            <TextField  name="company_name"
                                                        size="5"
                                                        value={this.formData.company_name}
                                                        label="Company"
                                                        placeholder=""
                                                        classes="pgs-sign-inputs"
                                                        onInputChange={this.elementChangeHandler}
                                                        required={false}
                                                        validate={this.state.invalidElements.company_name}
                                                        error_message={this.state.error.company_name}/>
                                        </div>
                                        {this.state.validateAlert ? <p className="form-validation-alert" style={errorStyles} >{this.state.validateAlert}</p> : null}
	                                        <div className="row">
		                                        <Button type="button" size="6" classes="pgs-sign-submit-cancel" value="Back" onButtonClick = {this.onBack.bind(this)} />
		                                        <Button type="submit" size="6" classes="pgs-sign-submit" value="next" />
		                                    </div>
                                        </form>
                                    </div>
                                </div>
                        	</div>
                        </div>
                    </div>
                </div>
            </div>
		);
	}
}
