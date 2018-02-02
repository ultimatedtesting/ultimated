require('babel-register')({
  "presets": ["es2015", "es2016", "stage-2"]
});

require('babel-polyfill');

var commonUtils = require('./commonUtils').default;
global.PROJECT_RELATIVE_PATH_SHALLOW = commonUtils.getProjectPathRelativeToFrameworkPath();
global.PROJECT_RELATIVE_PATH = commonUtils.getProjectPathRelativeToFrameworkPath(1);
global.PROJECT_CONFIG = require(global.PROJECT_RELATIVE_PATH + '.ultimated/config.js').default;
global.SuiteManager = require('./suiteManager').default;
global.STORAGE = require(global.PROJECT_RELATIVE_PATH + '.ultimated/tests/storage').default;

require(global.PROJECT_RELATIVE_PATH + '.ultimated/tests/tests');