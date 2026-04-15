import momentFactory, { config } from '../momentWrapper';

import isBeforeDay from './isBeforeDay';

export default function isInclusivelyAfterDay(a, b) {
  if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
  return !isBeforeDay(a, b);
}
