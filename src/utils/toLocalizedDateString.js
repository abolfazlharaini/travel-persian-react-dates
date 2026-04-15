import momentFactory from '../momentWrapper';

import toMomentObject from './toMomentObject';


export default function toLocalizedDateString(date, currentFormat, momentConfig) {
    const dateObj = momentFactory().moment.isMoment(date) ? date : toMomentObject(date, currentFormat, momentConfig);
  if (!dateObj) return null;

    return momentFactory().moment(dateObj).format(momentConfig.FullISOFormat);
}
