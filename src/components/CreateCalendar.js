import React from 'react';
import ICAL from "ical.js";

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

  function parseTitle(event) {
    //need to get college information like state and parse for time to only get home games?
  }

  function compareDate(day, eventStart, eventEnd)
  {
    return (eventStart.getFullYear() >= day.getFullYear() && day.getFullYear() <= eventEnd.getFullYear() &&
    eventStart.getMonth() >= day.getMonth() && day.getMonth() <= eventEnd.getMonth() &&
    eventStart.getDate() >= day.getDate() && day.getDate() <= eventEnd.getDate());
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
        console.log('Event Summary:', event.summary);
        title = event.summary;
        location = event.location;
        emoji = getEmoji(title);
        // parse description for links
        eventStr.push(`${emoji} ${title} @ ${location} @ ${time} ${links}\n`);
      }
      else {
        console.log("no match");
      }
    });
    return eventStr;
  }

  function rssParse(day, file)
  {
    let eventStr = [];
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
        eventStr.push(`${emoji} ${title} @ ${location}\n`);
      }
    }
    return eventStr;
  }

  function generateCal(day, files) {
    let line = [];
    let events = [];
    for (let i = 0; i < files.length; i++)
    {
      let file = files[i];
      if (file.name.endsWith('.ics')) {
        events = icsParse(day, file);
      } else if (file.name.endsWith('.rss')) {
        events = rssParse(day, file);
      }
    }
    line.push(events);
    if (events.length === 0)
    {
      line.push(<i>"No Events Scheduled"</i>);
    }
    return line;
  }

  function generateCalendar(files) {
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const events = [];
    let i = 0;

    while (currentDate <= end) {
      events.push(
        <div key={++i}>
          <b><u>{days[currentDate.getDay()]}, {months[currentDate.getMonth()]} {currentDate.getDate().toString()}</u></b>
          <br></br>
          {generateCal(currentDate, files)}
          <br />
          <br />
        </div>
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return events;

  }

  return (
    <div>
      {generateCalendar(files)}
    </div>
  );
};

export default CreateCalendar;