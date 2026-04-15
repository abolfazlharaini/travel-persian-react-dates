import momentFactory, { config } from '../momentWrapper';

import isSameDay from './isSameDay';

export default function isNextDay(a, b) {
  if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
  const nextDay = momentFactory().moment(a).add(1, 'day');
  return isSameDay(nextDay, b);
}
