const express = require('express');

// middleware
const cors = require('cors');
const formidable = require('express-formidable');

// code dependencies
const puppeteer = require('puppeteer');
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

/*
 * retrieve a chart image and return it
 * takes form-data, x-ww-form-urlencoded, and JSON
 * @ parameters
 * h => height (String or Number)
 * w => width(String or Number)
 * svg => raw svg string data (NOT JSON stringified)
 * t => type (png, jpeg, pdf, svg)
 */
app.post('/', async (req, res) => {
  try {
    // grab all parameters
    const svgData = (req.fields && req.fields.svg) || '<h1>No SVG Supplied In Body</h1>';
    const chartHeight = (req.fields && req.fields.h);
    const chartWidth = (req.fields && req.fields.w);
    const imgType = (req.fields && req.fields.t) || 'png';

    // generate filed related variabeld
    const fileId = _generateFileId();
    const fileName = `zc_chart_${fileId}`;
    const outputImageFilePath = `./tmp/images/${fileName}.${imgType}`;
    const outputPDFFilePath = `./tmp/pdf/${fileName}.pdf`;
    const outputSvgFilePath = `./tmp/svg/${fileName}.svg`;


    // local variables
    let readFilePath = outputImageFilePath; // default behavior is png
    let isSvgFlag = false;
    let errorFlag = false;
    let errorMsg = 'N/A';

    // launch the headless browser
    const browser = await puppeteer.launch().catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
    });
    const page = await browser.newPage().catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
    });

    // set the viewport size to the chart size
    // default will return a piece of the chart 1000 x 1000
    await page.setViewport({
      width: chartWidth ? Number(chartWidth) : 1000,
      height: chartHeight ? Number(chartHeight) : 1000,
    }).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
    });

    // set the svg contents
    await page.setContent(svgData).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
    });

    // dont even try to screenshot from any of the above
    if (errorFlag) {
      return res.status(500).send(errorMsg);
    }

    // wait a couple milliseconds for page to appropriately settle??
    //await page.waitFor(100);

    // different actions for different types
    if (imgType === 'pdf') {
      await page.pdf({
        path: outputPDFFilePath
      }).catch(err => {
        errorFlag = true;
        errorMsg = 'Issues Generating PDF';
      });
      readFilePath = outputPDFFilePath;
    } else if (imgType === 'svg') {
      isSvgFlag = true;
      readFilePath = outputSvgFilePath;
    } else {
      // get the screenshot and close
      await page.screenshot({
        path: outputImageFilePath,
        type: imgType
      }).catch(err => {
        errorFlag = true;
        errorMsg = 'Issues Generating Screenshot';
      });
      // redundant assignment but explict when user is reading
      readFilePath = outputImageFilePath;
    }

    // close connection
    await browser.close();

    // catch screenshot issues
    if (errorFlag) {
      return res.status(500).send(errorMsg);
    }

    // We DON'T really care about this and don't want user speed to be affected
    // by this. This is why we write the svg file to server asynchronously.
    fs.writeFile(outputSvgFilePath, svgData, (err) => {
      if (err) {
        console.error(`Issues writing ${outputSvgFilePath} to server file system`);
      };
    });

    // read file asynchronously in case it never returns
    fs.readFile(readFilePath, (err, imageFile) => {

      // catch err
      if (err) {
        return res.status(500).send('Issue Reading File From Server');
      }

      // request headers
      let rHeaders = {
       'Content-Type': '',
       'Content-Length': '',
       'Content-Disposition': `attachment; filename="${fileName}.${imgType}"`
      };

      // set appropriate mime/types
      switch (imgType) {
        case 'svg':
          rHeaders['Content-Type'] = 'image/svg+xml';
          rHeaders['Content-Length'] = svgData.length;
          break;
        case 'pdf':
          rHeaders['Content-Type'] = 'application/pdf';
          rHeaders['Content-Length'] = imageFile.length;
          break;
        case 'png':
        case 'jpeg':
        default:
          rHeaders['Content-Type'] = `image/${imgType}`;
          rHeaders['Content-Length'] = imageFile.length;
      }

      // write headers
      res.writeHead(200, rHeaders);

      // end the buffer and send
      return res.end(imageFile);
    });

  } catch(e) {
    console.error(e);
    res.status(500).send('Issue Generating Image from Server');
  }
});

/*
 * retrieve a chart image and return it
 * takes form-data, x-ww-form-urlencoded, and JSON
 * @ parameters
 * h => height (String or Number)
 * w => width(String or Number)
 * chartJSON => JSON for chart to render
 * t => type (png, jpeg, pdf),
 * wait => milliseconds delay for taking screenshot
 */
app.post('/json', async (req, res) => {
  try {
    // grab all parameters
    const chartJSON = (req.fields && req.fields.chartJSON) || '{title: {text: "No Chart JSON"}}';
    const chartHeight = (req.fields && req.fields.h);
    const chartWidth = (req.fields && req.fields.w);
    const imgType = (req.fields && req.fields.t) || 'png';
    const waitTime = (req.fields && req.fields.wait) || 0;

    // generate filed related variabeld
    const fileId = _generateFileId();
    const fileName = `zc_chart_${fileId}`;
    const outputImageFilePath = `./tmp/images/${fileName}.${imgType}`;
    const outputPDFFilePath = `./tmp/pdf/${fileName}.pdf`;
    const outputJSONFilePath = `./tmp/svg/${fileName}.json`;


    // local variables
    let readFilePath = outputImageFilePath; // default behavior is png
    let isSvgFlag = false;
    let errorFlag = false;
    let errorMsg = 'N/A';
    let serverTimeout = null;

    // launch the headless browser
    const browser = await puppeteer.launch().catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
    });
    const page = await browser.newPage().catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
    });

    // set the viewport size to the chart size
    // default will return a piece of the chart 1000 x 1000
    await page.setViewport({
      width: chartWidth ? Number(chartWidth) : 1000,
      height: chartHeight ? Number(chartHeight) : 1000,
    }).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Headless Browser';
    });

    // set the svg contents
    await page.setContent(`<div id="myChart"></div>`).catch(err => {
      errorFlag = true;
      errorMsg = 'Issues With Injecting Chart Into Browser';
    });

    // render consoles
    page.on('console', async (msg) => {
      // newer puppeteer versions use msg._text
      // if (msg && msg._text === '---zingchart_loaded---') {
      if (msg === '---zingchart_loaded---') {
        // clear server timeout
        clearTimeout(serverTimeout);

        // wait 0 or user defined amount of time
        await page.waitFor(waitTime);

        // different actions for different types
        if (imgType === 'pdf') {
          await page.pdf({
            path: outputPDFFilePath
          }).catch(err => {
            errorFlag = true;
            errorMsg = 'Issues Generating PDF';
          });
          readFilePath = outputPDFFilePath;
        } else {
          // get the screenshot and close
          await page.screenshot({
            path: outputImageFilePath,
            type: imgType
          }).catch(err => {
            errorFlag = true;
            errorMsg = 'Issues Generating Screenshot';
          });
          // redundant assignment but explict when user is reading
          readFilePath = outputImageFilePath;
        }

        // close connection
        await browser.close();

        // catch screenshot issues
        if (errorFlag) {
          return res.status(500).send(errorMsg);
        }

        // We DON'T really care about this and don't want user speed to be affected
        // by this. This is why we write the JSON file to server asynchronously.
        fs.writeFile(outputJSONFilePath, JSON.stringify(chartJSON, null, 2), (err) => {
          if (err) {
            console.error(`Issues writing ${outputJSONFilePath} to server file system`);
          };
        });

        // read file asynchronously in case it never returns
        fs.readFile(readFilePath, (err, imageFile) => {

          // catch err
          if (err) {
            return res.status(500).send('Issue Reading File From Server');
          }

          // request headers
          let rHeaders = {
          'Content-Type': '',
          'Content-Length': '',
          'Content-Disposition': `attachment; filename="${fileName}.${imgType}"`
          };

          // set appropriate mime/types
          switch (imgType) {
            case 'pdf':
              rHeaders['Content-Type'] = 'application/pdf';
              rHeaders['Content-Length'] = imageFile.length;
              break;
            case 'png':
            case 'jpeg':
            default:
              rHeaders['Content-Type'] = `image/${imgType}`;
              rHeaders['Content-Length'] = imageFile.length;
          }

          // write headers
          res.writeHead(200, rHeaders);

          // end the buffer and send
          return res.end(imageFile);
        });
      }
    });

    // inject zingchart in
    await page.evaluate(fs.readFileSync('./node_modules/zingchart/client/zingchart.min.js', 'utf8'));

    // set a timeout for 6 seconds if chart doesn't load
    serverTimeout = setTimeout(() => {
      return res.status(500).send('Server Timed Out');
    }, 10000 + waitTime);

    // render zingchart
    await page.evaluate(({chartWidth, chartHeight, chartJSON}) => {
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
    });
  
    // dont even try to screenshot from any of the above
    if (errorFlag) {
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
app.listen(9085, function () {
  console.log('Example app listening on port 9085!')
});
