/**
 * One-time helper: exchanges an OAuth authorization code for a refresh token.
 * Run: node scripts/getDropboxRefreshToken.js <APP_KEY> <APP_SECRET>
 * It prints an authorize URL — open it, approve, paste the code back in.
 */
const readline = require('readline');
const { Dropbox, DropboxAuth } = require('dropbox');

async function main() {
  const [appKey, appSecret] = process.argv.slice(2);
  if (!appKey || !appSecret) {
    console.error('Usage: node scripts/getDropboxRefreshToken.js <APP_KEY> <APP_SECRET>');
    process.exit(1);
  }

  const dbxAuth = new DropboxAuth({ clientId: appKey, clientSecret: appSecret });
  const authUrl = await dbxAuth.getAuthenticationUrl(
    undefined, undefined, 'code', 'offline', undefined, undefined, false
  );

  console.log('Open this URL, approve access, and paste the resulting code below:');
  console.log(authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Code: ', async (code) => {
    dbxAuth.setClientSecret(appSecret);
    const response = await dbxAuth.getAccessTokenFromCode('', code.trim());
    console.log('\nAdd this to backend/.env as DROPBOX_REFRESH_TOKEN:');
    console.log(response.result.refresh_token);
    rl.close();
  });
}

main();
