import momentFactory from '../momentWrapper';

import isSameMonth from './isSameMonth';

export default function isNextMonth(a, b, momentConfig) {
  if (!momentFactory().moment.isMoment(a) || !momentFactory().moment.isMoment(b)) return false;
  return isSameMonth(a.clone().add(1, momentConfig.MonthProp), b);
}
