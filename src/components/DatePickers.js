import React from "react";
import { LocalizationProvider, DatePicker, PickersActionBar  } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import TextField from '@mui/material/TextField';

const DateBox = ({ selectedDate, onDateChange }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label="Select Date"
        value={selectedDate}
        onChange={(newValue) => onDateChange(newValue)}
        TextField={(params) => <TextField {...params} />}
        slots={{
          ActionBar: PickersActionBar,
        }}
        slotProps={{
          actionBar: {
            actions: ['today','clear']
          }
        }}
      />
    </LocalizationProvider>
  );
};

export default DateBox;