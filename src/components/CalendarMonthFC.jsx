/* eslint react/no-array-index-key: 0 */

import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';
import momentFactory, { momentConfigDefault } from '../momentWrapper';

import { CalendarDayPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import calculateDimension from '../utils/calculateDimension';
import getCalendarMonthWeeks from '../utils/getCalendarMonthWeeks';
import toISODateString from '../utils/toISODateString';

import ModifiersShape from '../shapes/ModifiersShape';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';


import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
} from '../constants';
import CalendarDayFC from './CalendarDayFC';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  month: momentPropTypes.momentObj,
  horizontalMonthPadding: nonNegativeInteger,
  isVisible: PropTypes.bool,
  enableOutsideDays: PropTypes.bool,
  modifiers: PropTypes.objectOf(ModifiersShape),
  orientation: ScrollableOrientationShape,
  daySize: nonNegativeInteger,
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,
  onMonthSelect: PropTypes.func,
  onYearSelect: PropTypes.func,
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  firstDayOfWeek: DayOfWeekShape,
  setMonthTitleHeight: PropTypes.func,
// verticalBorderSpacing: nonNegativeInteger,

  isFocused: PropTypes.bool, // indicates whether or not to move focus to focusable day

  // i18n
  phrases: PropTypes.shape(getPhrasePropTypes(CalendarDayPhrases)),
  momentConfig: PropTypes.object,

  // focusedDate: momentPropTypes.momentObj, // indicates focusable day
  // monthFormat: PropTypes.string,
  // // dayAriaLabelFormat: PropTypes.string,
  // renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  // renderCalendarDay: PropTypes.func,
  // renderDayContents: PropTypes.func,
});

const defaultProps = {
  month: momentFactory().moment(),
  horizontalMonthPadding: 13,
  isVisible: true,
  enableOutsideDays: false,
  modifiers: {},
  orientation: HORIZONTAL_ORIENTATION,
  daySize: DAY_SIZE,
  onDayClick() { },
  onDayMouseEnter() { },
  onDayMouseLeave() { },
  onMonthSelect() { },
  onYearSelect() { },
  renderMonthElement: null,
  firstDayOfWeek: null,
  setMonthTitleHeight: null,

  isFocused: false,

  // i18n
  // monthFormat: config().YMFormat, // english locale
  phrases: CalendarDayPhrases,
// verticalBorderSpacing: undefined,
  momentConfig: momentConfigDefault

  // focusedDate: null,
  // // dayAriaLabelFormat: undefined,
  // renderMonthText: null,
  // renderCalendarDay: (props) => (<CalendarDay {...props} />),
  // renderDayContents: null,
};


const CalendarMonth = (props) => {

  const captionRef = React.useRef();
  const monthTitleHeightTimeoutRef = React.useRef();

  const calendarMonthWeeks = React.useMemo(() => {
    return getCalendarMonthWeeks(
      props.month,
      props.enableOutsideDays,
      props.firstDayOfWeek == null ? momentFactory().moment.localeData().firstDayOfWeek() : props.firstDayOfWeek,
      props.momentConfig
    );
  }, [props.month, props.enableOutsideDays, props.firstDayOfWeek, props.momentConfig]);

  const [state, setState] = React.useState({
    weeks: calendarMonthWeeks,
  });

  const [prevProps, setPrevProps] = React.useState({ month: props.month, enableOutsideDays: props.enableOutsideDays, firstDayOfWeek: props.firstDayOfWeek });

  React.useEffect(() => {
    _componentDidMount();

    return () => {
      _componentWillUnmount();
    }
  }, []);

  React.useMemo(() => {

    // _componentWillReceiveProps(props);

    // console.log('_componentWillReceiveProps')

    const { month, enableOutsideDays, firstDayOfWeek } = props;
    const { month: prevMonth, enableOutsideDays: prevEnableOutsideDays, firstDayOfWeek: prevFirstDayOfWeek, } = prevProps;

    if (!month.isSame(prevMonth) || enableOutsideDays !== prevEnableOutsideDays || firstDayOfWeek !== prevFirstDayOfWeek) {
      setPrevProps({ month: props.month, enableOutsideDays: props.enableOutsideDays, firstDayOfWeek: props.firstDayOfWeek });
      setState({
        weeks: calendarMonthWeeks,
      });
    }

  }, [props.month, props.enableOutsideDays, props.firstDayOfWeek]);

  function _componentDidMount() {
    monthTitleHeightTimeoutRef.current = setTimeout(setMonthTitleHeight, 0);
  }

  function _componentWillUnmount() {
    if (monthTitleHeightTimeoutRef.current) {
      clearTimeout(monthTitleHeightTimeoutRef.current);
    }
  }

  function setMonthTitleHeight() {
    const { setMonthTitleHeight } = props;
    if (setMonthTitleHeight) {
      const captionHeight = calculateDimension(captionRef.current, 'height', true, true);
      setMonthTitleHeight(captionHeight);
    }
  }

  const {
    daySize,
    horizontalMonthPadding,
    isFocused,
    isVisible,
    modifiers,
    month,
    onDayClick,
    onDayMouseEnter,
    onDayMouseLeave,
    onMonthSelect,
    onYearSelect,
    orientation,
    phrases,
    renderMonthElement,
    styles,
  // verticalBorderSpacing,
    momentConfig
  } = props;


  const monthTitle = React.useMemo(() => momentConfig.FormatMonth(month), []);
  const verticalScrollable = orientation === VERTICAL_SCROLLABLE;

  return (
    <div
      {...css(
        styles.CalendarMonth,
        { padding: `0 ${horizontalMonthPadding}px` },
      )}
      data-visible={isVisible}
    >
      <div
        ref={captionRef}
        {...css(
          styles.CalendarMonth_caption,
          verticalScrollable && styles.CalendarMonth_caption__verticalScrollable,
        )}
      >
        {renderMonthElement ? (
          renderMonthElement({
            month,
            onMonthSelect,
            onYearSelect,
            isVisible,
          })
        ) : (
          <strong>
            {monthTitle}
          </strong>
        )}
      </div>

      <table
        {...css(
          styles.CalendarMonth_table,
          // !verticalBorderSpacing && styles.CalendarMonth_table,
          // verticalBorderSpacing && styles.CalendarMonth_verticalSpacing,
          // verticalBorderSpacing && { borderSpacing: `0px ${verticalBorderSpacing}px` },
        )}
        role="presentation"
      >
        <tbody>
          {state.weeks.map((week, i) => (
            <tr key={i}>
              {week.map((day, dayOfWeek) =>
                day ? (
                  <CalendarDayFC
                    key={dayOfWeek}
                    day={day}
                    daySize={daySize}
                    isFocused={isFocused}
                    onDayMouseEnter={onDayMouseEnter}
                    onDayMouseLeave={onDayMouseLeave}
                    onDayClick={onDayClick}
                    phrases={phrases}
                    modifiers={modifiers[toISODateString(day, undefined, momentConfig)]}
                    momentConfig={momentConfig}
                  />
                ) : (
                  <td key={dayOfWeek} />
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

CalendarMonth.propTypes = propTypes;
CalendarMonth.defaultProps = defaultProps;

export default withStyles(({ reactDates: { color, font, spacing } }) => ({
  CalendarMonth: {
    background: color.background,
    textAlign: 'center',
    verticalAlign: 'top',
    userSelect: 'none',
  },

  CalendarMonth_table: {
    borderCollapse: 'collapse',
    borderSpacing: 0,
  },

  // CalendarMonth_verticalSpacing: {
  //   borderCollapse: 'separate',
  // },

  CalendarMonth_caption: {
    color: color.text,
    fontSize: font.captionSize,
    textAlign: 'center',
    paddingTop: spacing.captionPaddingTop,
    paddingBottom: spacing.captionPaddingBottom,
    captionSide: 'initial',
  },

  CalendarMonth_caption__verticalScrollable: {
    paddingTop: 12,
    paddingBottom: 7,
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(React.memo(CalendarMonth));
