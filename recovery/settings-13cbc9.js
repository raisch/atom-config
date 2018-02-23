'use strict';
/* eslint-env node, es6 */
/* eslint-disable hapi/hapi-scope-start */

const _ = require('lodash');

module.exports = {

  identity: 'settings',
  tableName: 'user_settings',

  connection: 'ambi',

  types: {
    trim: function (val) {
      let result = val;
      if (!_.isString(val)) {
        result = val.toString();
      }
      return result.trim();
    }
  },

  attributes: {

    user: {
      model: 'users'
    },

    background: {
      type: 'string',
      trim: true,
      defaultsTo: ''
    },

    sounds: {
      type: 'boolean',
      defaultsTo: true
    },

    weather_format: {
      type: 'string',
      trim: true,
      defaultsTo: 'f'
    },

    clock_format: {
      type: 'number',
      enum: [12, 24],
      defaultsTo: 12
    }
  }
};
