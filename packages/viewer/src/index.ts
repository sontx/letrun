import express from 'express';
import path from 'path';
import open from 'open';
import getPort from 'get-port';
import pako from 'pako';
import * as fs from 'node:fs';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticDir = path.join(__dirname, 'public');
if (!fs.existsSync(staticDir)) {
  throw new Error(`Directory not found: ${staticDir}`);
}

// Create an Express application
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(staticDir));

const uint8ArrayToBase64 = (uint8Array: Uint8Array): string => {
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i] as any);
  }
  return btoa(binaryString);
};

const startServer = async () => {
  const port = await getPort();

  const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);

    let inputString = '';
    process.stdin.on('data', (data) => {
      inputString += data.toString();
    });

    process.stdin.on('end', () => {
      const compressed = pako.deflate(JSON.stringify(JSON.parse(inputString)));
      const indexUrl = `http://localhost:${port}`;
      const url = `${indexUrl}?schema=${encodeURIComponent(uint8ArrayToBase64(compressed))}`;

      open(url)
        .then(() => {
          console.log(`Opened browser with URL: ${indexUrl}`);
        })
        .catch((err) => {
          console.error('Failed to open browser:', err);
        });
    });
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    server.close(() => {
      console.log('Closed out remaining connections.');
      process.exit(0);
    });

    // If after 5 seconds, forcefully shut down
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 5000);
  });
};

startServer().then();
