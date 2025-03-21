import React from 'react';
import ICAL from "ical.js";
import Moment from 'moment';

const CreateCalendar = ({ startDate, endDate, files, emojiDictionary }) => {
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

  // Extract links from description
  function extractLinks(description) {
    let links = [];
    
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

  function getTime(description) {
    
  }

  function parseTitle(event) {
    //need to get college information like state and parse for time to only get home games?
  }

  function compareDate(day, eventStart, eventEnd)
  {
    return (eventStart.getFullYear() === day.getFullYear() &&
    eventStart.getMonth() === day.getMonth() &&
    eventStart.getDate() === day.getDate());
  }

  function icsParse(day, file)
  {
    let eventStr = [];
    let emoji = '';
    let title = "";
    let location = "";
    let time = "";
    let links = "";
    const jCalData = ICAL.parse(file.content);
    const comp = new ICAL.Component(jCalData);

    // Retrieve all VEVENT components from the calendar
    const events = comp.getAllSubcomponents('vevent');
    events.forEach(eventComponent => {
      const event = new ICAL.Event(eventComponent);
      let eventStart = event.startDate.toJSDate();
      let eventEnd = event.endDate.toJSDate();

      if (compareDate(day, eventStart, eventEnd))
      {
        title = event.summary;
        location = event.location;
        emoji = getEmoji(title);
        // parse description for links
        let eventDescription = `${emoji} ${title} @ ${location} @ ${time} ${links}\n`;
        eventStr.push(eventDescription);
      }
    });
    return eventStr;
  }

  function rssParse(day, file)
  {
    let events = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(file.content, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = item.getElementsByTagName("title")[0].textContent;
      const startDate = new Date(item.getElementsByTagName("ev:startdate")[0].textContent);
      const endDate = new Date(item.getElementsByTagName("ev:enddate")[0].textContent);
      const location = item.getElementsByTagName("ev:location")[0].textContent;

      if (compareDate(day, startDate, endDate)) {
        const emoji = getEmoji(title);
        let eventDescription = `${emoji} ${title} @ ${location}\n`;
        console.log(eventDescription);
        events.push(eventDescription);
      }
    }
    if (events.length > 0) {
      events[events.length - 1] = events[events.length - 1].replace(/\n$/, ""); // Remove the last newline character
    }
    return events;
  }

  function generateCal(day, files) {
    let line = [];
    let events = [];
    for (let i = 0; i < files.length; i++)
    {
      console.log(i, files[i].name, files.length);
      let file = files[i];
      if (file.name.endsWith('.ics')) {
        console.log("parsing ics");
        events = icsParse(day, file);
      } 
      if (file.name.endsWith('.rss')) {
        console.log("parsing rss");
        events = rssParse(day, file);
      }
    }
    line.push(events);
    if (events.length === 0)
    {
      line.push(<i>No Events Scheduled</i>);
    }
    return line;
  }

  function generateCalendar(files) {
    const start = new Moment(startDate);
    let currentDate = new Date(start);
    const endDay = new Moment(endDate);
    const end = new Moment(endDay.add(1, 'days'));
    let dates = [];
    let events = [];
    let i = 0;

    // while (!start.isSame(end)) {
    //   console.log("hello",start, end, currentDate)
    //   console.log("start=end", start.isSame(end));
    //   dates.push(start.format('YYYY-MM-DD'));
    //   start.add(1, 'days');
    // }

    // for (let i = 0; i < dates.length; i++) {
    //   console.log(dates[i]);
    // }
    
      events.push(
        <div key={++i}>
          <b><u>{days[currentDate.getDay()]}, {months[currentDate.getMonth()]} {currentDate.getDate().toString()}</u></b>
          <br></br>
          {generateCal(currentDate, files)}
          <br />
          <br />
        </div>
      );
    
    return events;

  }

  return (
    <div>
      {generateCalendar(files)}
    </div>
  );
};

export default CreateCalendar;