import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';
import { addEventListener } from 'consolidated-events';

// App
//
import momentFactory, { momentConfigDefault } from '../momentWrapper';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import noflip from '../utils/noflip';
import isTransitionEndSupported from '../utils/isTransitionEndSupported';
import getTransformStyles from '../utils/getTransformStyles';
import getCalendarMonthWidth from '../utils/getCalendarMonthWidth';
import toISOMonthString from '../utils/toISOMonthString';
import isPrevMonth from '../utils/isPrevMonth';
import isNextMonth from '../utils/isNextMonth';
import ModifiersShape from '../shapes/ModifiersShape';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
// import CalendarMonthFC from './CalendarMonthFC';
import CalendarMonth from './CalendarMonth';
import { CalendarDayPhrases } from '../defaultPhrases';
import { HORIZONTAL_ORIENTATION, VERTICAL_ORIENTATION, VERTICAL_SCROLLABLE, DAY_SIZE } from '../constants';
import { CalendarMonthGridList } from './CalendarMonthGridList';


const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  enableOutsideDays: PropTypes.bool,
  firstVisibleMonthIndex: PropTypes.number,
  horizontalMonthPadding: nonNegativeInteger,
  initialMonth: momentPropTypes.momentObj,
  numberOfMonths: PropTypes.number,
  modifiers: PropTypes.objectOf(PropTypes.objectOf(ModifiersShape)),
  orientation: ScrollableOrientationShape,
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,
  onMonthTransitionEnd: PropTypes.func,
  onMonthChange: PropTypes.func,
  onYearChange: PropTypes.func,
  translationValue: PropTypes.number,
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  daySize: nonNegativeInteger,
  isFocused: PropTypes.bool, // indicates whether or not to move focus to focusable day
  firstDayOfWeek: DayOfWeekShape,
  setMonthTitleHeight: PropTypes.func,
  isRTL: PropTypes.bool,
  // verticalBorderSpacing: nonNegativeInteger,

  // i18n
  phrases: PropTypes.shape(getPhrasePropTypes(CalendarDayPhrases)),
  momentConfig: PropTypes.object,
  selectedMonthISO: PropTypes.string,

  // isAnimating: PropTypes.bool,
  // transitionDuration: nonNegativeInteger,
  // renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  // renderCalendarDay: PropTypes.func,
  // renderDayContents: PropTypes.func,
  // focusedDate: momentPropTypes.momentObj, // indicates focusable day
  // monthFormat: PropTypes.string,
  // // dayAriaLabelFormat: PropTypes.string,
});

const defaultProps = {
  enableOutsideDays: false,
  firstVisibleMonthIndex: 0,
  horizontalMonthPadding: 13,
  initialMonth: momentFactory().moment(),
  numberOfMonths: 1,
  modifiers: {},
  orientation: HORIZONTAL_ORIENTATION,
  onDayClick() { },
  onDayMouseEnter() { },
  onDayMouseLeave() { },
  onMonthChange() { },
  onYearChange() { },
  onMonthTransitionEnd() { },
  translationValue: null,
  renderMonthElement: null,
  daySize: DAY_SIZE,
  isFocused: false,
  firstDayOfWeek: null,
  setMonthTitleHeight: null,
  isRTL: false,
  // verticalBorderSpacing: undefined,

  // i18n
  phrases: CalendarDayPhrases,
  momentConfig: momentConfigDefault,
  selectedMonthISO: null

  // isAnimating: false,
  // transitionDuration: 200,
  // renderMonthText: null,
  // renderCalendarDay: undefined,
  // renderDayContents: null,
  // focusedDate: null,
  // monthFormat: config().YMFormat, // english locale
  // // dayAriaLabelFormat: undefined,
};

function getMonths(initialMonth, numberOfMonths, withoutTransitionMonths, momentConfig) {
  let month = initialMonth.clone();
  if (!withoutTransitionMonths) month = month.subtract(1, momentConfig.MonthProp);

  const months = [];
  for (let i = 0; i < (withoutTransitionMonths ? numberOfMonths : numberOfMonths + 2); i += 1) {
    months.push(month);
    month = month.clone().add(1, momentConfig.MonthProp);
  }

  return months;
}

class CalendarMonthGrid extends React.PureComponent {
  constructor (props) {
    super(props);
    const withoutTransitionMonths = props.orientation === VERTICAL_SCROLLABLE;
    this.state = {
      months: getMonths(props.initialMonth, props.numberOfMonths, withoutTransitionMonths, props.momentConfig),
    };

    this.isTransitionEndSupported = isTransitionEndSupported();
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.setContainerRef = this.setContainerRef.bind(this);

    this.locale = momentFactory().moment.locale();
    this.onMonthSelect = this.onMonthSelect.bind(this);
    this.onYearSelect = this.onYearSelect.bind(this);
  }

  componentDidMount() {

    // console.log('CalendarMonthGrid, componentDidMount')

    this.removeEventListener = addEventListener(
      this.container,
      'transitionend',
      this.onTransitionEnd,
    );
  }

  componentWillReceiveProps(nextProps) {

    // console.log('CalendarMonthGrid, componentWillReceiveProps')

    const { initialMonth, numberOfMonths, orientation } = nextProps;
    const { months } = this.state;

    const {
      initialMonth: prevInitialMonth,
      numberOfMonths: prevNumberOfMonths,
      momentConfig
    } = this.props;
    const hasMonthChanged = !prevInitialMonth.isSame(initialMonth, momentConfig.MonthProp);
    const hasNumberOfMonthsChanged = prevNumberOfMonths !== numberOfMonths;
    let newMonths = months;

    if (hasMonthChanged && !hasNumberOfMonthsChanged) {
      if (isNextMonth(prevInitialMonth, initialMonth, momentConfig)) {
        newMonths = months.slice(1);
        newMonths.push(months[months.length - 1].clone().add(1, momentConfig.MonthProp));
      } else if (isPrevMonth(prevInitialMonth, initialMonth, momentConfig)) {
        newMonths = months.slice(0, months.length - 1);
        newMonths.unshift(months[0].clone().subtract(1, momentConfig.MonthProp));
      } else {
        const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
        newMonths = getMonths(initialMonth, numberOfMonths, withoutTransitionMonths, momentConfig);
      }
    }

    if (hasNumberOfMonthsChanged) {
      const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
      newMonths = getMonths(initialMonth, numberOfMonths, withoutTransitionMonths, momentConfig);
    }

    const momentLocale = momentFactory().moment.locale();
    if (this.locale !== momentLocale) {
      this.locale = momentLocale;
      newMonths = newMonths.map((m) => m.locale(this.locale));
    }

    this.setState({
      months: newMonths,
    });
  }

  componentDidUpdate() {
    // console.log('CalendarMonthGrid, componentDidUpdate')
    //const {
    // isAnimating,
    // transitionDuration,
    //   onMonthTransitionEnd,
    // } = this.props;

    // For IE9, immediately call onMonthTransitionEnd instead of
    // waiting for the animation to complete. Similarly, if transitionDuration
    // is set to 0, also immediately invoke the onMonthTransitionEnd callback
    // if ((!this.isTransitionEndSupported || !transitionDuration) && isAnimating) {
    //   onMonthTransitionEnd();
    // }
    this.props.onMonthTransitionEnd();
  }

  componentWillUnmount() {
    if (this.removeEventListener) this.removeEventListener();
  }

  onTransitionEnd() {
    const { onMonthTransitionEnd } = this.props;
    onMonthTransitionEnd();
  }

  onMonthSelect(currentMonth, newMonthVal) {
    const newMonth = currentMonth.clone();
    const { onMonthChange, orientation, momentConfig } = this.props;
    const { months } = this.state;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    let initialMonthSubtraction = months.indexOf(currentMonth);
    if (!withoutTransitionMonths) {
      initialMonthSubtraction -= 1;
    }
    newMonth.set(momentConfig.MonthProp, newMonthVal).subtract(initialMonthSubtraction, momentConfig.MonthsProp);
    onMonthChange(newMonth);
  }

  onYearSelect(currentMonth, newYearVal) {
    const newMonth = currentMonth.clone();
    const { onYearChange, orientation, momentConfig } = this.props;
    const { months } = this.state;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    let initialMonthSubtraction = months.indexOf(currentMonth);
    if (!withoutTransitionMonths) {
      initialMonthSubtraction -= 1;
    }
    newMonth.set('year', newYearVal).subtract(initialMonthSubtraction, momentConfig.MonthsProp);
    onYearChange(newMonth);
  }

  setContainerRef(ref) {
    this.container = ref;
  }

  render() {
    const {
      enableOutsideDays,
      firstVisibleMonthIndex,
      horizontalMonthPadding,
      modifiers,
      numberOfMonths,
      orientation,
      translationValue,
      daySize,
      onDayMouseEnter,
      onDayMouseLeave,
      onDayClick,
      renderMonthElement,
      onMonthTransitionEnd,
      firstDayOfWeek,
      isFocused,
      isRTL,
      styles,
      phrases,
      // verticalBorderSpacing,
      setMonthTitleHeight,
      momentConfig,
      selectedMonthISO

      // isAnimating,
      // transitionDuration,
      // monthFormat,
      // renderMonthText,
      // // renderCalendarDay,
      // renderDayContents,
      // focusedDate,
      // dayAriaLabelFormat,
    } = this.props;

    const isVertical = orientation === VERTICAL_ORIENTATION;
    const isVerticalScrollable = orientation === VERTICAL_SCROLLABLE;
    const isHorizontal = orientation === HORIZONTAL_ORIENTATION;

    const calendarMonthWidth = getCalendarMonthWidth(
      daySize,
      horizontalMonthPadding,
    );

    const width = isVertical || isVerticalScrollable
      ? calendarMonthWidth
      : (numberOfMonths + 2) * calendarMonthWidth;

    const transformType = (isVertical || isVerticalScrollable) ? 'translateY' : 'translateX';
    const transformValue = `${transformType}(${translationValue}px)`;

    // console.log('CalendarMonthGrid, render')

    return (
      <div
        {...css(
          styles.CalendarMonthGrid,
          isHorizontal && styles.CalendarMonthGrid__horizontal,
          isVertical && styles.CalendarMonthGrid__vertical,
          isVerticalScrollable && styles.CalendarMonthGrid__vertical_scrollable,
          // isAnimating && styles.CalendarMonthGrid__animating,
          // isAnimating && transitionDuration && {
          //   transition: `transform ${transitionDuration}ms ease-in-out`,
          // },
          {
            ...getTransformStyles(transformValue),
            width,
          },
        )}
        ref={this.setContainerRef}
        onTransitionEnd={onMonthTransitionEnd}
      >
        {isVerticalScrollable ? (
          <CalendarMonthGridList
            selectedMonthISO={selectedMonthISO}
            isRTL={isRTL}
            numberOfMonths={numberOfMonths}
            itemData={this.state.months}
            momentConfig={momentConfig}>

            {({ month, index: i }) =>
              <CalendarMonth
                month={month}
                isVisible={(i >= firstVisibleMonthIndex) && (i < firstVisibleMonthIndex + numberOfMonths)}
                enableOutsideDays={enableOutsideDays}
                modifiers={modifiers[toISOMonthString(month, undefined, momentConfig)]}
                orientation={orientation}
                onDayMouseEnter={onDayMouseEnter}
                onDayMouseLeave={onDayMouseLeave}
                onDayClick={onDayClick}
                onMonthSelect={this.onMonthSelect}
                onYearSelect={this.onYearSelect}
                renderMonthElement={renderMonthElement}
                firstDayOfWeek={firstDayOfWeek}
                daySize={daySize}
                isFocused={isFocused}
                phrases={phrases}
                setMonthTitleHeight={setMonthTitleHeight}
                horizontalMonthPadding={horizontalMonthPadding}
                momentConfig={momentConfig} />
            }

          </CalendarMonthGridList>
        ) : (
          <React.Fragment>
            {this.state.months.map((month, i) => {
              const isVisible = (i >= firstVisibleMonthIndex)
                && (i < firstVisibleMonthIndex + numberOfMonths);
              const hideForAnimation = i === 0 && !isVisible;
              // const showForAnimation = i === 0 && isAnimating && isVisible;
              const monthString = toISOMonthString(month, undefined, momentConfig);
              return (
                <div
                  key={monthString}
                  {...css(
                    isHorizontal && styles.CalendarMonthGrid_month__horizontal,
                    hideForAnimation && styles.CalendarMonthGrid_month__hideForAnimation,
                    // showForAnimation && !isVertical && !isRTL && {
                    //   position: 'absolute',
                    //   left: -calendarMonthWidth,
                    // },
                    // showForAnimation && !isVertical && isRTL && {
                    //   position: 'absolute',
                    //   right: 0,
                    // },
                    // showForAnimation && isVertical && {
                    //   position: 'absolute',
                    //   top: -translationValue,
                    // },
                    !isVisible && styles.CalendarMonthGrid_month__hidden,
                    // !isAnimating && 
                  )}
                >
                  <CalendarMonth
                    month={month}
                    isVisible={isVisible}
                    enableOutsideDays={enableOutsideDays}
                    modifiers={modifiers[monthString]}
                    orientation={orientation}
                    onDayMouseEnter={onDayMouseEnter}
                    onDayMouseLeave={onDayMouseLeave}
                    onDayClick={onDayClick}
                    onMonthSelect={this.onMonthSelect}
                    onYearSelect={this.onYearSelect}
                    renderMonthElement={renderMonthElement}
                    firstDayOfWeek={firstDayOfWeek}
                    daySize={daySize}
                    isFocused={isFocused}
                    phrases={phrases}
                    setMonthTitleHeight={setMonthTitleHeight}
                    // verticalBorderSpacing={verticalBorderSpacing}
                    horizontalMonthPadding={horizontalMonthPadding}
                    momentConfig={momentConfig}
                  // monthFormat={monthFormat}
                  // renderMonthText={renderMonthText}
                  // renderCalendarDay={renderCalendarDay}
                  // renderDayContents={renderDayContents}
                  // focusedDate={isVisible ? focusedDate : null}
                  // dayAriaLabelFormat={dayAriaLabelFormat}
                  />
                </div>
              );
            })}
          </React.Fragment>
        )}
      </div>
    );
  }
}

CalendarMonthGrid.propTypes = propTypes;
CalendarMonthGrid.defaultProps = defaultProps;

export default withStyles(({
  reactDates: {
    color,
    spacing,
    zIndex,
  },
}) => ({
  CalendarMonthGrid: {
    background: color.background,
    textAlign: noflip('left'),
    height: "100%",
    zIndex,
  },

  CalendarMonthGrid__animating: {
    zIndex: zIndex + 1,
  },

  CalendarMonthGrid__horizontal: {
    position: 'absolute',
    left: noflip(spacing.dayPickerHorizontalPadding),
  },

  CalendarMonthGrid__vertical: {
    margin: '0 auto',
  },

  CalendarMonthGrid__vertical_scrollable: {
    margin: '0 auto',
  },

  CalendarMonthGrid_month__horizontal: {
    display: 'inline-block',
    verticalAlign: 'top',
    minHeight: '100%',
  },

  CalendarMonthGrid_month__hideForAnimation: {
    position: 'absolute',
    zIndex: zIndex - 1,
    opacity: 0,
    pointerEvents: 'none',
  },

  CalendarMonthGrid_month__hidden: {
    visibility: 'hidden',
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(CalendarMonthGrid);
