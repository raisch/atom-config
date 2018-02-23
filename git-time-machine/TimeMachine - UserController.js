
/* eslint-env node, es6 */
'use strict';

// temporary!!! TODO: FIX ME!

/* eslint
    eqeqeq: "off",
    camelcase: "off",
    one-var: "off",
    no-unused-vars: "off",
    no-undef: "off"
*/

/* global Alert ApiHelper */

const path = require('path');
const mongoose = require('mongoose');

const Util = require(path.join(__dirname, '../lib/Util'));
const stringify = Util.stringify;
const log = require(path.join(__dirname, '../lib/Logger'));

const User = mongoose.model('User');

var UserController = {
    /**
     * Register new User
     * @param req
     * @param res
     */
  doSignup: function (req, res) {
    var user = {
      id: req.body._id,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.emailField,
      password: req.body.password,
      birthday: req.body.bdayField,
      gradYear: req.body.graduationYear,
      isStudent: req.body.isStudent,
      companyName: req.body.companyName,
      jobTitle: req.body.jobTitle,
      zipcode: req.body.zipField,
      status: req.body.status
    };

    User.findByEmail(user.email, function (ResultSet) {
      if (ResultSet.status === 200 && ResultSet.user === null) {
        const username = Util.getUniqueUserName(user);
        if (!username) {
          const errmsg = `failed to create unique user name: ${stringify(user)}`;
          log.error(errmsg);
          res.status(400).json({
            status: 'error',
            message: Alert.USER_CREATION_ERROR
          });
          return;
        }

        user.user_name = username;

        User.create(user, function (_ResultSet) {
          if (typeof _ResultSet.status !== 'undefined' && _ResultSet.status === 400) {
            res.status(400).json({
              status: 'error',
              message: Alert.USER_CREATION_ERROR
            });
            return;
          }

          var _notebook = {
            name: 'My Notes',
            color: '#038247',
            creator: _ResultSet.user.id
          };
          var Notebook = require('mongoose').model('Notebook');
          Notebook.createNotebook(_notebook, function (results) {
          });

          Util.addToSession(req, _ResultSet.user);
          var _out_put = {
            status: 'success',
            message: Alert.ACCOUNT_CREATION_SUCCESS
          };

          _out_put['user'] = _ResultSet.user;
                    // ADD TO CACHE
          User.addUserToCache(_ResultSet.user.id, function (csResult) {
          });
          res.status(200).json(_out_put);
          return 0;

                    // res.render('email-templates/signup', {
                    //     name: _ResultSet.user.first_name,
                    // }, function (err, emailHTML) {
                    //
                    //     var sendOptions = {
                    //         to: _ResultSet.user.email,
                    //         subject: 'Proglobe Signup',
                    //         html: emailHTML
                    //     };
                    //     EmailEngine.sendMail(sendOptions, function (err) {
                    //         if (!err) {
                    //             console.log("Email Send")
                    //         } else {
                    //             console.log("EMAIL Sending Error");
                    //             console.log(err);
                    //         }
                    //     });
                    //
                    //     res.status(200).json(_out_put);
                    //     return 0
                    // });

                    /*
                     var _cache_key = CacheEngine.prepareCacheKey("sess:"+_ResultSet.user.token);
                     /*CacheEngine.addToCache(_cache_key,_ResultSet.user,function(cacheData){

                     var _out_put= {
                     status:'success',
                     message:Alert.ACCOUNT_CREATION_SUCCESS
                     }
                     if(!cacheData){
                     _out_put['extra']=Alert.CACHE_CREATION_ERROR
                     }

                     _out_put['user']=_ResultSet.user;

                     res.render('email-templates/signup', {
                     name: _ResultSet.user.first_name,
                     }, function(err, emailHTML) {

                     var sendOptions = {
                     to: _ResultSet.user.email,
                     subject: 'Proglobe Signup',
                     html: emailHTML
                     };
                     EmailEngine.sendMail(sendOptions, function(err){
                     if(!err){
                     console.log("Email Send")
                     } else{
                     console.log("EMAIL Sending Error");
                     console.log(err);
                     }
                     });
                     res.status(200).json(_out_put);
                     return 0
                     });
                     }); */
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: Alert.ACCOUNT_EXIST
        });
      }
    });
  },

  validateEmail: function (req, res) {
    let email = req.body.email;
    let User = require('mongoose').model('User');

    User.findByEmail(email, function (resultSet) {
      if (resultSet.status === 200) {
        res.status(200).json(resultSet.user);
      } else {
        res.status(400).json({
          message: Alert.ACCOUNT_EXIST
        });
      }
    });
  },

    /**
     * Find user by id
     * @param req id of the user to find.
     * @param res user found that matches the id.
     */
  findById: function (req, res) {
    let user_id = req.query.userid;
    var response = {
      error: 'User Not found'
    };

    if (typeof user_id !== 'undefined') {
      var User = require('mongoose').model('User');
      User.findById(user_id)
              .populate('current_avatar')
              .exec(function (err, userResult) {
                if (!err) {
                  res.json(userResult);
                } else {
                  res.json(response);
                }
              });
    } else {
      res.json(response);
    }
  },

    /**
     * Api User Signin
     * @param req
     * @param res
     * @returns {number}
     */

  doMobileApiSignin: function (req, res) {
    var outPut = {};

    console.log(req.body);

    if (typeof req.body.uname !== 'undefined' && typeof req.body.password !== 'undefined') {
      var User = require('mongoose').model('User'),
        bCrypt = require('bcrypt-nodejs');

      var data = {
        user_name: req.body.uname,
        password: req.body.password
      };

      User.authenticate(data, function (resultSet) {
        if (resultSet.status != 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        } else if (resultSet.status == 200 && resultSet.error != null) {
          outPut['status'] = ApiHelper.getMessage(400, resultSet.error, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        }

        if (typeof req.body.push_token !== 'undefined' && req.body.push_token != null && req.body.push_token != ''
                    && (typeof resultSet.user.push_token !== 'undefined' && resultSet.user.push_token != req.body.push_token)) {
          var _async = require('async');

          _async.waterfall([
            function (callback) {
              var _data = {
                push_token: req.body.push_token,
                device_type: req.body.device_type
              };
              User.saveUpdates(resultSet.user.id, _data, function (result) {
                if (result.status == 200) {
                  resultSet.user.push_token = req.body.push_token;
                  resultSet.user.device_type = req.body.device_type;
                }
                callback(null);
              });
            },
            function (callback) {
              if (typeof resultSet.user.push_token !== 'undefined' && resultSet.user.push_token != null && resultSet.user.push_token != '') {
                var query = {
                  q: 'user_id:' + resultSet.user.id,
                  index: 'idx_usr'
                };

                ES.search(query, function (esResultSet) {
                  var profileData = esResultSet.result[0];
                  profileData.push_token = resultSet.user.push_token;
                  profileData.device_type = resultSet.user.device_type;

                  var payLoad = {
                    index: 'idx_usr',
                    id: profileData.user_id,
                    type: 'user',
                    data: profileData,
                    tag_fields: ['first_name', 'last_name', 'email', 'user_name', 'country']
                  };

                  ES.createIndex(payLoad, function (resultSet) {
                    callback(resultSet);
                    return 0;
                  });
                });
              } else {
                callback(null);
              }
            }
          ], function (err) {
            var _async = require('async'),
              jwt = require('jsonwebtoken'),
              date_t = new Date().getTime();

            _async.waterfall([
              function getApiVerificationCode (callBack) {
                var data = {
                  user_name: req.body.uname,
                  dt: date_t
                };
                User.getApiVerification(data, function (result) {
                  if (result.status == 200) {
                    console.log('verification >>' + result.verificationCode);

                    var _payload = {
                      user_id: resultSet.user.id,
                      push_token: resultSet.user.push_token,
                      device_type: resultSet.user.device_type,
                      pat: date_t,
                      v_token: result.verificationCode,
                      v_tag: result.verificationName
                    };

                    var token = jwt.sign(_payload, Config.SECRET);
                    resultSet.user.token = token;
                  }
                  callBack(null);
                });
              },
              function createToken (callBack) {
                console.log(resultSet.user.token);

                callBack(null);
              }

            ], function (err) {
              var outPut = {};
              if (err) {
                outPut['status'] = ApiHelper.getMessage(400, Alert.INVALID_TOKEN, Alert.ERROR);
                res.status(400).json(outPut);
                return;
              } else {
                outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
                outPut['user'] = resultSet.user;
                res.status(200).send(outPut);
                return;
              }
            });
            return;
          });
        } else {
          var _async = require('async'),
            jwt = require('jsonwebtoken'),
            date_t = new Date().getTime();

          _async.waterfall([
            function getApiVerificationCode (callBack) {
              var data = {
                user_name: req.body.uname,
                dt: date_t
              };
              User.getApiVerification(data, function (result) {
                if (result.status == 200) {
                  console.log('verification >>' + result.verificationCode);

                  var _payload = {
                    user_id: resultSet.user.id,
                    push_token: resultSet.user.push_token,
                    device_type: resultSet.user.device_type,
                    pat: date_t,
                    v_token: result.verificationCode,
                    v_tag: result.verificationName
                  };

                  var token = jwt.sign(_payload, Config.SECRET);
                  resultSet.user.token = token;
                }
                callBack(null);
              });
            },
            function createToken (callBack) {
              console.log(resultSet.user.token);

              callBack(null);
            }

          ], function (err) {
            var outPut = {};
            if (err) {
              outPut['status'] = ApiHelper.getMessage(400, Alert.INVALID_TOKEN, Alert.ERROR);
              res.status(400).json(outPut);
              return;
            } else {
              outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
              outPut['user'] = resultSet.user;
              res.status(200).send(outPut);
              return;
            }
          });

                    // outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
                    // outPut['user']=resultSet.user;
                    // res.status(200).send(outPut);
          return;
        }
      });
    } else {
      outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
      res.status(400).json(outPut);
      return 0;
    }
  },

    /**
     * Save Secretary for selected User
     * @param req
     * @param res
     */
  saveSecretary: function (req, res) {
    var User = require('mongoose').model('User'),
      Secretary = require('mongoose').model('Secretary');

    var secretaryData = {
      secretary: req.body.secretary,
      status: 2
    };

    var CurrentSession = Util.getCurrentSession(req);

    User.saveUpdates(CurrentSession.id, secretaryData, function (resultSet) {
      Secretary.getSecretaryById(secretaryData.secretary, function (resultSet) {
        CurrentSession['secretary_name'] = resultSet.full_name;
        CurrentSession['secretary_id'] = resultSet.id;
        CurrentSession['secretary_image_url'] = resultSet.image_name;
        CurrentSession['status'] = 2;

        Util.addToSession(req, CurrentSession);
        var _out_put = {
          status: 'success',
          message: Alert.ADDED_SECRETARY,
          user: CurrentSession
        };

        res.status(200).json(_out_put);
                /* CacheEngine.updateCache(_cache_key,CurrentSession,function(cacheData){
                 var _out_put= {
                 status:'success',
                 message:Alert.ADDED_SECRETARY
                 }
                 if(!cacheData){
                 _out_put['extra']=Alert.CACHE_CREATION_ERROR
                 }
                 _out_put['user']=CurrentSession;
                 console.log("saveSecretary");
                 console.log(CurrentSession);
                 res.status(200).json(_out_put);
                 }); */
      });
    });
  },

    /**
     * Save Data fo birth,
     * @param req
     * @param res
     */
  saveGeneralInfo: function (req, res) {
    var User = require('mongoose').model('User');
    var generalInfo = {
      dob: req.body.dob,
      country: req.body.country,
      zip_code: req.body.zip,
      status: 3
    };
    var CurrentSession = Util.getCurrentSession(req);
    User.saveUpdates(CurrentSession.id, generalInfo, function (resultSet) {
      if (resultSet.status != 200) {
        res.status(400).json({
          status: 'error',
          message: Alert.ERROR_ON_GENERAL_INFO_ADDING
        });
      }

      CurrentSession['status'] = 3;
      CurrentSession['country'] = req.body.country;
      CurrentSession['dob'] = req.body.dob;
      CurrentSession['zip_code'] = req.body.zip;
      Util.addToSession(req, CurrentSession);
      var _out_put = {
        status: ApiHelper.getMessage(200, Alert.SUCCESS, Alert.INFO),
        user: CurrentSession
      };
      res.status(200).json(_out_put);
            /* CacheEngine.updateCache(_cache_key,CurrentSession,function(cacheData){
             var  _out_put = {}
             _out_put = {
             status:ApiHelper.getMessage(200,Alert.SUCCESS,Alert.INFO),
             user:CurrentSession
             }
             if(!cacheData){
             _out_put['extra']=Alert.CACHE_CREATION_ERROR
             }
             console.log("saveGeneralInfo");
             console.log(CurrentSession);
             res.status(200).json(_out_put);
             }); */

      return 0;
    });
  },
    /**
     * Add College and Job information in signup process
     * @param req
     * @param res
     */
  addCollegeAndJob: function (req, res) {
    var CurrentSession = Util.getCurrentSession(req);
    CurrentSession['status'] = 4;
    CurrentSession['school'] = (req.body.school) ? req.body.school : null;
    CurrentSession['grad_date'] = (req.body.grad_date) ? req.body.grad_date : null;
    CurrentSession['job_title'] = (req.body.job_title) ? req.body.job_title : null;
    CurrentSession['company_name'] = (req.body.company_name) ? req.body.company_name : null;

    Util.addToSession(req, CurrentSession);
    var User = require('mongoose').model('User'),
      _collegeAndJob = {
        school: req.body.school,
        grad_date: req.body.grad_date,
        job_title: req.body.job_title,
        company_name: req.body.company_name,
        status: 4
      };

    User.addCollegeAndJob(CurrentSession.id, _collegeAndJob, function (resultSet) {
      var outPut = {};

      if (resultSet.status != 200) {
        outPut['status'] = ApiHelper.getMessage(400, Alert.FAILED_TO_ADD_JOB_AND_COLLEGE, Alert.ERROR);
        res.status(200).json(outPut);
        return 0;
      }

      outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
      outPut['user'] = CurrentSession;

      res.status(200).json(outPut);
    });
        /* CacheEngine.updateCache(_cache_key,CurrentSession,function(cacheData){

         var User = require('mongoose').model('User'),
         _collegeAndJob={
         school:req.body.school,
         grad_date:req.body.grad_date,
         job_title:req.body.job_title,
         company_name:req.body.company_name,
         status:4
         };

         User.addCollegeAndJob(CurrentSession.id,_collegeAndJob,function(resultSet){
         var outPut ={};

         if(resultSet.status != 200){
         outPut['status'] = ApiHelper.getMessage(400, Alert.FAILED_TO_ADD_JOB_AND_COLLEGE, Alert.ERROR);
         res.status(200).json(outPut);
         return 0;
         }
         if(!cacheData){
         outPut['extra']=Alert.CACHE_CREATION_ERROR
         }
         outPut['status']    = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
         outPut['user']      = CurrentSession;

         console.log("addCollegeAndJob");
         console.log(CurrentSession);
         res.status(200).json(outPut);

         });

         }); */
  },

    /**
     * Load Connections
     * @param req
     * @param res
     */
  getConnections: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var criteria = {
      pg: 0,
      country: CurrentSession.country,
      user_id: CurrentSession.id,
      status: [ConnectionStatus.REQUEST_ACCEPTED, ConnectionStatus.REQUEST_SENT]
    };

    User.getConnectionUsers(criteria, function (resultSet) {
      var outPut = {};

      if (resultSet.status !== 400) {
        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['header'] = {
          total_result: resultSet.total_result,
          result_per_page: Config.CONNECTION_RESULT_PER_PAGE,
          total_pages: Math.ceil(resultSet.total_result / Config.CONNECTION_RESULT_PER_PAGE)
        };

        outPut['connections'] = resultSet.friends;

        res.status(200).send(outPut);
        return 0;
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.CONNECTION_USERS_EMPTY, Alert.ERROR);

        res.status(400).send(outPut);
        return 0;
      }
    });
  },

  getConnectionsSorted: function (req, res) {
    var User = require('mongoose').model('User');
    let currentUser = Util.getCurrentSession(req);

    User.find({ grad_year: { $in: [2017, 2018, 2019, 2020] } })
            .populate('current_avatar')
            .select('first_name last_name grad_year current_avatar')
            .exec(function (err, users) {
              if (!err) {
                var userMap = {};
                users.forEach(function (user) {
                  if (user.id !== currentUser.id) {
                    userMap[user._id] = user;
                  }
                });
                res.status(200).send(userMap);
              } else {
                res.status(400).send('ERROR');
              }
            });
  },

    /**
     * Connect Peoples
     * Even though connected_users object empty nothing but user hit skip button, Current session should be set to 4.
     * @param req
     * @param res
     */
  connect: function (req, res) {
    var CurrentSession = Util.getCurrentSession(req);
    CurrentSession['status'] = 5;
    Util.addToSession(req, CurrentSession);
    var outPut = {};
    outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
    outPut['user'] = CurrentSession;

    var req_connected_users = JSON.parse(req.body.connected_users);
    var req_unconnected_users = JSON.parse(req.body.unconnected_users);

    var Connection = require('mongoose').model('Connection'),
      User = require('mongoose').model('User');

    User.saveUpdates(CurrentSession.id, {status: 5}, function (updateDataSet) {
      Connection.sendConnectionRequest(CurrentSession.id, req_connected_users, req_unconnected_users, function (resultSet) {
        if (resultSet.status !== 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.CONNECT_ERROR, Alert.ERROR);
          res.status(400).send(outPut);
          return 0;
        }
        res.status(200).json(outPut);
        return 0;
      });
    });
  },

    /**
     * Add new category to the user in Sign up process
     * @param req
     * @param res
     */
  addNewsCategory: function (req, res) {
    var CurrentSession = Util.getCurrentSession(req);
    CurrentSession['status'] = 6;
    Util.addToSession(req, CurrentSession);

    var outPut = {};
    outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
    outPut['user'] = CurrentSession;

    var req_news_categories = JSON.parse(req.body.news_categories);
    var un_selected_categories = JSON.parse(req.body.un_selected);

    var FavouriteNewsCategory = require('mongoose').model('FavouriteNewsCategory'),
      User = require('mongoose').model('User');

    User.saveUpdates(CurrentSession.id, {status: 6}, function (updateDataSet) {
      FavouriteNewsCategory.addUserNewsCategory(CurrentSession.id, req_news_categories, un_selected_categories, function (resultSet) {
        if (resultSet.status !== 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
          res.status(400).send(outPut);
          return 0;
        }

        res.status(200).json(outPut);
        return 0;
      });
    });
  },

    /**
     * Update General Account Info for a user
     * @param req
     * @param res
     */
  updateAccountInfo: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    var _accountInfo = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      user_name: req.body.user_name
    };

    var outPut = {};
    function saveAccountUpdates (User, CurrentSession, userId, accountInfo, req, res, outPut) {
      User.saveUpdates(_userId, _accountInfo, function (resultSet) {
        if (resultSet.status == 200) {
          CurrentSession['first_name'] = req.body.first_name;
          CurrentSession['last_name'] = req.body.last_name;
          CurrentSession['user_name'] = req.body.user_name;
          Util.addToSession(req, CurrentSession);

          outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
          outPut['user'] = CurrentSession;
          res.status(200).send(outPut);
        } else {
          outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
          res.status(400).send(outPut);
        }
      });
    }

    if (req.body.curPW) {
      var data = {
        email: CurrentSession.email,
        password: req.body.curPW
      };

      User.validatePassword(data, function (resultSet) {
        if (resultSet.status == 200 && resultSet.error == null) {
          console.log('auth');
          User.updatePassword(_userId, req.body.newPW, function (resultSet) {
            if (resultSet.status == 200) {
              saveAccountUpdates(User, CurrentSession, _userId, _accountInfo, req, res, outPut);
            } else {
              outPut['status'] = ApiHelper.getMessage(400, Alert.RESET_PASSWORD_FAIL, Alert.ERROR);
              res.status(400).json(outPut);
            }
          });
        } else if (resultSet.status != 200) {
          outPut['status'] = ApiHelper.getMessage(400, resultSet.error, Alert.ERROR);
          res.status(400).json(outPut);
        }
      });
    } else {
      saveAccountUpdates(User, CurrentSession, _userId, _accountInfo, req, res, outPut);
    }
  },

    /**
     * Update Background Image for a user
     * @param req
     * @param res
     */
  updateBackgroundImage: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    var _settings = {
      'settings.background': req.body.background
    };

    var outPut = {};

    User.saveUpdates(_userId, _settings, function (resultSet) {
      if (resultSet.status == 200) {
        CurrentSession['settings']['background'] = req.body.background;

        Util.addToSession(req, CurrentSession);

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = CurrentSession;
        res.status(200).send(outPut);
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).send(outPut);
      }
    });
  },

     /**
     * Update Settings for a user
     * @param req
     * @param res
     */
  updateSettings: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    var _settings = {
      'settings.clock_format': req.body.clock_format,
      'settings.weather_format': req.body.weather_format,
      'settings.sounds': req.body.sounds
    };

    var outPut = {};

    User.saveUpdates(_userId, _settings, function (resultSet) {
      if (resultSet.status == 200) {
        CurrentSession['settings']['clock_format'] = req.body.clock_format;
        CurrentSession['settings']['weather_format'] = req.body.weather_format;
        CurrentSession['settings']['sounds'] = req.body.sounds;

        Util.addToSession(req, CurrentSession);

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = CurrentSession;
        res.status(200).send(outPut);
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).send(outPut);
      }
    });
  },

    /**
     * Update Widgets for a user
     * @param req
     * @param res
     */
  updateWidgets: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    var _settings = {
      'settings.widgets.date_and_time': req.body.date_and_time,
      'settings.widgets.daily_quotes': req.body.daily_quotes,
      'settings.widgets.weather': req.body.weather,
      'settings.widgets.daily_interest': req.body.daily_interest,
      'settings.widgets.countdown': req.body.countdown,
      'settings.widgets.feedback': req.body.feedback
    };

    var outPut = {};
    User.saveUpdates(_userId, _settings, function (resultSet) {
      if (resultSet.status == 200) {
        var widgets = resultSet.user.settings.widgets;
        CurrentSession['settings']['widgets']['date_and_time'] = widgets.date_and_time;
        CurrentSession['settings']['widgets']['daily_quotes'] = widgets.daily_quotes;
        CurrentSession['settings']['widgets']['weather'] = widgets.weather;
        CurrentSession['settings']['widgets']['daily_interest'] = widgets.daily_interest;
        CurrentSession['settings']['widgets']['countdown'] = widgets.countdown;
        CurrentSession['settings']['widgets']['feedback'] = widgets.feedback;

        Util.addToSession(req, CurrentSession);

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = CurrentSession;
        res.status(200).send(outPut);
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).send(outPut);
      }
    });
  },

  updateCountdownWidget: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    var _settings = {
      'settings.widgets.countdown_event': req.body.countdown_event,
      'settings.widgets.countdown_date': req.body.countdown_date
    };

    var outPut = {};
    User.saveUpdates(_userId, _settings, function (resultSet) {
      if (resultSet.status == 200) {
        var widgets = resultSet.user.settings.widgets;
        CurrentSession['settings']['widgets']['countdown_event'] = widgets.countdown_event;
        CurrentSession['settings']['widgets']['countdown_date'] = widgets.countdown_date;

        Util.addToSession(req, CurrentSession);

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = CurrentSession;
        res.status(200).send(outPut);
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).send(outPut);
      }
    });
  },

  updateDailyInterest: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    var _settings = {
      'settings.widgets.daily_interest_text': req.body.daily_interest_text
    };

    var outPut = {};
    User.saveUpdates(_userId, _settings, function (resultSet) {
      if (resultSet.status == 200) {
        var widgets = resultSet.user.settings.widgets;
        CurrentSession['settings']['widgets']['daily_interest_text'] = widgets.daily_interest_text;

        Util.addToSession(req, CurrentSession);

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = CurrentSession;
        res.status(200).send(outPut);
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).send(outPut);
      }
    });
  },

    /**
     * Upload Profile Image in Sign up process
     * @param req
     * @param res
     * @returns {number}
     */
  uploadProfileImage: function (req, res) {
    var CurrentSession = Util.getCurrentSession(req);

    var User = require('mongoose').model('User');
    var data = {
      content_title: 'Profile Image',
      file_name: req.body.profileImg,
      is_default: 1,
      entity_id: CurrentSession.id,
      entity_tag: UploadMeta.PROFILE_IMAGE
    };

    User.saveUpdates(CurrentSession.id, {status: 7}, function (updateDataSet) {
            // IF PROFILE IMAGE NOT FOUND
      if (typeof req.body.profileImg === 'undefined' || req.body.profileImg == '') {
        CurrentSession['profile_image'] = Config.DEFAULT_PROFILE_IMAGE;
        Util.addToSession(req, CurrentSession);
        var outPut = {
          status: ApiHelper.getMessage(200, Alert.ADDED_PROFILE_IMAGE, Alert.SUCCESS)
        };

        outPut['user'] = CurrentSession;
                // ADD TO CACHE
        User.addUserToCache(CurrentSession.id, function (csResult) {
        });
        res.status(200).json(outPut);
      } else {
        ContentUploader.uploadFile(data, function (payLoad) {
          if (payLoad.status != 400) {
            let Photo = require('mongoose').model('Photo');
            let newPhoto = new Photo({
              url: payLoad.http_url,
              timestamp: Date.now(),
              file_name: payLoad.file_name,
              file_type: payLoad.file_type
            });

            newPhoto.save(function (err) {
              if (err) {
                let outPut = {
                  status: ApiHelper.getMessage(400, Alert.ERROR_UPLOADING_IMAGE, Alert.ERROR)
                };
                res.status(400).json(outPut);
              } else {
                let photo_id = newPhoto._id;
                let user_id = require('mongoose').Types.ObjectId(CurrentSession.id);
                User.update({_id: user_id}, {current_avatar: photo_id}).exec();

                CurrentSession['profile_image'] = payLoad.http_url;
                CurrentSession['current_avatar'] = photo_id;
                Util.addToSession(req, CurrentSession);
                var outPut = {
                  status: ApiHelper.getMessage(200, Alert.ADDED_PROFILE_IMAGE, Alert.SUCCESS)
                };

                outPut['user'] = CurrentSession;
                outPut['profile_image'] = payLoad;

                                // ADD TO CACHE
                User.addUserToCache(CurrentSession.id, function (csResult) {
                });
                res.status(200).json(outPut);
              }
            });
          } else {
            var outPut = {
              status: ApiHelper.getMessage(400, Alert.ERROR_UPLOADING_IMAGE, Alert.ERROR)
            };
            res.status(400).send(outPut);
          }
        });
      }
    });
  },

    /**
     * Upload cover image
     * @param req
     * @param res
     */
  uploadCoverImage: function (req, res) {
    var CurrentSession = Util.getCurrentSession(req);
    if (typeof req.body.cover_img === 'undefined' || typeof req.body.cover_img === '') {
      var outPut = {
        status: ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR)
      };
      res.status(400).send(outPut);
      return 0;
    }

    var User = require('mongoose').model('User');
    var data = {
      content_title: 'Cover Image',
      file_name: req.body.cover_img,
      is_default: 1,
      entity_id: CurrentSession.id,
      entity_tag: UploadMeta.COVER_IMAGE
    };
    ContentUploader.uploadFile(data, function (payLoad) {
      if (payLoad.status != 400) {
        var _cache_key = CacheEngine.prepareCacheKey(CurrentSession.token);
        CurrentSession['cover_image'] = payLoad.http_url;

        Util.addToSession(req, CurrentSession);
        var outPut = {
          status: ApiHelper.getMessage(200, Alert.ADDED_PROFILE_IMAGE, Alert.SUCCESS)
        };
        outPut['user'] = CurrentSession;
        outPut['cover_image'] = payLoad;

                // ADD TO CACHE
        User.addUserToCache(CurrentSession.id, function (csResult) {
        });

        res.status(200).json(outPut);
        return 0;
                /* CacheEngine.updateCache(_cache_key, CurrentSession, function (cacheData) {
                 var outPut = {
                 status: ApiHelper.getMessage(200, Alert.ADDED_PROFILE_IMAGE, Alert.SUCCESS)
                 }
                 if (!cacheData) {
                 outPut['extra'] = Alert.CACHE_CREATION_ERROR
                 }
                 outPut['user'] = CurrentSession;

                 //ADD TO CACHE
                 User.addUserToCache(CurrentSession.id,function(csResult){});

                 res.status(200).json(outPut);
                 }); */
      } else {
        var outPut = {
          status: ApiHelper.getMessage(400, Alert.ERROR_UPLOADING_IMAGE, Alert.ERROR)
        };
        res.status(400).send(outPut);
      }
    });
  },

    /**
     * Add educational details to a user
     * @param req
     * @param res
     */
  addEducationDetail: function (req, res) {
    var User = require('mongoose').model('User');

        // var educationDetails = req.body.educationDetails;

        // var _educationDetails = {
        //    school:"Westminster",
        //    date_attended_from:"2012",
        //    date_attended_to:"2015",
        //    degree:"MSc in Advanced Software Engineering",
        //    grade:"Merit",
        //    activities_societies:"Debate Team",
        //    description:"It was wonderful"
        // };

    var _educationDetails = {
      school: 'Middlesex',
      date_attended_from: '2007',
      date_attended_to: '2010',
      degree: 'BSc in IT',
      grade: 'Merit',
      activities_societies: 'Debate Team',
      description: 'It was wonderful'
    };

        // var _userId = CurrentSession.id;

    var _userId = '56c2d6038c920a41750ac4db';

    User.addEducationDetail(_userId, _educationDetails, function (resultSet) {
      res.status(200).json(resultSet);
    });
  },

    /**
     * Retrieve particular educational detail of a user
     * @param req
     * @param res
     */
  retrieveEducationDetail: function (req, res) {
    var User = require('mongoose').model('User');

    if (typeof req.params['uname'] === 'undefined') {
      var outPut = {};
      outPut['status'] = ApiHelper.getMessage(400, Alert.CANNOT_FIND_PROFILE, Alert.ERROR);
      res.status(400).send(outPut);
    }

    var criteria = {user_name: req.params['uname']},
      showOptions = {
        w_exp: true,
        edu: true,
        skill: false
      };
    User.getUser(criteria, showOptions, function (resultSet) {
      var outPut = {};
      if (resultSet.status != 200) {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).json(outPut);
        return 0;
      }

      outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
      outPut['user'] = resultSet.user;
      res.status(200).send(outPut);
    });
  },

    /**
     * Update particular educational detail of a user
     * @param req
     * @param res
     */
  updateEducationDetail: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
        // var _userId = CurrentSession.id;

    var _userId = CurrentSession.id;

    var _educationDetails = {
      school: req.body.school,
      date_attended_from: req.body.date_attended_from,
      date_attended_to: req.body.date_attended_to,
      degree: req.body.degree,
      grade: req.body.grade,
      activities_societies: req.body.activities_societies,
      description: req.body.description
    };
    if (req.body.edu_id) {
      _educationDetails['_id'] = req.body.edu_id;
      User.updateEducationDetail(_userId, _educationDetails, function (resultSet) {
        var outPut = {};
        if (resultSet.status != 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.DATA_UPDATE_ERROR, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        }

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = resultSet.user;
        res.status(200).send(outPut);
      });
    } else {
      User.addEducationDetail(_userId, _educationDetails, function (resultSet) {
        var outPut = {};
        if (resultSet.status != 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.DATA_INSERT_ERROR, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        }

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = resultSet.user;
        res.status(200).send(outPut);
      });
    }
  },

    /**
     * delete particular educational detail of a user
     * @param req
     * @param res
     */
  deleteEducationDetail: function (req, res) {
    var User = require('mongoose').model('User');

        // var _userId = CurrentSession.id;

    var _userId = '56c2d6038c920a41750ac4db';

    var _education_id = '56c321a42ab09c7b09034e85';

    User.deleteEducationDetail(_userId, _education_id, function (resultSet) {
      res.status(200).json(resultSet);
    });
  },

    /**
     * add / delete skills of a user
     * @param req
     * @param res
     * @param next
     */
  saveSkillInfo: function (req, res) {
    var async = require('async'),
      User = require('mongoose').model('User');

        // Need to COMMENT these

    var skill_sets = JSON.parse(req.body.skill_set);

        // GET EXPERIENCED SKILLS
    var existing_skills = [], deleted_skills = [];

    for (var a = 0; a < skill_sets.experienced.add.length; a++) {
      existing_skills.push({
        skill_id: skill_sets.experienced.add[a],
        is_day_to_day_comfort: 0

      });
    }

    for (var a = 0; a < skill_sets.day_to_day_comforts.add.length; a++) {
      existing_skills.push({
        skill_id: skill_sets.day_to_day_comforts.add[a],
        is_day_to_day_comfort: 1
      });
    }
    for (var a = 0; a < skill_sets.experienced.remove.length; a++) {
      deleted_skills.push(Util.toObjectId(skill_sets.experienced.remove[a]));
    }
    for (var a = 0; a < skill_sets.day_to_day_comforts.remove.length; a++) {
      deleted_skills.push(Util.toObjectId(skill_sets.day_to_day_comforts.remove[a]));
    }

    var userId = Util.getCurrentSession(req).id;

        // TODO : If user added new skills that are not in Skill Collection

    async.parallel([

      function (callback) {
        if (existing_skills.length > 0) {
          User.addSkills(userId, existing_skills, function (resultSet) {
            callback(null);
          });
        } else {
          callback(null);
        }
      },
      function (callback) {
        if (deleted_skills.length > 0) {
          User.deleteSkills(userId, deleted_skills, function (resultSet) {
            callback(null);
          });
        } else {
          callback(null);
        }
      }

    ], function (err) {
      if (!err) {
        res.status(200).send(ApiHelper.getMessage(200, Alert.SKILL_SAVED, Alert.SUCCESS));
      } else {
        res.status(400).send(ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR));
      }
    });
  },

    /**
     * Get Skills
     * @param req
     * @param ress
     */
  getSkills: function (req, res) {
    var User = require('mongoose').model('User');
    var criteria = {user_name: req.params['uname']},
      showOptions = {
        skill: true
      };

    User.getUser(criteria, showOptions, function (resultSet) {
      var outPut = {};
      if (resultSet.status != 200) {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).json(outPut);
        return 0;
      }

      User.formatSkills(resultSet.user, function (skillsData) {
        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = resultSet.user;
        outPut['user']['skills'] = skillsData;

        res.status(200).send(outPut);
      });
    });
  },

  forgotPassword: function (req, res) {
    var async = require('async'),
      crypto = require('crypto'),
      User = require('mongoose').model('User');

    var outPut = {};

    async.waterfall([
            // Generate random token
      function (done) {
        crypto.randomBytes(20, function (err, buffer) {
          var token = buffer.toString('hex');
          done(null, token);
        });
      },
            // Lookup user by username
      function (token, done) {
        if (req.body.email) {
          var email = req.body.email;

          User.findByEmail(email, function (ResultSet) {
            if (ResultSet.status == 200 && ResultSet.user != null) {
              var generalInfo = {
                resetPasswordToken: token,
                resetPasswordExpires: Date.now() + 3600000  // 1 hour from requested time
              };
              User.saveUpdates(ResultSet.user._id, generalInfo, function (resultSet) {
                done(null, token, ResultSet.user);
              });
            } else {
              outPut['status'] = ApiHelper.getMessage(400, Alert.NO_ACCOUNT_FOUND, Alert.ERROR);
              res.status(400).json(outPut);
            }
          });
        } else {
          outPut['status'] = ApiHelper.getMessage(400, Alert.EMAIL_EMPTY, Alert.ERROR);
          res.status(400).json(outPut);
        }
      },
      function (token, user, done) {
        res.render('email-templates/resetPassword', {
          name: user.first_name,
          url: 'http://' + req.headers.host + '/forgot-password/reset/' + token
        }, function (err, emailHTML) {
          done(null, emailHTML, user);
        });
      },
            // If valid email, send reset email using service
      function (emailHTML, user) {
        var sendOptions = {
          to: user.email,
          subject: 'Password Reset',
          html: emailHTML
        };
        EmailEngine.sendMail(sendOptions, function (err) {
          if (!err) {
            outPut['status'] = ApiHelper.getMessage(200, Alert.FORGOT_PASSWORD_EMAIL_SENT, Alert.SUCCESS);
            res.status(200).json(outPut);
          } else {
            outPut['status'] = ApiHelper.getMessage(400, Alert.FAILED_TO_SEND_EMAIL, Alert.ERROR);
            res.status(400).json(outPut);
          }
        });
      }
    ], function (err) {
      if (err) return next(err);
    });
  },

    /**
     * to test valid reset password request
     * @param req
     * @param res
     */
  validateToken: function (req, res) {
    var User = require('mongoose').model('User');

    User.findByCriteria({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    }, function (ResultSet) {
      if (ResultSet.status == 200 && ResultSet.user != null) {
        res.redirect('/change-password/' + req.params.token);
      } else {
        res.redirect('/change-password-invalid');
      }
    });
  },

  resetPassword: function (req, res) {
    var User = require('mongoose').model('User');

    var password = req.body.password;
    User.findByCriteria({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    }, function (ResultSet) {
      var outPut = {};

      if (ResultSet.status == 200 && ResultSet.user != null) {
        User.updatePassword(ResultSet.user._id, password, function (resultSet) {
          if (resultSet.status == 200) {
            outPut['status'] = ApiHelper.getMessage(200, Alert.RESET_PASSWORD_SUCCESS, Alert.SUCCESS);
            res.status(200).json(outPut);
          } else {
            outPut['status'] = ApiHelper.getMessage(400, Alert.RESET_PASSWORD_FAIL, Alert.ERROR);
            res.status(400).json(outPut);
          }
        });
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.INVALID_TOKEN, Alert.ERROR);
        res.status(400).json(outPut);
      }
    });
  },
    /**
     * Get Connection count
     * @param req
     * @param res
     */
  connectionCount: function (req, res) {
    var Connection = require('mongoose').model('Connection');
    var CurrentSession = Util.getCurrentSession(req);

    Connection.getConnectionCount(CurrentSession.id, function (connectionCount) {
      console.log(connectionCount);
      var outPut = {};
      outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
      outPut['connection_count'] = connectionCount;
      res.status(200).send(outPut);
      return 0;
    });
  },
    /**
     * Get Profile
     * @param req
     * @param res
     */
  getProfile: function (req, res) {
    var _async = require('async'),
      Connection = require('mongoose').model('Connection'),
      User = require('mongoose').model('User'),
      Upload = require('mongoose').model('Upload'),
      CurrentSession = Util.getCurrentSession(req);

    if (typeof req.params['uname'] === 'undefined') {
      var outPut = {};
      outPut['status'] = ApiHelper.getMessage(400, Alert.CANNOT_FIND_PROFILE, Alert.ERROR);
      res.status(400).send(outPut);
    }

    var _uname = req.params['uname'];
    _async.waterfall([
      function getUserById (callBack) {
        var _search_param = {
            user_name: _uname
          },
          showOptions = {
            w_exp: false,
            edu: false
          };
        User.getUser(_search_param, showOptions, function (resultSet) {
          if (resultSet.status == 200) {
            callBack(null, resultSet.user);
          }
        });
      },
      function getConnectionCount (profileData, callBack) {
        if (profileData != null) {
          Connection.getFriendsCount(profileData.user_id, function (connectionCount) {
            profileData['connection_count'] = connectionCount;
            callBack(null, profileData);
            return 0;
          });
        } else {
          callBack(null, null);
        }
      },
      function getProfileImage (profileData, callBack) {
        if (profileData != null) {
          Upload.getProfileImage(profileData.user_id.toString(), function (profileImageData) {
            if (profileImageData.status != 200) {
              profileData['images'] = {
                'profile_image': {
                  id: 'DEFAULT',
                  file_name: '/images/default-profile-image.png',
                  file_type: '.png',
                  http_url: Config.DEFAULT_PROFILE_IMAGE
                }
              };
            } else {
              profileData['images'] = profileImageData.image;
            }

            callBack(null, profileData);
            return 0;
          });
        } else {
          callBack(null, null);
        }
      },
      function getMutualConnectionCount (profileData, callBack) {
        if (profileData != null) {
          console.log('getMutualConnectionCount');

          if (CurrentSession.id != profileData.user_id) {
            var _grep = require('grep-from-array'),
              _mutual_cons = [];

            _async.waterfall([
              function getMyConnections (callback) {
                var criteria = {
                  user_id: CurrentSession.id
                                        // q:req.query['q']
                };

                Connection.getMyConnection(criteria, function (resultSet) {
                  var my_cons = resultSet.results;
                  callback(null, my_cons);
                });
              },
              function getFriendsConnection (resultSet, callback) {
                var myConnection = resultSet,
                  criteria = {
                    user_id: profileData.user_id
                                            // q:req.query['q']
                  };

                Connection.getMyConnection(criteria, function (resultSet) {
                  var friend_cons = resultSet.results;

                  for (var inc = 0; inc < myConnection.length; inc++) {
                    var user_id = myConnection[inc].user_id;
                    if (user_id != profileData.user_id) {
                      var mutual_con = _grep(friend_cons, function (e) {
                        return e.user_id == user_id;
                      });
                      if (mutual_con[0] != null) {
                        _mutual_cons.push(mutual_con[0]);
                      }
                    }
                  }
                  callback(null);
                });
              }
            ], function (err) {
              profileData['mutual_connection_count'] = _mutual_cons.length;
              callBack(null, profileData);
            }
                        );
          } else {
            callBack(null, profileData);
          }
        } else {
          callBack(null, null);
        }
      }

    ], function (err, profileData) {
      var outPut = {};
      if (!err) {
        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['profile_data'] = profileData;
        res.status(200).send(outPut);
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(200).send(outPut);
      }
    });
  },

    /**
     * Get news categories of a user
     * @param req
     * @param res
     */
  getNewsCategories: function (req, res) {
    var FavouriteNewsCategory = require('mongoose').model('FavouriteNewsCategory');

    var user_id = '56c2d6038c920a41750ac4db';
        // var user_id = CurrentSession.id;

    var criteria = {
      search: {user_id: user_id.toObjectId()},
      populate: 'category',
      populate_field: 'category'
    };

    FavouriteNewsCategory.findFavouriteNewsCategory(criteria, function (resultSet) {
      res.status(resultSet.status).json(resultSet);
    });
  },

    /**
     * Delete a news category of a user
     * @param req
     * @param res
     */
  deleteNewsCategory: function (req, res) {
    var FavouriteNewsCategory = require('mongoose').model('FavouriteNewsCategory');

    var user_id = '56c2d6038c920a41750ac4db';
        // var user_id = CurrentSession.id;

    var categoryId = '56cbeae0e975b0070ad200f8';
        // var categoryId = req.body.categoryId;

    var criteria = {
      user_id: user_id.toObjectId(),
      category: categoryId.toObjectId()
    };

    FavouriteNewsCategory.deleteNewsCategory(criteria, function (resultSet) {
      if (resultSet.status == 200) {
        res.status(200).send(ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS));
      } else {
        res.status(400).send(ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR));
      }
    });
  },

    /**
     * Add user's channel for a category
     * @param req
     * @param res
     */
  addNewsChannel: function (req, res) {
    var user_id = '56c6aeaa6e1ac13e18b2400d';
        // var user_id = CurrentSession.id;

    var categoryId = '56cbeae0e975b0070ad200f8';
        // var categoryId = req.body.categoryId;

        // var channels = req.body.channels;
    var channels = ['56cbf55f09e38d870d1df691'.toObjectId()];

    var FavouriteNewsCategory = require('mongoose').model('FavouriteNewsCategory');

    var criteria = {
      user_id: user_id.toObjectId(),
      category: categoryId.toObjectId()
    };

    var data = {
      channels: {$each: channels}
    };

    FavouriteNewsCategory.addUserNewsChannel(criteria, data, function (resultSet) {
      if (resultSet.status == 200) {
        res.status(200).send(ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS));
      } else {
        res.status(400).send(ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR));
      }
    });
  },

    /**
     * Get user's channels for a category
     * @param req
     * @param res
     */
  getNewsChannels: function (req, res) {
    var user_id = '56c6aeaa6e1ac13e18b2400d';
        // var user_id = CurrentSession.id;

    var categoryId = req.params.category;

    var criteria = {
      search: {user_id: user_id.toObjectId(), category: categoryId.toObjectId()}
    };

    var FavouriteNewsCategory = require('mongoose').model('FavouriteNewsCategory');

    FavouriteNewsCategory.findFavouriteNewsChannel(criteria, function (resultSet) {
      res.status(resultSet.status).json(resultSet);
    });
  },

    /**
     * Delete user's news channel for a category
     * @param req
     * @param res
     */

  deleteNewsChannel: function (req, res) {
    var user_id = '56c6aeaa6e1ac13e18b2400d';
        // var user_id = CurrentSession.id;

        // var categoryId = req.body.categoryId;
    var categoryId = '56cbeae0e975b0070ad200f8';

        // var channelId = req.body.channelId;
        // var channelId = "56cbf4ed221d355c0d063183";
    var channels = ['56cbf4ed221d355c0d063183'.toObjectId()];

    var FavouriteNewsCategory = require('mongoose').model('FavouriteNewsCategory');

    var criteria = {
      user_id: user_id.toObjectId(),
      category: categoryId.toObjectId()
    };

    var pullData = {
      channels: {$in: channels}
    };

    FavouriteNewsCategory.deleteNewsChannel(criteria, pullData, function (resultSet) {
      if (resultSet.status == 200) {
        res.status(200).send(ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS));
      } else {
        res.status(400).send(ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR));
      }
    });
  },

    /**
     * save an article to a user
     * @param req
     * @param res
     */
  saveArticle: function (req, res) {
    var req_saved_articles = JSON.parse(req.body.saved_articles);
    var SavedArticle = require('mongoose').model('SavedArticle');

    SavedArticle.saveArticle(req_saved_articles, function (resultSet) {
      if (resultSet.status == 200) {
        res.status(200).send(ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS));
      } else {
        res.status(400).send(ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR));
      }
    });
  },

    /**
     * get all saved articles of a user
     * @param req
     * @param res
     */
  getSavedArticles: function (req, res) {
    var user_id = '56c6aeaa6e1ac13e18b2400d';
        // var user_id = CurrentSession.id;

    var criteria = {
      search: {user_id: user_id.toObjectId()}
    };

    var SavedArticle = require('mongoose').model('SavedArticle');

    SavedArticle.findSavedArticle(criteria, function (resultSet) {
      res.status(resultSet.status).json(resultSet);
    });
  },

    /**
     * delete a saved article of a user
     * @param req
     * @param res
     */
  deleteSavedArticle: function (req, res) {
    var SavedArticle = require('mongoose').model('SavedArticle');

    var _id = '56d5216ea2d6542b334da0b8';
        // var _id = req.body.id;

    var criteria = {
      _id: _id.toObjectId()
    };

    SavedArticle.deleteSavedArticle(criteria, function (resultSet) {
      if (resultSet.status == 200) {
        res.status(200).send(ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS));
      } else {
        res.status(400).send(ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR));
      }
    });
  },

    /**
     * Get WOrk Experinces
     * @param req
     * @param res
     */
  retrieveWorkExperience: function (req, res) {
    var User = require('mongoose').model('User');

    if (typeof req.params['uname'] === 'undefined') {
      var outPut = {};
      outPut['status'] = ApiHelper.getMessage(400, Alert.CANNOT_FIND_PROFILE, Alert.ERROR);
      res.status(400).send(outPut);
    }

    var criteria = {user_name: req.params['uname']},
      showOptions = {
        w_exp: true,
        edu: false
      };
    User.getUser(criteria, showOptions, function (resultSet) {
      var outPut = {};
      if (resultSet.status != 200) {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).json(outPut);
        return 0;
      }

      outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
      outPut['user'] = resultSet.user;
      res.status(200).send(outPut);
    });
  },

    /**
     * Update Working Experinces
     * @param req
     * @param res
     */
  updateWorkExperience: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    if (req.body.exp_id) {
      if (req.body.isProfile) {
        var _weDetails = {
          'working_experiences.$.company_name': req.body.company_name,
          'working_experiences.$.title': req.body.title
        };
      } else {
        var _weDetails = {
          'working_experiences.$.company_name': req.body.company,
          'working_experiences.$.title': req.body.title,
          'working_experiences.$.location': req.body.location,
          'working_experiences.$.start_date': {
            year: (req.body.fromYear != null) ? req.body.fromYear : 0,
            month: (req.body.fromMonth != null) ? req.body.fromMonth : 0
          },
          'working_experiences.$.left_date': {
            year: (req.body.toYear != null && !req.body.currentPlc) ? req.body.toYear : 0,
            month: (req.body.toMonth != null && !req.body.currentPlc) ? req.body.toMonth : 0
          },
          'working_experiences.$.is_current_work_place': req.body.currentPlc,
          'working_experiences.$.description': req.body.description
        };
      }

      User.updateWorkingExperience(_userId, req.body.exp_id, _weDetails, function (resultSet) {
        var outPut = {};
        if (resultSet.status != 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.DATA_UPDATE_ERROR, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        }

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = resultSet.user;
        res.status(200).send(outPut);
      });
    } else {
      var _weDetails = {
        company_name: req.body.company,
        title: req.body.title,
        left_date: {
          year: (req.body.toYear != null && !req.body.currentPlc) ? req.body.toYear : 0,
          month: (req.body.toMonth != null && !req.body.currentPlc) ? req.body.toMonth : 0
        },
        start_date: {
          year: (req.body.fromYear != null) ? req.body.fromYear : 0,
          month: (req.body.fromMonth != null) ? req.body.fromMonth : 0
        },
        description: req.body.description,
        location: req.body.location,
        is_current_work_place: req.body.currentPlc
      };
      User.addWorkingExperience(_userId, _weDetails, function (resultSet) {
        var outPut = {};
        if (resultSet.status != 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.DATA_INSERT_ERROR, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        }

        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        outPut['user'] = resultSet.user;
        res.status(200).send(outPut);
      });
    }
  },

  findByUserName: function (req, res) {
    let user_name = req.query.uname;
    var response = {
      error: 'User Not found'
    };

    if (typeof user_name !== 'undefined') {
      var User = require('mongoose').model('User');
      User.findByUserName(user_name, function (resultSet) {
        response = resultSet.user;
        res.json(response);
      });
    } else {
      res.json(response);
    }
  },

  doSignin: function (req, res) {
    var outPut = {};

    if (typeof req.body.uname !== 'undefined' && typeof req.body.password !== 'undefined') {
      var User = require('mongoose').model('User');

      var data = {
        user_name: req.body.uname,
        password: req.body.password
      };

      User.authenticate(data, function (resultSet) {
        if (resultSet.status != 200) {
          outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        } else if (resultSet.status == 200 && resultSet.error != null) {
          outPut['status'] = ApiHelper.getMessage(400, resultSet.error, Alert.ERROR);
          res.status(400).json(outPut);
          return 0;
        }

        Util.addToSession(req, resultSet.user);
        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        var _cache_key = CacheEngine.prepareCacheKey(resultSet.user.token);
        outPut['user'] = resultSet.user;
        res.status(200).send(outPut);
        return 0;
                /* CacheEngine.addToCache(_cache_key,resultSet.user,function(cacheData){

                 outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);

                 if(!cacheData){
                 outPut['extra']=Alert.CACHE_CREATION_ERROR
                 }

                 outPut['user']=resultSet.user;
                 res.status(200).send(outPut);

                 }); */
      });
    } else {
      outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
      res.status(400).json(outPut);
      return 0;
    }
  },

    /**
     * Update introduction of a user
     * @param req
     * @param res
     */
  updateIntroduction: function (req, res) {
    var User = require('mongoose').model('User');
    var CurrentSession = Util.getCurrentSession(req);
    var _userId = CurrentSession.id;

    var outPut = {};
    var _introInfo = {introduction: req.body.introText};

    User.saveUpdates(_userId, _introInfo, function (resultSet) {
      if (resultSet.status == 200) {
        outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
        res.status(200).send(outPut);
      } else {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).send(outPut);
      }
    });
  },

    /**
     * Retrieve Introduction of a user
     * @param req
     * @param res
     */
  retrieveIntroduction: function (req, res) {
    var User = require('mongoose').model('User');

    if (typeof req.params['uname'] === 'undefined') {
      var outPut = {};
      outPut['status'] = ApiHelper.getMessage(400, Alert.CANNOT_FIND_PROFILE, Alert.ERROR);
      res.status(400).send(outPut);
    }

    var criteria = {user_name: req.params['uname']},
      showOptions = {
        w_exp: false,
        edu: false,
        skill: false
      };
    User.getUser(criteria, showOptions, function (resultSet) {
      var outPut = {};
      if (resultSet.status != 200) {
        outPut['status'] = ApiHelper.getMessage(400, Alert.ERROR, Alert.ERROR);
        res.status(400).json(outPut);
        return 0;
      }

      outPut['status'] = ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS);
      outPut['user'] = resultSet.user;
      res.status(200).send(outPut);
    });
  },

    /**
     * Load Connections
     * @param req
     * @param res
     */
  getUserSuggestions: function (req, res) {
    var User = require('mongoose').model('User'),
      Connection = require('mongoose').model('Connection'),
      _async = require('async'),
      CurrentSession = Util.getCurrentSession(req),
      outPut = {},
      my_connections = [], all_users = [], suggested_users = [], unique_ids = [];

    _async.waterfall([
      function getData (callback) {
        _async.parallel([
          function getMyConnection (callback) {
            var criteria = {
              user_id: CurrentSession.id,
              q: 'first_name:' + req.params['name'] + '* OR last_name:' + req.params['name'] + '*'
                                // q:req.params['name']+'*'
            };

            Connection.getMyConnectionData(criteria, function (resultSet) {
                                // console.log("=======================Connections==============")
                                // console.log(resultSet)
              my_connections = resultSet.results;
              callback(null);
            });
          },
          function getAllUsers (callback) {
            var user_id = CurrentSession.id;
                            // var q = '+first_name:'+req.params['name']+'*';
            var q = 'first_name:' + req.params['name'] + '* OR last_name:' + req.params['name'] + '*';

            User.getAllUsers(q, user_id, function (resultSet) {
                                // console.log("=======================All Users=======================")
                                // console.log(resultSet)
              all_users = resultSet.users;
              callback(null);
            });
          }

        ], function (err) {
          callback(null);
        });
      },
      function finalizeData (callback) {
        for (var i = 0; i < my_connections.length; i++) {
          if (unique_ids.indexOf(my_connections[i].user_id) == -1) {
            unique_ids.push(my_connections[i].user_id);
            suggested_users.push(my_connections[i]);
          }
        }
        for (var j = 0; j < all_users.length; j++) {
          if (unique_ids.indexOf(all_users[j].user_id) == -1) {
            unique_ids.push(all_users[j].user_id);
            suggested_users.push(all_users[j]);
          }
        }

        callback(null);
      }

    ], function (err) {
      var outPut = {
        status: ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS),
        suggested_users: suggested_users
      };
      res.status(200).send(outPut);
      return 0;
    }
        );
  },

    /**
     * Load User Connections for Shared Notebooks
     * @param req
     * @param res
     */
  getNotesSharedUsers: function (req, res) {
    var User = require('mongoose').model('User'),
      NoteBook = require('mongoose').model('Notebook'),
      Connection = require('mongoose').model('Connection'),
      _async = require('async'),
      grep = require('grep-from-array'),
      _arrIndex = require('array-index-of-property'),
      CurrentSession = Util.getCurrentSession(req),
      outPut = {},
      my_connections = [];

    _async.waterfall([

      function getConnectedUsers (callback) {
        var criteria = {
          user_id: CurrentSession.id,
          q: 'first_name:' + req.params['name'] + '* OR last_name:' + req.params['name'] + '*'
                    // q:req.params['name']+'*'
        };
        var notebookId = req.params['notebook'];
        Connection.getMyConnectionData(criteria, function (resultSet) {
                    // console.log("=======================Connections==============")
                    // console.log(resultSet)
          my_connections = resultSet.results;

          _async.waterfall([
            function getSharedUsers (callback) {
              NoteBook.getNotebookById(notebookId, function (resultSet) {
                var _notebookSharedUsers = resultSet.shared_users;
                if (_notebookSharedUsers != null) {
                  for (var inc = 0; inc < _notebookSharedUsers.length; inc++) {
                    var _user = grep(my_connections, function (e) {
                      return e.user_id == _notebookSharedUsers[inc].user_id;
                    });
                    if (_user.length == 1) {
                      var index = my_connections.indexOfProperty('user_id', _user[0].user_id);
                      my_connections.splice(index, 1);
                    }
                  }
                }

                callback(null);
              });
            }
          ], function (err, resultSet) {
            callback(null, my_connections);
          });
        });
      }

    ], function (err, resultSet) {
      if (err) {
        console.log(err);
        return;
      }
      var outPut = {
        status: ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS),
        users: resultSet
      };
      res.status(200).json(outPut);
    });
  },

    /**
     * Load User Connections for Shared Folder
     * @param req
     * @param res
     */
  getFolderUsers: function (req, res) {
    console.log('getFolderUsers');
    var User = require('mongoose').model('User'),
      Folder = require('mongoose').model('Folders'),
      Connection = require('mongoose').model('Connection'),
      _async = require('async'),
      grep = require('grep-from-array'),
      CurrentSession = Util.getCurrentSession(req),
      my_connections,
      alreadySharedUsers = [],
      filteredConnections = [],
      criteria = {};

    _async.waterfall([

      function getConnectionsAndSharedUsers (callback) {
        console.log('getConnectionsAndSharedUsers');
        _async.parallel([

          function getMyConnections (callback) {
            console.log('getMyConnections');
            console.log(req.params['name']);
            if (typeof req.params['name'] !== 'undefined' && req.params['name'] != null) {
              criteria = {
                user_id: CurrentSession.id,
                q: 'first_name:' + req.params['name'] + '* OR last_name:' + req.params['name'] + '*'
              };
            } else {
              criteria = {
                user_id: CurrentSession.id
              };
            }
            console.log(criteria);
            Connection.getMyConnectionData(criteria, function (resultSet) {
                            // console.log("=======================Connections==============")
                            // console.log(resultSet)
              my_connections = resultSet.results;
              callback(null);
            });
          },
          function getSharedUsers (callback) {
            console.log('getSharedUsers');
            var folderId = req.params['folder'];

            Folder.getFolderById(folderId, function (resultSet) {
              for (var i = 0; i < resultSet.shared_users.length; i++) {
                alreadySharedUsers.push(resultSet.shared_users[i].user_id);
              }
              callback(null);
            });
          }

        ], function (err) {
          callback(null);
        });
      },
      function getNotSharedUsers (callback) {
        console.log('getFolderUsers');
        if (alreadySharedUsers != null && my_connections != null) {
          for (var i = 0; i < my_connections.length; i++) {
            if (alreadySharedUsers.indexOf(my_connections[i].user_id) == -1) {
              filteredConnections.push(my_connections[i]);
            }
          }
          callback(null);
        } else {
          callback(null);
        }
      }
    ], function (err) {
      if (err) {
        console.log(err);
        return;
      }
      var outPut = {
        status: ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS),
        users: filteredConnections
      };
      res.status(200).json(outPut);
    });
  },

    /**
     * Filter User Connections
     * @param req
     * @param res
     */
  filterNoteBookSharedUsers: function (req, res) {
    var User = require('mongoose').model('User'),
      NoteBook = require('mongoose').model('Notebook'),
      Connection = require('mongoose').model('Connection'),
      _async = require('async'),
      grep = require('grep-from-array'),
      _arrIndex = require('array-index-of-property'),
      CurrentSession = Util.getCurrentSession(req),
      outPut = {},
      my_connections = [],
      shared_users = [];

    _async.waterfall([

      function getConnectedUsers (callback) {
        var criteria = {
          q: 'first_name:' + req.params['name'] + '* OR last_name:' + req.params['name'] + '*',
          index: 'idx_usr'
                    // q:req.params['name']+'*'
        };
        var notebookId = req.params['notebook'];
        ES.search(criteria, function (esResultSet) {
                    // console.log("=======================Connections==============")
                    // console.log(resultSet)
          my_connections = esResultSet.result;
                    // console.log(my_connections);
          _async.waterfall([
            function getSharedUsers (callback) {
              NoteBook.getNotebookById(notebookId, function (resultSet) {
                var _notebookSharedUsers = resultSet.shared_users;
                if (_notebookSharedUsers != null) {
                  for (var inc = 0; inc < _notebookSharedUsers.length; inc++) {
                    var _user = grep(my_connections, function (e) {
                      return e.user_id == _notebookSharedUsers[inc].user_id;
                    });
                    if (_user.length == 1) {
                      var index = my_connections.indexOfProperty('user_id', _user[0].user_id);
                                            // if (_notebookSharedUsers[inc].status == SharedRequestStatus.REQUEST_ACCEPTED) {
                      var usrObj = {
                        user_id: my_connections[index].user_id,
                        notebook_id: notebookId,
                        shared_type: my_connections[index].shared_type,
                        shared_status: _notebookSharedUsers[inc].status,
                        user_name: my_connections[index].first_name + ' ' + my_connections[index].last_name,
                        profile_image: my_connections[index].images.profile_image.http_url
                      };
                      shared_users.push(usrObj);
                                            // }
                    }
                  }
                }

                callback(null);
              });
            }
          ], function (err, resultSet) {
            callback(null, shared_users);
          });
        });
      }

    ], function (err, resultSet) {
      if (err) {
        console.log(err);
        return;
      }
      var outPut = {
        status: ApiHelper.getMessage(200, Alert.SUCCESS, Alert.SUCCESS),
        users: resultSet
      };
      res.status(200).json(outPut);
    });
  }

};

module.exports = UserController;
