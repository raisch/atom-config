'use strict';

module.exports = {
  connections: {
    DEFAULT_LIMIT: 100,
    DEFAULT_OFFSET: 0,
    ALLOWED_TYPES: [
      'personal',
      'group'
    ]
  },
  notifications: {
    DEFAULT_LIMIT: 100,
    DEFAULT_OFFSET: 0
  },
  users: {
    DEFAULT_LIMIT: 100,
    DEFAULT_OFFSET: 0,
    VALID_USERNAME: /^[a-z][a-z0-9_]{4,}$/
  }
  // someDomain: {
  //   SOME_PARAM: ...
  //   ...
  // }
};
