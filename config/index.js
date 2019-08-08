// requires
const _ = require('lodash');

// module variables
const index = require('./app.config.json');
const defaultConfig = index.development;
const environment = process.env.NODE_ENV || 'development';
const environmentConfig = index[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);

// as a best practice
// all global variables should be referenced via global. syntax
// and their names should always begin with g
global.gConfig = finalConfig;
