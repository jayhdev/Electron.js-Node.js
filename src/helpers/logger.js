import electronLog from 'electron-log';

export default function log(message, category = 'anonymous', data) {
  electronLog.info(`${category}: ${message}`);
  if (data && typeof data === 'object') {
    electronLog.info(JSON.stringify(data));
  }

  console.log(category, message, data);
}
