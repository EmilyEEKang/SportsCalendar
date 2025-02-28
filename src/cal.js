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