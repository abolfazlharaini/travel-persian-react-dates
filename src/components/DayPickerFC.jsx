import React from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import isTouchDevice from 'is-touch-device';
import OutsideClickHandler from 'react-outside-click-handler';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

// App
//
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import noflip from '../utils/noflip';
import CalendarMonthGrid from './CalendarMonthGrid';
import DayPickerNavigation from './DayPickerNavigation';
import getNumberOfCalendarMonthWeeks from '../utils/getNumberOfCalendarMonthWeeks';
import getCalendarMonthWidth from '../utils/getCalendarMonthWidth';
import calculateDimension from '../utils/calculateDimension';
import getActiveElement from '../utils/getActiveElement';
import isDayVisible from '../utils/isDayVisible';
import isSameMonth from '../utils/isSameMonth';
import ModifiersShape from '../shapes/ModifiersShape';
import NavPositionShape from '../shapes/NavPositionShape';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
import CalendarInfoPositionShape from '../shapes/CalendarInfoPositionShape';
import momentFactory, { momentConfigDefault } from '../momentWrapper';
import { DayPickerPhrases } from '../defaultPhrases';
import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
  INFO_POSITION_TOP,
  INFO_POSITION_BOTTOM,
  INFO_POSITION_BEFORE,
  INFO_POSITION_AFTER,
  MODIFIER_KEY_NAMES,
  NAV_POSITION_TOP,
  // NAV_POSITION_BOTTOM,
} from '../constants';
import usePreviousValue from '../utils/usePreviousValue';
import DayPickerWeakHeader from './DayPickerWeakHeader';

const MONTH_PADDING = 23;
const PREV_TRANSITION = 'prev';
const NEXT_TRANSITION = 'next';
const MONTH_SELECTION_TRANSITION = 'month_selection';
const YEAR_SELECTION_TRANSITION = 'year_selection';
const PREV_NAV = 'prev_nav';
const NEXT_NAV = 'next_nav';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,

  // calendar presentation props
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  withPortal: PropTypes.bool,
  onOutsideClick: PropTypes.func,
  hidden: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  firstDayOfWeek: DayOfWeekShape,
  renderCalendarInfo: PropTypes.func,
  calendarInfoPosition: CalendarInfoPositionShape,
  daySize: nonNegativeInteger,
  isRTL: PropTypes.bool,
  // noBorder: PropTypes.bool,
  horizontalMonthPadding: nonNegativeInteger,

  // navigation props
  dayPickerNavigationInlineStyles: PropTypes.object,
  disablePrev: PropTypes.bool,
  disableNext: PropTypes.bool,
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
  onMonthChange: PropTypes.func,
  onYearChange: PropTypes.func,
  onGetNextScrollableMonths: PropTypes.func, // VERTICAL_SCROLLABLE daypickers only
  onGetPrevScrollableMonths: PropTypes.func, // VERTICAL_SCROLLABLE daypickers only

  // month props
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderWeekHeaderElement: PropTypes.func,

  // day props
  modifiers: PropTypes.objectOf(PropTypes.objectOf(ModifiersShape)),
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,

  // accessibility props
  isFocused: PropTypes.bool,
  getFirstFocusableDay: PropTypes.func,
  onBlur: PropTypes.func,
  onTab: PropTypes.func,
  onShiftTab: PropTypes.func,

  // internationalization
  weekDayFormat: PropTypes.string,
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)),
  momentConfig: PropTypes.object,
  selectedMonthISO: PropTypes.string,
});

export const defaultProps = {
  // calendar presentation props
  enableOutsideDays: false,
  numberOfMonths: 2,
  orientation: HORIZONTAL_ORIENTATION,
  withPortal: false,
  onOutsideClick() { },
  hidden: false,
  initialVisibleMonth: () => momentFactory().moment(),
  firstDayOfWeek: null,
  renderCalendarInfo: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,
  daySize: DAY_SIZE,
  isRTL: false,
  // verticalHeight: null,
  // noBorder: false,
  // verticalBorderSpacing: undefined,
  horizontalMonthPadding: 13,

  // navigation props
  dayPickerNavigationInlineStyles: null,
  disablePrev: false,
  disableNext: false,
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
  onMonthChange() { },
  onYearChange() { },
  onGetNextScrollableMonths() { },
  onGetPrevScrollableMonths() { },

  // month props
  renderMonthElement: null,
  renderWeekHeaderElement: null,

  // day props
  modifiers: {},
  onDayClick() { },
  onDayMouseEnter() { },
  onDayMouseLeave() { },

  // accessibility props
  isFocused: false,
  getFirstFocusableDay: null,
  onBlur() { },
  onTab() { },
  onShiftTab() { },

  // internationalization
  weekDayFormat: 'dd',
  phrases: DayPickerPhrases,
  momentConfig: momentConfigDefault,
  selectedMonthISO: null
};


let hasSetInitialVisibleMonth;
let calendarMonthGridHeight;
let setCalendarInfoWidthTimeout;
let setCalendarMonthGridHeightTimeout;
let throttledKeyDown;
let calendarMonthWeeks;
let isFirstRun = true;

const DayPicker = (props) => {

  const prevProps = usePreviousValue({
    orientation: props.orientation,
    daySize: props.daySize,
    isFocused: props.isFocused
  });

  /**
   * Refs
   */
  const transitionContainerRef = React.useRef();
  const calendarInfoRef = React.useRef();
  const containerRef = React.useRef();

  /**
   * State
   */
  const [state, setState] = React.useState(() => {

    const { horizontalMonthPadding } = props;
    const translationValue = props.isRTL && getIsHorizontal()
      ? -getCalendarMonthWidth(props.daySize, horizontalMonthPadding)
      : 0;

    return {
      currentMonthScrollTop: null,
      monthTransition: null,
      translationValue,
      scrollableMonthMultiple: 1,
      calendarMonthWidth: getCalendarMonthWidth(props.daySize, horizontalMonthPadding),
      nextFocusedDate: null,
      isTouchDevice: isTouchDevice(),
      withMouseInteractions: true,
      calendarInfoWidth: 0,
      monthTitleHeight: null,
      hasSetHeight: false,
    }
  });
  const prevState = usePreviousValue({
    currentMonth: state.currentMonth
  });

  /**
   * Memoization variables
   */
  const dayPickerFirstDayOfWeek = React.useMemo(() => {
    const { firstDayOfWeek } = props;
    if (firstDayOfWeek == null) {
      return momentFactory().moment.localeData().firstDayOfWeek();
    }

    return firstDayOfWeek;
  }, [props.firstDayOfWeek])

  const firstVisibleMonthIndex = React.useMemo(() => {

    const { orientation } = props;
    const { monthTransition } = state;

    if (orientation === VERTICAL_SCROLLABLE) return 0;

    let firstVisibleMonthIndex = 1;
    if (monthTransition === PREV_TRANSITION) {
      firstVisibleMonthIndex -= 1;
    } else if (monthTransition === NEXT_TRANSITION) {
      firstVisibleMonthIndex += 1;
    }

    return firstVisibleMonthIndex;
  }, [props.orientation, state.monthTransition])


  /**
   * Methods
   */
  function _updateState(payload) {
    setState((currentState) => ({
      ...currentState,
      ...payload
    }));
  }

  function onKeyDown(e) {
    e.stopPropagation();

    if (!MODIFIER_KEY_NAMES.has(e.key)) {
      throttledKeyDown(e);
    }
  }

  function onFinalKeyDown(e) {

    _updateState({ withMouseInteractions: false });

    const {
      onBlur,
      onTab,
      onShiftTab,
      isRTL,
      momentConfig
    } = props;
    const {
      focusedDate
    } = state;
    if (!focusedDate) return;

    const newFocusedDate = focusedDate.clone();

    let didTransitionMonth = false;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newFocusedDate.subtract(1, momentConfig.WeekProp);
        didTransitionMonth = maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (isRTL) {
          newFocusedDate.add(1, 'day');
        } else {
          newFocusedDate.subtract(1, 'day');
        }
        didTransitionMonth = maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'Home':
        e.preventDefault();
        newFocusedDate.startOf(momentConfig.WeekProp).hour(12);
        didTransitionMonth = maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'PageUp':
        e.preventDefault();
        newFocusedDate.subtract(1, momentConfig.MonthProp);
        didTransitionMonth = maybeTransitionPrevMonth(newFocusedDate);
        break;

      case 'ArrowDown':
        e.preventDefault();
        newFocusedDate.add(1, momentConfig.WeekProp);
        didTransitionMonth = maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (isRTL) {
          newFocusedDate.subtract(1, 'day');
        } else {
          newFocusedDate.add(1, 'day');
        }
        didTransitionMonth = maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'End':
        e.preventDefault();
        newFocusedDate.endOf(momentConfig.WeekProp);
        didTransitionMonth = maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'PageDown':
        e.preventDefault();
        newFocusedDate.add(1, momentConfig.MonthProp);
        didTransitionMonth = maybeTransitionNextMonth(newFocusedDate);
        break;

      case 'Escape':
        onBlur(e);
        break;

      case 'Tab':
        if (e.shiftKey) {
          onShiftTab();
        } else {
          onTab(e);
        }
        break;

      default:
        break;
    }

    // If there was a month transition, do not update the focused date until the transition has
    // completed. Otherwise, attempting to focus on a DOM node may interrupt the CSS animation. If
    // didTransitionMonth is true, the focusedDate gets updated in #updateStateAfterMonthTransition
    if (!didTransitionMonth) {
      _updateState({
        focusedDate: newFocusedDate,
      });
    }
  }

  function onPrevMonthTransition(nextFocusedDate) {
    const { daySize, isRTL, numberOfMonths } = props;
    const { calendarMonthWidth, monthTitleHeight } = state;

    let translationValue;
    if (getIsVertical()) {
      const calendarMonthWeeksHeight = calendarMonthWeeks[0] * (daySize - 1);
      translationValue = monthTitleHeight + calendarMonthWeeksHeight + 1;
    } else if (getIsHorizontal()) {
      translationValue = calendarMonthWidth;
      if (isRTL) {
        translationValue = -2 * calendarMonthWidth;
      }

      const visibleCalendarWeeks = calendarMonthWeeks.slice(0, numberOfMonths);
      const calendarMonthWeeksHeight = Math.max(0, ...visibleCalendarWeeks) * (daySize - 1);
      const newMonthHeight = monthTitleHeight + calendarMonthWeeksHeight + 1;
      adjustDayPickerHeight(newMonthHeight);
    }

    _updateState({
      monthTransition: PREV_TRANSITION,
      translationValue,
      focusedDate: null,
      nextFocusedDate,
    });
  }

  function onMonthChange(currentMonth) {
    setCalendarMonthWeeks(currentMonth);
    calculateAndSetDayPickerHeight();

    // Translation value is a hack to force an invisible transition that
    // properly rerenders the CalendarMonthGrid
    _updateState({
      monthTransition: MONTH_SELECTION_TRANSITION,
      translationValue: 0.00001,
      focusedDate: null,
      nextFocusedDate: currentMonth,
      currentMonth,
    });
  }

  function onYearChange(currentMonth) {
    setCalendarMonthWeeks(currentMonth);
    calculateAndSetDayPickerHeight();

    // Translation value is a hack to force an invisible transition that
    // properly rerenders the CalendarMonthGrid
    _updateState({
      monthTransition: YEAR_SELECTION_TRANSITION,
      translationValue: 0.0001,
      focusedDate: null,
      nextFocusedDate: currentMonth,
      currentMonth,
    });
  }

  function onNextMonthTransition(nextFocusedDate) {
    const { isRTL, numberOfMonths, daySize } = props;
    const { calendarMonthWidth, monthTitleHeight } = state;

    let translationValue;

    if (getIsVertical()) {
      const firstVisibleMonthWeeks = calendarMonthWeeks[1];
      const calendarMonthWeeksHeight = firstVisibleMonthWeeks * (daySize - 1);
      translationValue = -(monthTitleHeight + calendarMonthWeeksHeight + 1);
    }

    if (getIsHorizontal()) {
      translationValue = -calendarMonthWidth;
      if (isRTL) {
        translationValue = 0;
      }

      const visibleCalendarWeeks = calendarMonthWeeks.slice(2, numberOfMonths + 2);
      const calendarMonthWeeksHeight = Math.max(0, ...visibleCalendarWeeks) * (daySize - 1);
      const newMonthHeight = monthTitleHeight + calendarMonthWeeksHeight + 1;
      adjustDayPickerHeight(newMonthHeight);
    }

    _updateState({
      monthTransition: NEXT_TRANSITION,
      translationValue,
      focusedDate: null,
      nextFocusedDate,
    });
  }

  function getFocusedDay(newMonth) {
    const { getFirstFocusableDay, numberOfMonths, momentConfig } = props;

    let focusedDate;
    if (getFirstFocusableDay) {
      focusedDate = getFirstFocusableDay(newMonth);
    }

    if (newMonth && (!focusedDate || !isDayVisible(focusedDate, newMonth, numberOfMonths, undefined, momentConfig))) {
      focusedDate = newMonth.clone().startOf(momentConfig.MonthProp).hour(12);
    }

    return focusedDate;
  }

  function setMonthTitleHeight(monthTitleHeight) {
    _updateState({
      monthTitleHeight,
    });
    calculateAndSetDayPickerHeight(monthTitleHeight);
  }

  function setCalendarMonthWeeks(currentMonth) {

    const { numberOfMonths, momentConfig } = props;

    calendarMonthWeeks = [];
    let month = currentMonth.clone().subtract(1, momentConfig.MonthProp);
    for (let i = 0; i < numberOfMonths + 2; i += 1) {
      const numberOfWeeks = getNumberOfCalendarMonthWeeks(month, dayPickerFirstDayOfWeek, momentConfig);
      calendarMonthWeeks.push(numberOfWeeks);
      month = month.add(1, momentConfig.MonthsProp);
    }
  }

  function getNextScrollableMonths(e) {
    const { onGetNextScrollableMonths } = props;
    if (e) e.preventDefault();

    if (onGetNextScrollableMonths) onGetNextScrollableMonths(e);

    _updateState(({ scrollableMonthMultiple }) => ({
      scrollableMonthMultiple: scrollableMonthMultiple + 1,
    }));
  }

  function getPrevScrollableMonths(e) {
    const { numberOfMonths, onGetPrevScrollableMonths } = props;
    if (e) e.preventDefault();

    if (onGetPrevScrollableMonths) onGetPrevScrollableMonths(e);

    _updateState(({ currentMonth, scrollableMonthMultiple }) => ({
      currentMonth: currentMonth.clone().subtract(numberOfMonths, 'month'),
      scrollableMonthMultiple: scrollableMonthMultiple + 1,
    }));
  }

  function maybeTransitionNextMonth(newFocusedDate) {
    const { numberOfMonths, momentConfig } = props;
    const { currentMonth, focusedDate } = state;

    const newFocusedDateMonth = newFocusedDate.month();
    const focusedDateMonth = focusedDate.month();
    const isNewFocusedDateVisible = isDayVisible(newFocusedDate, currentMonth, numberOfMonths, undefined, momentConfig);
    if (newFocusedDateMonth !== focusedDateMonth && !isNewFocusedDateVisible) {
      onNextMonthTransition(newFocusedDate);
      return true;
    }

    return false;
  }

  function maybeTransitionPrevMonth(newFocusedDate) {
    const { numberOfMonths, momentConfig } = props;
    const { currentMonth, focusedDate } = state;

    const newFocusedDateMonth = newFocusedDate.month();
    const focusedDateMonth = focusedDate.month();
    const isNewFocusedDateVisible = isDayVisible(newFocusedDate, currentMonth, numberOfMonths, undefined, momentConfig);
    if (newFocusedDateMonth !== focusedDateMonth && !isNewFocusedDateVisible) {
      onPrevMonthTransition(newFocusedDate);
      return true;
    }

    return false;
  }

  function getIsHorizontal() { return props.orientation === HORIZONTAL_ORIENTATION; }

  function getIsVertical() { return props.orientation === VERTICAL_ORIENTATION || props.orientation === VERTICAL_SCROLLABLE; }

  function updateStateAfterMonthTransition() {

    const {
      onPrevMonthClick,
      onNextMonthClick,
      numberOfMonths,
      onMonthChange,
      onYearChange,
      isRTL,
      momentConfig
    } = props;

    const {
      currentMonth,
      monthTransition,
      focusedDate,
      nextFocusedDate,
      withMouseInteractions,
      calendarMonthWidth,
    } = state;

    if (!monthTransition) return;


    // debugger

    const newMonth = currentMonth.clone();
    if (monthTransition === PREV_TRANSITION) {
      newMonth.subtract(1, momentConfig.MonthProp);
      if (onPrevMonthClick) onPrevMonthClick(newMonth);
      const newInvisibleMonth = newMonth.clone().subtract(1, momentConfig.MonthProp);
      const numberOfWeeks = getNumberOfCalendarMonthWeeks(newInvisibleMonth, dayPickerFirstDayOfWeek, momentConfig);
      calendarMonthWeeks = [numberOfWeeks, ...calendarMonthWeeks.slice(0, -1)];
    } else if (monthTransition === NEXT_TRANSITION) {
      newMonth.add(1, momentConfig.MonthProp);
      if (onNextMonthClick) onNextMonthClick(newMonth);
      const newInvisibleMonth = newMonth.clone().add(numberOfMonths, momentConfig.MonthProp);
      const numberOfWeeks = getNumberOfCalendarMonthWeeks(newInvisibleMonth, dayPickerFirstDayOfWeek, momentConfig);
      calendarMonthWeeks = [...calendarMonthWeeks.slice(1), numberOfWeeks];
    } else if (monthTransition === MONTH_SELECTION_TRANSITION) {
      if (onMonthChange) onMonthChange(newMonth);
    } else if (monthTransition === YEAR_SELECTION_TRANSITION) {
      if (onYearChange) onYearChange(newMonth);
    }

    let newFocusedDate = null;
    if (nextFocusedDate) {
      newFocusedDate = nextFocusedDate;
    } else if (!focusedDate && !withMouseInteractions) {
      newFocusedDate = getFocusedDay(newMonth);
    }

    _updateState({
      currentMonth: newMonth,
      monthTransition: null,
      translationValue: (isRTL && getIsHorizontal()) ? -calendarMonthWidth : 0,
      nextFocusedDate: null,
      focusedDate: newFocusedDate,
    });
    // we don't want to focus on the relevant calendar day after a month transition
    // if the user is navigating around using a mouse
    setTimeout(() => {
      if (withMouseInteractions) {
        const activeElement = getActiveElement();
        if (
          activeElement
          && activeElement !== document.body
          && containerRef.current.contains(activeElement)
          && activeElement.blur
        ) {
          activeElement.blur();
        }
      }
    }, 0);
  }

  function adjustDayPickerHeight(newMonthHeight) {
    const monthHeight = newMonthHeight + MONTH_PADDING;
    if (monthHeight !== calendarMonthGridHeight) {
      transitionContainerRef.current.style.height = `${monthHeight}px`;
      if (!calendarMonthGridHeight) {
        setCalendarMonthGridHeightTimeout = setTimeout(() => {
          if (!state.hasSetHeight)
            _updateState({ hasSetHeight: true });
        }, 0);
      }
      calendarMonthGridHeight = monthHeight;
    }
  }

  function calculateAndSetDayPickerHeight(newMonthTitleHeight) {
    const { daySize, numberOfMonths } = props;
    const { monthTitleHeight } = state;

    const visibleCalendarWeeks = calendarMonthWeeks.slice(1, numberOfMonths + 1);
    const calendarMonthWeeksHeight = Math.max(0, ...visibleCalendarWeeks) * (daySize - 1);
    const newMonthHeight = (newMonthTitleHeight ? newMonthTitleHeight : monthTitleHeight) + calendarMonthWeeksHeight + 1;

    if (getIsHorizontal()) {
      adjustDayPickerHeight(newMonthHeight);
    }
  }

  function renderNavigation(navDirection) {
    const {
      dayPickerNavigationInlineStyles,
      disablePrev,
      disableNext,
      navPosition,
      navPrev,
      navNext,
      noNavButtons,
      noNavNextButton,
      noNavPrevButton,
      orientation,
      phrases,
      renderNavPrevButton,
      renderNavNextButton,
      isRTL,
    } = props;

    if (noNavButtons) {
      return null;
    }

    const onPrevMonthClick = orientation === VERTICAL_SCROLLABLE
      ? getPrevScrollableMonths
      : dayPickerOnPrevMonthClick;

    const onNextMonthClick = orientation === VERTICAL_SCROLLABLE
      ? getNextScrollableMonths
      : dayPickerOnNextMonthClick;

    return (
      <DayPickerNavigation
        disablePrev={disablePrev}
        disableNext={disableNext}
        inlineStyles={dayPickerNavigationInlineStyles}
        onPrevMonthClick={onPrevMonthClick}
        onNextMonthClick={onNextMonthClick}
        navPosition={navPosition}
        navPrev={navPrev}
        navNext={navNext}
        renderNavPrevButton={renderNavPrevButton}
        renderNavNextButton={renderNavNextButton}
        orientation={orientation}
        phrases={phrases}
        isRTL={isRTL}
        showNavNextButton={
          !(noNavNextButton || (orientation === VERTICAL_SCROLLABLE && navDirection === PREV_NAV))
        }
        showNavPrevButton={
          !(noNavPrevButton || (orientation === VERTICAL_SCROLLABLE && navDirection === NEXT_NAV))
        }
      />
    );
  }

  function generateCurrentMonth() {
    return props.hidden ? momentFactory().moment() : props.initialVisibleMonth();
  }

  function dayPickerOnNextMonthClick(e) {
    if (e) e.preventDefault();
    onNextMonthTransition();
  }
  function dayPickerOnPrevMonthClick(e) {
    if (e) e.preventDefault();
    onPrevMonthTransition();
  }

  /**
   * Lifecycles
   */
  function constructor() {

    isFirstRun = true;

    // console.log('DayPickerFC, constructor')

    hasSetInitialVisibleMonth = !props.hidden;

    // setCalendarMonthWeeks(currentMonth);

    calendarMonthGridHeight = 0;
    setCalendarInfoWidthTimeout = null;
    setCalendarMonthGridHeightTimeout = null;

    throttledKeyDown = throttle(onFinalKeyDown, 200, { trailing: false });
  }

  function componentDidMount(currentMonth) {

    isFirstRun = false;

    // console.log('DayPickerFC, componentDidMount')

    let focusedDate = currentMonth.clone().startOf(props.momentConfig.MonthProp).hour(12);
    if (props.getFirstFocusableDay) {
      focusedDate = props.getFirstFocusableDay(currentMonth);
    }

    _updateState({
      focusedDate: (!props.hidden || props.isFocused) ? focusedDate : null,
      currentMonth,

      isTouchDevice: isTouchDevice(),
      calendarInfoWidth: calendarInfoRef.current ?
        calculateDimension(calendarInfoRef.current, 'width', true, true) :
        0,
      currentMonthScrollTop: (transitionContainerRef.current && props.orientation === VERTICAL_SCROLLABLE) ?
        (transitionContainerRef.current.scrollHeight - transitionContainerRef.current.scrollTop) :
        null,
    });

    setCalendarMonthWeeks(currentMonth);
  }

  function componentWillUnmount() {

    // console.log('DayPickerFC, componentWillUnmount')

    clearTimeout(setCalendarInfoWidthTimeout);
    clearTimeout(setCalendarMonthGridHeightTimeout);
  }

  function componentDidUpdate() {

    // console.log('DayPickerFC, componentDidUpdate')

    const {
      orientation,
      daySize,
      isFocused,
      numberOfMonths,
    } = props;
    const {
      currentMonth,
      currentMonthScrollTop,
      focusedDate,
      monthTitleHeight,
    } = state;
    // debugger
    if (
      getIsHorizontal()
      && (orientation !== prevProps.orientation || daySize !== prevProps.daySize)
    ) {
      const visibleCalendarWeeks = calendarMonthWeeks.slice(1, numberOfMonths + 1);
      const calendarMonthWeeksHeight = Math.max(0, ...visibleCalendarWeeks) * (daySize - 1);
      const newMonthHeight = monthTitleHeight + calendarMonthWeeksHeight + 1;
      adjustDayPickerHeight(newMonthHeight);
    }

    if (!prevProps.isFocused && isFocused && !focusedDate) {
      containerRef.current.focus();
    }

    // If orientation is VERTICAL_SCROLLABLE and currentMonth has changed adjust scrollTop so the
    // new months rendered above the current month don't push the current month out of view.
    if (
      orientation === VERTICAL_SCROLLABLE
      && !isSameMonth(prevState.currentMonth, currentMonth)
      && currentMonthScrollTop
      && transitionContainerRef.current
    ) {
      transitionContainerRef.current.scrollTop = transitionContainerRef.current.scrollHeight - currentMonthScrollTop;
    }
  }

  function componentWillReceiveProps(nextProps, nextState) {

    // console.log('DayPickerFC, componentWillReceiveProps')

    const {
      hidden,
      isFocused,
      orientation,
      horizontalMonthPadding,
    } = nextProps;
    const { currentMonth } = prevState;
    const { currentMonth: nextCurrentMonth } = nextState;
    // debugger
    if (!hidden) {
      if (!hasSetInitialVisibleMonth) {
        hasSetInitialVisibleMonth = true;
        _updateState({
          currentMonth: nextProps.initialVisibleMonth(),
        });
      }
    }

    const {
      daySize,
      isFocused: prevIsFocused,
    } = prevProps;

    if (nextProps.daySize !== daySize) {
      _updateState({
        calendarMonthWidth: getCalendarMonthWidth(
          nextProps.daySize,
          horizontalMonthPadding,
        ),
      });
    }

    if (isFocused !== prevIsFocused) {
      if (isFocused) {
        const focusedDate = getFocusedDay(currentMonth);

        _updateState({
          focusedDate,
          withMouseInteractions: false,
        });
      } else {
        if (state.focusedDate)
          _updateState({ focusedDate: null });
      }
    }

    // Capture the scroll position so when previous months are rendered above the current month
    // we can adjust scroll after the component has updated and the previous current month
    // stays in view.
    if (
      orientation === VERTICAL_SCROLLABLE
      && transitionContainerRef.current
      && !isSameMonth(currentMonth, nextCurrentMonth)
    ) {
      _updateState({
        currentMonthScrollTop: transitionContainerRef.current.scrollHeight - transitionContainerRef.current.scrollTop,
      });
    }
  }

  function componentWillUpdate() {

    // console.log('DayPickerFC, componentWillUpdate')

    if (calendarInfoRef.current) {
      setCalendarInfoWidthTimeout = setTimeout(() => {
        const { calendarInfoWidth } = state;
        const calendarInfoPanelWidth = calculateDimension(calendarInfoRef.current, 'width', true, true);
        if (calendarInfoWidth !== calendarInfoPanelWidth) {
          _updateState({
            calendarInfoWidth: calendarInfoPanelWidth,
          });
        }
      }, 0);
    }
  }

  React.useMemo(() => {
    constructor();
  }, []);

  React.useEffect(() => {

    const currentMonth = generateCurrentMonth();
    componentDidMount(currentMonth);

    return () => {
      componentWillUnmount();
    }
  }, []);

  React.useEffect(() => {

    if (!isFirstRun) {
      componentDidUpdate();
    }

  }, [
    //props.orientation,
    //props.daySize,
    props.isFocused,
    //props.numberOfMonths,
    state.currentMonth,
    state.currentMonthScrollTop,
    state.focusedDate,
    state.monthTitleHeight,
  ]);

  React.useMemo(() => {

    if (!isFirstRun) {
      componentWillUpdate()
    }

  }, [calendarInfoRef.current, state.calendarInfoWidth]);

  React.useMemo(() => {

    if (!isFirstRun) {
      componentWillReceiveProps(props, state);
    }

  }, [
    props.hidden,
    props.isFocused,
    // props.orientation,
    // props.horizontalMonthPadding,
    // props.daySize,
    state.currentMonth
  ]);


  /**
   * Render
   */

  const {
    calendarMonthWidth,
    currentMonth,
    translationValue,
    scrollableMonthMultiple,
    hasSetHeight,
    calendarInfoWidth,
    monthTitleHeight,
  } = state;

  const {
    enableOutsideDays,
    numberOfMonths,
    orientation,
    modifiers,
    withPortal,
    onDayClick,
    onDayMouseEnter,
    onDayMouseLeave,
    firstDayOfWeek,
    renderCalendarInfo,
    renderMonthElement,
    calendarInfoPosition,
    onOutsideClick,
    daySize,
    isFocused,
    isRTL,
    styles,
    theme,
    phrases,
    horizontalMonthPadding,
    momentConfig,
    selectedMonthISO
  } = props;

  const { reactDates: { spacing: { dayPickerHorizontalPadding } } } = theme;

  const isHorizontal = getIsHorizontal();
  const isVertical = getIsVertical();

  const verticalScrollable = orientation === VERTICAL_SCROLLABLE;
  const height = isHorizontal ? calendarMonthGridHeight : undefined;

  const shouldFocusDate = isFocused;
  const shouldAnimateHeight = isHorizontal && hasSetHeight;

  const calendarInfoPositionTop = calendarInfoPosition === INFO_POSITION_TOP;
  const calendarInfoPositionBottom = calendarInfoPosition === INFO_POSITION_BOTTOM;
  const calendarInfoPositionBefore = calendarInfoPosition === INFO_POSITION_BEFORE;
  const calendarInfoPositionAfter = calendarInfoPosition === INFO_POSITION_AFTER;
  const calendarInfoIsInline = calendarInfoPositionBefore || calendarInfoPositionAfter;

  // const calendarInfoElement = React.useMemo(() => {
  //   return renderCalendarInfo && (
  //     <div
  //       ref={calendarInfoRef}
  //       {...css((calendarInfoIsInline) && styles.DayPicker_calendarInfo__horizontal)}
  //     >
  //       {renderCalendarInfo()}
  //     </div>
  //   );
  // }, [renderCalendarInfo, calendarInfoIsInline]);
  const calendarInfoElement = renderCalendarInfo && (
    <div
      children={renderCalendarInfo()}
      ref={calendarInfoRef}
      {...css((calendarInfoIsInline) && styles.DayPicker_calendarInfo__horizontal)} />
  );

  const calendarInfoPanelWidth = (renderCalendarInfo && calendarInfoIsInline) ? calendarInfoWidth : 0;

  const wrapperHorizontalWidth = React.useMemo(() =>
    (calendarMonthWidth * numberOfMonths) + (2 * dayPickerHorizontalPadding), [calendarMonthWidth, numberOfMonths, dayPickerHorizontalPadding]);
  // Adding `1px` because of whitespace between 2 inline-block
  const fullHorizontalWidth = React.useMemo(() =>
    wrapperHorizontalWidth + calendarInfoPanelWidth + 1, [wrapperHorizontalWidth, calendarInfoPanelWidth]);

  const dayPickerStyle = React.useMemo(() => ({
    width: isHorizontal && fullHorizontalWidth,

    // These values are to center the datepicker (approximately) on the page
    marginLeft: isHorizontal && withPortal ? -fullHorizontalWidth / 2 : null,
    marginTop: isHorizontal && withPortal ? -calendarMonthWidth / 2 : null,
  }), [isHorizontal, fullHorizontalWidth, withPortal, calendarMonthWidth]);

  if (!currentMonth)
    return null;

  // console.log('DayPickerFC, render')

  return (
    <div
      {...css(
        styles.DayPicker,
        isHorizontal && styles.DayPicker__horizontal,
        verticalScrollable && styles.DayPicker__verticalScrollable,
        isHorizontal && withPortal && styles.DayPicker_portal__horizontal,
        isVertical && withPortal && styles.DayPicker_portal__vertical,
        dayPickerStyle,
        !monthTitleHeight && styles.DayPicker__hidden,
        styles.DayPicker__withBorder,
      )}
    >
      <OutsideClickHandler onOutsideClick={onOutsideClick}>
        {(calendarInfoPositionTop || calendarInfoPositionBefore) && calendarInfoElement}

        <div
          {...css(
            {
              width: isHorizontal && wrapperHorizontalWidth,
            },
            calendarInfoIsInline && isHorizontal && styles.DayPicker_wrapper__horizontal,
          )}
        >

          <DayPickerWeakHeader
            calendarMonthWidth={calendarMonthWidth}
            currentMonth={currentMonth}
            daySize={daySize}
            firstDayOfWeek={dayPickerFirstDayOfWeek}
            horizontalMonthPadding={horizontalMonthPadding}
            isVertical={isVertical}
            isHorizontal={isHorizontal}
            numberOfMonths={numberOfMonths}
            orientation={orientation}
            styles={styles}
            weekDayFormat={props.weekDayFormat} />

          <div // eslint-disable-line jsx-a11y/no-noninteractive-element-interactions
            {...css(styles.DayPicker_focusRegion)}
            ref={containerRef}
            onClick={(e) => { e.stopPropagation(); }}
            onKeyDown={onKeyDown}
            onMouseUp={() => {
              if (!state.withMouseInteractions)
                _updateState({ withMouseInteractions: true });
            }}
            tabIndex={-1}
            role="application"
            aria-roledescription={phrases.roleDescription}
            aria-label={phrases.calendarLabel}>

            {!verticalScrollable && renderNavigation()}

            <div
              {...css(
                styles.DayPicker_transitionContainer,
                shouldAnimateHeight && styles.DayPicker_transitionContainer__horizontal,
                isVertical && styles.DayPicker_transitionContainer__vertical,
                verticalScrollable && styles.DayPicker_transitionContainer__verticalScrollable,
                {
                  width: isHorizontal && wrapperHorizontalWidth,
                  height,
                },
              )}
              ref={transitionContainerRef}>
              <CalendarMonthGrid
                setMonthTitleHeight={!monthTitleHeight ? setMonthTitleHeight : undefined}
                translationValue={translationValue}
                enableOutsideDays={enableOutsideDays}
                firstVisibleMonthIndex={firstVisibleMonthIndex}
                initialMonth={currentMonth}
                modifiers={modifiers}
                orientation={orientation}
                numberOfMonths={numberOfMonths * scrollableMonthMultiple}
                onDayClick={onDayClick}
                onDayMouseEnter={onDayMouseEnter}
                onDayMouseLeave={onDayMouseLeave}
                onMonthChange={onMonthChange}
                onYearChange={onYearChange}
                renderMonthElement={renderMonthElement}
                onMonthTransitionEnd={updateStateAfterMonthTransition}
                daySize={daySize}
                firstDayOfWeek={firstDayOfWeek}
                isFocused={shouldFocusDate}
                phrases={phrases}
                isRTL={isRTL}
                horizontalMonthPadding={horizontalMonthPadding}
                momentConfig={momentConfig}
                selectedMonthISO={selectedMonthISO} />
            </div>
          </div>
        </div>

        {(calendarInfoPositionBottom || calendarInfoPositionAfter) && calendarInfoElement}
      </OutsideClickHandler>
    </div>
  );
}

DayPicker.propTypes = propTypes;
DayPicker.defaultProps = defaultProps;

export { DayPicker as PureDayPicker };

export default withStyles(({
  reactDates: {
    color,
    noScrollBarOnVerticalScrollable
  },
}) => ({
  DayPicker: {
    background: color.background,
    position: 'relative',
    textAlign: noflip('left'),
  },

  DayPicker__horizontal: {
    background: color.background,
  },

  DayPicker__verticalScrollable: {
    height: '100%',
  },

  DayPicker__hidden: {
    visibility: 'hidden',
  },

  DayPicker__withBorder: {
    boxShadow: noflip('0 2px 6px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.07)'),
    borderRadius: 3,
  },

  DayPicker_portal__horizontal: {
    boxShadow: 'none',
    position: 'absolute',
    left: noflip('50%'),
    top: '50%',
  },

  DayPicker_portal__vertical: {
    position: 'initial',
  },

  DayPicker_focusRegion: {
    outline: 'none',
  },

  DayPicker_calendarInfo__horizontal: {
    display: 'inline-block',
    verticalAlign: 'top',
  },

  DayPicker_wrapper__horizontal: {
    display: 'inline-block',
    verticalAlign: 'top',
  },

  DayPicker_transitionContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 3,
  },

  DayPicker_transitionContainer__horizontal: {
    transition: 'height 0.2s ease-in-out',
  },

  DayPicker_transitionContainer__vertical: {
    width: '100%',
  },

  DayPicker_transitionContainer__verticalScrollable: {
    paddingTop: 20,
    height: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: noflip(0),
    left: noflip(0),
    overflowY: 'scroll',
    ...(noScrollBarOnVerticalScrollable && {
      '-webkitOverflowScrolling': 'touch',
      '::-webkit-scrollbar': {
        '-webkit-appearance': 'none',
        display: 'none',
      },
    }),
  },
}), { pureComponent: true })(React.memo(DayPicker));
