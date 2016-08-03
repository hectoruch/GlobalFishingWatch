import React, { Component } from 'react';
import map from '../../../styles/index.scss';

class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.onDatePickerChange = this.onDatePickerChange.bind(this);
  }

  onDatePickerChange(e) {
    const start = (e.target.id === 'inner_extent_start') ? new Date(e.target.value) : this.props.start;
    const end = (e.target.id === 'inner_extent_end') ? new Date(e.target.value) : this.props.end;
    this.props.onDatePickerChange([start, end]);
  }

  render() {
    return (
      <div className={map.date_inputs}>
        <label htmlFor="inner_extent_start">
        Start date
          <input
            type="date"
            id="inner_extent_start"
            value={this.props.start.toISOString().slice(0, 10)}
            min={this.props.startMin.toISOString().slice(0, 10)}
            max={this.props.startMax.toISOString().slice(0, 10)}
            onChange={this.onDatePickerChange}
          />
        </label>
        <label htmlFor="inner_extent_end">
          End date
          <input
            type="date"
            id="inner_extent_end"
            value={this.props.end.toISOString().slice(0, 10)}
            min={this.props.endMin.toISOString().slice(0, 10)}
            max={this.props.endMax.toISOString().slice(0, 10)}
            onChange={this.onDatePickerChange}
          />
        </label>
      </div>
    );
  }
}

DatePicker.propTypes = {
  onDatePickerChange: React.PropTypes.func,
  start: React.PropTypes.object,
  end: React.PropTypes.object,
  startMin: React.PropTypes.object,
  startMax: React.PropTypes.object,
  endMin: React.PropTypes.object,
  endMax: React.PropTypes.object
};

export default DatePicker;
