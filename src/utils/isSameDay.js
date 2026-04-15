import momentFactory, { config } from '../momentWrapper';

export default function isSameDay(a, b) {
    if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
    // Compare least significant, most likely to change units first
    // Moment's isSame clones moment inputs and is a tad slow
        return a.date() === b.date()
            && a.month() === b.month()
            && a.year() === b.year();
}
