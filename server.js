const express = require('express');

// middleware
const cors = require('cors');
const formidable = require('express-formidable');

// code dependencies
const puppeteer = require("puppeteer");
const fs = require('fs');
const app = express();

// multipart/form-data
app.use(formidable({
  encoding: 'utf-8'
}));

// allow cors access
app.use(cors());

// helper function for generating filedId
const _generateFileId = () => {
  return Math.random().toString(36).substr(2, 10);
}

/**
 * @todo expand on filename validation checks
 * @description Verify filename doesn't have any special characters
 * and DOES not start with a number
 * @param {*} fileName 
 */
function _isValidFilename(fileName) {
  // check if filename string starts with number
  if (fileName.match(/^[0-9a]+/)) return false;
  return true;
}

/*
 * retrieve a chart image and return it
 * takes form-data, x-ww-form-urlencoded, and JSON
 * @ parameters
 * h => height (String or Number)
 * w => width(String or Number)
 * svg => raw svg string data (NOT JSON stringified)
 * t => type (png, jpeg, pdf, svg)
 * fn => filename (String)
 */
app.post('/', async (req, res) => {
  try {
    // grab all parameters
    const svgData = (req.fields && req.fields.svg) || '<h1>No SVG Supplied In Body</h1>';
    const chartHeight = (req.fields && req.fields.h);
    const chartWidth = (req.fields && req.fields.w);
    const imgType = (req.fields && req.fields.t) || 'png';

    // generate filed related variabe ld.
    // Users CAN pass in a filename as well
    const fileId = _generateFileId();
    const fileName = (req.fields && req.fields.fn && _isValidFilename(req.fields.fn)) ? req.fields.fn : `zc_chart_${fileId}`;

    // local variables
    let isSvgFlag = false;
    let errorFlag = false;
    let errorMsg = 'N/A';
    let errorMsgServer = '';
    let tmpBuffer = '';

    // launch the headless browser
    const browser = await puppeteer.launch({
      // Paste "Executable Path" value. Check at `chrome://version/`.
      executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome'
    }).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
      errorMsgServer = err;
    });
    const page = await browser.newPage().catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
      errorMsgServer = err;
    });

    // set the viewport size to the chart size
    // default will return a piece of the chart 1000 x 1000
    await page.setViewport({
      width: chartWidth ? Number(chartWidth) : 1000,
      height: chartHeight ? Number(chartHeight) : 1000,
    }).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
      errorMsgServer = err;
    });

    // set the svg contents
    await page.setContent(svgData).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
      errorMsgServer = err;
    });

    // don't even try to screenshot from any of the above errors
    if (errorFlag) {
      console.error(errorMsgServer);
      return res.status(500).send(errorMsg);
    }

    // different actions for different types
    if (imgType === 'pdf') {
      tmpBuffer = await page.pdf({
      }).catch(err => {
        errorFlag = true;
        errorMsg = 'Issues Generating PDF';
        errorMsgServer = err;
      });
    } else if (imgType === 'svg') {
      isSvgFlag = true;
    } else {
      // get the screenshot and close
      tmpBuffer = await page.screenshot({
        type: imgType
      }).catch(err => {
        errorFlag = true;
        errorMsg = 'Issues Generating Screenshot';
        errorMsgServer = err;
      });
    }

    // close connection
    await browser.close();

    // catch screenshot issues
    if (errorFlag) {
      console.error(errorMsgServer);
      return res.status(500).send(errorMsg);
    }

    // We DON'T really care about this and don't want user speed to be affected
    // by this. This is why we write the svg file to server asynchronously.
    // fs.writeFile(outputSvgFilePath, svgData, (err) => {
    //   if (err) {
    //     console.error(`Issues writing ${outputSvgFilePath} to server file system`);
    //   };
    // });

    // read file asynchronously in case it never returns
    // fs.readFile(readFilePath, (err, imageFile) => {

      // catch err
      // if (err) {
      //   console.error(err);
      //   return res.status(500).send('Issue Reading File From Server');
      // }

      // request headers
      let rHeaders = {
       'Content-Type': '',
      //  'Content-Length': '',
      //  'Content-Disposition': `attachment; filename="${fileName}.${imgType}"`
      };

      // set appropriate mime/types
      switch (imgType) {
        case 'svg':
          rHeaders['Content-Type'] = 'image/svg+xml';
          // rHeaders['Content-Length'] = svgData.length;
          break;
        case 'pdf':
          rHeaders['Content-Type'] = 'application/pdf';
          // rHeaders['Content-Length'] = imageFile.length;
          break;
        case 'png':
        case 'jpeg':
        default:
          rHeaders['Content-Type'] = `image/${imgType}`;
          // rHeaders['Content-Length'] = imageFile.length;
      }

      // write headers
      res.writeHead(200, rHeaders);

      // end the buffer and send
      return res.end(tmpBuffer);
    // });

  } catch(e) {
    console.error(e);
    res.status(500).send('Issue Generating Image from Server',);
  }
});

/*
 * retrieve a chart image and return it
 * takes form-data, x-ww-form-urlencoded, and JSON
 * @ parameters
 * h => height (String or Number)
 * w => width(String or Number)
 * chartConfig => JSON for chart to render
 * t => type (png, jpeg, pdf),
 * fn => filename (String)
 * wait => milliseconds delay for taking screenshot
 */
app.post('/json', async (req, res) => {
  try {
    // grab all parameters
    const chartJSON = (req.fields && req.fields.chartConfig) || false;
    const chartHeight = (req.fields && req.fields.h);
    const chartWidth = (req.fields && req.fields.w);
    const imgType = (req.fields && req.fields.t) || 'png';
    const waitTime = (req.fields && req.fields.wait) || 0;

    if (!chartJSON) {
      res.status(400).send('No chartConfig was supplied');
    }
    // generate filed related variabeld
    const fileId = _generateFileId();
    const fileName = (req.fields && req.fields.fn && _isValidFilename(req.fields.fn)) ? req.fields.fn : `zc_chart_${fileId}`;

    // local variables
    let isSvgFlag = false;
    let errorFlag = false;
    let errorMsg = 'N/A';
    let errorMsgServer = '';
    let serverTimeout = null;
    let tmpBuffer = '';

    // launch the headless browser
    const browser = await puppeteer.launch({
      // Paste "Executable Path" value. Check at `chrome://version/`.
      executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome'
    }).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
      errorMsgServer = err;
    });
    const page = await browser.newPage().catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
      errorMsgServer = err;
    });
    page.setDefaultTimeout(0);

    // set the viewport size to the chart size
    // default will return a piece of the chart 1000 x 1000
    await page.setViewport({
      width: chartWidth ? Number(chartWidth) : 1000,
      height: chartHeight ? Number(chartHeight) : 1000,
    }).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
      errorMsgServer = err;
    });

    // set the svg contents
    await page.setContent(`<div id="myChart"></div>`).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Injecting Chart Into Browser';
      errorMsgServer = err;
    });

    // render consoles
    page.on('console', async (msg) => {
      if (msg && msg.text() === '---zingchart_loaded---') {
        // clear server timeout
        clearTimeout(serverTimeout);

        // wait 0 or user defined amount of time
        await page.waitForTimeout(waitTime);

        // different actions for different types
        if (imgType === 'pdf') {
          tmpBuffer = await page.pdf({
          }).catch(err => {
            console.log('1 err: ', err)
            errorFlag = true;
            errorMsg = 'Issues Generating PDF';
            errorMsgServer = err;
          });
        } else {
          // get the screenshot and close
          tmpBuffer = await page.screenshot({
            type: imgType
          }).catch(err => {
            console.log('2 err: ', err)
            errorFlag = true;
            errorMsg = 'Issues Generating Screenshot';
            errorMsgServer = err;
          });
        }

        // close connection
        await browser.close();

        // catch screenshot issues
        if (errorFlag) {
          console.error(errorMsgServer);
          return res.status(500).send(errorMsg);
        }

        // request headers
        let rHeaders = {
        'Content-Type': '',
        };

        // set appropriate mime/types
        switch (imgType) {
          case 'pdf':
            rHeaders['Content-Type'] = 'application/pdf';
            // rHeaders['Content-Length'] = imageFile.length;
            break;
          case 'png':
          case 'jpeg':
          default:
            rHeaders['Content-Type'] = `image/${imgType}`;
        }

        // write headers
        res.writeHead(200, rHeaders);

        // end the buffer and send
        return res.end(tmpBuffer);
      }
    });
  
    // inject zingchart in
    await page.addScriptTag({
      url: 'https://cdn.zingchart.com/zingchart.min.js'
    });
    
    // set a timeout for 6 seconds if chart doesn't load
    serverTimeout = setTimeout(() => {
      return res.status(500).send('Server Timed Out');
    }, 10000 + waitTime);
    
    // render zingchart
    await page.evaluate(({chartWidth, chartHeight, chartJSON}) => {
      // set modules path
      zingchart.MODULESDIR = 'https://cdn.zingchart.com/modules/';
      // trigger the event to take a photo
      zingchart.bind(null, 'load', function() {
        console.log('---zingchart_loaded---');
      });
      zingchart.render({
        width: chartWidth ? Number(chartWidth) : 1000,
        height: chartHeight ? Number(chartHeight) : 1000,
        data: chartJSON,
        id: 'myChart'
      });
    }, {chartWidth, chartHeight, chartJSON} ).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Rendering ZingChart Into Browser';
      errorMsgServer = err;
    });
  
    // dont even try to screenshot from any of the above
    if (errorFlag) {
      console.error(errorMsgServer);
      return res.status(500).send(errorMsg);
    }


  } catch(e) {
    console.error(e);
    res.status(500).send('Issue Generating Image from Server');
  }
});

/*****************************************************
 * ORDER OF ROUTE DECLARATION MATTERS. CASCADES DOWN *
 ******************************************************/

// define landing page
app.get('/', async (req, res) => {
  res.status(200).sendFile(`${__dirname}/index.html`);
});

// redirect all non-registered routes to 404
app.get(['/404','*'], (req, res) => {
  res.status(404).sendFile(`${__dirname}/404.html`);
});

app.post('*', (req, res, next) => {
  // this route is called upon subsequent api requests so catch the top level
  // route and go there with next or redirect to 404 if its not the root route
  if (req.url === '/') {
    next();
  } else if (req.url === '/json') {
    next();
  } else {
    res.status(301).redirect('/404');
  }
});

// Start the application!
// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

module.exports = app;
