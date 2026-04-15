import momentFactory from '../momentWrapper';

import toMomentObject from './toMomentObject';

export default function toISODateString(date, currentFormat, momentConfig) {
    const dateObj = momentFactory().moment.isMoment(date) ? date : toMomentObject(date, currentFormat, momentConfig);
    if (!dateObj) return null;

    // Template strings compiled in strict mode uses concat, which is slow. Since
    // this code is in a hot path and we want it to be as fast as possible, we
    // want to use old-fashioned +.
    // eslint-disable-next-line prefer-template
    return momentConfig._toISODateString(dateObj);
}
