import fs from 'fs';
import https from 'https';
import path from 'path';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
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

const run = async () => {
  if (!fs.existsSync('public/images/carousel')) {
    fs.mkdirSync('public/images/carousel', { recursive: true });
  }
  if (!fs.existsSync('public/images/logo')) {
    fs.mkdirSync('public/images/logo', { recursive: true });
  }

  await downloadFile("https://lh3.googleusercontent.com/aida-public/AB6AXuCRHiilUVxmxOT7TgQ9mDKcefZPLCHOdFoUay8J3Pga9DKBzCOsJxBlmCx4dPm1U_78ZG2J_aRV2DGuvE4AGk-qrBCDQqYMkF0BNyOOJm7vy4jwoRM_0nBEBGPUsB3GNt_bPqJWOesMO8G5Chtp8eactEBOiidJs7PXZzbr_6pA0oTtvK5NIxhZ-nWb4_Y_h1HfFx-dbvIMcmjuuAWjLBv1oV64JLmo6j8vXiv09xUQTAlZHd85IDjmrA", "public/images/carousel/hero1.jpg");
  await downloadFile("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800", "public/images/carousel/hero2.jpg");
  await downloadFile("https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=800", "public/images/carousel/hero3.jpg");
  await downloadFile("https://lh3.googleusercontent.com/aida-public/AB6AXuCSdelZDCENNelBLTzKUKWktaJousE6rYvf4OOuguOYynlSADBBDXnDUiuOYv6hvhZxa6kEVSZG9w8Q-gxUjWtpDI0BqIveRF0ooCiL3l2g-aLjHMYVd7cnmJ3rQbbdiyJOEUZqPyXRDYkqLuQAYYPZ8TDDH7RAfvZVHytgW8sKtKmn-_z5i2DJaF58H19-76I6wmM1r1xP_R-MLOkW7RCODX48Tda7BmjrOuxc8yTHvWAQaKfMuwz2QOU3Ak4_qtkFP38", "public/images/logo/mertha-logo.png");
  
  console.log("Done");
}

run();
