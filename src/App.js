import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import DateBox from './DatePickers';
import LinkBox from './LinkBox';
import CreateCalendar from './CreateCalendar';
import './App.css';

function App() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [severity, setSeverity] = useState('');
  const [links, setLinks] = useState('');
  const [divText, setDivText] = useState('');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [dictionaryString, setDictionaryString] = useState('');
  const [emojiDictionary, setEmojiDictionary] = useState({
    "baseball": '⚾',
    "base": '⚾',
    "basketball": '🏀',
    "bb": '🏀',
    "soccer": '⚽',
    "soc": '⚽',
    "softball": '🥎',
    "sb": '🥎',
    "volleyball": '🏐',
    "vb": '🏐',
    "football": '🏈',
    "tennis": '🎾',
    "ten": '🎾',
    "golf": '🏌️',
    "bowling": '🎳',
    "dive": '🌊',
    "diving": '🌊',
    "surfing": '🌊',
    "swim": '🌊',
    "swimming": '🌊',
    "water polo": '🌊',
    "weightlifting": '🏋️',
    "wrestling": '🤼',
    "track": '🏃‍♂️',
    "field": '🏃‍♂️',
    "TF": '🏃‍♂️',
    "cross country": '🏃‍♂️',
    "x-country": '🏃‍♂️',
    "XCTF": '🏃‍♂️',
    "XC": '🏃‍♂️',
    "hockey": '🏒',
    "archery": '🏹',
    "bike": '🚲',
    "biking": '🚲',
    "bowling": '🎳',
    "bowl": '🎳',
    "boxing": '🥊',
    "cheer": '📣',
    "dance": '💃',
    "esports": '🎮',
    "equestrian": '🐎',
    "fencing": '🤺',
    "fishing": '🎣',
    "frisbee": '🥏',
    "gymnastics": '🤸',
    "gym": '🤸',
    "lacrosse": '🥍',
    "rowing": '🚣',
    "rugby": '🏉',
    "shooting": '🎯',
    "skiing": '🎿',
    "snowboarding": '🏂',
    "triathlon": '🌊🚲🏃‍♂️'
  });

  useEffect(() => {
    const sortedDictionary = Object.entries(emojiDictionary).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    );
    let dictString = '';
    for (const [key, value] of sortedDictionary) {
      dictString += `${key}: ${value}  |  `;
    }
    setDictionaryString(dictString);
  }, [emojiDictionary]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && date && date > endDate) {  // Reset end date if start date is after end date
      setEndDate(null);
      setAlertMessage('Start date cannot be after end date');
      setSeverity('warning');
      setAlertOpen(true);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (!startDate || (date && date >= startDate)) {
      setEndDate(date);
    } else if (date && date < startDate) { // Reset start date if end date is before start date
      setAlertMessage('End date cannot be before start date');
      setSeverity('warning');
      setStartDate(null);
      setEndDate(date);
      setAlertOpen(true);
    }
  };

  const handleButtonClick = () => {
    if (!startDate || !endDate) {
      setAlertMessage('Please select a start and end date'); // Error if start or end date is not selected
      setSeverity('error');
      setAlertOpen(true);
      return;
    }
    if (!links) {
      setAlertMessage('Please enter a list of links'); // Error if links are not entered
      setSeverity('error');
      setAlertOpen(true);
      return;
    }
    setLinks(links); // Gets links from text box
    setDivText(<CreateCalendar startDate={startDate} endDate={endDate} links={links} emojiDictionary={emojiDictionary} />); // Creates calendar
  };

  const handleAdd = () => {
    if (!key || !value) {
      setAlertMessage('Please enter a word and an asoocated emoji. Words do not need to be capitalized'); // Error if key or value is not entered
      setSeverity('info');
      setAlertOpen(true);
      return;
    }
    key.trim();
    value.trim();
    if (emojiDictionary[key]) {
      setAlertMessage(`The emoji association for ${key} already exists and will be overwritten`);
      setSeverity('info');
      setAlertOpen(true);
    }
    setKey(key);
    setValue(value);
    setEmojiDictionary(prevDict => ({ ...prevDict, [key]: value }));
  };

  const handleRemove = () => {
    if (!key) {
      setAlertMessage('Please enter a word to remove from list'); // Error if key is not entered
      setSeverity('info');
      setAlertOpen(true);
      return;
    }
    key.trim();
    if (emojiDictionary[key]) {
      delete emojiDictionary[key];
    }
    setEmojiDictionary(prevDict => ({ ...prevDict}));
  };

  return (
    <div className="App">
      <h1>Sports Calendar</h1>
      <div>
        Select calendar start: 
        <DateBox selectedDate={startDate} onDateChange={handleStartDateChange} />
      </div>
      <br />
      <div>
        Select calendar end: 
        <DateBox selectedDate={endDate} onDateChange={handleEndDateChange} minDate={startDate} />
      </div>
      <Snackbar className="alert"open={alertOpen} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
      <br /> 
      <LinkBox value={links} onChange={setLinks} />
      <br />
      <b>Emoji Association List:</b>
      <br />
      <div className="dictionary-container">
        {dictionaryString}
      </div>
      <br />
      <div>
        <input
          type="text"
          display="inline"
          placeholder="Sport name"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <input
          type="text"
          display="inline"
          placeholder="Emoji"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          display="inline"
          onClick={handleAdd}>
            Add to list
        </button>
        <button
          display="inline"
          onClick={handleRemove}>
            Remove from list
        </button>
      </div>

      <br />
      <button onClick={handleButtonClick}>Generate Calendar!</button>
      <br />
      <div className="calendar">
        {divText}
      </div>
    </div>
  );
}

export default App;
