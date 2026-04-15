import * as React from 'react';

// App
//
import getVisibleDays from '../utils/getVisibleDays';
import momentFactory from '../momentWrapper';
// import dayPickerControllerModifiers from './DayPickerControllerModifiers';
// import toISODateString from '../utils/toISODateString';
import { config } from '../momentWrapper';
import { VERTICAL_SCROLLABLE } from '../constants';


const PRELOAD_DATA_MIN_COUNT = 3;
var faSimpleVisibleDays;
var enSimpleVisibleDays;

const DatePickerDataContainer = ({
  datePickerProps,
  children,
  isRangePicker
}) => {

  const {
    numberOfMonths,
    orientation,
    enableOutsideDays,
    momentConfig,
    focused,
    initialVisibleMonth,
    date
  } = datePickerProps;

  const [state, setState] = React.useState({
    locale: null,
    // faVisibleDay: undefined,
    // enVisibleDay: undefined
  });

  const preLoadTimeoutRef = React.useRef();
  const mustToPreLoadData = React.useMemo(() => numberOfMonths > PRELOAD_DATA_MIN_COUNT, [numberOfMonths]);

  function getCurrentMonth(today) {
    return (initialVisibleMonth || (date ? () => date : () => today))();
  }

  function getVisibleDaysByLocale(currentMonth, locale) {
    return getVisibleDays(
      currentMonth,
      numberOfMonths,
      enableOutsideDays,
      orientation === VERTICAL_SCROLLABLE,
      config(locale)
    );
  }

  function setVisibleDaysInfo(payloadModifiersData) {

    const today = momentFactory().moment();

    if (!faSimpleVisibleDays && !enSimpleVisibleDays) {
      const currentMonth = getCurrentMonth(today);
      if (!faSimpleVisibleDays) {
        faSimpleVisibleDays = getVisibleDaysByLocale(currentMonth.clone().locale('fa'), 'fa');
      }

      if (!enSimpleVisibleDays) {
        enSimpleVisibleDays = getVisibleDaysByLocale(currentMonth.clone().locale('en'), 'en');
      }
    }

    setState({
      locale: momentConfig.locale,
      // faVisibleDay: getModifiers(faSimpleVisibleDays, today, payloadModifiersData, 'fa'),
      // enVisibleDay: getModifiers(enSimpleVisibleDays, today, payloadModifiersData, 'en'),
    });
  }

  // function getModifiers(visibleDays, today, payloadModifiersData, locale) {
  //   const momentConfig = configPure(locale);

  //   const dayPickerModifiers = isRangePicker ?
  //     dayPickerControllerModifiers.rangePicker :
  //     dayPickerControllerModifiers.singlePicker;

  //   const modifiersOtherData = {
  //     ...modifiersData,
  //     ...payloadModifiersData,
  //     today
  //   }

  //   const modifiers = {};
  //   Object.keys(visibleDays).forEach((month) => {
  //     modifiers[month] = {};
  //     visibleDays[month].forEach((day) => {
  //       modifiers[month][toISODateString(day, undefined, momentConfig)] = getModifiersForDay(dayPickerModifiers, day, modifiersOtherData);
  //     });
  //   });

  //   return modifiers;
  // }

  // function getModifiersForDay(modifiers, day, modifiersOtherData) {
  //   return new Set(Object.keys(modifiers).filter((modifier) => modifiers[modifier](day, modifiersOtherData)));
  // }

  function onUpdateModifiersData(payloadModifiersData) {
    if (!mustToPreLoadData)
      return;

    preLoadTimeoutRef.current = setTimeout(() => setVisibleDaysInfo(payloadModifiersData), 0);
  }


  React.useEffect(() => {

    if (mustToPreLoadData) {
      preLoadTimeoutRef.current = setTimeout(() => setVisibleDaysInfo(), 0);
    }

    return () => {
      if (preLoadTimeoutRef.current)
        clearTimeout(preLoadTimeoutRef.current);
    }
  }, []);

  React.useEffect(() => {

    if (mustToPreLoadData && momentConfig.locale !== state.locale) {
      setState({ ...state, locale: momentConfig.locale });
    }

  }, [momentConfig.locale, state.locale, mustToPreLoadData, setState]);


  return children({
    visibleDays: state.locale === 'fa' ? faSimpleVisibleDays : enSimpleVisibleDays,
    //visibleDays: state.locale === 'fa' ? state.faVisibleDay : state.enVisibleDay,
    controllerConfig: {
      getIsOpen: () => mustToPreLoadData ?
        (mustToPreLoadData && momentConfig.locale === state.locale && faSimpleVisibleDays !== undefined && enSimpleVisibleDays !== undefined) :
        focused,
      // getIsOpen: () => mustToPreLoadData ?
      //   (mustToPreLoadData && momentConfig.locale === state.locale && state.faVisibleDay !== undefined && state.enVisibleDay !== undefined) :
      //   focused,
      getHasInitializeData: () => mustToPreLoadData,

      onUpdateModifiersData
    }
  });
}

export default DatePickerDataContainer;
