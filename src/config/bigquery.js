// src/config/bigquery.js
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID,
  keyFilename: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
});

module.exports = bigquery;