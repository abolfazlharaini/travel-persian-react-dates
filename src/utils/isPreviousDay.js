import momentFactory, { config } from '../momentWrapper';

import isSameDay from './isSameDay';

export default function isPreviousDay(a, b) {
  if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
  const dayBefore = momentFactory().moment(a).subtract(1, 'day');
  return isSameDay(dayBefore, b);
}
