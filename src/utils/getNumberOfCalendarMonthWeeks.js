import momentFactory from '../momentWrapper';
import momentJalali from 'moment-jalaali-patched';


function getBlankDaysBeforeFirstDay(firstDayOfMonth, firstDayOfWeek) {
  const weekDayDiff = firstDayOfMonth.day() - firstDayOfWeek;
  return (weekDayDiff + 7) % 7;
}

function getDaysInMonth(month, momentConfig) {
  return momentConfig.isFa ?
    momentJalali.jDaysInMonth(month.jYear(), month.jMonth()) :
    month.daysInMonth();
}

export default function getNumberOfCalendarMonthWeeks(
  month,
  firstDayOfWeek = momentFactory().moment.localeData().firstDayOfWeek(),
  momentConfig
) {
  const firstDayOfMonth = month.clone().startOf(momentConfig.MonthProp).hour(12);
  const numBlankDays = getBlankDaysBeforeFirstDay(firstDayOfMonth, firstDayOfWeek);
  return Math.ceil((numBlankDays + getDaysInMonth(month, momentConfig)) / 7);
}
