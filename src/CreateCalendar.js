import React from 'react';
import ICAL from "ical.js";

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
  function getEvent(link) {
    const events = [];
    const cal = "https://broncosports.com/api/v2/Calendar/subscribe?type=ics";

    fetch(cal)
      .then(response => {
        if (!response.ok) {
          throw new Error("Error:" + response.statusText);
        }

        return response.text()
      })
      .then(data => {
        // Parse the iCal data using ical.js
        const jCalData = ICAL.parse(data);
        const comp = new ICAL.Component(jCalData);

        // Retrieve all VEVENT components from the calendar
        const events = comp.getAllSubcomponents('vevent');
        events.forEach(eventComponent => {
          const event = new ICAL.Event(eventComponent);
          console.log('Event Summary:', event.summary);
          console.log('Event Start Date:', event.startDate.toJSDate());
          console.log('Event End Date:', event.endDate.toJSDate());
        });
      })
      .catch(e => {
        console.error(e);
      })

    // for (let k in data) {
    //   if (data.hasOwnProperty(k)) {
    //     var ev = data[k]
    //     if (data[k].type == 'VEVENT') {
    //       console.log(`${ev.summary} is in ${ev.location} on the ${ev.start.getDate()} of ${months[ev.start.getMonth()]} at ${ev.start.toLocaleTimeString('en-GB')}`);
    //     }
    //   }
    // }
  }

  function getEvents(links) {
    const events = [];
    // let urls = links.split('\n ,');
    // for (const url of urls) {
      getEvent();
    // }
  }

  function tempText(text) {
    let line = [];
    let links = text.split('\n');
    for (const link of links) {
      line.push(parsetext(link));
      line.push(<br />);
    }
    return line;
  }

  function generateCalendar(links) {
    getEvents();
    // Gets the list of links from the text box
    // finds calendar and clicks gets rss or iCal
    // parses that file for given date range
    // creates calendar with event list in order of date and time

    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const events = [];
    let i = 0;


    while (currentDate <= end) {
      events.push(
        <div>
          <b key={++i}><u>{days[currentDate.getDay()]}, {months[currentDate.getMonth()]} {currentDate.getDate().toString()}</u></b>
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