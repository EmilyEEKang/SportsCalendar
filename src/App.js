import React, { useEffect, useState, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, SettingsIcon, Upload } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CreateCalendar from './components/CreateCalendar';
import DateBox from './components/DatePickers';
import './App.css';
import Tiptap from './components/Tiptap';

function App() {
  //State for date range
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  // State for uploaded ICS files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // State for alerts
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [severity, setSeverity] = useState('');
  // State for button
  const [isExpanded, setIsExpanded] = useState(false);
  // State for calendar output
  const tiptapRef = useRef(null);
  const [divText, setDivText] = useState('');
  // State for dictionary
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
    "bowl": '🎳',
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
    let dictString = '| ';
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
    if (uploadedFiles.length === 0) {
      setAlertMessage('Please select a iCal (.ics) or RSS (.rss) Calendar file'); // Error if files are not entered
      setSeverity('error');
      setAlertOpen(true);
      return;
    }
    setDivText(<CreateCalendar startDate={startDate} endDate={endDate} files={uploadedFiles} emojiDictionary={emojiDictionary} />); // Creates calendar

    if (tiptapRef.current) {
      console.log(divText)
      tiptapRef.current.updateContent("hello");
      //tiptapRef.current.updateContent(divText);
    }
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

  const handleRemoveFile = (fileName) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    const newUploadedFiles = [];
    let duplicate = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      for (let j = 0; j < uploadedFiles.length; j++)
      {
        if (file.name === uploadedFiles[j].name)
        {
          console.log("File already uploaded")
          duplicate = true;
          break;
        }
      }

      if (duplicate)
      {
        duplicate = false;
        continue;
      }
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target.result;
        newUploadedFiles.push({ name: file.name, content });

        // Update the state after reading all files
        if (newUploadedFiles.length === files.length) {
          setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
        }
      };
      if (file)
      {
        reader.readAsText(file);
      }
    }
  };

  const ChangeButton = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
    else {
      setIsExpanded(true);
    }
  }

  const copyToClipboard = (input) => {
    if (input === '') {
      setAlertMessage('There is no calendar to copy');
      setSeverity('info');
      setAlertOpen(true);
    } else {
      const clipboard = new window.ClipboardItem({ 'text/html': new Blob([input], { type: 'text/plain' }) });
      navigator.clipboard.write([clipboard]);
      setAlertMessage('Calendar copied to clipboard');
      setSeverity('success');
      setAlertOpen(true);
      // const turndownService = new TurndownService();
      // const markdown = turndownService.turndown(input);
      // navigator.clipboard.writeText(markdown);
    }
  }

  

  return (
  <div className="App">
    <header className="app-header">
      <div className="app-header-container">
        <div className="app-flex">
          <Calendar size={32}/>
          <h1 className="title">Sports Calendar</h1>
        </div>
      </div>
    </header>

    <main className="app-main">
    <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {alertMessage}
      </Alert>
    </Snackbar>
    <div className="content">
      <div className="SettingsComponent">
        <div className="settings">
          <SettingsIcon size={20} color='rgb(37 99 235)'/>
          <p className="settings-title">Settings</p>
          <button id="toggleButton" className="chevron-button" onClick={ChangeButton}>
            <span id="chevron">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </button>
        </div>
        <br/>
        {isExpanded ? 
        <div id="emojiDict" className="emojiDict">
          <p className="emojiList"><b>Emoji Associations</b></p>
          <br />
          {dictionaryString}
          <div className='dictionary-container'>
            <input
              type="text"
              className = "input-box"
              display="inline"
              placeholder="Sport name"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <input
              type="text"
              className = "input-box"
              display="inline"
              placeholder="Emoji"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              display="inline"
              className="emoji-buttons"
              onClick={handleAdd}>
                Add to list
            </button>
            <button
              display="inline"
              className="emoji-buttons"
              onClick={handleRemove}>
                Remove from list
            </button>
          </div>
        </div>
        : <div /> }
        </div>
        <div className="separator"/>
        <div className="DateComponent">
          <div className="date-title">
            <Clock size={20} color='rgb(37 99 235)'/>
            <p className="date-range">Date Range</p>
          </div>
          <div className="empty">
            <div className="date-pickers">
              <div> 
                <label className="date-label">Start Date</label>
                <div className="date-box">
                  <DateBox id="startDate" selectedDate={startDate} onDateChange={handleStartDateChange} />
                </div>
              </div>
              <div>
              <label className="date-label">End Date</label>
              <div className="date-box">
                <DateBox id="endDate" selectedDate={endDate} onDateChange={handleEndDateChange} />
              </div>
              </div>
            </div>
          </div>
        </div>
        <div className="separator"/>
        <div className="UploadComponent">
          <div className="upload-title">
            <Upload size={20} color='rgb(37 99 235)'/>
            <p className="file-upload-title">Upload ICS or RSS File</p>
          </div>
          <div>
            <label htmlFor="files" className="file-label">
              <Upload className="icon" size={18}/>
              Select ICS or RSS file(s)
            </label>
            <br/>
            <input id="files" type="file" className="file-input" accept=".ics,.rss" onChange={handleFileChange} multiple/>
          </div>
          <div>
            {uploadedFiles.length === 0 ? (
              <div className="empty"/>
            ) : (
              <div className="uploaded-files">
                <p className="UploadedFilesTitle">Uploaded files:</p>
                <ul>
                {
                  uploadedFiles.map((file, index) => (
                    <li key={index}>
                      {file.name}
                      <button className="remove-button" onClick={() => handleRemoveFile(file.name)}>Remove</button>
                    </li>
                  ))
                }
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="separator"/>
        <div className="CalendarComponent">
          <button className='generate-button' onClick={handleButtonClick}>Generate Calendar!</button>
        </div>
        </div>
    <div className="content">
      <div className="calendar">
        {divText ? (<Tiptap ref={tiptapRef}></Tiptap>) : (
          <div/>
        ) }
        {divText}
      </div>
    </div>
    </main>
  </div>
  );
}

export default App;
