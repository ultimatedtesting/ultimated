const PAGE = {
    ANDROID: {
        CALENDAR_DAY_NUMBER: '//android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.DatePicker[1]/android.widget.LinearLayout[1]/android.widget.ViewAnimator[1]/android.view.ViewGroup[1]/com.android.internal.widget.ViewPager[1]/android.view.View[1]/android.view.View',
        CALENDAR_YEAR: '//*[@resource-id="android:id/date_picker_header_year"]',
        CALENDAR_DATE: '//*[@resource-id="android:id/date_picker_header_date"]',
        PREV_MONTH: '//*[@resource-id="android:id/prev"]',
        NEXT_MONTH: '//*[@resource-id="android:id/next"]',
        CALENDAR_OK: '//*[@resource-id="android:id/button1"]'
    }
};

const NativeCalender = class {
    async pickDate(targetDateMomentObject) {
        await driver.context(Framework.CONTEXTS.NATIVE);

        await this._waitForDatePicker();
        await this._goToProperMonth(targetDateMomentObject);
        await this._selectProperDayNumber(targetDateMomentObject);
        await this._submitDatePicker();

        await driver.context(Framework.CONTEXTS.WEBVIEW);
    }

    async _waitForDatePicker() {
        await driver
            .waitForXPath(PAGE.ANDROID.CALENDAR_DATE);
    }

    async _goToProperMonth(targetDateMomentObject) {
        const currentMonthNumber = await this._getCurrentMonthNumber();
        const targetMonthNumber = targetDateMomentObject.format('M');

        if (currentMonthNumber > targetMonthNumber) {
            while (await this._getCurrentMonthNumber() !== targetMonthNumber) {
                await this._goToPreviousMonth();
            }
        } else {
            while (await this._getCurrentMonthNumber() !== targetMonthNumber) {
                await this._goToNextMonth();
            }
        }
    }

    async _getCurrentMonthNumber() {
        const currentDayMonth = String(await driver
            .elementByXPath(PAGE.ANDROID.CALENDAR_DATE).text());
        const currentYear = String(await driver
            .elementByXPath(PAGE.ANDROID.CALENDAR_YEAR).text());
        const currentDate = `${currentDayMonth}, ${currentYear}`;

        const currentDateMomentObject = moment(Date.parse(currentDate.replace(/[ap]m$/i, '')));
        const currentMonthNumber = currentDateMomentObject.format('M');

        return currentMonthNumber;
    }

    async _goToPreviousMonth() {
        await driver
            .elementByXPath(PAGE.ANDROID.PREV_MONTH).click()
            .elementByXPath(`${PAGE.ANDROID.CALENDAR_DAY_NUMBER}[1]`).click();
    }

    async _goToNextMonth() {
        await driver
            .elementByXPath(PAGE.ANDROID.NEXT_MONTH).click()
            .elementByXPath(`${PAGE.ANDROID.CALENDAR_DAY_NUMBER}[1]`).click();
    }

    async _selectProperDayNumber(targetDateMomentObject) {
        const targetDayNumber = targetDateMomentObject.format('D');

        await driver
            .elementByXPath(`${PAGE.ANDROID.CALENDAR_DAY_NUMBER}[${targetDayNumber}]`).click();
    }

    async _submitDatePicker() {
        await driver
            .elementByXPath(PAGE.ANDROID.CALENDAR_OK).click()
            .sleep(1000);
    }
};

export default new NativeCalender();