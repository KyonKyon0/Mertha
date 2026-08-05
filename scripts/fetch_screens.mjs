import fs from 'fs';
import https from 'https';
import path from 'path';

const screens = [
  { name: 'Daftar', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODRhMDM0MGM1MTEwMzM4NWMzNTA1MTI5YWE1EgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Lupa_Kata_Sandi', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ5ZmU3MmI0NDkwMjA3YTIxYTc0MTkyZjQ5EgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Login', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ5ZmI2NzBkOTUwMWVlN2U1NWQyMWUyMDgwEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Index', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ5ZTI2NjBjNjUwNzc5ODQ3NmYzMGZiNjAyEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Jelajahi', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ3NjJkN2IwZmYwOTI1ZDM3ZWRhMGJlYjAwEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Detail_Produk', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ3NjJmNTQyMTkwNmYxYzIwNGIwMzBkZDcxEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Maps', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ3NjI4Mzc5OTQwNGVhYjdiODBjMmVhMGQyEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Pesanan_Berhasil', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ3NjJhZDZiYWEwMWE2MDM1Mjc3MmFiOGM5EgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Pesanan_Gagal', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODRhMTI5NTlkNTYwNGVhYjQ1YzJhMzhhMjg2EgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Checkout', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ3NjI4Y2UxNDAwMmE5YmQ3MTk0MzU3Y2JlEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Profil', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ3NjMxOTAzODUwOTEwN2MzNzMyMDUzN2JiEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' },
  { name: 'Detail_Pesanan_Refund', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ODQ3NjI3YTI0ZTMwMWE2MGU3ZmVhMmI0YmEzEgsSBxCawerO2RsYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTQ3OTc5MTc3NTI2MzQ4NTUxMg&filename=&opi=89354086' }
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  if (!fs.existsSync('docs/stitch-screens')) {
    fs.mkdirSync('docs/stitch-screens', { recursive: true });
  }
  if (!fs.existsSync('public/assets')) {
    fs.mkdirSync('public/assets', { recursive: true });
  }

  let assetIndex = 1;
  const downloadedUrls = new Map(); // url -> localFilename

  for (const screen of screens) {
    console.log(`Fetching ${screen.name}...`);
    try {
      let html = await fetchUrl(screen.url);
      
      // Find all image URLs (very basic regex)
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const cssRegex = /url\(['"]?(https:\/\/[^'"\)]+)['"]?\)/g;
      
      let match;
      const urlsToDownload = new Set();
      
      while ((match = imgRegex.exec(html)) !== null) {
        if (match[1].startsWith('http')) urlsToDownload.add(match[1]);
      }
      while ((match = cssRegex.exec(html)) !== null) {
        if (match[1].startsWith('http')) urlsToDownload.add(match[1]);
      }

      for (const url of urlsToDownload) {
        if (!downloadedUrls.has(url)) {
          // guess extension
          let ext = '.png';
          if (url.includes('.jpg') || url.includes('.jpeg')) ext = '.jpg';
          if (url.includes('.svg')) ext = '.svg';
          
          const filename = `asset_${assetIndex}${ext}`;
          const dest = path.join('public/assets', filename);
          console.log(`  Downloading asset ${url.substring(0,50)}... -> ${filename}`);
          try {
             await downloadFile(url, dest);
             downloadedUrls.set(url, `/assets/${filename}`);
             assetIndex++;
          } catch (e) {
             console.error(`  Failed to download ${url}: ${e}`);
          }
        }
      }

      // Replace URLs in HTML
      for (const [url, localPath] of downloadedUrls.entries()) {
        html = html.split(url).join(localPath);
      }

      fs.writeFileSync(`docs/stitch-screens/${screen.name}.html`, html);
      console.log(`Saved ${screen.name}.html`);
    } catch (e) {
      console.error(`Failed to process ${screen.name}:`, e);
    }
  }
  console.log("Done phase 2 extraction.");
}

run();
