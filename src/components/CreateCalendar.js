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

  function cleanEventTitle(title) {
    // Remove date and time prefixes like "3/1 5:00 PM [W]" from event titles
    // Matches patterns like: 
    // - MM/DD H:MM AM/PM [W/L]
    // - MM/DD [W/L]
    // - H:MM AM/PM [W/L]
    return title.replace(/^\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?\s*(?:\[\w+\])?\s+/i, '')
                .replace(/^\d{1,2}\/\d{1,2}\s+(?:\[\w+\])?\s+/i, '')
                .replace(/^\d{1,2}:\d{2}\s*(?:AM|PM)?\s*(?:\[\w+\])?\s+/i, '')
                .replace(/^\d{1,2}\/\d{1,2}\s+/i, '')
                .replace(/^\s*\[\w+\]\s+/i, '');
  }

  function compareDate(day, eventStart, eventEnd)
  {
    return (eventStart.getFullYear() === day.getFullYear() &&
    eventStart.getMonth() === day.getMonth() &&
    eventStart.getDate() === day.getDate());
  }

  function icsParse(day, file)
  {
    let eventArr = [];
    const jCalData = ICAL.parse(file.content);
    const comp = new ICAL.Component(jCalData);

    // Retrieve all VEVENT components from the calendar
    const events = comp.getAllSubcomponents('vevent');
    events.forEach(eventComponent => {
      const event = new ICAL.Event(eventComponent);
      let eventStart = event.startDate.toJSDate();
      let eventEnd = event.endDate.toJSDate();

      if (compareDate(day, eventStart, eventEnd)) {
        const rawTitle = event.summary;
        const title = cleanEventTitle(rawTitle);
        const location = event.location || "";
        const emoji = getEmoji(title) || "";
        const time = eventStart ? Moment(eventStart).format('h:mm A') : "";
        const description = event.description || "";
        
        // Extract links from description
        const links = extractLinks(description);
        let linkSection = "";
        
        // Add relevant links at the end of the event description
        if (links.length > 0) {
          // Group links by type
          const relevantLinks = links.filter(link => {
            const text = link.text.trim().toUpperCase();
            return ["SEATGEEK", "ESPN", "SEC", "TICKETS", "STATS", "LIVE STATS", "TOURNAMENT"].some(
              keyword => text.includes(keyword)
            );
          });
          
          if (relevantLinks.length > 0) {
            // Format as HTML links
            linkSection = " | " + relevantLinks.map(link => 
              `<a href="${link.url}" target="_blank">${link.text.trim()}</a>`
            ).join(" | ");
          }
        }
        
        // Simplified event description without formatting
        let eventDescription = `${emoji} ${title}`;
        if (location) eventDescription += ` @ ${location}`;
        if (time) eventDescription += ` @ ${time}`;
        if (linkSection) eventDescription += linkSection;
        
        // Store both the event description and the original start time for sorting
        eventArr.push({
          description: eventDescription,
          startTime: eventStart ? eventStart : new Date(day.setHours(23, 59, 59)) // Events without time go to end of day
        });
      }
    });
    return eventArr;
  }

  function rssParse(day, file)
  {
    let eventArr = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(file.content, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawTitle = item.getElementsByTagName("title")[0].textContent;
      const title = cleanEventTitle(rawTitle);
      const startDate = new Date(item.getElementsByTagName("ev:startdate")[0].textContent);
      const endDate = new Date(item.getElementsByTagName("ev:enddate")[0].textContent);
      const location = item.getElementsByTagName("ev:location")[0]?.textContent || "";
      const description = item.getElementsByTagName("description")[0]?.textContent || "";

      if (compareDate(day, startDate, endDate)) {
        const emoji = getEmoji(title) || "";
        const time = startDate ? Moment(startDate).format('h:mm A') : "";
        
        // Extract links from description
        const links = extractLinks(description);
        let linkSection = "";
        
        // Add relevant links at the end of the event description
        if (links.length > 0) {
          // Group links by type
          const relevantLinks = links.filter(link => {
            const text = link.text.trim().toUpperCase();
            return ["SEATGEEK", "ESPN", "SEC", "TICKETS", "STATS", "LIVE STATS", "TOURNAMENT"].some(
              keyword => text.includes(keyword)
            );
          });
          
          if (relevantLinks.length > 0) {
            // Format as HTML links
            linkSection = " | " + relevantLinks.map(link => 
              `<a href="${link.url}" target="_blank">${link.text.trim()}</a>`
            ).join(" | ");
          }
        }
        
        let eventDescription = `${emoji} ${title}`;
        if (location) eventDescription += ` @ ${location}`;
        if (time) eventDescription += ` @ ${time}`;
        if (linkSection) eventDescription += linkSection;
        
        // Store both the event description and the original start time for sorting
        eventArr.push({
          description: eventDescription,
          startTime: startDate ? startDate : new Date(day.setHours(23, 59, 59)) // Events without time go to end of day
        });
      }
    }
    return eventArr;
  }

  function generateCal(day, files) {
    let allEvents = [];
    
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      let events = [];
      
      if (file.name.endsWith('.ics')) {
        events = icsParse(day, file);
      } else if (file.name.endsWith('.rss')) {
        events = rssParse(day, file);
      }
      
      allEvents = [...allEvents, ...events];
    }
    
    if (allEvents.length === 0) {
      return <p key="no-events" style={{ fontStyle: "italic", fontWeight: "normal", margin: "0" }}>No Events Scheduled</p>;
    }
    
    // Sort events by time
    allEvents.sort((a, b) => a.startTime - b.startTime);
    
    // Extract descriptions after sorting
    const sortedDescriptions = allEvents.map(event => event.description);
    
    // Join all events with line breaks
    const combinedEvents = sortedDescriptions.join('<br />');
    
    return (
      <p 
        className="events-container" 
        style={{ lineHeight: "1.4", margin: "0", fontWeight: "normal" }}
        dangerouslySetInnerHTML={{ __html: combinedEvents }} 
      />
    );
  }

  function generateCalendar(files) {
    const start = new Moment(startDate);
    const end = new Moment(endDate).add(1, 'days'); // Include end date
    let events = [];
    let i = 0;
    
    // Loop through each day in the range
    let currentDate = start.clone();
    while (currentDate.isBefore(end)) {
      const jsDate = currentDate.toDate();
      const dayStr = days[jsDate.getDay()];
      const monthStr = months[jsDate.getMonth()];
      const dateNum = jsDate.getDate();
      
      // Get events for this day
      const eventsForDay = generateCal(jsDate, files);
      
      // Generate day header formatted as bold and underlined
      const dayHeader = `<b><u>${dayStr}, ${monthStr} ${dateNum}</u></b>`;
      
      // If there are no events, show "No Events Scheduled" message
      let combinedContent;
      if (eventsForDay.type === 'p' && eventsForDay.props.dangerouslySetInnerHTML) {
        // We have events, combine header with events
        combinedContent = `${dayHeader}<br />${eventsForDay.props.dangerouslySetInnerHTML.__html}`;
      } else {
        // No events scheduled
        combinedContent = `${dayHeader}<br />No Events Scheduled`;
      }
      
      events.push(
        <div key={++i} className="calendar-day" style={{ marginBottom: "20px" }}>
          <p 
            className="day-content" 
            style={{ lineHeight: "1.4", margin: "0" }}
            dangerouslySetInnerHTML={{ __html: combinedContent }} 
          />
        </div>
      );
      
      currentDate.add(1, 'days');
    }
    
    return events;
  }

  return (
    <div style={{ lineHeight: "1.3" }}>
      {generateCalendar(files)}
    </div>
  );
};

export default CreateCalendar;
