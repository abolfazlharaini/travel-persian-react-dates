import momentFactory from '../momentWrapper';

import isBeforeDay from './isBeforeDay';
import isAfterDay from './isAfterDay';
import toISOMonthString from './toISOMonthString';

const startCacheOutsideDays = new Map();
const endCacheOutsideDays = new Map();

const startCacheInsideDays = new Map();
const endCacheInsideDays = new Map();

export default function isDayVisible(day, month, numberOfMonths, enableOutsideDays, momentConfig) {
  if (!momentFactory().moment.isMoment(day)) return false;

  // Cloning is a little expensive, so we want to do it as little as possible.

  const startKey = toISOMonthString(month, undefined, momentConfig);
  // eslint-disable-next-line prefer-template
  const endKey = startKey + '+' + numberOfMonths;

  if (enableOutsideDays) {
    if (!startCacheOutsideDays.has(startKey)) {
      startCacheOutsideDays.set(startKey, month.clone().startOf(momentConfig.MonthProp).startOf(momentConfig.WeekProp).hour(12));
    }

    if (isBeforeDay(day, startCacheOutsideDays.get(startKey))) return false;

    if (!endCacheOutsideDays.has(endKey)) {
      endCacheOutsideDays.set(
        endKey,
        month.clone().endOf(momentConfig.WeekProp).add(numberOfMonths - 1, momentConfig.MonthsProp).endOf(momentConfig.MonthProp)
          .endOf(momentConfig.WeekProp)
          .hour(12),
      );
    }

    return !isAfterDay(day, endCacheOutsideDays.get(endKey));
  }

  // !enableOutsideDays

  if (!startCacheInsideDays.has(startKey)) {
    startCacheInsideDays.set(startKey, month.clone().startOf(momentConfig.MonthProp).hour(12));
  }

  if (isBeforeDay(day, startCacheInsideDays.get(startKey))) return false;

  if (!endCacheInsideDays.has(endKey)) {
    endCacheInsideDays.set(
      endKey,
      month.clone().add(numberOfMonths - 1, momentConfig.MonthsProp).endOf(momentConfig.MonthProp).hour(12),
    );
  }

  return !isAfterDay(day, endCacheInsideDays.get(endKey));
}
