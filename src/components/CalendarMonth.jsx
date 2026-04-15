/* eslint react/no-array-index-key: 0 */

import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

// App
//
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import calculateDimension from '../utils/calculateDimension';
import getCalendarMonthWeeks from '../utils/getCalendarMonthWeeks';
import toISODateString from '../utils/toISODateString';
import ModifiersShape from '../shapes/ModifiersShape';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
import momentFactory, { momentConfigDefault } from '../momentWrapper';
import CalendarDayFC from './CalendarDayFC';
import { CalendarDayPhrases } from '../defaultPhrases';
import { HORIZONTAL_ORIENTATION, VERTICAL_SCROLLABLE, DAY_SIZE } from '../constants';


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

class CalendarMonth extends React.PureComponent {
  constructor (props) {
    // console.log('CalendarMonth, constructor')
    super(props);

    this.state = {
      weeks: getCalendarMonthWeeks(
        props.month,
        props.enableOutsideDays,
        props.firstDayOfWeek == null ? momentFactory().moment.localeData().firstDayOfWeek() : props.firstDayOfWeek,
        props.momentConfig
      ),
    };

    this.setCaptionRef = this.setCaptionRef.bind(this);
    this.setMonthTitleHeight = this.setMonthTitleHeight.bind(this);
  }

  componentDidMount() {
    // console.log('CalendarMonth, componentDidMount')
    this.setMonthTitleHeightTimeout = setTimeout(this.setMonthTitleHeight, 0);
  }

  componentWillReceiveProps(nextProps) {
    // console.log('CalendarMonth, componentWillReceiveProps')
    const { month, enableOutsideDays, firstDayOfWeek } = nextProps;
    const {
      month: prevMonth,
      enableOutsideDays: prevEnableOutsideDays,
      firstDayOfWeek: prevFirstDayOfWeek,
    } = this.props;
    if (
      !month.isSame(prevMonth)
      || enableOutsideDays !== prevEnableOutsideDays
      || firstDayOfWeek !== prevFirstDayOfWeek
    ) {
      this.setState({
        weeks: getCalendarMonthWeeks(
          month,
          enableOutsideDays,
          firstDayOfWeek == null ? momentFactory().moment.localeData().firstDayOfWeek() : firstDayOfWeek,
          this.props.momentConfig
        ),
      });
    }
  }

  componentWillUnmount() {
    // console.log('CalendarMonth, componentWillUnmount')
    if (this.setMonthTitleHeightTimeout) {
      clearTimeout(this.setMonthTitleHeightTimeout);
    }
  }

  setMonthTitleHeight() {
    const { setMonthTitleHeight } = this.props;
    if (setMonthTitleHeight) {
      const captionHeight = calculateDimension(this.captionRef, 'height', true, true);
      setMonthTitleHeight(captionHeight);
    }
  }

  setCaptionRef(ref) {
    this.captionRef = ref;
  }

  render() {
    // console.log('CalendarMonth, render')
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

      // focusedDate,
      // dayAriaLabelFormat,
      // monthFormat,
      // // renderCalendarDay,
      // renderDayContents,
      // renderMonthText,
    } = this.props;

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
          ref={this.setCaptionRef}
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
            <strong children={momentConfig.FormatMonth(month)} />
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
            {this.state.weeks.map((week, i) => (
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
                    // tabIndex={isVisible && isSameDay(day, focusedDate) ? 0 : -1}
                    // isOutsideDay={!day || !momentConfig.AreMonthEqual(day, month)}
                    // renderDayContents={renderDayContents}
                    // ariaLabelFormat={dayAriaLabelFormat}
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
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(CalendarMonth);
