import React, { createRef, useState } from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import { forbidExtraProps, nonNegativeInteger } from 'airbnb-prop-types';
import { css, withStyles, withStylesPropTypes } from 'react-with-styles';

// App
//
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import getCalendarDaySettings from '../utils/getCalendarDaySettings';
import ModifiersShape from '../shapes/ModifiersShape';
import { momentConfigDefault } from '../momentWrapper';
import { CalendarDayPhrases } from '../defaultPhrases';
import { DAY_SIZE } from '../constants';


const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  day: momentPropTypes.momentObj,
  daySize: nonNegativeInteger,
  modifiers: ModifiersShape,
  isFocused: PropTypes.bool,
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,

  // internationalization
  phrases: PropTypes.shape(getPhrasePropTypes(CalendarDayPhrases)),
  momentConfig: PropTypes.object,
});
const defaultProps = {
  day: momentPropTypes.momentObj,
  daySize: DAY_SIZE,
  modifiers: new Set(),
  isFocused: false,
  // tabIndex: -1,
  onDayClick() { },
  onDayMouseEnter() { },
  onDayMouseLeave() { },

  // internationalization
  phrases: CalendarDayPhrases,
  momentConfig: momentConfigDefault
};

const CalendarDay = (props) => {

  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = createRef();

  function onKeyDown(day, e) {
    const { key } = e;
    if (key === 'Enter' || key === ' ') {
      props.onDayClick(day, e);
    }
  }


  const {
    day,
    daySize,
    modifiers,
    styles,
    momentConfig
  } = props;

  const {
    daySizeStyles,
    selected,
    hoveredSpan,
    isOutsideRange,
  } = React.useMemo(() => {
    return getCalendarDaySettings(daySize, modifiers);
  }, [daySize, modifiers]);

  //const dayDisplay = React.useMemo(() => day.format(momentConfig.DayFromat), []);

  return (
    <td
      {...css(
        styles.CalendarDay,
        styles.CalendarDay__default,
        modifiers.has('today') && styles.CalendarDay__today,
        hoveredSpan && styles.CalendarDay__hovered_span,
        modifiers.has('selected-span') && styles.CalendarDay__selected_span,
        modifiers.has('selected-start') && styles.CalendarDay__selected_start,
        modifiers.has('selected-end') && styles.CalendarDay__selected_end,
        selected && !modifiers.has('selected-span') && styles.CalendarDay__selected,
        isOutsideRange && styles.CalendarDay__blocked_out_of_range,
        daySizeStyles,
      )}
      role="button" // eslint-disable-line jsx-a11y/no-noninteractive-element-to-interactive-role
      onMouseEnter={(e) => props.onDayMouseEnter(day, e)}
      onMouseLeave={(e) => props.onDayMouseLeave(day, e)}
      onMouseUp={(e) => e.currentTarget.blur()}
      onClick={(e) => {
        props.onDayClick(day, e);

        setShowTooltip(true);
        if (timerRef.current)
          clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => setShowTooltip(false), 3_000);
      }}
      onKeyDown={(e) => onKeyDown(day, e)}>

      <div
        data-show-toolbar={showTooltip}
        className='day-toolbar'>
        <span
          children={`${day.format(momentConfig.DayFromat)} ${day.format(momentConfig.MountFromat)}`} />
      </div>

      <div className="fdatepicker-body__day-content">
        <span
          children={day.format(momentConfig.DayFromat)}
          className="fdatepicker-body__day-amount" />
      </div>
    </td>
  );
}

CalendarDay.propTypes = propTypes;
CalendarDay.defaultProps = defaultProps;

export { CalendarDay as PureCalendarDay };
export default withStyles(({ reactDates: { color, font } }) => ({
  CalendarDay: {
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontSize: font.size,
    textAlign: 'center',

    ':active': {
      outline: 0,
    },
  },

  CalendarDay__defaultCursor: {
    cursor: 'default',
  },

  CalendarDay__default: {
    border: `1px solid ${color.core.borderLight}`,
    color: color.text,
    background: color.background,

    ':hover': {
      background: color.core.borderLight,
      border: `1px solid ${color.core.borderLight}`,
      color: 'inherit',
    },
  },

  CalendarDay__selected_span: {
    background: color.selectedSpan.backgroundColor,
    border: `1px double ${color.selectedSpan.borderColor}`,
    color: color.selectedSpan.color,

    ':hover': {
      background: color.selectedSpan.backgroundColor_hover,
      border: `1px double ${color.selectedSpan.borderColor}`,
      color: color.selectedSpan.color_active,
    },

    ':active': {
      background: color.selectedSpan.backgroundColor_active,
      border: `1px double ${color.selectedSpan.borderColor}`,
      color: color.selectedSpan.color_active,
    },
  },

  CalendarDay__selected: {
    background: color.selected.backgroundColor,
    border: `1px double ${color.selected.borderColor}`,
    color: color.selected.color,

    ':hover': {
      background: color.selected.backgroundColor_hover,
      border: `1px double ${color.selected.borderColor}`,
      color: color.selected.color_active,
    },

    ':active': {
      background: color.selected.backgroundColor_active,
      border: `1px double ${color.selected.borderColor}`,
      color: color.selected.color_active,
    },
  },

  CalendarDay__hovered_span: {
    background: color.hoveredSpan.backgroundColor,
    border: `1px double ${color.hoveredSpan.borderColor}`,
    color: color.hoveredSpan.color,

    ':hover': {
      background: color.hoveredSpan.backgroundColor_hover,
      border: `1px double ${color.hoveredSpan.borderColor}`,
      color: color.hoveredSpan.color_active,
    },

    ':active': {
      background: color.hoveredSpan.backgroundColor_active,
      border: `1px double ${color.hoveredSpan.borderColor}`,
      color: color.hoveredSpan.color_active,
    },
  },

  CalendarDay__blocked_out_of_range: {
    background: color.blocked_out_of_range.backgroundColor,
    border: `1px solid ${color.blocked_out_of_range.borderColor}`,
    color: color.blocked_out_of_range.color,

    ':hover': {
      background: color.blocked_out_of_range.backgroundColor_hover,
      border: `1px solid ${color.blocked_out_of_range.borderColor}`,
      color: color.blocked_out_of_range.color_active,
    },

    ':active': {
      background: color.blocked_out_of_range.backgroundColor_active,
      border: `1px solid ${color.blocked_out_of_range.borderColor}`,
      color: color.blocked_out_of_range.color_active,
    },
  },

  CalendarDay__selected_start: {},
  CalendarDay__selected_end: {},
  CalendarDay__today: {},

}), { pureComponent: typeof React.PureComponent !== 'undefined' })(CalendarDay);
