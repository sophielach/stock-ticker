
const http = require('http');
const url = require('url');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const PORT = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGO_URI);
let db; // create variable for db

http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // give the index.html when the root path is visited
  if (parsedUrl.pathname === '/') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });

  // Handle the "/process" route
  } else if (parsedUrl.pathname === '/process') {
    const query = parsedUrl.query.query;
    const searched = parsedUrl.query.searched;

    try {
      if (!db) {
        await client.connect();
        db = client.db('Stocks');
      }
      const collection = db.collection('PublicCompanies');

      // look for answers to the query
      let answers = {};
      if (searched === 'ticker') {
        answers = { ticker: query }; 
      } else {
        answers = { companyName: query };
      }
      // write to the console
      const results = await collection.find(answers).toArray();
      console.log('Search Results:', results);

      // write to the webpage
      let html = `
      <html>
      <head>
        <title>Stock Results:</title>
        <style>
          body {background: #ecd5e9; text-align: center; padding: 50px;}
          .container {display: inline-block; background: #ecd5e9; padding: 30px; border-radius: 5px;}
          p {font-size: 18px;}
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Results</h1>
    `;
          results.forEach(stock => {
        html += `${stock.companyName}(${stock.ticker}) $${stock.price}`;
      });
      html += ` </div> </body> </html> `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);

    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error processing request');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Route not found');
  }
}).listen(PORT, () => {
  console.log(`the server is running on port ${PORT}`);
});
