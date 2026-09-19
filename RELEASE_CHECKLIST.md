# Release checklist

The standing procedure for releasing the app. Copy this file into a new release issue and tick the
boxes as you go; the issue then becomes the record of what was done for that version.

The **Before this release** section is per-release scratch: replace its contents each time.
Everything below it is the standing procedure, and changes only when the pipeline changes.

Two version numbers are used in most releases: the lower one for the legacy UWP Store app, the
higher for everything else. The Store will not accept two apps with the same version number.

## Before this release (3.9.x)

- [ ] Verify ZIM file associations in the **rpm** and **32-bit Linux** packages built from `main` (deb, macOS arm64 and Windows NSIS already verified for #917)
- [ ] Finish #964 testing: upgrade from the *old* PWA manifest (the Service Worker precaches `manifest.json` under `appVersion`), *Open With* on Linux offering both the PWA and the Electron app, ChromeOS
- [ ] Bhuvan's on-port of the `toStringId` pipe-escaping fix (#966), if he takes it
- [ ] Delete the leftover throwaway drafts from #917 testing: `v3.8.93` ("Test register file associations") and `v3.8.93-E`
- [ ] Consolidate the interim 3.8.9x CHANGELOG sections into a single full-release section covering everything since 3.8.8, and fix the typos "openinig" and "REGRISSION"
- [ ] Close on release, as fixed: #907, #789, #675, #463, #631
- [ ] After publication, publish security advisory **GHSA-37j3-jm4x-gjmv**. This is the first release to carry that fix to the Electron and NW.js apps. Decide at that point: request a CVE? a separate downstream advisory? affected range `<= 3.8.8` or `<= 3.8.9`?

## Pre-flight

- [ ] Fix any urgent issues
- [ ] Wait for any external PRs to be ready
- [ ] Create PR to update CHANGELOG.md (detailed log), and the user-facing log embedded in `www/index.html`
  - [ ] User-facing changelog in www/index.html
- [ ] Check build numbers of Electron (in `package.json`) and NWJS (in `package.json.nwjs`), and decide if they need bumping to latest stable
  - [ ] **Do not bump Electron past 43.x while #970 is undecided**: Electron 44 removed `win32-ia32`, and our NSIS Setup and portable targets are ia32-only, so a bump silently deletes the main Windows downloads
  - [ ] Within that pin, update with `npm install electron@43 --save-dev`, and do a quick test with `npm start`
  - [ ] You will need to update the number or range of the NWJS version manually in `package.json.nwjs`. Do not install NWJS alongside Electron
  - [ ] Commit and push the changes you have made
- [ ] Run the script `./scripts/Set-AppVersion` in PowerShell (Windows or [Linux](https://learn.microsoft.com/en-us/powershell/scripting/install/linux-overview)), to touch all the files where updates are required
  - [ ] Set the version number to the higher of the two release numbers (we'll temporarily set it to the lower when building the UWP app)
  - [ ] The script runs `npm install`, but if you updated manually, be sure to run `npm install`, and `npm audit fix` if security updates are required. Do not use the `force` option to install breaking patches
  - [ ] Merge and push any changes to main, or via a separate PR - do not use the CHANGELOG PR
- [ ] Run `npm run build`, note any build errors and fix if necessary
- [ ] Confirm `npm test` passes (the suites also run in CI on every push and pull request)

## Manual testing

- [ ] Of the PWA, using the test implementation https://kiwix.github.io/kiwix-js-pwa and the bundled version https://kiwix.github.io/kiwix-js-pwa/dist/ or on localhost, testing both the unbundled app and the built app in `./dist/`. Be sure to test in Restricted Mode as well as ServiceWorker Mode. Fix any issues arising
- [ ] Of the Electron app by running `npm install` and then `npm start` in the root of the Repo (Windows or Linux). Ensure app self-updates to the version you're testing, or exit and restart the app once update is detected
- [ ] Ensure the `archives` folder is empty (apart from the README) or that it contains only any bundled demo archive (if so, you will need to ensure the archive is listed in the UWP manifests for both the Store and the GitHub releases: `Set-AppVersion` should do this for you if the packaged archive is properly referenced in `init.js`)
- [ ] If all changes done, squash and merge the CHANGELOG PR

## Store packages

Both are built locally: the legacy UWP needs Visual Studio 2017, the last version of VS that supports
the JS project type, which cannot be installed on GitHub runners; the Electron appx is unsigned for
the Store.

- [ ] Build the UWP app locally on a Windows machine
  - [ ] Temporarily set the app to the **lower** of the two release version numbers using `Set-AppVersion`
  - [ ] Run `./scripts/Create-DraftRelease -buildstorerelease -buildonly`. In the interactive dialogue, do not set any E suffix, just build the plain app with the suggested release version
  - [ ] Find the built `.appxupload` bundle in `.\dist\AppPackages\`, and move it to a top-level directory so it is not deleted when building the Electron version
- [ ] Build the Electron UWP app locally for Store release
  - [ ] Increment the app version again to the **higher** of the two release numbers using `Set-AppVersion`
  - [ ] Run `./scripts/Create-DraftRelease -buildstorerelease -winonly appx -electronbuild local`. When asked for the tagname, simply type `E` (for Electron). Build only (no draft release yet)
  - [ ] Find the `.appxbundle` that was built in `.\dist\bld\Electron\` and move it to a top-level directory, together with the previously built `.appxupload`
- [ ] Log in to the [Microsoft Store account](https://partner.microsoft.com/en-US/dashboard/), create a new release, update the Store info with the user-facing changes you want to appear in the Store entry, and upload the two packages
- [ ] Submit the release to the MS Store

## GitHub release (cloud build)

- [ ] Create the Draft Release, and build the Electron and NWJS packages on GitHub
  - [ ] Run `./scripts/Create-DraftRelease -electronbuild cloud`. When asked, enter `+E+N` at the tag version prompt (builds and signs the UWP, and builds Electron and NWJS versions on GitHub)
  - [ ] The human draft release **must exist before the build jobs reach their publish step**. `Create-DraftRelease` creates it, and `Build-Electron.ps1` dispatches the workflow with `target=release`. The publisher runs with `--skip-if-no-draft`, so a missing draft means artefacts are *silently* not published
  - [ ] Wait for all release packages to build - check the Actions tab for any failures. If the actions fail, you can try re-running them. Sometimes the best option is to delete the draft release and re-run `Create-DraftRelease`

### Check the two releases

`scripts/publish-github-release.cjs` creates the `-E` channel release itself (as a draft
prerelease), routes every artefact to the human release, the channel release or both, and rewrites
the channel ymls. Nothing here is downloaded, edited or re-uploaded by hand.

- [ ] The `-E` channel draft exists, titled "Supplementary installation files for Kiwix JS Electron"
- [ ] Human release holds the downloads only: `.dmg` (x64 and arm64), deb, rpm, AppImage, Setup exes, portable, the three `*.nsis.7z` and the Web Setup exe - and **no** `latest*.yml`
- [ ] Channel release holds the `latest*.yml` files, the macOS x64/arm64 zips, and - deliberately, for the web installer and for the in-app update sniffer - the same `*.nsis.7z` and Web Setup exe
- [ ] Every url, path and file entry in the channel ymls is prefixed `../vX.Y.Z/` where the file lives on the human release
- [ ] `latest-mac.yml` is a single merged file covering x64 and arm64, and carries `minimumSystemVersion` (Darwin 21). Installed High Sierra builds rely on it alone to avoid being offered a build they cannot run

### Test the packages

- [ ] Test a Linux release (deb and AppImage, and check the ZIM file association in the deb and rpm)
- [ ] Test a macOS release on the MacInCloud account, from the `.dmg`. MacInCloud has no admin rights, so the disk image cannot go in `/Applications`: `mkdir -p ~/Applications`, copy the app there and run `xattr -dr com.apple.quarantine` on it, otherwise translocation makes file-association testing meaningless
- [ ] Test the NWJS release on Windows 11
- [ ] Test the NWJS release for XP on the Windows XP Mode VM
- [ ] Verify auto-update from the **previously installed release** on Windows NSIS, Linux AppImage, and macOS x64 and arm64
- [ ] Publish the main release
- [ ] Publish the supplementary `-E` release (it is created as a draft, so the updater will not see it until it is published)
- [ ] Push the changes to permalinks produced by the `Create-DraftRelease` script. If this wasn't completed successfully, and you used a Workflow Dispatch to build Electron packages, you will have to update these manually
- [ ] Check whether the PWA was updated when creating the draft release
  - [ ] If not, update with `./scripts/Publish-PWA`. Choose `docker` as the target when asked, and set the release tag to the tag number, e.g. `3.9.2`
- [ ] Update the winget package repository, either by accepting the prompt in the `Create-DraftRelease` script, or by re-running it with `./scripts/Create-DraftRelease -updatewinget`

## After publication

- [ ] Publicize the new release:
  - [ ] Reddit
  - [ ] Mastodon
- [ ] When the release is available on the Microsoft Store and in the winget repo, update the GitHub release to show that packages have been published
- [ ] Create a new release issue with release details, following the example of the last release issue, which is pinned at the top of Issues
- [ ] Unpin the old release, and pin the new release issue
- [ ] Close the issues labelled fixed
- [ ] Update GitHub milestones and issues, closing any old milestone less than the current release version
