/**
 * Calender Event model for communicate call-center collection in Database
 */

'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

GLOBAL.CallConfig = {
    CACHE_PREFIX: "call_record:"
};

GLOBAL.CallType = {
    INCOMING: 1,
    OUTGOING: 2
};

GLOBAL.CallStatus = {
    MISSED: 1,
    ANSWERED: 2,
    REJECTED: 3, /* call rejected due to targeted user work-mode */
    CANCELLED: 4 /* call hanged-up by targeted user */
};

GLOBAL.ContactType = {
    INDIVIDUAL: 1,
    GROUP: 2,
    MULTI: 3
};

GLOBAL.CallChannel = {
    VIDEO: 1,
    AUDIO: 2
};

var ReceiversListSchema = new Schema({
    user_id: {
        type: Schema.ObjectId,
        ref: 'User',
        default: null
    }
});

var CallSchema = new Schema({
    user_id: {
        type: Schema.ObjectId,
        ref: 'User',
        default: null
    },
    contact_type: {
        type: Number, /* 1 - individual | 2 - group | 3 - multi*/
        default: null
    },
    call_type: {
        type: Number, /* 1 - incoming | 2 - outgoing */
        default: null
    },
    call_channel: {
        type: Number, /* 1 - video | 2 - audio */
        default: null
    },
    call_started_at: {
        type: Date,
        default: null
    },
    call_ended_at: {
        type: Date,
        default: null
    },
    call_status: {
        type: Number,
        default: null /* 1 - missed | 2 - answered | 3 - rejected, 4 - cancelled */
    },
    receivers_list: [ReceiversListSchema],
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    }
}, {collection: "call", timestamps: true});

/**
 * Add Call Center records
 * @param eventData
 * @param callBack
 */
CallSchema.statics.addNew = function (oCall, callBack) {
    var _this = this;
    var oNewCallRecord = new this();

    for (var key in oCall) {
        switch (key) {
            case 'receivers_list':
                var aReceivers = [];
                for (var i = 0; i < oCall[key].length; i++) {
                    aReceivers.push({
                        user_id: oCall[key][i].user_id
                    });
                }
                oNewCallRecord.receivers_list = aReceivers;
                break;
        }
    }

    oNewCallRecord.user_id = oCall.user_id;
    oNewCallRecord.contact_type = oCall.contact_type;
    oNewCallRecord.call_type = oCall.call_type;
    oNewCallRecord.call_started_at = oCall.started_at;
    oNewCallRecord.call_channel = oCall.call_channel;
    oNewCallRecord.call_type = oCall.call_type;
    oNewCallRecord.call_status = oCall.call_status;

    var _async = require('async');

    _async.waterfall([
        function saveCallRecord(callback) {
            oNewCallRecord.save(function (error, oCallRecord) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, oCallRecord);
                }
            });
        },
        function addUserCallRecordToES(oCallRecord, callback) {
            var _user_key = CallConfig.CACHE_PREFIX + oCallRecord.user_id.toString();

            var callPayload = {
                index: _user_key,
                id: oCallRecord._id.toString(),
                type: 'call-record',
                data: oCallRecord
            };

            ES.createIndex(callPayload, function (result) {
                console.log('CALL RECORD INDEX CREATED:' + _user_key);
                callback(null, oCallRecord);
            });
        },
        function addReciversCallRecordToES(oCallRecord, callback) {
            _async.each(oCallRecord.receivers_list, function (oReceiver, forEachCallBack) {

                var _user_key = CallConfig.CACHE_PREFIX + oReceiver.user_id.toString();

                oCallRecord.call_type = _this.callTypes.INCOMING;

                var callPayload = {
                    index: _user_key,
                    id: oCallRecord._id.toString(),
                    type: 'call-record',
                    data: oCallRecord
                };

                ES.createIndex(callPayload, function (result) {
                    forEachCallBack(null);
                });

            }, function (error) {
                error ? callback(error) : callback(null, oCallRecord);
            });
        }
    ], function (error, oCallRecord) {
        error ? callBack({status: 400, error: error}) : callBack({status: 200, data: oCallRecord});
    });
};

/**
 * Get Call Record By Id
 * @param id
 * @param callBack
 */
CallSchema.statics.getRecordById = function (id, callBack) {

    var _this = this;

    _this.findOne({_id: id}).lean().exec(function (err, resultSet) {
        if (!err) {
            callBack({status: 200, data: resultSet})
        } else {
            console.log(err);
            callBack({status: 400, error: err})
        }
    });
};


/**
 * Get records by given filer
 * @param filter
 * @param fields
 * @param callBack
 */
CallSchema.statics.get = function (filter, fields, callBack) {

    var options = {multi: true};
    var _this = this;

    _this.find(filter, fields, options).lean().exec(function (err, records) {
        if (err) {
            callBack({status: 400, error: err}, null);
        } else {
            callBack(null, {status: 200, records: records});
        }
    });
};

/**
 * Update Call Record
 * @param filter
 * @param value
 * @param callBack
 */
CallSchema.statics.updateCallRecord = function (recordId, oRecord, callBack) {
    var _this = this;

    _this.findOneAndUpdate({_id: recordId}, {$set: oRecord}, {new: true}, function (error, data) {
        if (!error) {
            return callBack({status: 200, data: data});
        } else {
            return callBack({status: 400, error: error});
        }
    });
};

CallSchema.statics.callStatus = {
    MISSED: 1,
    ANSWERED: 2,
    REJECTED: 3, /* call rejected due to targeted user work-mode */
    CANCELED: 4, /* call hanged-up by targeted user */
};

CallSchema.statics.callTypes = {
    INCOMING: 1,
    OUTGOING: 2
};

mongoose.model('Call', CallSchema);