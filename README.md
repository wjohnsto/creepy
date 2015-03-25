# Creepy

> Crawl AJAX/SPA websites and create snapshots for SEO.

## Getting Started
This plugin requires [PhantomJS](http://phantomjs.org/).

This plugin uses the [HTML5 History API](https://developer.mozilla.org/en-US/docs/Web/API/History) `pushState` method to 
do all navigation. This avoids having to reload the pages, but requires that the application support `popstate` event routing.

### Options
```js
var Creepy = require('./creepy');
var creepy = new Creepy(...);
```

#### rootUrl
Type: `string`

Specifies the first page from which to start the crawl.

#### initialDelay
Type: `number`  
Default: `5000`

Specifies the time (in milliseconds) to wait after loading the initial page before beginning the crawl. 
This allows you to tailor the crawler for your site and make sure everything loads before you change URLs.

#### delay
Type: `number`  
Default: `5000`

Specifies the time (in milliseconds) to wait for each new route to load before getting the DOM.

#### ignore
Type: `Array<string>`

Specifies paths to ignore while crawling. Can also be Regular Expression strings.

#### sort
Type: `(urls: Array<string>) => Array<string>`  

Allows you to sort/filter the urls while they are being collected.

### Crawl
```js
var Creepy = require('./creepy');
var creepy = new Creepy(...);

creepy.crawl(success, failure, done);
```

The success callback is called after every page load. The page information is passed to the function including:

```js
{
  // The page url processed
  url: string;
  
  // The HTML for the url
  content: string;
}
```

The failure callback is called whenever a page fails to load with the information:
```js
{
  // The page url that failed to process
  url: string;
  status: 'fail';
}
```

The done callback is called when all the urls have finished loading.

### Usage Examples

```js
var fs = require('fs');
var Creepy = require('./creepy');

var isPosts = '^((?!\/posts).)*$';
var regex = new RegExp(isPosts);
var rootUrl = 'http://my-site.com';

var creepy = new Creepy({
    rootUrl: rootUrl,
    initialDelay: 3000,
    delay: 1000,
    ignore: [
        '/admin'
    ],
    // Process all posts routes last
    sort: function(urls) {
        urls.sort(function(a, b) {
            var testA = regex.test(a),
                testB = regex.test(b);
                
            if(testA && !testB) {
                return -1;
            } else if(!testA && testB) {
                return 1;
            }
            
            return 0;
        });

        return urls;
    }
});

creepy.crawl(
  function(page) {
    try {
      page.url = 'pages/' +  
                  decodeURI(page.url.replace(rootUrl + '/', '').replace(/\/|:/g, '_')) + 
                  '.html';
      fs.write(page.url, page.content, 'w');
    } catch(e) { }
    console.log('Loaded ' + page.url + ' content length = ' + page.content.length);
  },
  function(page) {
    console.log('Could not load page. URL = ' +  page.url + ' status = ' + page.status);
  },
  function() {
    console.log('Done');
    phantom.exit();
  }
);
```
