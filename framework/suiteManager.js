import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import webDriverInstance from 'wd';
import screenshotComparer from 'wd-screenshot';
import CONFIG from './configGenerator';
import CommunicationManager from './communicationManager';
import FacebookLogin from './facebookLogin';
import NativeCalendar from './nativeCalendar';
import moment from 'moment';
import shelljs from 'shelljs';

const SuiteManagerClass = class {
    constructor () {
        global.Framework = {
            IOS: 'iOS',
            ANDROID: 'Android',
            PLATFORM: process.env.PLATFORM,
            SPECIAL_KEYS: webDriverInstance.SPECIAL_KEYS
        };

        this.beginDateTime = process.env.DATETIME;
        this.deviceId = process.env.DEVICE;
        this.moduleName = null;

        this.serverConfig = {
            host: '127.0.0.1',
            port: process.env.PORT,
            protocol: 'http'
        };

        this.capsConfig = {
            udid: this.deviceId,
            deviceName: '*',
            platformName: process.env.PLATFORM,
            app: process.env.PLATFORM === Framework.ANDROID ? CONFIG.APK_PATH : CONFIG.APP_PATH,
            noReset: false,
            fullReset: false,
            automationName: process.env.PLATFORM === 'Android' ? "Appium" : "XCUITest",
            nativeWebScreenshot: false,
            androidInstallTimeout: 240000
            // unicodeKeyboard: true,
            // resetKeyboard: true
        };

        if (process.env.PLATFORM === Framework.IOS) {
            this.capsConfig.xcodeConfigFile = CONFIG.XCODE_CONFIG;
            this.capsConfig.wdaLocalPort = +process.env.PORT + 1500;
            this.capsConfig.webviewConnectRetries = 50;
            this.capsConfig.autoWebview = true;
            this.capsConfig.startIWDP = true;
        }

        if (process.env.PLATFORM === Framework.ANDROID) {
            this.capsConfig.nativeWebScreenshot = true;
        }

        Framework.IOS = 'iOS';
        Framework.ANDROID = 'Android';
        Framework.PLATFORM = process.env.PLATFORM;
    }

    async initBefore (filename) {
        this.moduleName = filename.split('/').pop().split('.').shift();

        return new Promise(async (resolve) => {
            console.log('Initializing Framework...');
            // TODO change framework.js to .ultimated/frameworkObject
            const frameworkPath = `${PROJECT_RELATIVE_PATH}.ultimated/framework`;
            const framework = await require(frameworkPath).default;
            global.Framework =  Object.assign({}, global.Framework, framework);
            this.exposeChai(webDriverInstance);
            this.enhanceDriver(webDriverInstance);
            this.enhanceFramework(Framework);
            const driver = webDriverInstance.promiseChainRemote(this.serverConfig);
            console.log('Framework ready, initializing suite...');
            await driver.init(this.capsConfig);
            await driver.setImplicitWaitTimeout(CONFIG.MAXIMUM_WAIT_TIMEOUT_MS);
            console.log('App installed on the device, changing to webview...');
            const contexts = await driver.contexts();
            Framework.CONTEXT = contexts[contexts.length - 1];
            Framework.CONTEXTS = {
                WEBVIEW: Framework.CONTEXT,
                NATIVE: contexts[0]
            };
            await driver.context(Framework.CONTEXT);

            if (Framework.PLATFORM === Framework.ANDROID) {
                Framework.SCREEN_HEIGHT = (await driver.execute('return window.screen')).height;
                Framework.SCREEN_WIDTH = (await driver.execute('return window.screen')).width;
                Framework.SCREEN_RATIO = (await driver.execute('return window.devicePixelRatio'));
                Framework.SCREEN_RESOLUTION_HEIGHT = Framework.SCREEN_HEIGHT * Framework.SCREEN_RATIO;
                Framework.SCREEN_RESOLUTION_WIDTH = Framework.SCREEN_WIDTH * Framework.SCREEN_RATIO;
            }

            this.exposeDriver(driver);
            this.exposeFramework();
            this.exposeUltimatedMethods();

            resolve();
        });
    }

    exposeChai(webDriverInstance) {
        chai.use(chaiAsPromised);
        chai.should();
        chaiAsPromised.transferPromiseness = webDriverInstance.transferPromiseness;
    }

    enhanceDriver(webDriverInstance) {
        webDriverInstance.addPromiseChainMethod(
            'waitForClass',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                return this
                    .waitForElementByClassName(selector, timeout);
            }
        );
        webDriverInstance.addPromiseChainMethod(
            'waitForCssSelector',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                return this
                    .waitForElementByCssSelector(selector, timeout);
            }
        );
        webDriverInstance.addPromiseChainMethod(
            'waitForXPath',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                return this
                    .waitForElementByXPath(selector, timeout);
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'scrollDown',
            function(cssSelector) {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    if (cssSelector) {
                        return this
                            .execute(`document.querySelector('${cssSelector}').scrollTop = ${Framework.SCREEN_HEIGHT * 3 / 4}`);
                    } else {
                        return this
                            .scroll(0, Framework.SCREEN_HEIGHT * 3 / 4);
                    }
                } else {
                    return this
                        .execute('mobile: scroll', {direction: 'down'});
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'scrollUp',
            function() {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    return this
                        .scroll(0, 0);
                } else {
                    return this
                        .execute('mobile: scroll', {direction: 'up'});
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'handleKeyboard',
            function() {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    const output = shelljs.exec('adb shell dumpsys input_method | grep mInputShown', {silent: true});

                    if (output.includes('mInputShown=true')) {
                        return this.hideKeyboard();
                    } else {
                        return this;
                    }
                } else {
                    return this.hideKeyboard();
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'selectElement',
            function(selector, timeout = CONFIG.DEFAULT_WAIT_TIMEOUT_MS) {
                if (selector.includes('//')) {
                    return this
                        .waitForElementByXPath(selector, timeout)
                        .elementByXPath(selector);
                } else {
                    return this
                        .waitForElementByCssSelector(selector, timeout)
                        .elementByCssSelector(selector);
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'selectElements',
            function(selector, timeout = CONFIG.DEFAULT_WAIT_TIMEOUT_MS) {
                if (selector.includes('//')) {
                    return this
                        .waitForElementByXPath(selector, timeout)
                        .elementsByXPath(selector);
                } else {
                    return this
                        .waitForElementByCssSelector(selector, timeout)
                        .elementsByCssSelector(selector);
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'waitForElement',
            function(selector, timeout = CONFIG.DEFAULT_WAIT_TIMEOUT_MS) {
                if (selector.includes('//')) {
                    return this.waitForElementByXPath(selector, timeout);
                } else {
                    return this.waitForElementByCssSelector(selector, timeout);
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'waitLongerForElement',
            function(selector, timeout = CONFIG.MAXIMUM_WAIT_TIMEOUT_MS) {
                if (selector.includes('//')) {
                    return this.waitForElementByXPath(selector, timeout);
                } else {
                    return this.waitForElementByCssSelector(selector, timeout);
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'isElement',
            function(selector) {
                if (selector.includes('//')) {
                    return this.elementByXPathOrNull(selector);
                } else {
                    return this.elementByCssSelectorOrNull(selector);
                }
            }
        );

        // swipe example
        // await driver.context(Framework.CONTEXTS.NATIVE);
        // await driver.swipe({
        //     startX: 20, startY: 200,
        //     endX: 20,  endY: 80,
        //     duration: 800
        // });
        webDriverInstance.addPromiseChainMethod(
            'swipe',
            function (opts) {
                const action = new webDriverInstance.TouchAction();
                action
                    .press({x: opts.startX, y: opts.startY})
                    .wait(opts.duration)
                    .moveTo({x: opts.endX, y: opts.endY})
                    .release();

                if (Framework.CONTEXT === Framework.CONTEXTS.WEBVIEW) {
                    return this
                        .context(Framework.CONTEXTS.NATIVE)
                        .performTouchAction(action)
                        .context(Framework.CONTEXTS.WEBVIEW);
                } else {
                    return this
                        .performTouchAction(action);
                }
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'goToWebviewContext',
            function() {
                Framework.CONTEXT = Framework.CONTEXTS.WEBVIEW;

                return this
                    .context(Framework.CONTEXTS.WEBVIEW);
            }
        );

        webDriverInstance.addPromiseChainMethod(
            'goToNativeContext',
            function() {
                Framework.CONTEXT = Framework.CONTEXTS.NATIVE;

                return this
                    .context(Framework.CONTEXTS.NATIVE);
            }
        );
    }

    exposeDriver(driver) {
        global.driver = driver;
        global.driver.screenshot = async (path) => {
            await driver.saveScreenshot(`reports/${this.beginDateTime}/${this.deviceId}/${this.moduleName}-${path}.png`);
        };

        const comparer = screenshotComparer({
            Q: driver.Q,
            tolerance: CONFIG.SCREENSHOT_TOLERANCE,
            saveDiffImagePath: 'screenshot-reference',
            highlightColor: 'magenta',
            highlightStyle: 'XOR'
        });

        global.driver.compare = async (path) => {
            return await comparer.compareScreenshot(
                `screenshot-reference/${this.deviceId}/${this.moduleName}-${path}.png`,
                `reports/${this.beginDateTime}/${this.deviceId}/${this.moduleName}-${path}.png`
            );
        };
    }

    enhanceFramework() {
        Framework.utils = {
            getElementsListIndexByPhrase: async (phrase, list) => {
                let phraseIndex = 0;
                let i = 0;

                for (let listElement of list) {
                    if (String(await listElement.text()).toLowerCase().includes(phrase.toLowerCase())) {
                        phraseIndex = i;
                    }
                    i++;
                }

                return phraseIndex;
            },
            logInWithFacebook: async (username, password) => {
                await FacebookLogin.logIn(username, password);
            },
            nativeCalendar: NativeCalendar
        }
    }

    exposeFramework() {
        global.Framework = Framework;
        global.moment = moment;
    }

    exposeUltimatedMethods() {
        global.selectElement = driver.selectElement.bind(driver);
        global.selectElements = driver.selectElements.bind(driver);
        global.waitForElement = driver.waitForElement.bind(driver);
        global.waitLongerForElement = driver.waitLongerForElement.bind(driver);
        global.isElement = driver.isElement.bind(driver);
        global.handleKeyboard = driver.handleKeyboard.bind(driver);
        global.sleep = driver.sleep.bind(driver);
        global.swipe = driver.swipe.bind(driver);
        global.goToNativeContext = driver.goToNativeContext.bind(driver);
        global.goToWebviewContext = driver.goToWebviewContext.bind(driver);
    }

    async initAfter () {
        return new Promise(async (resolve) => {
            await driver.quit();
            resolve();
        });
    }

    executeTestSuite (its) {
        return function () {
            before(SuiteManager.initBefore.bind(SuiteManager, __filename));
            beforeEach(function() {
                if (Framework.PLATFORM === Framework.ANDROID) {
                    shelljs.exec(`adb -s ${this.deviceId} shell input keyevent KEYCODE_WAKEUP`, {silent: true});

                    // TODO use this info to write screen turn on/off script for android
                    // adb shell input touchscreen swipe 930 880 930 380 //Swipe UP
                    // adb shell input keyevent 82 && adb shell input keyevent 66 //unlock screen without pass
                    // adb shell input keyevent KEYCODE_POWER
                    // Android < 5.x.x
                    // adb shell dumpsys input_method
                    // In the output search for mScreenOn=true/false
                    //
                    //     Android >= 5.x.x
                    // adb shell dumpsys display
                    // In the output search for mScreenState=ON/OFF
                }
            });
            its();
            afterEach(function (done) {
                CommunicationManager.updateItStatus({
                    parent: this.currentTest.parent.title,
                    title: this.currentTest.title,
                    status: this.currentTest.state,
                    duration: this.currentTest.duration,
                    deviceId: SuiteManager.deviceId
                });

                if (this.currentTest.state === 'failed') {
                    shelljs.exec(`adb -s ${this.deviceId} shell input keyevent KEYCODE_WAKEUP`, {silent: true});
                    console.log('Test failed, taking screenshot...');
                    global.driver.screenshot(`${this.currentTest.title}-FAILED`).then(() => {
                        done();
                    });
                } else {
                    done();
                }
            });
            after(SuiteManager.initAfter.bind(SuiteManager));
        };
    }
};

export default new SuiteManagerClass();
