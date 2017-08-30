var shelljs = require('shelljs');
var fs = require('fs');

//ensures node_modules link after cloning git repo
if (fs.existsSync('./.ultimated/release-version')) {
    var homeDir = shelljs.exec('cd && pwd', {silent:true}).stdout.trim();
    var projectVersion = fs.readFileSync('./.ultimated/release-version', 'utf8').trim();
    var nodeSuiteVersion = fs.readFileSync(`${homeDir}/.ultimated/packages/ultimated-core/${projectVersion}/release-node-suite`, 'utf8').trim();
    shelljs.exec(`ln -s ~/.ultimated/packages/node-suites/${nodeSuiteVersion}/lib/node_modules "./.ultimated/node_modules"`, {silent: true});
}


require('babel-register')({
    "presets": ["es2015", "es2016", "stage-2"]
});

require('babel-polyfill');

var versionManager = require('./framework/versionManager').default;
var commonUtils = require('./framework/commonUtils').default;
// set project relative path
global.Ultimated = {
    VAULT: {
        PROJECT_RELATIVE_PATH_SHALLOW: commonUtils.getProjectPathRelativeToFrameworkPath(),
        PROJECT_RELATIVE_PATH: commonUtils.getProjectPathRelativeToFrameworkPath(1),
        FRAMEWORK_RELATIVE_PATH_SHALLOW: commonUtils.getFrameworkPathRelativeToProjectPath(),
        FRAMEWORK_RELATIVE_PATH: commonUtils.getFrameworkPathRelativeToProjectPath(1)
    }
};

function executeTests() {
    shelljs.exec(`rm -rf ./.ultimated/tests`);
    shelljs.exec(`cp -r tests ./.ultimated`);
    shelljs.exec(`cp config.js ./.ultimated`);

    // DEPRECATED >>
    global.PROJECT_CONFIG = require(global.PROJECT_RELATIVE_PATH_SHALLOW + '.ultimated/config.js').default;
    global.PROJECT_VERSION = versionManager.getProjectCurrentVersion();
    global.PROJECT_NODE_SUITE = versionManager.getProjectNodeSuite();
    global.FRAMEWORK_CURRENT_VERSION = versionManager.getFrameworkCurrentVersion();
    global.FRAMEWORK_LATEST_VERSION = versionManager.getFrameworkLatestVersion();

    // << DEPRECATED
    Ultimated.VAULT.PROJECT_CONFIG = require(Ultimated.VAULT.PROJECT_RELATIVE_PATH_SHALLOW + '.ultimated/config.js').default;
    Ultimated.VAULT.PROJECT_VERSION = versionManager.getProjectCurrentVersion();
    Ultimated.VAULT.PROJECT_NODE_SUITE = versionManager.getProjectNodeSuite();
    Ultimated.VAULT.FRAMEWORK_CURRENT_VERSION = versionManager.getFrameworkCurrentVersion();
    Ultimated.VAULT.FRAMEWORK_LATEST_VERSION = versionManager.getFrameworkLatestVersion();
    versionManager.ensureLatestFrameworkVersion();
    versionManager.ensureProperFrameworkVersion();

    versionManager.informAboutNewerVersion();

    require(`./../${Ultimated.VAULT.PROJECT_VERSION}/framework/main.js`);
}

global.PROJECT_RELATIVE_PATH_SHALLOW = commonUtils.getProjectPathRelativeToFrameworkPath();
global.PROJECT_RELATIVE_PATH = commonUtils.getProjectPathRelativeToFrameworkPath(1);
global.FRAMEWORK_RELATIVE_PATH_SHALLOW = commonUtils.getFrameworkPathRelativeToProjectPath();
global.FRAMEWORK_RELATIVE_PATH = commonUtils.getFrameworkPathRelativeToProjectPath(1);

//TODO add all ifs to a class, refactor to switch

if (!process.argv[2] && fs.existsSync('./.ultimated/release-version')) { // if ultimated is run with no params
    executeTests();
} else if (!process.argv[2] && !fs.existsSync('./.ultimated/release-version')) {
    console.log('\nThis command can only be run from the project directory\n');
    console.log('');
    console.log('Would you like to create a new project? Type:');
    console.log('  ultimated create project_name\n');
} else if (process.argv[2] === 'create' && process.argv[3]) { // if ultimated is run with "create"
    shelljs.exec(`~/.ultimated/packages/ultimated-core/latest/create.sh create ${process.argv[3]}`);
} else if (process.argv[2] === 'install' && process.argv[3] === 'android') {
    console.log('If you haven\'t installed Android SDK or Java on your system yet');
    console.log('to do so, type:');
    console.log('  bash <( curl http://ultimatedtesting.com/install/android )');
} else if (process.argv[2] === 'jenkins' && fs.existsSync('./jenkins.sh') && fs.existsSync('./.ultimated/release-version')) {
    process.env.JENKINS = true;
    console.log('Executing jenkins.sh script...');
    shelljs.exec(`./jenkins.sh ${process.argv[3]}`);
    console.log('jenkins.sh script finished. Executing tests...');
    executeTests();
} else if (process.argv[2] === 'jenkins' && !fs.existsSync('./jenkins.sh') && fs.existsSync('./.ultimated/release-version')) {
    console.log('Running Ultimated in jenkins-mode impossible. Please add jenkins.sh to your project');
} else if (process.argv[2] === 'update' && fs.existsSync('./.ultimated/release-version')) {
    Ultimated.VAULT.FRAMEWORK_LATEST_VERSION = versionManager.getFrameworkLatestVersion();
    console.log('Updating project to version', Ultimated.VAULT.FRAMEWORK_LATEST_VERSION);
    versionManager.ensureLatestFrameworkVersion();
    shelljs.exec('rm ./.ultimated/release-version');
    shelljs.exec('touch ./.ultimated/release-version');
    fs.writeFileSync('./.ultimated/release-version', Ultimated.VAULT.FRAMEWORK_LATEST_VERSION);
    console.log('');
    console.log('Project updated. To run the project, type');
    console.log('  ultimated');
    console.log('');
} else {
    console.log('Ultimated: command unknown');
}