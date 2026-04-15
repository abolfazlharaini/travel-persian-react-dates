import isSameDay from "../utils/isSameDay";

export default {
  rangePicker: {
    today: (day, { today }) => isSameDay(day, today),
    blocked: (day, { isOutsideRange }) => isOutsideRange(day),
    'blocked-out-of-range': (day, { isOutsideRange }) => isOutsideRange(day),
    'selected-start': (day, { startDate }) => isSameDay(day, startDate),
    'selected-end': (day, { endDate }) => isSameDay(day, endDate),
    'selected-span': (day, { startDate, endDate }) => day.isBetween(startDate, endDate, 'days'),
    hovered: (_, { focusedInput }) => !!focusedInput,
    'hovered-span': () => false
  },
  singlePicker: {
    today: (day, { today }) => isSameDay(day, today),
    blocked: (day, { isOutsideRange }) => isOutsideRange(day),
    'blocked-out-of-range': (day, { isOutsideRange }) => isOutsideRange(day),
    hovered: (_) => false,
    selected: (day, { date }) => isSameDay(day, date)
  }
}