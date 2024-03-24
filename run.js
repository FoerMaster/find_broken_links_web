///////////////////////////////////////////////////////
///
/// Change url here:
const basesiteUrl = 'https:/example.com';
/// and wait)
///
///////////////////////////////////////////////////////


import axios from 'axios';
import cheerio from 'cheerio';
import url from 'url';
import ora from 'ora';

const spinner = ora('Searching').start();

const visitedUrls = new Set();
const externalLinks = new Set();
const internalLinks = new Set();
const notFoundLinks = new Set();



const Reset = "\x1b[0m"
const FgYellow = "\x1b[33m"
const FgCyan = "\x1b[36m"
const FgWhite = "\x1b[37m"
const BgRed = "\x1b[41m"

async function crawlPage(baseUrl,previos) {
  try {
    const { data: html } = await axios.get(baseUrl);
    const $ = cheerio.load(html);
    $('a').each((_, element) => {
      let href = $(element).attr('href');
      if (!href) return;
      href = url.resolve(basesiteUrl, href);
      if (visitedUrls.has(href)) return;
      visitedUrls.add(href);
      (href.startsWith(basesiteUrl) ? internalLinks : externalLinks).add(href);
      if (href.startsWith(basesiteUrl)) crawlPage(href, baseUrl);
    });
  } catch ({ response }) {
    if (response && response.status === 404) {
      spinner.stop();
      console.log(`${BgRed}${FgWhite} 404 ${Reset} ${FgYellow}${baseUrl}${FgWhite} found at page (${FgCyan}${previos}${FgWhite})`);
      notFoundLinks.add(baseUrl);
      spinner.start();
      spinner.text = 'Searching broken links';
    }
  }
}

async function checkExternalLinksStatus() {
  for (const link of externalLinks) {
    try {
      const { status } = await axios.head(link);
      if (status >= 400) notFoundLinks.add(link);
    } catch ({ response }) {
      if (response && response.status >= 400) {
        spinner.stop();
        spinner.text = null;
        console.log(`${BgRed}${FgWhite} 404 ${Reset} ${FgYellow}${link}${FgWhite} (${FgYellow}External link${FgWhite})`);
        spinner.start();
        spinner.text = 'Searching broken links';
      };
    }
  }
}

async function main() {
  spinner.text = 'Searching';
  await crawlPage(basesiteUrl,null);
  await checkExternalLinksStatus();

  spinner.stop();
}

main();
