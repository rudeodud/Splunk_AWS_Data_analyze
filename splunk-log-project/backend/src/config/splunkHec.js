const dotenv = require('dotenv');
dotenv.config();

const axios = require('axios');
const https = require('https');

const HEC_URL = process.env.URL;
const TOKEN = process.env.TOKEN;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function sendToSplunk(logData) {
  try {
    await axios.post(
      HEC_URL,
      {
        event: logData,
        sourcetype: '_json',
        index: 'main'
      },
      {
        headers: {
          Authorization: `Splunk ${TOKEN}`,
          'Content-Type': 'application/json',
          'X-Splunk-Request-Channel': TOKEN
        },
        httpsAgent
      }
    );
  } catch (err) {
    console.error('Splunk HEC 전송 실패:', err.message);
  }
}

module.exports = {
  sendToSplunk
};