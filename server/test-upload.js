
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const photoPath = 'E:\\Laseya\\Pics\\Ruby\\Ruby.jpg';

async function testUpload() {
  if (!fs.existsSync(photoPath)) {
    console.error('Photo not found:', photoPath);
    return;
  }

  const form = new FormData();

  form.append('name', 'Photo Test Dog');
  form.append('type', 'Dog');
  form.append('breed', 'Mixed Breed');
  form.append('color', 'Brown');
  form.append('location', 'Kandy');
  form.append('status', 'Lost');
  form.append(
    'description',
    'Testing real pet photo uploads in PAWTRACE.'
  );

  const photo = new Blob([fs.readFileSync(photoPath)], {
    type: 'image/jpeg',
  });

  form.append('image', photo, path.basename(photoPath));

  try {
    const response = await fetch(
      'http://localhost:5000/api/reports/with-photo',
      {
        method: 'POST',
        body: form,
      }
    );

    console.log('HTTP Status:', response.status);
    console.log(await response.text());
  } catch (error) {
    console.error('Upload test failed:', error.message);
  }
}

testUpload();
