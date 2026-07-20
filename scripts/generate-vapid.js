// Generate a VAPID key pair for Web Push.
// Run once:  npm run gen-keys
// Then add the output to your Vercel project's Environment Variables.
const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();
console.log('# Environment variables for Vercel (Project Settings -> Environment Variables)');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
