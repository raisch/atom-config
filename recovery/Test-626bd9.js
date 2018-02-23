const _ = require('lodash');
const stringify = require('json-stringify-safe');

const ValidatorBase = require('./Base');

require('../mixins/lodash');

'use strict';

// TODO should support base types...like 'matches' first tests for 'string'

class ValidationTest extends ValidatorBase {

  //constructor(name, func, msg = `%s failed to validate using ${name}`, aliases = [], debug = false) {
  
  constructor(opts) {
    super();

    _.merge(this, opts);

    if(!_.isNonEmptyString(this.name)) {
      throw 'ValidationTest name must be a String';
    }

    if(_.isNonEmptyString(this.func)) {
      try {
        this.func = eval(this.func);
      }
      catch(e) {
        throw new Error(`ValidationTest ctor failed to eval func "${this.func}: ${e.toString()}`);
      }
    }

    if(!_.isFunction(this.func)) {
      throw 'ValidationTest func must be a Function';
    }

    if(!_.isNonEmptyString(this.msg)) {
      throw 'ValidationTest msg must be a String';
    }
  }

  get description() {
    return `this.name`;
  }

  dump() {
    const funcAsString = (func) => {
      return func.toString()
        .replace(/\/\/.+?$/gm, '')
        .replace(/\/\*.+?\*\//g, '')
        .replace(/\n\s+/g, ' ');
    }
    return {
      name: this.name,
      func: funcAsString(this.func),
      msg: this.msg,
      aliases: this.aliases
    };
  }

  run(value, opts, path, validator) {

    let msg = this.msg;

    if(this.debug) {
      console.log('\t\trunning %s test', this.name);
    }

    let result;

    try {
      result = this.func(value, opts, path, validator);
    }
    catch(e) {
      msg = e.toString();
    }

    if(this.debug) {
      console.log('\t\t\t%s test returned %s', this.name, result);
    }

    if(this.name === 'required') {
      validator.required.add(path);
    }

    if(this.name === 'optional') {
      validator.optional.add(path);
    }

    return {
      ok: result,
      msg: this.msg
    };
  }
}

module.exports = ValidationTest;
