import React from 'react';
import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';
import moment from 'moment';
import jMoment from 'moment-jalaali-patched'
import omit from 'lodash/omit';
import SingleDatePicker from '../src/components/SingleDatePicker';

import { SingleDatePickerPhrases } from '../src/defaultPhrases';
import SingleDatePickerShape from '../src/shapes/SingleDatePickerShape';
import { HORIZONTAL_ORIENTATION, ANCHOR_LEFT, VERTICAL_ORIENTATION, VERTICAL_SCROLLABLE } from '../src/constants';
import isInclusivelyAfterDay from '../src/utils/isInclusivelyAfterDay';

const propTypes = {
    // example props for the demo
    autoFocus: PropTypes.bool,
    initialDate: momentPropTypes.momentObj,

    ...omit(SingleDatePickerShape, [
        'date',
        'onDateChange',
        'focused',
        'onFocusChange',
    ]),
};

const defaultProps = {
    // example props for the demo
    autoFocus: false,
    initialDate: null,

    // input related props
    id: 'date',
    placeholder: 'Date',
    disabled: false,
    required: false,
    screenReaderInputMessage: '',
    showClearDate: false,
    showDefaultInputIcon: false,
    customInputIcon: null,
    block: false,
    small: false,
    regular: false,
    // verticalSpacing: undefined,
    keepFocusOnInput: false,

    // calendar presentation and interaction related props
    // renderMonthText: null,
    orientation: HORIZONTAL_ORIENTATION,
    anchorDirection: ANCHOR_LEFT,
    horizontalMargin: 0,
    withPortal: false,
    withFullScreenPortal: false,
    initialVisibleMonth: null,
    numberOfMonths: 2,
    keepOpenOnDateSelect: false,
    reopenPickerOnClearDate: false,
    isRTL: false,

    // navigation related props
    navPrev: null,
    navNext: null,
    onPrevMonthClick() { },
    onNextMonthClick() { },
    onClose() { },

    // day presentation and interaction related props
    // renderCalendarDay: undefined,
    // renderDayContents: null,
    enableOutsideDays: false,
    // isDayBlocked: () => false,
    isOutsideRange: day => !isInclusivelyAfterDay(day, moment()),
    // isDayHighlighted: () => { },

    // internationalization props
    displayFormat: () => moment.localeData().longDateFormat('L'),
    //monthFormat: 'MMMM YYYY',
    phrases: SingleDatePickerPhrases,
};

class SingleDatePickerWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            focused: props.autoFocus,
            date: props.initialDate,
            lan: 'fa'
        };

        this.onDateChange = this.onDateChange.bind(this);
        this.onFocusChange = this.onFocusChange.bind(this);
        this.handleChangeLanguage = this.handleChangeLanguage.bind(this);
    }
    //componentWillUpdate(nextProps, nextState) {
    //    console.log('componentWillUpdate', this.state.date === nextState.date, this.state.date, nextState.date);

    //    //if (nextState.date) {
    //    //    if (nextState.date.day() == 0)
    //    //        throw {};
    //    //    else
    //    //        console.log('componentWillUpdate a', nextState.date.day() );
    //    //}

    //}
    onDateChange(date) {
        //console.log('onDateChange b', this.state.date);

        this.setState({ date });

    }

    onFocusChange({ focused }) {
        //console.log('onFocusChange b', this.state.date);

        this.setState({ focused });




    }
    handleChangeLanguage() {
        //console.log('handleChangeLanguage b', this.state)
        var lan = (this.state.lan === 'en' ? 'fa' : 'en');
        this.setState({
            lan: lan,
            date: (this.state && this.state.date) ? (this.state.lan === 'en' ? jMoment(this.state.date).locale('fa') : moment(this.state.date).locale('en')) : undefined
        });

    }

    render() {
        const { focused, date, lan } = this.state;
        //console.log('wrapper render', date);
        moment.locale(lan);

        // autoFocus and initialDate are helper props for the example wrapper but are not
        // props on the SingleDatePicker itself and thus, have to be omitted.
        const props = omit(this.props, [
            'autoFocus',
            'initialDate',
        ]);
        //var watch = WatchJS.watch;
        var cloned = date ? date.clone() : null;
        //if (cloned) {

        //    watch(cloned, function () {
        //        throw {};
        //    });
        //}
        return (
            <div>
                <SingleDatePicker
                    {...props}
                    id="date_input"
                    date={cloned}
                    focused={focused}
                    onDateChange={this.onDateChange}
                    onFocusChange={this.onFocusChange}
                    locale={lan}
                    initialVisibleMonth={()=> this.state.lan === 'fa' ? jMoment().add(1, 'months') : moment().add(1, 'months')}
                />
                <button className='btn' onClick={this.handleChangeLanguage}>{lan}</button>
            </div>
        );
    }
}

SingleDatePickerWrapper.propTypes = propTypes;
SingleDatePickerWrapper.defaultProps = defaultProps;

export default SingleDatePickerWrapper;
