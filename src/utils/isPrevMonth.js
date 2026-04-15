import momentFactory from '../momentWrapper';

import isSameMonth from './isSameMonth';

export default function isPrevMonth(a, b, momentConfig) {
  if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
  return isSameMonth(a.clone().subtract(1, momentConfig.MonthProp), b);
}
