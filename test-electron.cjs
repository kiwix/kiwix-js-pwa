const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching Electron app with Playwright...');
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: __dirname
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState('networkidle');
  console.log('App loaded. Invoking downloadToArchives via IPC bridge...');

  // Download a small test zim file (~2.9MB)
  const archiveName = 'alpinelinux_en_all_maxi_2026-04.zim';
  const archiveUrl = 'https://download.kiwix.org/zim/other/alpinelinux_en_all_maxi_2026-04.zim';

  // Listen to console logs from the renderer to see progress
  window.on('console', msg => console.log('Renderer:', msg.text()));

  // Setup progress listener
  await window.evaluate(() => {
    window.electronAPI.onDownloadProgress((data) => {
      console.log(`Progress: ${data.receivedBytes} / ${data.totalBytes}`);
    });
  });

  console.log('Starting download...');
  const result = await window.evaluate(async ([name, url]) => {
    return await window.electronAPI.downloadToArchives(name, url);
  }, [archiveName, archiveUrl]);

  console.log('Download IPC returned:', result);

  if (result && result.success) {
    const filePath = result.filePath;
    console.log(`Checking if file exists at ${filePath}...`);
    if (fs.existsSync(filePath)) {
      console.log('✅ Success! File was downloaded successfully.');
      // Cleanup test file
      fs.unlinkSync(filePath);
      console.log('Test file cleaned up.');
    } else {
      console.error('❌ Failed! IPC returned success but file not found.');
      process.exitCode = 1;
    }
  } else {
    console.error('❌ Failed! IPC did not return success.');
    process.exitCode = 1;
  }

  await electronApp.close();
})();
