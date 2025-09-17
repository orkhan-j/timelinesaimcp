#!/usr/bin/env node

/**
 * Google Ads API OAuth Token Generator
 * This script helps you get a refresh token for Google Ads API
 */

const http = require('http');
const url = require('url');
const { exec } = require('child_process');

// Your OAuth2 credentials
const CLIENT_ID = '147746943941-ac1c9i7dj37t0q2ifcmqgsq0au80p8b6.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:8080';
const SCOPE = 'https://www.googleapis.com/auth/adwords';

console.log('🔐 Google Ads OAuth Token Generator');
console.log('====================================\n');

// Step 1: Generate authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log('Step 1: Opening browser for authorization...\n');
console.log('If browser doesn\'t open automatically, visit this URL:');
console.log(authUrl);
console.log('\n');

// Create local server to receive the callback
const server = http.createServer(async (req, res) => {
  const queryObject = url.parse(req.url, true).query;

  if (queryObject.code) {
    console.log('✅ Authorization code received!\n');

    // Send success page to browser
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="font-family: system-ui; padding: 50px; text-align: center;">
          <h1 style="color: green;">✅ Success!</h1>
          <p>Authorization complete. Check your terminal for the refresh token.</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);

    // Exchange code for tokens
    console.log('Step 2: Exchanging authorization code for tokens...\n');

    const https = require('https');
    const postData = new URLSearchParams({
      code: queryObject.code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const tokenReq = https.request(options, (tokenRes) => {
      let data = '';
      tokenRes.on('data', (chunk) => data += chunk);
      tokenRes.on('end', () => {
        try {
          const tokens = JSON.parse(data);

          if (tokens.refresh_token) {
            console.log('🎉 SUCCESS! Here are your tokens:\n');
            console.log('=====================================');
            console.log('REFRESH TOKEN (save this!):');
            console.log(tokens.refresh_token);
            console.log('=====================================\n');
            console.log('Access Token (expires in 1 hour):');
            console.log(tokens.access_token);
            console.log('=====================================\n');

            console.log('📝 Add this to your .env file:');
            console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);

            console.log('✅ All done! Press Ctrl+C to exit.');
          } else if (tokens.error) {
            console.error('❌ Error:', tokens.error);
            console.error('Description:', tokens.error_description);
          } else {
            console.log('⚠️ No refresh token received. Response:', JSON.stringify(tokens, null, 2));
          }
        } catch (e) {
          console.error('❌ Error parsing response:', e);
          console.error('Response:', data);
        }

        // Close the server
        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 2000);
      });
    });

    tokenReq.on('error', (e) => {
      console.error('❌ Request error:', e);
    });

    tokenReq.write(postData);
    tokenReq.end();

  } else if (queryObject.error) {
    console.error('❌ Authorization denied:', queryObject.error);
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="font-family: system-ui; padding: 50px; text-align: center;">
          <h1 style="color: red;">❌ Authorization Failed</h1>
          <p>Error: ${queryObject.error}</p>
          <p>Please try again.</p>
        </body>
      </html>
    `);
    server.close();
    process.exit(1);
  }
});

server.listen(8080, () => {
  console.log('📡 Local server listening on http://localhost:8080\n');
  console.log('Waiting for authorization...\n');

  // Try to open browser automatically
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${command} "${authUrl}"`, (err) => {
    if (err) {
      console.log('⚠️ Could not open browser automatically. Please visit the URL above.');
    }
  });
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('❌ Error: Port 8080 is already in use.');
    console.error('Please close any other applications using this port and try again.');
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});