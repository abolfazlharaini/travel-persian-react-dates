import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import memoize from "memoize-one";
import { VariableSizeList as List, areEqual } from 'react-window';


const ITEM_HEIGHT_DEFAULT = 310;

const createItemData = memoize((months, children, setSize) => ({
  months, children, setSize
}));

const CalendarMonthGridRow = React.memo(({ data, index, style }) => {

  const { months, children, setSize } = data;

  const rowRef = React.useRef();

  React.useEffect(() => {
    try {
      setSize(index, rowRef.current.firstChild.getBoundingClientRect().height);
    } catch (e) {
      console.error(e);
    }
  }, [setSize, index]);

  return (
    <div
      children={children({ month: months[index], index })}
      ref={rowRef}
      style={style} />
  );
}, areEqual);

export const CalendarMonthGridList = ({ isRTL, numberOfMonths, children, itemData, selectedMonthISO, momentConfig }) => {

  const listRef = React.useRef();
  const sizeMap = React.useRef({});
  const setSize = React.useCallback((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef.current.resetAfterIndex(index);
  }, []);
  const getSize = (index) => sizeMap.current[index] || ITEM_HEIGHT_DEFAULT;

  React.useEffect(() => {

    if (selectedMonthISO && listRef.current) {

      for (let iMonth = 0; iMonth < itemData.length; iMonth++) {
        if (momentConfig._toISOMonthString(itemData[iMonth]) === selectedMonthISO) {
          setTimeout(() => listRef.current.scrollToItem(iMonth, "center"), 150);
          break;
        }
      }

    }

  }, [listRef.current]);

  const itemDataMemoized = createItemData(itemData, children, setSize);

  return (
    <AutoSizer>
      {({ height: autoSizerH, width: autoSizerW }) =>
        <List
          children={CalendarMonthGridRow}
          direction={isRTL ? "rtl" : undefined}
          estimatedItemSize={ITEM_HEIGHT_DEFAULT}
          height={autoSizerH}
          itemCount={numberOfMonths}
          itemSize={getSize}
          itemData={itemDataMemoized}
          itemKey={(i) => `CalendarMonth-${i}`}
          overscanCount={0}
          ref={listRef}
          width={autoSizerW}
        />
      }
    </AutoSizer>
  )
}