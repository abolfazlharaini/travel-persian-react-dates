import moment from 'moment';
import momentJalali from 'moment-jalaali-patched';


var cachedLocale;
var configModel;

export const config = (locale) => {

    if (!locale)
        locale = 'en';

    if (cachedLocale === locale && configModel)
        return configModel;

    cachedLocale = locale;
    const isFa = cachedLocale === 'fa';

    configModel = {};
    configModel.isFa = isFa;
    configModel.locale = locale;
    configModel.YMFormat = isFa ? 'jMMMM jYYYY' : 'YYYY MMMM';
    configModel.MountFromat = isFa ? 'jMMMM' : 'MMMM';
    configModel.DayFromat = isFa ? 'jD' : 'D';
    configModel.FullISOFormat = isFa ? 'jYYYY-jMM-jDD' : 'YYYY-MM-DD';
    configModel.MonthISOFormat = isFa ? 'jYYYY-jMM' : 'YYYY-MM';
    configModel.MonthsProp = isFa ? 'jMonths' : 'months';
    configModel.MonthProp = isFa ? 'jMonth' : 'month';
    configModel.WeekProp = isFa ? 'jWeek' : 'week';

    configModel._toISODateString = (dateObj) => {
        return isFa ?
            dateObj.jYear() + '-' + String(dateObj.jMonth() + 1).padStart(2, '0') + '-' + String(dateObj.jDate()).padStart(2, '0') :
            dateObj.year() + '-' + String(dateObj.month() + 1).padStart(2, '0') + '-' + String(dateObj.date()).padStart(2, '0');
    };
    configModel._toISOMonthString = (dateObj) => {
        return isFa ?
            dateObj.jYear() + '-' + String(dateObj.jMonth() + 1).padStart(2, '0') :
            dateObj.year() + '-' + String(dateObj.month() + 1).padStart(2, '0')
    }
    configModel.AreMonthEqual = (day1, day2) => {
        if (!day1 || !day2)
            return false;

        return isFa ?
            day1.jMonth() === day2.jMonth() :
            day1.month() === day2.month()
    }
    configModel.FormatMonth = (date) => {
        return isFa ?
            momentJalali(date).format(configModel.YMFormat) :
            moment(date).format(configModel.YMFormat);
    }

    return configModel;
};
export function configPure(locale) {

    const isFa = locale === 'fa';

    const result = {};
    result.isFa = isFa;
    result.locale = locale;
    result.YMFormat = isFa ? 'jMMMM jYYYY' : 'YYYY MMMM';
    result.MountFromat = isFa ? 'jMMMM' : 'MMMM';
    result.DayFromat = isFa ? 'jD' : 'D';
    result.FullISOFormat = isFa ? 'jYYYY-jMM-jDD' : 'YYYY-MM-DD';
    result.MonthISOFormat = isFa ? 'jYYYY-jMM' : 'YYYY-MM';
    result.MonthsProp = isFa ? 'jMonths' : 'months';
    result.MonthProp = isFa ? 'jMonth' : 'month';
    result.WeekProp = isFa ? 'jWeek' : 'week';

    result._toISODateString = (dateObj) => {
        return isFa ?
            dateObj.jYear() + '-' + String(dateObj.jMonth() + 1).padStart(2, '0') + '-' + String(dateObj.jDate()).padStart(2, '0') :
            dateObj.year() + '-' + String(dateObj.month() + 1).padStart(2, '0') + '-' + String(dateObj.date()).padStart(2, '0');
    };
    result._toISOMonthString = (dateObj) => {
        return isFa ?
            dateObj.jYear() + '-' + String(dateObj.jMonth() + 1).padStart(2, '0') :
            dateObj.year() + '-' + String(dateObj.month() + 1).padStart(2, '0')
    }
    result.AreMonthEqual = (day1, day2) => {
        if (!day1 || !day2)
            return false;

        return isFa ?
            day1.jMonth() === day2.jMonth() :
            day1.month() === day2.month()
    }
    result.FormatMonth = (date) => {
        return isFa ?
            momentJalali(date).format(result.YMFormat) :
            moment(date).format(result.YMFormat);
    }

    return result;
};

export const momentConfigDefault = config('en');


const getMoment = () => ({ moment: momentJalali });
export default getMoment;
