const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'index.html'),
  'utf8'
);
const app = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'app.js'),
  'utf8'
);

[
  'card-source-filter',
  'card-category-filter',
  'card-source',
  'kink-category-filter',
  'conv-source-filter',
  'conv-source',
].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `Missing #${id}`);
});

[
  'card-source-filter',
  'card-category-filter',
  'kink-category-filter',
  'conv-source-filter',
  'sourceFile',
].forEach((text) => {
  assert.match(app, new RegExp(text), `app.js does not reference ${text}`);
});
