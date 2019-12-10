# Headless Chrome Export Server 
 
Live version running on glitch [https://glitch.com/~zingchart-export-server](https://glitch.com/~zingchart-export-server) with a reachable endpoint of `https://zingchart-export-server.glitch.me` & `https://zingchart-export-server.glitch.me/json`

### Deploying

`gcloud app deploy --project export-server`

### Installation

- run `npm install`
- run `npm run start` to instantiate the local server

### Dependencies

This has a strong dependency on the headless chrome API library **Puppeteer**. Documentation
can be found [here](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#event-console)

### Routes

1) We have our default route `/` which functions **EXACTLY** as our current export server at [https://export.zingchart.com](https://export.zingchart.com). Documentation on this can be on the ZingChart site [here](https://www.zingchart.com/docs/api/export-chart/) and gitlab repo containing the code for that server [here](https://gitlab.zingchart.com/zingchart/export-server.

  - This takes svg and renders it to the page. From there it takes a screenshot
  - You can change the ZingChart `EXPORTURL` like the following
  - `zingchart.EXPORTURL = 'https://my.server.com/';` but since we have client side rendering for canvas and svg (convert svg to image blob) we don't really need this.
 
#### Params for this route are as follows

```
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
```

2) We have secondary route `/json` which functions by taking a chart JSON and outputting a png, jpeg or pdf.
 
#### Params for this route are as follows

```
/*
 * retrieve a chart image and return it
 * takes form-data, x-ww-form-urlencoded, and JSON
 * @ parameters
 * h => height (String or Number)
 * w => width(String or Number)
 * chartJSON => JSON for chart to render
 * t => type (png, jpeg, pdf),
 * wait => milliseconds delay for taking screenshot (for animations)
 */
app.post('/json', async (req, res) => {
```

#### Curl Request

```
curl -X POST \
  http://localhost:9085/json \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'postman-token: 8692d4b2-6d11-9314-bcf2-2d46b7d182ad' \
  -d '{
	"chartJSON": {
	"graphset":[
	    {
	        "type":"bar",
	        "background-color":"white",
	        "title":{
	            "text":"Tech Giant Quarterly Revenue",
	            "font-color":"#7E7E7E",
	            "backgroundColor":"none",
	            "font-size":"22px",
	            "alpha":1,
	            "adjust-layout":true
	        },
	        "plotarea":{
	            "margin":"dynamic"
	        },
	        "series":[
	            {
	                "values":[37.47,57.59,45.65,37.43],
	                "alpha":0.95,
	                "borderRadiusTopLeft":7,
	                "background-color":"#8993c7",
	                "text":"Apple"
	            }
	        ]
	    }
	]
	},
	"t": "png",
	"height": 500,
	"width": 500
}'
```

### Other Stuff

`tmp` folder holds ALL the screenshots, JSON's and SVG's sent to the server. If we are taking images for people we might as well save them!