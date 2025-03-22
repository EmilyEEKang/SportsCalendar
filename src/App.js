import React, { useEffect, useState, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, SettingsIcon, Upload, Copy } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CreateCalendar from './components/CreateCalendar';
import DateBox from './components/DatePickers';
import './App.css';
import Tiptap from './components/Tiptap';
import ReactDOMServer from 'react-dom/server';

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
  // Add state for copy success notification
  const [copySuccess, setCopySuccess] = useState(false);

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
    
    // Create calendar content
    const calendarContent = <CreateCalendar startDate={startDate} endDate={endDate} files={uploadedFiles} emojiDictionary={emojiDictionary} />;
    setDivText(calendarContent); // Creates calendar and displays it
    
    // Generate HTML string from the React component
    try {
      const htmlString = ReactDOMServer.renderToString(calendarContent);
      console.log("Generated HTML content length:", htmlString.length);
      
      // Process HTML to ensure only day headers are formatted
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;
      
      // Make sure there's good spacing between days
      const dayContainers = tempDiv.querySelectorAll('.calendar-day');
      dayContainers.forEach(container => {
        container.style.marginBottom = '20px';
      });
      
      // Make sure day headers and content are properly formatted
      const dayContentParagraphs = tempDiv.querySelectorAll('.day-content');
      dayContentParagraphs.forEach(paragraph => {
        // Ensure only headers are bold and underlined
        const content = paragraph.innerHTML;
        // Make sure <br> tags and header formatting is preserved
        const processedContent = content.replace(/<b><u>(.*?)<\/u><\/b><br\s*\/>/, function(match, headerText) {
          return `<b><u>${headerText}</u></b><br />`;
        });
        paragraph.innerHTML = processedContent;
      });
      
      const processedHtml = tempDiv.innerHTML;
      
      // Wait a moment to ensure the component has mounted
      setTimeout(() => {
        if (tiptapRef.current) {
          tiptapRef.current.updateContent(processedHtml);
        }
      }, 500);
    } catch (error) {
      console.error("Error rendering HTML:", error);
      setAlertMessage('Error generating calendar for editor');
      setSeverity('error');
      setAlertOpen(true);
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

  // Add function to copy editor content to clipboard
  const handleCopyToClipboard = () => {
    if (tiptapRef.current) {
      const htmlContent = tiptapRef.current.getHTML();
      
      try {
        // Process HTML to preserve only day headers formatting
        const processedHtml = processHtmlForCopy(htmlContent);
        
        // Use ClipboardItem to preserve minimal formatting
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([processedHtml], { type: 'text/html' }),
          'text/plain': new Blob([stripHtml(processedHtml)], { type: 'text/plain' }) // Fallback plain text
        });
        
        navigator.clipboard.write([clipboardItem])
          .then(() => {
            setCopySuccess(true);
            setAlertMessage('Calendar copied to clipboard!');
            setSeverity('success');
            setAlertOpen(true);
            
            // Reset success message after 3 seconds
            setTimeout(() => {
              setCopySuccess(false);
            }, 3000);
          })
          .catch(err => {
            console.error('Failed to copy formatted text: ', err);
            // Fallback to plain text copy
            fallbackCopyText(processedHtml);
          });
      } catch (err) {
        console.error('ClipboardItem not supported: ', err);
        // Fallback to plain text copy
        fallbackCopyText(htmlContent);
      }
    }
  };
  
  // Process HTML to preserve only day headers formatting
  const processHtmlForCopy = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all day content paragraphs
    const dayContentParagraphs = tempDiv.querySelectorAll('.day-content');
    
    // Process each day's content
    dayContentParagraphs.forEach(paragraph => {
      // Make sure parent div has proper spacing
      const parentDiv = paragraph.closest('.calendar-day');
      if (parentDiv) {
        parentDiv.style.marginBottom = '20px';
      }
      
      // Preserve the header formatting and ensure line breaks work properly
      const content = paragraph.innerHTML;
      
      // Get all the anchor tags to preserve them
      const anchorTags = [];
      const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi;
      let match;
      let processedContent = content;
      
      // Find all anchor tags and replace them with placeholders
      let i = 0;
      while ((match = anchorRegex.exec(content)) !== null) {
        const placeholder = `__LINK_${i}__`;
        anchorTags.push({
          placeholder: placeholder,
          original: match[0]
        });
        
        // Replace the link with a placeholder in processed content
        processedContent = processedContent.replace(match[0], placeholder);
        i++;
      }
      
      // Apply other formatting rules (keep header bold/underlined, preserve line breaks)
      processedContent = processedContent
        // Keep header formatting
        .replace(/<b><u>(.*?)<\/u><\/b><br\s*\/>/, function(match, headerText) {
          return `<b><u>${headerText}</u></b><br />`;
        })
        // Remove any other formatting but preserve <br /> tags - excluding our placeholders
        .replace(/<(?!b>|\/b>|u>|\/u>|\/?br\s*\/?)([^>]*)>/gi, '');
      
      // Replace the placeholders with the original anchor tags
      anchorTags.forEach(tag => {
        processedContent = processedContent.replace(tag.placeholder, tag.original);
      });
      
      paragraph.innerHTML = processedContent;
    });
    
    return tempDiv.innerHTML;
  };
  
  // Strip all HTML for plain text version
  const stripHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };
  
  // Fallback function for browsers that don't support ClipboardItem
  const fallbackCopyText = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get the text content, preserving line breaks
    const textContent = tempDiv.innerText;
    
    navigator.clipboard.writeText(textContent)
      .then(() => {
        setCopySuccess(true);
        setAlertMessage('Calendar copied to clipboard (plain text only)');
        setSeverity('info');
        setAlertOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setAlertMessage('Failed to copy to clipboard');
        setSeverity('error');
        setAlertOpen(true);
      });
  };

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
        {divText && (
          <div className="editor-wrapper">
            <h3>Edit Calendar:</h3>
            <Tiptap ref={tiptapRef} />
            {divText && (
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button 
                  className="generate-button" 
                  onClick={handleCopyToClipboard}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Copy className="icon" size={18}/>
                  Copy Calendar to Clipboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </main>
  </div>
  );
}

export default App;
