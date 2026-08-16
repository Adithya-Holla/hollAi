const { Dropbox } = require('dropbox');

function getClient() {
  return new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN
  });
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadImageToDropbox(buffer, originalFilename) {
  const dbx = getClient();
  const path = `/portfolio-uploads/${Date.now()}-${sanitizeFilename(originalFilename)}`;

  await dbx.filesUpload({ path, contents: buffer, mode: { '.tag': 'add' } });

  let sharedLink;
  try {
    const created = await dbx.sharingCreateSharedLinkWithSettings({ path });
    sharedLink = created.result.url;
  } catch (error) {
    if (error?.error?.error_summary?.startsWith('shared_link_already_exists')) {
      const existing = await dbx.sharingListSharedLinks({ path, direct_only: true });
      sharedLink = existing.result.links[0].url;
    } else {
      throw error;
    }
  }

  return sharedLink.replace(/\?dl=0$/, '?raw=1').replace(/&dl=0$/, '&raw=1');
}

module.exports = { uploadImageToDropbox };
