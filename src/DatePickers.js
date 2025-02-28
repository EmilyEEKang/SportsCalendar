import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateBox = ({ selectedDate, onDateChange }) => {
  return (
    <div>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => onDateChange(date)}
        dateFormat={["MMMM d, yyyy", "MM/dd/yyyy"]}
        placeholderText="Select a date"
        isClearable
      />
    </div>
  );
};

export default DateBox;