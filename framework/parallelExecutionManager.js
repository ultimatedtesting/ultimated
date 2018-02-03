import shelljs from 'shelljs';
import request from 'request';
import CommonUtils from './commonUtils';
import CONFIG from './configGenerator';
import moment from 'moment';
import CommunicationManager from './communicationManager';

const ParallelExecutionManager = class {
    constructor () {
        this.beginDateTime = moment().format('YYYY-MM-DD_HH-mm');
        this.activeDevicesList = {};

        this.allDone = null;
    }

	init (afterAllCallback) {
        this.afterAllCallback = afterAllCallback;

		this.resetAppium();
		this.prepareFolders();
		this.startTestsOnAllDevices();
	}
	
	resetAppium () {
		shelljs.exec(`${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/node ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/forever stopall`, {silent:true});
	}

	prepareFolders () {
        shelljs.exec(`mkdir reports`, {silent:true});
        shelljs.exec(`mkdir reports/${this.beginDateTime}`, {silent:true});
        shelljs.exec(`mkdir logs`, {silent:true});
    }

	startTestsOnAllDevices () {
        console.log('Please wait a moment, initiating tests on all connected devices...');

        this.startTestsOnAndroidDevices();
        this.startTestsOnIOSDevices();
        // this.startTestsOnIOSSimulators();
	}

    startTestsOnAndroidDevices () {
        const devicesIdList = this.getAndroidDevicesList();

        for (let i = devicesIdList.length; i--;) {
            const port = CONFIG.PORT_MIN + i;
            const deviceId = devicesIdList[i];

            shelljs.exec(`mkdir reports/${this.beginDateTime}/${deviceId}`, {silent:true});

            this.runAppium(port, deviceId);
            this.runTest(deviceId, port, 'Android');
        }
    }

    generateFreePort() {

    }

    getAndroidDevicesList () {
		shelljs.exec(`adb devices`, {silent:true});
		
        let response = shelljs.exec(`adb devices`, {silent:true});

        response = response.stdout.replace('List of devices attached', '');
        response = response.replace(/(\r\n|\n|\r|\t)/gm, '');
        response = response.replace(/\s+/g, '');
        response = response.split('device');
		response.pop();
		
		console.log(`Android devices connected: ${response.length}`);
		
        return response;
    }
	
    runAppium (port, deviceId) {
        shelljs.exec(`${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/node ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/forever start -o logs/${this.beginDateTime}-${port} -a --sourceDir "${CommonUtils.getMainPath()}" --tmp "${CommonUtils.getMainPath()}/reports/${this.beginDateTime}/${deviceId}" --uid "${deviceId}-port${port}" "/node_modules/appium/build/lib/main.js" --port ${port} -bp ${port+100} --chromedriver-port ${port+200} --webkit-debug-proxy-port ${port+300}`, {silent:true});
    }

	runTest (deviceId, port, platform, resolve) {
        this.activeDevicesList[deviceId] = deviceId;

		request(`http://127.0.0.1:${port}`, (error, response, body) => {
			if (!error && response.statusCode === 404) {
			    console.log('appium ok');
                const shelljsObject = shelljs.exec(`env DEVICE=${deviceId} PORT=${port} PLATFORM=${platform} DATETIME=${this.beginDateTime} ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/node ${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/mocha -R good-mocha-html-reporter -p ./reports/${this.beginDateTime}/${deviceId}.html --timeout 300000 ${Ultimated.FLAGS.BAIL ? '--bail' : ''} ${CONFIG.ULTIMATED_CORE_ABSOLUTE_PATH}/${global.PROJECT_VERSION}/framework/testsEntryPoint.js`, {silent:false}, (code) => {
                    console.log(`Test (device: ${deviceId}, port: ${port}) has just finished`);
                    shelljs.exec(`${CONFIG.NODE_SUITES_ABSOLUTE_PATH}/${global.PROJECT_NODE_SUITE}/bin/forever stop ${deviceId}-port${port}`, {silent:true});
                    CommunicationManager.updateTestStatus(deviceId);

                    delete this.activeDevicesList[deviceId];
                    console.log('devices left: ', Object.keys(this.activeDevicesList).length);

                    if (Ultimated.FLAGS.BAIL && code !== 0) {
                        console.log('one of the tests failed, killing...');
                        if (this.afterAllCallback) {
                            this.afterAllCallback(this.beginDateTime, deviceId, port);
                        }
                         setTimeout(() => {
                            console.log(`killed with code ${code}!`);
                            process.exit(code);
                        }, 3000);
                    } else if (Object.keys(this.activeDevicesList).length === 0) {
                        console.log('killing...');
                        if (this.afterAllCallback) {
                            this.afterAllCallback(this.beginDateTime, deviceId, port);
                        }
                        setTimeout(() => {
                            console.log('killed!');
                            process.exit(0);
                        }, 3000);
                    }

                    if (resolve) {
                        resolve();
                    }
                });
			} else {
				setTimeout((() => {
					this.runTest.call(this, deviceId, port, platform, resolve);
				}).bind(this), 3000)
			}
		});
    }

    runTestSync (deviceId, port, platform) {
        return new Promise((resolve) => {
            this.runTest(deviceId, port, platform, resolve);
        });
    }

    startTestsOnIOSDevices () {
		const devicesIdList = this.getIOSDevicesList();

        for (let i = devicesIdList.length; i--;) {
            const port = CONFIG.PORT_MIN + 1000 + i;
            const deviceId = devicesIdList[i];

            shelljs.exec(`mkdir reports/${this.beginDateTime}/${deviceId}`, {silent:true});
            shelljs.exec(`ios_webkit_debug_proxy -c ${deviceId}:${port+300} -d`, {silent: true, async: true});

            this.runAppium(port, deviceId);
            this.runTest(deviceId, port, 'iOS');
        }
	}

    getIOSDevicesList () {
        let response = shelljs.exec(`instruments -s devices`, {silent:true});
        let devices = [];

        response = response.stdout.replace('Known Devices:', '');
        response = response.split('\n');

        for (let i = response.length; i--;) {
            if (response[i].indexOf('Simulator') === -1 && response[i].length !== 0) {
                let parsedResponse = response[i].substring(response[i].indexOf('[') + 1);
                parsedResponse = parsedResponse.substring(0, parsedResponse.indexOf(']'));
                if (parsedResponse.indexOf('-') === -1) {
                    devices.push(parsedResponse);
                }
            }
        }

        console.log('iOS devices connected: ', devices.length);

        return devices;
    }

    // async startTestsOnIOSSimulators () {
    //     const iOSSimulatorsList = this.getIOSSimulatorsList();
    //
    //     for (let i = iOSSimulatorsList.length; i--;) {
    //         const port = CONFIG.PORT_MIN + 2000 + i;
    //         const device = iOSSimulatorsList[i];
    //
    //         shelljs.mkdir(`reports/${this.beginDateTime}/${device}`);
    //
    //         this.runAppium(port);
    //         await this.runTestSync(device, port, 'iOS');
    //     }
    // }
    //
    // getIOSSimulatorsList () {
    //     let response = shelljs.exec(`instruments -s devices`, {silent:true});
    //     let devices = [];
    //
    //     response = response.stdout.replace('Known Devices:', '');
    //     response = response.split('\n');
    //
    //     for (let i = 0; devices.length < 4; i++) {
    //         if (response[i].indexOf('Simulator') !== -1 && response[i].length !== 0
    //             && response[i].indexOf('iPhone') !== -1 && response[i].indexOf('iPhone 4') === -1) {
    //             let parsedResponse = response[i].substring(response[i].indexOf('[') + 1);
    //             parsedResponse = parsedResponse.substring(0, parsedResponse.indexOf(']'));
    //             devices.push(parsedResponse);
    //         }
    //     }
    //
    //     console.log('iPhone simulators available: ', devices.length);
    //
    //     return devices;
    // }
};

export default new ParallelExecutionManager();
