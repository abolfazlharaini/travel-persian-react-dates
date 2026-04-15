import momentFactory, { config } from '../momentWrapper';

import isAfterDay from './isAfterDay';

export default function isInclusivelyBeforeDay(a, b) {
  if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
  return !isAfterDay(a, b);
}
