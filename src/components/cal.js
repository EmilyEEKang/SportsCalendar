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


// const axios = require('axios');
// const cheerio = require('cheerio');

// async function findIcalFiles(links) {
//   const icalFiles = [];

//   for (const link of links) {
//     try {
//       const response = await axios.get(link);
//       const $ = cheerio.load(response.data);

//       $('a').each((index, element) => {
//         const href = $(element).attr('href');
//         if (href && href.endsWith('.ical')) {
//           icalFiles.push(href);
//         } 
//       });
//     } catch (error) {
//       console.error(`Error fetching ${link}:`, error);
//     }
//   }

//   return icalFiles;
// }

// // Example usage:
// const links = [
//   'https://broncosports.com/calendar',
//   'https://goutsa.com/all-sports-schedule',
//   'https://goshockers.com/calendar',
//   'https://fausports.com/calendar'
// ];

// findIcalFiles(links).then(icalFiles => {
//   console.log('Found .ical files:', icalFiles);
// });

import React, { useState, useEffect } from 'react';
import { Calendar, Rss, Settings, Clock, AlertCircle } from 'lucide-react';
import URLInput from './components/URLInput';
import DateRangeSelector from './components/DateRangeSelector';
import EventsList from './components/EventsList';
import ICSFileUpload from './components/ICSFileUpload';
import { parseUrls, processICalContent } from './utils/parsers';
import { Event } from './types';

function App() {
  // State for URLs to scrape
  const [urls, setUrls] = useState<string[]>([]);
  
  // State for date range
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // State for events and loading
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // State for uploaded ICS files
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string, content: string }[]>([]);
  
  // Set default date range on mount
  useEffect(() => {
    const today = new Date();
    const defaultStartDate = today.toISOString().split('T')[0];
    
    const defaultEndDate = new Date();
    defaultEndDate.setDate(today.getDate() + 30);
    const defaultEndDateStr = defaultEndDate.toISOString().split('T')[0];
    
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDateStr);
  }, []);
  
  // Listen for console errors to capture warnings
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      // Check if this is a parser error (they start with "Error parsing")
      const errorMessage = args[0];
      if (typeof errorMessage === 'string' && errorMessage.startsWith('Error parsing')) {
        setWarnings(prev => [...prev, errorMessage]);
      }
      originalConsoleError(...args);
    };
    
    console.warn = (...args) => {
      // Capture warnings as well
      const warnMessage = args[0];
      if (typeof warnMessage === 'string') {
        setWarnings(prev => [...prev, warnMessage]);
      }
      originalConsoleWarn(...args);
    };
    
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);
  
  // Handle ICS file upload
  const handleICSFileContent = (fileName: string, content: string) => {
    // Add file to uploaded files state
    const existingIndex = uploadedFiles.findIndex(file => file.name === fileName);
    
    if (existingIndex >= 0) {
      // Update existing file
      setUploadedFiles(prev => {
        const newFiles = [...prev];
        newFiles[existingIndex] = { name: fileName, content };
        return newFiles;
      });
    } else {
      // Add new file
      setUploadedFiles(prev => [...prev, { name: fileName, content }]);
    }
  };
  
  // Function to fetch events
  const fetchEvents = async () => {
    if (urls.length === 0 && uploadedFiles.length === 0) {
      setError('Please enter at least one URL to scrape or upload an ICS file.');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Please select a valid date range.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setWarnings([]);
      
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      
      // Adjust end date to include the full day
      endDateTime.setHours(23, 59, 59, 999);
      
      let allEvents: Event[] = [];
      
      // 1. Process URLs
      if (urls.length > 0) {
        const fetchedEvents = await parseUrls(urls, startDateTime, endDateTime);
        allEvents = [...allEvents, ...fetchedEvents];
      }
      
      // 2. Process uploaded ICS files
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileEvents = processICalContent(file.content, file.name, startDateTime, endDateTime);
          allEvents = [...allEvents, ...fileEvents];
        }
      }
      
      // Sort all events by date
      allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      
      setEvents(allEvents);
      
      // Display a message if no events were found
      if (allEvents.length === 0 && warnings.length > 0) {
        setError('No events found. There might be issues with some of the sources.');
      } else if (allEvents.length === 0) {
        setError('No events found for the selected date range.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error fetching events:', errorMessage);
      setError('An error occurred while fetching events. Please check the URLs and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate total events sources
  const totalSources = urls.length + uploadedFiles.length;
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar size={32} />
              <h1 className="text-2xl md:text-3xl font-bold">Event Aggregator</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <Settings size={20} className="mr-2 text-blue-600" />
            Configuration
          </div>
          
          <div className="space-y-6">
            <URLInput urls={urls} setUrls={setUrls} />
            
            <ICSFileUpload onFileContent={handleICSFileContent} />
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center text-gray-800 mb-4">
                <Clock size={20} className="mr-2 text-blue-600" />
                <h3 className="font-medium">Date Range</h3>
              </div>
              <DateRangeSelector
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
              />
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={fetchEvents}
                disabled={isLoading}
                className={`px-6 py-3 ${totalSources > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center`}
              >
                <Rss size={18} className="mr-2" />
                {isLoading ? 'Fetching Events...' : 'Fetch Events'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                {error}
              </div>
            )}
            
            {warnings.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
                <div className="flex items-start">
                  <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-2">Warnings:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
                <p className="font-medium mb-2">Uploaded ICS Files:</p>
                <ul className="list-disc pl-5">
                  {uploadedFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8">
          <EventsList events={events} isLoading={isLoading} />
        </div>
      </main>
      
      <footer className="bg-gray-800 text-gray-300 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>Event Aggregator Tool © {new Date().getFullYear()}</p>
          <p className="text-sm mt-2">Collects events from RSS feeds, iCal files, and webpages</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

import React from 'react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate default end date (30 days from now)
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  const defaultEndDateStr = defaultEndDate.toISOString().split('T')[0];

  return (
    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
      <div className="w-full md:w-1/2">
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          min={today}
        />
      </div>
      <div className="w-full md:w-1/2">
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || today}
        />
      </div>
    </div>
  );
};

export default DateRangeSelector;

import React, { useState, useEffect, useRef } from 'react';
import { Event } from '../types';
import { format, isSameDay } from 'date-fns';
import parse from 'html-react-parser';
import { Copy, Check, ChevronDown, ChevronUp, Calendar, FileText, FileCode } from 'lucide-react';

interface EventsListProps {
  events: Event[];
  isLoading: boolean;
}

// Group events by date
const groupEventsByDate = (events: Event[]): { [key: string]: Event[] } => {
  const groupedEvents: { [key: string]: Event[] } = {};
  
  events.forEach(event => {
    const dateStr = format(event.startDate, 'yyyy-MM-dd');
    if (!groupedEvents[dateStr]) {
      groupedEvents[dateStr] = [];
    }
    groupedEvents[dateStr].push(event);
  });
  
  return groupedEvents;
};

// Get emoji based on event title or description
const getEventEmoji = (event: Event): string => {
  const title = event.title.toLowerCase();
  const description = event.description.toLowerCase();
  const location = (event.location || '').toLowerCase();
  
  // Sports
  if (title.includes('golf') || description.includes('golf')) return '🏌️';
  if (title.includes('basketball') || description.includes('basketball')) return '🏀';
  if (title.includes('football') || description.includes('football')) return '🏈';
  if (title.includes('soccer') || description.includes('soccer')) return '⚽';
  if (title.includes('baseball') || description.includes('baseball')) return '⚾';
  if (title.includes('tennis') || description.includes('tennis')) return '🎾';
  if (title.includes('volleyball') || description.includes('volleyball')) return '🏐';
  if (title.includes('swim') || description.includes('swim')) return '🏊';
  if (title.includes('softball') || description.includes('softball')) return '🥎';
  if (title.includes('gymnastics') || description.includes('gymnastics')) return '🤸';
  if (title.includes('track') || description.includes('track') || title.includes('country') || description.includes('country')) return '🏃';
  if (title.includes('equestrian') || description.includes('equestrian') || title.includes('horse') || description.includes('horse')) return '🐎';
  
  // Other event types
  if (title.includes('concert') || description.includes('concert') || title.includes('music') || description.includes('music')) return '🎵';
  if (title.includes('art') || description.includes('art') || title.includes('exhibition') || description.includes('exhibition')) return '🎨';
  if (title.includes('theatre') || description.includes('theatre') || title.includes('theater') || description.includes('theater')) return '🎭';
  if (title.includes('movie') || description.includes('movie') || title.includes('film') || description.includes('film')) return '🎬';
  if (title.includes('food') || description.includes('food') || title.includes('dinner') || description.includes('dinner')) return '🍽️';
  if (title.includes('party') || description.includes('party') || title.includes('celebration') || description.includes('celebration')) return '🎉';
  if (title.includes('workshop') || description.includes('workshop') || title.includes('class') || description.includes('class')) return '📚';
  if (title.includes('conference') || description.includes('conference') || title.includes('meeting') || description.includes('meeting')) return '💼';
  
  // Default emoji
  return '📅';
};

// Extract links from description
const extractLinks = (description: string): { text: string, url: string }[] => {
  const links: { text: string, url: string }[] = [];
  
  // Simple regex to find HTML links
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(description)) !== null) {
    links.push({
      url: match[1],
      text: match[2].replace(/<[^>]*>/g, '') // Remove any nested HTML tags
    });
  }
  
  return links;
};

type CopyFormat = 'html' | 'googleDocs' | 'markdown';

const EventsList: React.FC<EventsListProps> = ({ events, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [expandedDates, setExpandedDates] = useState<{ [key: string]: boolean }>({});
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<CopyFormat>('html');
  const [formattedOutput, setFormattedOutput] = useState<{
    html: string;
    googleDocs: string;
    markdown: string;
  }>({ html: '', googleDocs: '', markdown: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCopyOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate all formats when events change
  useEffect(() => {
    if (events.length > 0) {
      setFormattedOutput({
        html: generateHTMLOutput(),
        googleDocs: generateGoogleDocsOutput(),
        markdown: generateMarkdownOutput()
      });
    }
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-md shadow-sm p-6 text-center text-gray-500">
        No events found for the selected date range.
      </div>
    );
  }

  const toggleExpandDate = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const formatEventDate = (date: Date) => {
    return format(date, 'EEEE, MMM. d');
  };

  const formatEventTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const copyToClipboard = (format: CopyFormat) => {
    const content = format === 'html' 
      ? formattedOutput.html 
      : format === 'googleDocs' 
        ? formattedOutput.googleDocs 
        : formattedOutput.markdown;
        
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setShowCopyOptions(false);
      setSelectedFormat(format);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generateHTMLOutput = () => {
    const groupedEvents = groupEventsByDate(events);
    let output = '<h1>Resources</h1>\n\n';
    output += '<h2>Appendix A: Example Output</h2>\n\n';
    
    Object.keys(groupedEvents).sort().forEach(dateStr => {
      const dateEvents = groupedEvents[dateStr];
      const dateObj = new Date(dateStr);
      const dateHeader = format(dateObj, 'EEEE, MMM. d');
      
      output += `<h3>${dateHeader}</h3>\n`;
      
      if (dateEvents.length === 0) {
        output += '<p>No Events Scheduled</p>\n\n';
      } else {
        dateEvents.forEach(event => {
          const emoji = getEventEmoji(event);
          const title = event.title;
          const timeStr = event.startDate ? `@ ${format(event.startDate, 'h:mm a')} ${event.location ? 'CT' : ''}` : '';
          const location = event.location ? `${event.location}` : '';
          
          output += `<p>${emoji} ${title}${location ? ' - ' + location : ''} ${timeStr}</p>\n`;
          
          // Add links if available
          const links = extractLinks(event.description);
          if (event.url) {
            links.push({ text: 'More Info', url: event.url });
          }
          
          if (links.length > 0) {
            output += '<p>';
            links.forEach((link, index) => {
              output += `<a href="${link.url}">${link.text}</a>`;
              if (index < links.length - 1) {
                output += ' | ';
              }
            });
            output += '</p>\n';
          }
        });
        output += '\n';
      }
    });
    
    return output;
  };

  const generateGoogleDocsOutput = () => {
    const groupedEvents = groupEventsByDate(events);
    let output = 'Resources\n\n';
    output += 'Appendix A: Example Output\n\n';
    
    Object.keys(groupedEvents).sort().forEach(dateStr => {
      const dateEvents = groupedEvents[dateStr];
      const dateObj = new Date(dateStr);
      const dateHeader = format(dateObj, 'EEEE, MMM. d');
      
      output += `${dateHeader}\n`;
      
      if (dateEvents.length === 0) {
        output += 'No Events Scheduled\n\n';
      } else {
        dateEvents.forEach(event => {
          const emoji = getEventEmoji(event);
          const title = event.title;
          const timeStr = event.startDate ? `@ ${format(event.startDate, 'h:mm a')} ${event.location ? 'CT' : ''}` : '';
          const location = event.location ? `${event.location}` : '';
          
          output += `${emoji} ${title}${location ? ' - ' + location : ''} ${timeStr}\n`;
          
          // Add links if available
          const links = extractLinks(event.description);
          if (event.url) {
            links.push({ text: 'More Info', url: event.url });
          }
          
          if (links.length > 0) {
            links.forEach((link, index) => {
              output += `${link.text}: ${link.url}`;
              if (index < links.length - 1) {
                output += ' | ';
              }
            });
            output += '\n';
          }
        });
        output += '\n';
      }
    });
    
    return output;
  };

  const generateMarkdownOutput = () => {
    const groupedEvents = groupEventsByDate(events);
    let output = '# Resources\n\n';
    output += '## Appendix A: Example Output\n\n';
    
    Object.keys(groupedEvents).sort().forEach(dateStr => {
      const dateEvents = groupedEvents[dateStr];
      const dateObj = new Date(dateStr);
      const dateHeader = format(dateObj, 'EEEE, MMM. d');
      
      output += `### ${dateHeader}\n`;
      
      if (dateEvents.length === 0) {
        output += '*No Events Scheduled*\n\n';
      } else {
        dateEvents.forEach(event => {
          const emoji = getEventEmoji(event);
          const title = event.title;
          const timeStr = event.startDate ? `@ ${format(event.startDate, 'h:mm a')} ${event.location ? 'CT' : ''}` : '';
          const location = event.location ? `${event.location}` : '';
          
          output += `${emoji} ${title}${location ? ' - ' + location : ''} ${timeStr}\n`;
          
          // Add links if available
          const links = extractLinks(event.description);
          if (event.url) {
            links.push({ text: 'More Info', url: event.url });
          }
          
          if (links.length > 0) {
            links.forEach((link, index) => {
              output += `[${link.text}](${link.url})`;
              if (index < links.length - 1) {
                output += ' | ';
              }
            });
            output += '\n';
          }
        });
        output += '\n';
      }
    });
    
    return output;
  };
  
  // Format events for display
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort();

  const formatLabels = {
    html: 'HTML (Rich Text)',
    googleDocs: 'Google Docs (Plain Text)',
    markdown: 'Markdown'
  };

  const formatIcons = {
    html: <Copy size={18} />,
    googleDocs: <FileText size={18} />,
    markdown: <FileCode size={18} />
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Events ({events.length})</h2>
        <div className="relative" ref={dropdownRef}>
          {copied ? (
            <button className="px-4 py-2 bg-green-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center">
              <Check size={18} className="mr-1" />
              Copied!
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowCopyOptions(!showCopyOptions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                <Copy size={18} className="mr-1" />
                Copy As
                <ChevronDown size={18} className="ml-1" />
              </button>
              {showCopyOptions && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => copyToClipboard('html')}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-100 flex items-center"
                    >
                      {formatIcons.html}
                      <span className="ml-2">{formatLabels.html}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard('googleDocs')}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-100 flex items-center"
                    >
                      {formatIcons.googleDocs}
                      <span className="ml-2">{formatLabels.googleDocs}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard('markdown')}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-100 flex items-center"
                    >
                      {formatIcons.markdown}
                      <span className="ml-2">{formatLabels.markdown}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="hidden">
        <pre id="events-html-output">{formattedOutput.html}</pre>
        <pre id="events-googledocs-output">{formattedOutput.googleDocs}</pre>
        <pre id="events-markdown-output">{formattedOutput.markdown}</pre>
      </div>

      {/* Daily Schedule View */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {sortedDates.map((dateStr) => {
          const dateEvents = groupedEvents[dateStr];
          const dateObj = new Date(dateStr);
          const formattedDate = formatEventDate(dateObj);
          const isExpanded = expandedDates[dateStr] ?? true;
          
          return (
            <div key={dateStr} className="border-b border-gray-200 last:border-b-0">
              <div 
                className="bg-gray-50 px-6 py-3 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                onClick={() => toggleExpandDate(dateStr)}
              >
                <h3 className="font-bold text-lg text-gray-800">{formattedDate}</h3>
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">{dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}</span>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {dateEvents.length === 0 ? (
                    <div className="px-6 py-4 text-gray-500 italic">No Events Scheduled</div>
                  ) : (
                    dateEvents.map((event, eventIndex) => {
                      const emoji = getEventEmoji(event);
                      
                      return (
                        <div key={eventIndex} className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="text-xl mr-2">{emoji}</div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <div className="mt-1 text-sm text-gray-600">
                                {event.startDate && (
                                  <div className="flex items-center">
                                    <Calendar size={14} className="mr-1" />
                                    <span>{formatEventTime(event.startDate)}</span>
                                    {event.location && <span className="ml-2">at {event.location}</span>}
                                  </div>
                                )}
                                
                                {event.description && (
                                  <div className="mt-2 prose prose-sm max-w-none">
                                    {typeof event.description === 'string' ? parse(event.description) : event.description}
                                  </div>
                                )}
                                
                                {event.url && (
                                  <a 
                                    href={event.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="mt-2 inline-block text-blue-600 hover:underline"
                                  >
                                    More information
                                  </a>
                                )}
                                
                                {event.source && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    Source: {event.source}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventsList;

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, FileWarning } from 'lucide-react';

interface ICSFileUploadProps {
  onFileContent: (fileName: string, content: string) => void;
}

const ICSFileUpload: React.FC<ICSFileUploadProps> = ({ onFileContent }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setUploadStatus('idle');
      return;
    }

    // Check if file is likely an ICS file
    if (!file.name.toLowerCase().endsWith('.ics') && !file.type.includes('calendar')) {
      setFileName(file.name);
      setUploadStatus('error');
      setErrorMessage('The selected file does not appear to be an ICS calendar file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.includes('BEGIN:VCALENDAR')) {
        setUploadStatus('error');
        setErrorMessage('The file does not contain valid iCalendar data.');
        return;
      }

      setFileName(file.name);
      setUploadStatus('success');
      setErrorMessage(null);
      onFileContent(file.name, content);
    };

    reader.onerror = () => {
      setFileName(file.name);
      setUploadStatus('error');
      setErrorMessage('Failed to read the file. Please try again.');
    };

    reader.readAsText(file);
  };

  const resetFile = () => {
    setFileName(null);
    setUploadStatus('idle');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-center text-gray-800 mb-4">
        <Upload size={20} className="mr-2 text-blue-600" />
        <h3 className="font-medium">Upload ICS File</h3>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center">
          <input
            type="file"
            id="ics-file"
            ref={fileInputRef}
            accept=".ics"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="ics-file"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer flex items-center mr-4"
          >
            <Upload size={18} className="mr-2" />
            Select ICS File
          </label>

          {fileName && (
            <button
              onClick={resetFile}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Clear
            </button>
          )}
        </div>

        {fileName && (
          <div className={`mt-4 p-4 rounded-md ${
            uploadStatus === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : uploadStatus === 'error'
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-gray-50 border border-gray-200 text-gray-700'
          }`}>
            <div className="flex items-center">
              {uploadStatus === 'success' ? (
                <CheckCircle size={20} className="mr-2 flex-shrink-0" />
              ) : uploadStatus === 'error' ? (
                <FileWarning size={20} className="mr-2 flex-shrink-0" />
              ) : null}
              <div>
                <p className="font-medium">{fileName}</p>
                {errorMessage && <p className="text-sm mt-1">{errorMessage}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ICSFileUpload;

import React, { useState, useEffect } from 'react';
import { Save, Trash2 } from 'lucide-react';

interface URLInputProps {
  urls: string[];
  setUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

const URLInput: React.FC<URLInputProps> = ({ urls, setUrls }) => {
  const [urlText, setUrlText] = useState<string>('');
  const [savedUrlSets, setSavedUrlSets] = useState<{ name: string; urls: string[] }[]>([]);
  const [setName, setSetName] = useState<string>('');

  useEffect(() => {
    const savedSets = localStorage.getItem('savedUrlSets');
    if (savedSets) {
      setSavedUrlSets(JSON.parse(savedSets));
    }
  }, []);

  useEffect(() => {
    setUrlText(urls.join('\n'));
  }, [urls]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUrlText(e.target.value);
    const newUrls = e.target.value
      .split('\n')
      .map(url => url.trim())
      .filter(url => url !== '');
    setUrls(newUrls);
  };

  const saveUrlSet = () => {
    if (setName.trim() === '' || urls.length === 0) return;
    
    const newSavedSets = [...savedUrlSets, { name: setName, urls }];
    setSavedUrlSets(newSavedSets);
    localStorage.setItem('savedUrlSets', JSON.stringify(newSavedSets));
    setSetName('');
  };

  const loadUrlSet = (urls: string[]) => {
    setUrls(urls);
  };

  const deleteUrlSet = (index: number) => {
    const newSavedSets = [...savedUrlSets];
    newSavedSets.splice(index, 1);
    setSavedUrlSets(newSavedSets);
    localStorage.setItem('savedUrlSets', JSON.stringify(newSavedSets));
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-1">
          URLs to Scrape (one per line)
        </label>
        <textarea
          id="urls"
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={urlText}
          onChange={handleUrlChange}
          placeholder="https://example.com/rss&#10;https://example.com/events.ics&#10;https://example.com/events-page"
        />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          placeholder="URL Set Name"
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={saveUrlSet}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          disabled={setName.trim() === '' || urls.length === 0}
        >
          <Save size={18} className="mr-1" />
          Save URLs
        </button>
      </div>

      {savedUrlSets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Saved URL Sets</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedUrlSets.map((set, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                <span className="font-medium">{set.name}</span>
                <div>
                  <button
                    onClick={() => loadUrlSet(set.urls)}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteUrlSet(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default URLInput;