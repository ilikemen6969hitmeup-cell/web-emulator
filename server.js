const express = require('express');
const proxy = require('express-http-proxy');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use('/proxy', (req, res, next) => {
  let targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URL parameter is required');

  // Format URL properly
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return res.status(400).send('Invalid URL');
  }

  return proxy(parsedUrl.origin, {
    proxyReqPathResolver: (req) => {
      return parsedUrl.pathname + parsedUrl.search;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['User-Agent'] =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      proxyReqOpts.headers['Accept-Language'] = 'en-US,en;q=0.9';
      delete proxyReqOpts.headers['referer'];
      return proxyReqOpts;
    },
    userResHeaderDecorator: (headers) => {
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];
      delete headers['content-security-policy-report-only'];
      return headers;
    }
  })(req, res, next);
});

app.listen(PORT, () => console.log(`Server live at http://localhost:${PORT}`));