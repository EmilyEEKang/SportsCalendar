
import React from 'react';

const CreateCalendar = ({ startDate, endDate, links, emojiDictionary }) => {
  let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let months = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

  function getEmoji(text) {
    for (const key in emojiDictionary) {
      const regex = new RegExp(`\\b${key}\\b`, 'i'); // Create a case-insensitive regex for the key
      if (regex.test(text)) {
        return emojiDictionary[key];
      }
    }
  }

  // Fix name
  function parsetext(event) {
    const line = [];
    line.push(getEmoji(event), event);
    return line;
  }

  // Event example: "Women’s Basketball vs. Texas A&M - Black History Month Game @ 6 p.m. CT SEC ESPN | Buy"
  function getEvent(link){
    const events = [];
    const ical = require('cal-parser');
    const cal = ".\sports-calendar\src\calendar.ics";
    const data = ical.parseICS();

    for (let k in data) {
      if (data.hasOwnProperty(k)) {
        var ev = data[k]
        if (data[k].type == 'VEVENT') {
          console.log(`${ev.summary} is in ${ev.location} on the ${ev.start.getDate()} of ${months[ev.start.getMonth()]} at ${ev.start.toLocaleTimeString('en-GB')}`);
        }
      } 
    }
  }

  function getEvents(links){
    const events = [];
    let urls = links.split('\n ,');
    for (const url of urls) {
      getEvent(url);
    }
  }

  function tempText(text)
  { 
    let line = [];
    let links = text.split('\n');
    for (const link of links) {
      line.push(parsetext(link));
      line.push(<br />);
    }
    return line;
  }

  function generateCalendar(links) {
    // Gets the list of links from the text box
    // finds calendar and clicks gets rss or iCal
    // parses that file for given date range
    // creates calendar with event list in order of date and time

    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const events = [];


    while (currentDate <= end) {
      events.push(
        <div>
          <b><u>{days[currentDate.getDay()]}, {months[currentDate.getMonth()]} {currentDate.getDate().toString()}</u></b>
          <br />
          {tempText(links)}
          <br />
        </div>
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return events;
    
  }

  return (
    <div>
      {generateCalendar(links)}
    </div>
  );
};

export default CreateCalendar;