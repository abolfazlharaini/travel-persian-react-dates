import React from 'react';
import { css, withStyles } from 'react-with-styles';

// App
//
import noflip from '../utils/noflip';
import { VERTICAL_SCROLLABLE } from '../constants';


const DayPickerWeakHeader = ({
  currentMonth,
  calendarMonthWidth,
  daySize,
  firstDayOfWeek,
  horizontalMonthPadding,
  isHorizontal,
  isVertical,
  numberOfMonths,
  orientation,
  styles,
  weekDayFormat,
}) => {

  // console.log('DayPickerWeakHeader, render');

  const weekHeadersItems = React.useMemo(() => {

    // console.log('DayPickerWeakHeader, weekHeadersItems');

    const weekHeaders = [];
    for (let iWeek = 0; iWeek < 7; iWeek += 1) {
      weekHeaders.push(currentMonth.clone().day((iWeek + firstDayOfWeek) % 7).format(weekDayFormat));
    }
    return weekHeaders;
  }, [])

  function renderWeekHeader(index) {

    const verticalScrollable = orientation === VERTICAL_SCROLLABLE;
    let weekHeaderStyle = {}; // no styles applied to the vertical-scrollable orientation
    if (isHorizontal) {
      weekHeaderStyle = {
        left: index * calendarMonthWidth,
      };
    } else if (isVertical && !verticalScrollable) {
      weekHeaderStyle = {
        marginLeft: -calendarMonthWidth / 2,
      };
    }

    return (
      <div
        {...css(
          styles.DayPicker_weekHeader,
          isVertical && styles.DayPicker_weekHeader__vertical,
          verticalScrollable && styles.DayPicker_weekHeader__verticalScrollable,
          weekHeaderStyle,
          { padding: `0 ${horizontalMonthPadding}px` },
        )}
        key={`week-${index}`}
      >
        <ul {...css(styles.DayPicker_weekHeader_ul)}>
          {weekHeadersItems.map((day) => (
            <li key={day} {...css(styles.DayPicker_weekHeader_li, { width: daySize })}>
              <small children={day} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const numOfWeekHeaders = isVertical ? 1 : numberOfMonths;
  return (
    <div
      {...css(
        styles.DayPicker_weekHeaders,
        isHorizontal && styles.DayPicker_weekHeaders__horizontal,
      )}
      aria-hidden="true"
      role="presentation">

      {Array.apply(0, Array(numOfWeekHeaders)).map((_, i) =>
        <React.Fragment key={`weekheader-${i}`} children={renderWeekHeader(i)} />
      )}

    </div>
  );
}

export default withStyles(({
  reactDates: {
    color,
    font,
    spacing,
    zIndex,
  },
}) => ({
  DayPicker_weekHeaders: {
    position: 'relative',
  },

  DayPicker_weekHeaders__horizontal: {
    marginLeft: noflip(spacing.dayPickerHorizontalPadding),
  },

  DayPicker_weekHeader: {
    color: color.placeholderText,
    position: 'absolute',
    top: 62,
    zIndex: zIndex + 2,
    textAlign: noflip('left'),
  },

  DayPicker_weekHeader__vertical: {
    left: noflip('50%'),
  },

  DayPicker_weekHeader__verticalScrollable: {
    top: 0,
    display: 'table-row',
    borderBottom: `1px solid ${color.core.border}`,
    background: color.background,
    marginLeft: noflip(0),
    left: noflip(0),
    width: '100%',
    textAlign: 'center',
  },

  DayPicker_weekHeader_ul: {
    listStyle: 'none',
    margin: '1px 0',
    paddingLeft: noflip(0),
    paddingRight: noflip(0),
    fontSize: font.size,
  },

  DayPicker_weekHeader_li: {
    display: 'inline-block',
    textAlign: 'center',
  },

}), { pureComponent: true })(DayPickerWeakHeader);
