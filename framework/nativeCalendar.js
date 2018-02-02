const PAGE = {
    Android: {
        CALENDARS: [
            {}, {
                CALENDAR_WEEKDAY: '//*[@resource-id="android:id/date_picker_header"]',
                CALENDAR_CURRENT_DAY_NUMBER: '//*[@resource-id="android:id/date_picker_day"]',
                CALENDAR_CURRENT_YEAR: '//*[@resource-id="android:id/date_picker_year"]',
                CALENDAR_CURRENT_MONTH: '//*[@resource-id="android:id/date_picker_month"]',
                CALENDAR_OK: '//*[@resource-id="android:id/button1"]',
                CALENDAR_DAY_CONTENT: '//*[@content-desc="01 November 2017"]',
                CALENDAR_DAY_CONTENT_DEC: '//*[@content-desc="01 December 2017"]',
                CALENDAR_DAY_NUMBER_DOWN: '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.DatePicker[1]/android.widget.LinearLayout[1]/android.widget.ViewAnimator[1]/android.widget.ListView[1]/android.view.View[2]/android.view.View',
                CALENDAR_DAY_NUMBER_UP: '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.DatePicker[1]/android.widget.LinearLayout[1]/android.widget.ViewAnimator[1]/android.widget.ListView[1]/android.view.View[1]/android.view.View'

            }, {
                CALENDAR_DAY_NUMBER: '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.DatePicker[1]/android.widget.LinearLayout[1]/android.widget.ViewAnimator[1]/android.view.ViewGroup[1]/com.android.internal.widget.ViewPager[1]/android.view.View[1]/android.view.View',
                CALENDAR_YEAR: '//*[@resource-id="android:id/date_picker_header_year"]',
                CALENDAR_DATE: '//*[@resource-id="android:id/date_picker_header_date"]',
                PREV_MONTH: '//*[@resource-id="android:id/prev"]',
                NEXT_MONTH: '//*[@resource-id="android:id/next"]',
                CALENDAR_OK: '//*[@resource-id="android:id/button1"]'
            },
        ]
    }
};

PAGE.Android.CALENDARS[0].isCalendar = async () => {
    return false;
};

// CALENDAR TYPE 2
PAGE.Android.CALENDARS[2].isCalendar = async function() {
    return !!await isElement(`${PAGE.Android.CALENDARS[2].CALENDAR_DAY_NUMBER}[1]`);
};

PAGE.Android.CALENDARS[2].goToPreviousMonth = async function() {
    await driver
        .elementByXPath(this.currentCalendarObject.PREV_MONTH).click()
        .context(Framework.CONTEXTS.WEBVIEW)
        .context(Framework.CONTEXTS.NATIVE)
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER}[1]`).click();
};

PAGE.Android.CALENDARS[2].goToNextMonth = async function() {
    await driver
        .elementByXPath(this.currentCalendarObject.NEXT_MONTH).click()
        .context(Framework.CONTEXTS.WEBVIEW)
        .context(Framework.CONTEXTS.NATIVE)
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER}[1]`).click();
};

PAGE.Android.CALENDARS[2].getCurrentMonthNumber = async function() {
    const currentDayMonth = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_DATE).text());
    const currentYear = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_YEAR).text());
    const currentDate = `${currentDayMonth}, ${currentYear}`;

    const currentDateMomentObject = moment(Date.parse(currentDate.replace(/[ap]m$/i, '')));
    const currentMonthNumber = currentDateMomentObject.format('M');

    return currentMonthNumber;
};

PAGE.Android.CALENDARS[2].selectProperDayNumber = async function(targetDateMomentObject) {
    const targetDayNumber = targetDateMomentObject.format('D');

    await driver
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER}[${targetDayNumber}]`).click();
};

// CALENDAR TYPE 1
PAGE.Android.CALENDARS[1].isCalendar = async function() {
    const isCalendar = !!await isElement(`${PAGE.Android.CALENDARS[1].CALENDAR_DAY_NUMBER_DOWN}[1]`)
            || !!await isElement(`${PAGE.Android.CALENDARS[1].CALENDAR_DAY_NUMBER_UP}[1]`);

    return isCalendar;
};

PAGE.Android.CALENDARS[1].goToPreviousMonth = async function() {
    const height = Framework.SCREEN_HEIGHT * Framework.SCREEN_RATIO;
    const width =  Framework.SCREEN_WIDTH * Framework.SCREEN_RATIO;

    await driver.swipe({
        startX: parseInt(width * 0.5), startY: parseInt(height * 0.44),
        endX: parseInt(width * 0.5),  endY: parseInt(height * 0.765),
        // startX: 384, startY: 592,
        // startX: 735, startY: 1138,
        // endX: 735,  endY: 1960, //0.765625
        // endX: 384,  endY: 985,
        duration: 800
    })
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[1]`).click();
};

PAGE.Android.CALENDARS[1].goToNextMonth = async function() {
    await driver.swipe({
        startX: 384, startY: 985,
        endX: 384,  endY: 592,
        duration: 800
    })
        .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[1]`).click();
};

PAGE.Android.CALENDARS[1].getCurrentMonthNumber = async function() {
    const currentDay = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_CURRENT_DAY_NUMBER).text());
    const currentMonth = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_CURRENT_MONTH).text());
    const currentYear = String(await driver
        .elementByXPath(this.currentCalendarObject.CALENDAR_CURRENT_YEAR).text());
    const selectedDate = `${currentDay} ${currentMonth} ${currentYear}`;

    const currentDateMomentObject = moment(Date.parse(selectedDate.replace(/[ap]m$/i, '')));
    const currentMonthNumber = currentDateMomentObject.format('M');

    return currentMonthNumber;
};

PAGE.Android.CALENDARS[1].selectProperDayNumber = async function(targetDateMomentObject) {
    const targetDayNumber = targetDateMomentObject.format('D');

    if (!!await isElement(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[28]`)) {
        await driver
            .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_UP}[${targetDayNumber}]`).click();
    } else {
        await driver
            .elementByXPath(`${this.currentCalendarObject.CALENDAR_DAY_NUMBER_DOWN}[${targetDayNumber}]`).click();
    }
};

const NativeCalender = class {
    constructor() {
        this.calendarType = null;
        this.currentCalendarObject = null;
    }

    async pickDate(targetDateMomentObject) {
        await goToNativeContext();

        if (!this.calendarType) {
            await this._detectDatePicker();
        }

        await this._waitForDatePicker();
        await this._goToProperMonth(targetDateMomentObject);
        await this._selectProperDayNumber(targetDateMomentObject);
        await this._submitDatePicker();

        await goToWebviewContext();
    }

    async _detectDatePicker() {
        for (let i = 0, max = PAGE[Framework.PLATFORM].CALENDARS.length; i < max; i++) {
            if (await PAGE[Framework.PLATFORM].CALENDARS[i].isCalendar()) {
                this.calendarType = i;
                this.currentCalendarObject = PAGE[Framework.PLATFORM].CALENDARS[i];

                break;
            }
        }
    }

    async _waitForDatePicker() {
        await this.currentCalendarObject.isCalendar();
    }

    async _goToProperMonth(targetDateMomentObject) {
        const currentMonthNumber = parseInt(await this.currentCalendarObject.getCurrentMonthNumber.call(this));
        const targetMonthNumber = parseInt(targetDateMomentObject.format('M'));

        if (currentMonthNumber > targetMonthNumber) {
            while (parseInt(await this.currentCalendarObject.getCurrentMonthNumber.call(this)) !== targetMonthNumber) {
                await this.currentCalendarObject.goToPreviousMonth.call(this);
            }
        } else if (currentMonthNumber < targetMonthNumber) {
            while (parseInt(await this.currentCalendarObject.getCurrentMonthNumber.call(this)) !== targetMonthNumber) {
                await this.currentCalendarObject.goToNextMonth.call(this);
            }
        }
    }

    async _selectProperDayNumber(targetDateMomentObject) {
        await this.currentCalendarObject.selectProperDayNumber.call(this, targetDateMomentObject);
    }

    async _submitDatePicker() {
        await driver.elementByXPath(this.currentCalendarObject.CALENDAR_OK).click().sleep(1000);
    }
};

export default new NativeCalender();