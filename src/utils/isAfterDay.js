import momentFactory, { config } from '../momentWrapper';

import isBeforeDay from './isBeforeDay';
import isSameDay from './isSameDay';

export default function isAfterDay(a, b) {
    if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
  return !isBeforeDay(a, b) && !isSameDay(a, b);
}
