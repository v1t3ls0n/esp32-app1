// Generates a VAPID key pair for Web Push.
// Run once: `npm run gen-keys`, then copy the output into your .env file.
const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();
console.log('# Add these to server/.env');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
