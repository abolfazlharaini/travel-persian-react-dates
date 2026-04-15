import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from 'airbnb-prop-types';
import values from 'object.values';
import isTouchDevice from 'is-touch-device';

// App
//
import getVisibleDays from '../utils/getVisibleDays';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
import CalendarInfoPositionShape from '../shapes/CalendarInfoPositionShape';
import NavPositionShape from '../shapes/NavPositionShape';
import isSameDay from '../utils/isSameDay';
import isAfterDay from '../utils/isAfterDay';
import toISODateString from '../utils/toISODateString';
import isDayVisible from '../utils/isDayVisible';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import DayPickerFC from './DayPickerFC';
import getPooledMoment from '../utils/getPooledMoment';
import momentFactory, { momentConfigDefault } from '../momentWrapper';
import { DayPickerPhrases } from '../defaultPhrases';
import { addModifier, deleteModifier } from '../utils/modifiers';
import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
  INFO_POSITION_BOTTOM,
  NAV_POSITION_TOP,
} from '../constants';


const propTypes = forbidExtraProps({
  date: momentPropTypes.momentObj,
  minDate: momentPropTypes.momentObj,
  maxDate: momentPropTypes.momentObj,
  onDateChange: PropTypes.func,

  focused: PropTypes.bool,
  onFocusChange: PropTypes.func,
  onClose: PropTypes.func,

  keepOpenOnDateSelect: PropTypes.bool,
  isOutsideRange: PropTypes.func,

  // DayPicker props
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderWeekHeaderElement: PropTypes.func,
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  withPortal: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  firstDayOfWeek: DayOfWeekShape,
  // hideKeyboardShortcutsPanel: PropTypes.bool,
  daySize: nonNegativeInteger,
  // verticalHeight: nonNegativeInteger,
  // noBorder: PropTypes.bool,
  // verticalBorderSpacing: nonNegativeInteger,
  horizontalMonthPadding: nonNegativeInteger,

  dayPickerNavigationInlineStyles: PropTypes.object,
  navPosition: NavPositionShape,
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  renderNavPrevButton: PropTypes.func,
  renderNavNextButton: PropTypes.func,
  noNavButtons: PropTypes.bool,
  noNavNextButton: PropTypes.bool,
  noNavPrevButton: PropTypes.bool,

  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,
  onOutsideClick: PropTypes.func,
  renderCalendarInfo: PropTypes.func,
  calendarInfoPosition: CalendarInfoPositionShape,

  // accessibility
  onBlur: PropTypes.func,
  isFocused: PropTypes.bool,
  // showKeyboardShortcuts: PropTypes.bool,
  onTab: PropTypes.func,
  onShiftTab: PropTypes.func,

  // i18n
  weekDayFormat: PropTypes.string,
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)),

  // transitionDuration: nonNegativeInteger,
  // isDayBlocked: PropTypes.func,
  // isDayHighlighted: PropTypes.func,
  // renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  // renderCalendarDay: PropTypes.func,
  // renderDayContents: PropTypes.func,
  // monthFormat: PropTypes.string,
  // dayAriaLabelFormat: PropTypes.string,

  isRTL: PropTypes.bool,
  momentConfig: PropTypes.object,
  visibleDays: PropTypes.object,
});

const defaultProps = {
  date: undefined, // TODO: use null
  minDate: null,
  maxDate: null,
  onDateChange() { },

  focused: false,
  onFocusChange() { },
  onClose() { },

  keepOpenOnDateSelect: false,
  isOutsideRange() { },

  // DayPicker props
  renderWeekHeaderElement: null,
  enableOutsideDays: false,
  numberOfMonths: 1,
  orientation: HORIZONTAL_ORIENTATION,
  withPortal: false,
  // hideKeyboardShortcutsPanel: false,
  initialVisibleMonth: null,
  firstDayOfWeek: null,
  daySize: DAY_SIZE,
  // verticalHeight: null,
  // noBorder: false,
  // verticalBorderSpacing: undefined,
  horizontalMonthPadding: 13,

  dayPickerNavigationInlineStyles: null,
  navPosition: NAV_POSITION_TOP,
  navPrev: null,
  navNext: null,
  renderNavPrevButton: null,
  renderNavNextButton: null,
  noNavButtons: false,
  noNavNextButton: false,
  noNavPrevButton: false,

  onPrevMonthClick() { },
  onNextMonthClick() { },
  onOutsideClick() { },

  renderCalendarInfo: null,
  renderMonthElement: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,

  // accessibility
  onBlur() { },
  isFocused: false,
  // showKeyboardShortcuts: false,
  onTab() { },
  onShiftTab() { },

  // i18n
  weekDayFormat: 'dd',
  phrases: DayPickerPhrases,

  isRTL: false,
  momentConfig: momentConfigDefault,
  visibleDays: null,

  // transitionDuration: undefined,
  // isDayBlocked() {},
  // isDayHighlighted() {},
  // renderMonthText: null,
  // renderCalendarDay: undefined,
  // renderDayContents: null,
  // monthFormat: config().YMFormat,
  // dayAriaLabelFormat: undefined,
};

export default class DayPickerSingleDateController extends React.PureComponent {
  constructor (props) {
    super(props);

    this.isTouchDevice = false;
    this.today = momentFactory().moment();

    this.modifiers = {
      today: (day) => this.isToday(day),
      blocked: (day) => this.isBlocked(day),
      'blocked-out-of-range': (day) => props.isOutsideRange(day),
      hovered: (day) => this.isHovered(day),
      selected: (day) => this.isSelected(day),

      // valid: (day) => !this.isBlocked(day),
      // 'blocked-calendar': (day) => props.isDayBlocked(day),
      // 'highlighted-calendar': (day) => props.isDayHighlighted(day),
      // 'first-day-of-week': (day) => this.isFirstDayOfWeek(day),
      // 'last-day-of-week': (day) => this.isLastDayOfWeek(day),
    };

    const { currentMonth, visibleDays } = this.getStateForNewMonth(props, props.visibleDays);

    this.state = {
      hoverDate: null,
      currentMonth,
      visibleDays,
      disablePrev: this.shouldDisableMonthNavigation(props.minDate, currentMonth),
      disableNext: this.shouldDisableMonthNavigation(props.maxDate, currentMonth),
    };

    this.onDayMouseEnter = this.onDayMouseEnter.bind(this);
    this.onDayMouseLeave = this.onDayMouseLeave.bind(this);
    this.onDayClick = this.onDayClick.bind(this);

    this.onPrevMonthClick = this.onPrevMonthClick.bind(this);
    this.onNextMonthClick = this.onNextMonthClick.bind(this);
    this.onMonthChange = this.onMonthChange.bind(this);
    this.onYearChange = this.onYearChange.bind(this);
    this.onGetNextScrollableMonths = this.onGetNextScrollableMonths.bind(this);
    this.onGetPrevScrollableMonths = this.onGetPrevScrollableMonths.bind(this);
    this.getFirstFocusableDay = this.getFirstFocusableDay.bind(this);
  }

  componentDidMount() {
    this.isTouchDevice = isTouchDevice();
  }

  componentWillReceiveProps(nextProps) {
    const {
      date,
      focused,
      isOutsideRange,
      initialVisibleMonth,
      numberOfMonths,
      enableOutsideDays,
      // isDayBlocked,
      // isDayHighlighted,
    } = nextProps;
    const {
      isOutsideRange: prevIsOutsideRange,
      numberOfMonths: prevNumberOfMonths,
      enableOutsideDays: prevEnableOutsideDays,
      initialVisibleMonth: prevInitialVisibleMonth,
      focused: prevFocused,
      date: prevDate,
      // isDayBlocked: previsDayBlocked,
      // isDayHighlighted: previsDayHighlighted,
    } = this.props;
    let { visibleDays } = this.state;

    let recomputeOutsideRange = false;
    let recomputeDayBlocked = false;
    let recomputeDayHighlighted = false;

    if (isOutsideRange !== prevIsOutsideRange) {
      this.modifiers['blocked-out-of-range'] = (day) => isOutsideRange(day);
      recomputeOutsideRange = true;
    }

    // if (isDayBlocked !== prevIsDayBlocked) {
    //   // this.modifiers['blocked-calendar'] = (day) => isDayBlocked(day);
    //   recomputeDayBlocked = true;
    // }

    // if (isDayHighlighted !== prevIsDayHighlighted) {
    //   // this.modifiers['highlighted-calendar'] = (day) => isDayHighlighted(day);
    //   recomputeDayHighlighted = true;
    // }

    const recomputePropModifiers = (
      recomputeOutsideRange || recomputeDayBlocked || recomputeDayHighlighted
    );

    if (
      numberOfMonths !== prevNumberOfMonths
      || enableOutsideDays !== prevEnableOutsideDays
      || (
        initialVisibleMonth !== prevInitialVisibleMonth
        && !prevFocused
        && focused
      )
    ) {
      const newMonthState = this.getStateForNewMonth(nextProps);
      const { currentMonth } = newMonthState;
      ({ visibleDays } = newMonthState);
      this.setState({
        currentMonth,
        visibleDays,
      });
    }

    const didDateChange = date !== prevDate;
    const didFocusChange = focused !== prevFocused;

    let modifiers = {};

    if (didDateChange) {
      modifiers = this.deleteModifier(modifiers, prevDate, 'selected');
      modifiers = this.addModifier(modifiers, date, 'selected');
    }

    if (didFocusChange || recomputePropModifiers) {
      values(visibleDays).forEach((days) => {
        Object.keys(days).forEach((day) => {
          const momentObj = getPooledMoment(day);
          if (this.isBlocked(momentObj)) {
            modifiers = this.addModifier(modifiers, momentObj, 'blocked');
          } else {
            modifiers = this.deleteModifier(modifiers, momentObj, 'blocked');
          }

          if (didFocusChange || recomputeOutsideRange) {
            if (isOutsideRange(momentObj)) {
              modifiers = this.addModifier(modifiers, momentObj, 'blocked-out-of-range');
            } else {
              modifiers = this.deleteModifier(modifiers, momentObj, 'blocked-out-of-range');
            }
          }

          // if (didFocusChange || recomputeDayBlocked) {
          //   if (isDayBlocked(momentObj)) {
          //     modifiers = this.addModifier(modifiers, momentObj, 'blocked-calendar');
          //   } else {
          //     modifiers = this.deleteModifier(modifiers, momentObj, 'blocked-calendar');
          //   }
          // }

          // if (didFocusChange || recomputeDayHighlighted) {
          //   if (isDayHighlighted(momentObj)) {
          //     modifiers = this.addModifier(modifiers, momentObj, 'highlighted-calendar');
          //   } else {
          //     modifiers = this.deleteModifier(modifiers, momentObj, 'highlighted-calendar');
          //   }
          // }
        });
      });
    }

    const today = momentFactory().moment();
    if (!isSameDay(this.today, today)) {
      modifiers = this.deleteModifier(modifiers, this.today, 'today');
      modifiers = this.addModifier(modifiers, today, 'today');
      this.today = today;
    }

    if (Object.keys(modifiers).length > 0) {
      this.setState({
        visibleDays: {
          ...visibleDays,
          ...modifiers,
        },
      });
    }
  }

  componentWillUpdate() {
    this.today = momentFactory().moment();
  }

  onDayClick(day, e) {
    if (e) e.preventDefault();
    if (this.isBlocked(day)) return;
    const {
      onDateChange,
      keepOpenOnDateSelect,
      onFocusChange,
      onClose,
    } = this.props;

    onDateChange(day);
    if (!keepOpenOnDateSelect) {
      onFocusChange({ focused: false });
      onClose({ date: day });
    }
  }

  onDayMouseEnter(day) {
    if (this.isTouchDevice) return;
    const { hoverDate, visibleDays } = this.state;

    let modifiers = this.deleteModifier({}, hoverDate, 'hovered');
    modifiers = this.addModifier(modifiers, day, 'hovered');

    this.setState({
      hoverDate: day,
      visibleDays: {
        ...visibleDays,
        ...modifiers,
      },
    });
  }

  onDayMouseLeave() {
    const { hoverDate, visibleDays } = this.state;
    if (this.isTouchDevice || !hoverDate) return;

    const modifiers = this.deleteModifier({}, hoverDate, 'hovered');

    this.setState({
      hoverDate: null,
      visibleDays: {
        ...visibleDays,
        ...modifiers,
      },
    });
  }

  onPrevMonthClick() {
    const {
      enableOutsideDays,
      maxDate,
      minDate,
      numberOfMonths,
      onPrevMonthClick,
      momentConfig
    } = this.props;
    const { currentMonth, visibleDays } = this.state;

    const newVisibleDays = {};
    Object.keys(visibleDays).sort().slice(0, numberOfMonths + 1).forEach((month) => {
      newVisibleDays[month] = visibleDays[month];
    });

    const prevMonth = currentMonth.clone().subtract(1, momentConfig.MonthProp);
    const prevMonthVisibleDays = getVisibleDays(prevMonth, 1, enableOutsideDays, undefined, momentConfig);
    const newCurrentMonth = currentMonth.clone().subtract(1, 'month');

    this.setState({
      currentMonth: prevMonth,
      disablePrev: this.shouldDisableMonthNavigation(minDate, newCurrentMonth),
      disableNext: this.shouldDisableMonthNavigation(maxDate, newCurrentMonth),
      visibleDays: {
        ...newVisibleDays,
        ...this.getModifiers(prevMonthVisibleDays),
      },
    }, () => {
      onPrevMonthClick(prevMonth.clone());
    });
  }

  onNextMonthClick() {
    const {
      enableOutsideDays,
      maxDate,
      minDate,
      numberOfMonths,
      onNextMonthClick,
      momentConfig
    } = this.props;
    const { currentMonth, visibleDays } = this.state;

    const newVisibleDays = {};
    Object.keys(visibleDays).sort().slice(1).forEach((month) => {
      newVisibleDays[month] = visibleDays[month];
    });

    const nextMonth = currentMonth.clone().add(numberOfMonths, momentConfig.MonthProp);
    const nextMonthVisibleDays = getVisibleDays(nextMonth, 1, enableOutsideDays, undefined, momentConfig);

    const newCurrentMonth = currentMonth.clone().add(1, momentConfig.MonthProp);
    this.setState({
      currentMonth: newCurrentMonth,
      disablePrev: this.shouldDisableMonthNavigation(minDate, newCurrentMonth),
      disableNext: this.shouldDisableMonthNavigation(maxDate, newCurrentMonth),
      visibleDays: {
        ...newVisibleDays,
        ...this.getModifiers(nextMonthVisibleDays),
      },
    }, () => {
      onNextMonthClick(newCurrentMonth.clone());
    });
  }

  onMonthChange(newMonth) {
    const { numberOfMonths, enableOutsideDays, orientation, momentConfig } = this.props;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    const newVisibleDays = getVisibleDays(
      newMonth,
      numberOfMonths,
      enableOutsideDays,
      withoutTransitionMonths,
      momentConfig
    );

    this.setState({
      currentMonth: newMonth.clone(),
      visibleDays: this.getModifiers(newVisibleDays),
    });
  }

  onYearChange(newMonth) {
    const { numberOfMonths, enableOutsideDays, orientation, momentConfig } = this.props;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    const newVisibleDays = getVisibleDays(
      newMonth,
      numberOfMonths,
      enableOutsideDays,
      withoutTransitionMonths,
      momentConfig
    );

    this.setState({
      currentMonth: newMonth.clone(),
      visibleDays: this.getModifiers(newVisibleDays),
    });
  }

  onGetNextScrollableMonths() {
    const { numberOfMonths, enableOutsideDays, momentConfig } = this.props;
    const { currentMonth, visibleDays } = this.state;

    const numberOfVisibleMonths = Object.keys(visibleDays).length;
    const nextMonth = currentMonth.clone().add(numberOfVisibleMonths, momentConfig.MonthProp);
    const newVisibleDays = getVisibleDays(nextMonth, numberOfMonths, enableOutsideDays, true, momentConfig);

    this.setState({
      visibleDays: {
        ...visibleDays,
        ...this.getModifiers(newVisibleDays),
      },
    });
  }

  onGetPrevScrollableMonths() {
    const { numberOfMonths, enableOutsideDays, momentConfig } = this.props;
    const { currentMonth, visibleDays } = this.state;

    const firstPreviousMonth = currentMonth.clone().subtract(numberOfMonths, 'month');
    const newVisibleDays = getVisibleDays(
      firstPreviousMonth, numberOfMonths, enableOutsideDays, true, momentConfig
    );

    this.setState({
      currentMonth: firstPreviousMonth.clone(),
      visibleDays: {
        ...visibleDays,
        ...this.getModifiers(newVisibleDays),
      },
    });
  }

  getFirstFocusableDay(newMonth) {
    const { date, numberOfMonths, momentConfig } = this.props;

    let focusedDate = newMonth.clone().startOf(momentConfig.MonthProp).hour(12);
    if (date) {
      focusedDate = date.clone();
    }

    if (this.isBlocked(focusedDate)) {
      const days = [];
      const lastVisibleDay = newMonth.clone().add(numberOfMonths - 1, momentConfig.MonthsProp).endOf(momentConfig.MonthProp);
      let currentDay = focusedDate.clone();
      while (!isAfterDay(currentDay, lastVisibleDay)) {
        currentDay = currentDay.clone().add(1, 'day');
        days.push(currentDay);
      }

      const viableDays = days.filter((day) => !this.isBlocked(day) && isAfterDay(day, focusedDate));
      if (viableDays.length > 0) {
        ([focusedDate] = viableDays);
      }
    }

    return focusedDate;
  }

  getModifiers(visibleDays) {
    const modifiers = {};
    Object.keys(visibleDays).forEach((month) => {
      modifiers[month] = {};
      visibleDays[month].forEach((day) => {
        modifiers[month][toISODateString(day, undefined, this.props.momentConfig)] = this.getModifiersForDay(day);
      });
    });

    return modifiers;
  }

  getModifiersForDay(day) {
    return new Set(Object.keys(this.modifiers).filter((modifier) => this.modifiers[modifier](day)));
  }

  getStateForNewMonth(nextProps, initialVisibleDays) {
    const {
      initialVisibleMonth,
      date,
      numberOfMonths,
      orientation,
      enableOutsideDays,
      momentConfig
    } = nextProps;
    const initialVisibleMonthThunk = initialVisibleMonth || (date ? () => date.clone().locale(momentConfig.locale) : () => this.today);
    const currentMonth = initialVisibleMonthThunk();
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;

    const visibleDays = initialVisibleDays ?
      this.getModifiers(initialVisibleDays) :
      this.getModifiers(getVisibleDays(
        currentMonth,
        numberOfMonths,
        enableOutsideDays,
        withoutTransitionMonths,
        momentConfig
      ));
    return { currentMonth, visibleDays };
  }

  shouldDisableMonthNavigation(date, visibleMonth) {
    if (!date) return false;

    const {
      numberOfMonths,
      enableOutsideDays,
      momentConfig
    } = this.props;

    return isDayVisible(date, visibleMonth, numberOfMonths, enableOutsideDays, momentConfig);
  }

  addModifier(updatedDays, day, modifier) {
    return addModifier(updatedDays, day, modifier, this.props, this.state);
  }

  deleteModifier(updatedDays, day, modifier) {
    return deleteModifier(updatedDays, day, modifier, this.props, this.state);
  }

  isBlocked(day) {
    const {
      // isDayBlocked, 
      isOutsideRange } = this.props;
    return isOutsideRange(day);
    // isDayBlocked(day) ||
  }

  isHovered(day) {
    const { hoverDate } = this.state || {};
    return isSameDay(day, hoverDate);
  }

  isSelected(day) {
    const { date } = this.props;
    return isSameDay(day, date);
  }

  isToday(day) {
    return isSameDay(day, this.today);
  }

  // isFirstDayOfWeek(day) {
  //   const { firstDayOfWeek } = this.props;
  //   return day.day() === (firstDayOfWeek || momentFactory().moment.localeData().firstDayOfWeek());
  // }

  // isLastDayOfWeek(day) {
  //   const { firstDayOfWeek } = this.props;
  //   return day.day() === ((firstDayOfWeek || momentFactory().moment.localeData().firstDayOfWeek()) + 6) % 7;
  // }

  render() {
    const {
      numberOfMonths,
      orientation,
      renderWeekHeaderElement,
      dayPickerNavigationInlineStyles,
      navPosition,
      navPrev,
      navNext,
      renderNavPrevButton,
      renderNavNextButton,
      noNavButtons,
      noNavPrevButton,
      noNavNextButton,
      onOutsideClick,
      onShiftTab,
      onTab,
      withPortal,
      focused,
      enableOutsideDays,
      // hideKeyboardShortcutsPanel,
      daySize,
      firstDayOfWeek,
      renderCalendarInfo,
      renderMonthElement,
      calendarInfoPosition,
      isFocused,
      isRTL,
      phrases,
      onBlur,
      // showKeyboardShortcuts,
      weekDayFormat,
      // verticalHeight,
      // noBorder,
      // verticalBorderSpacing,
      horizontalMonthPadding,
      momentConfig,
      date

      // transitionDuration,
      // monthFormat,
      // renderMonthText,
      // renderCalendarDay,
      // renderDayContents,
      // dayAriaLabelFormat,
    } = this.props;

    const {
      currentMonth,
      disableNext,
      disablePrev,
      visibleDays,
    } = this.state;

    return (
      <DayPickerFC
        orientation={orientation}
        enableOutsideDays={enableOutsideDays}
        modifiers={visibleDays}
        numberOfMonths={numberOfMonths}
        onDayClick={this.onDayClick}
        onDayMouseEnter={this.onDayMouseEnter}
        onDayMouseLeave={this.onDayMouseLeave}
        onPrevMonthClick={this.onPrevMonthClick}
        onNextMonthClick={this.onNextMonthClick}
        onMonthChange={this.onMonthChange}
        onYearChange={this.onYearChange}
        onGetNextScrollableMonths={this.onGetNextScrollableMonths}
        onGetPrevScrollableMonths={this.onGetPrevScrollableMonths}
        withPortal={withPortal}
        hidden={!focused}
        // hideKeyboardShortcutsPanel={hideKeyboardShortcutsPanel}
        initialVisibleMonth={() => currentMonth}
        firstDayOfWeek={firstDayOfWeek}
        onOutsideClick={onOutsideClick}
        dayPickerNavigationInlineStyles={dayPickerNavigationInlineStyles}
        navPosition={navPosition}
        disablePrev={disablePrev}
        disableNext={disableNext}
        navPrev={navPrev}
        navNext={navNext}
        renderNavPrevButton={renderNavPrevButton}
        renderNavNextButton={renderNavNextButton}
        noNavButtons={noNavButtons}
        noNavNextButton={noNavNextButton}
        noNavPrevButton={noNavPrevButton}
        renderWeekHeaderElement={renderWeekHeaderElement}
        renderCalendarInfo={renderCalendarInfo}
        renderMonthElement={renderMonthElement}
        calendarInfoPosition={calendarInfoPosition}
        isFocused={isFocused}
        getFirstFocusableDay={this.getFirstFocusableDay}
        onBlur={onBlur}
        onTab={onTab}
        onShiftTab={onShiftTab}
        phrases={phrases}
        daySize={daySize}
        isRTL={isRTL}
        // showKeyboardShortcuts={showKeyboardShortcuts}
        weekDayFormat={weekDayFormat}
        // verticalHeight={verticalHeight}
        // noBorder={noBorder}
        // verticalBorderSpacing={verticalBorderSpacing}
        horizontalMonthPadding={horizontalMonthPadding}
        momentConfig={momentConfig}
        selectedMonthISO={date ? momentConfig._toISOMonthString(date) : null}

      // transitionDuration={transitionDuration}
      // monthFormat={monthFormat}
      // renderMonthText={renderMonthText}
      // renderCalendarDay={renderCalendarDay}
      // renderDayContents={renderDayContents}
      // dayAriaLabelFormat={dayAriaLabelFormat}
      />
    );
  }
}

DayPickerSingleDateController.propTypes = propTypes;
DayPickerSingleDateController.defaultProps = defaultProps;
