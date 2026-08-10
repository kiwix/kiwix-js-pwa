# Contributing

## Please contribute upstream, not here

We welcome new contributors to Kiwix. However, this repository is downstream of [Kiwix JS](https://github.com/kiwix/kiwix-js/), and we therefore prefer that new contributors make contributions upstream, unless the offered PR is very simple (e.g., documentation, typos), or offers a clear Repo-specific improvement, e.g. related to packaging that upstream does not provide.

We often on-port code improvements contributed upstream to this Repo, so contributing there benefits the whole Kiwix JS ecosystem, not just the PWA.

Please note that the current maintainer of Kiwix JS and Kiwix PWA is an unpaid volunteer, so please be patient if it takes some time for them to get round to reviewing your PRs (they do this in their spare time).

## What belongs upstream, and what belongs here

If you are not sure where your contribution should go, this is a rough guide.

**Please contribute upstream** if your change touches the shared app code, which is most of the app: reading and decoding ZIM archives, search, the article display and its transformations, styling and themes, translation of the UI, or the Service Worker and content-injection modes. Code contributed upstream is on-ported here, and it also benefits the Kiwix JS browser extensions, so everyone gains.

**Contribute here** if your change is specific to the packaging or distribution of this app: the Electron main process, the UWP/Store (APPX), NW.js or Docker packages, the in-app updaters, PWA installation, or features that this app provides and Kiwix JS does not (for example the in-app ZIM downloader and library integration).

If in doubt, please open an issue here describing what you want to do, and we will tell you which repository it belongs in. Please do this *before* writing any code: it is much better than us having to turn down a PR you have already spent time on.

## Setting up and building

* Clone your fork and run `npm install` to get the Node dependencies;
* `npm run serve` starts a [Vite.js](https://vitejs.dev/) development server with Hot Module Replacement, which will refresh the app as you save your changes;
* `npm run preview` builds the app and opens the bundled version in a server, so that you can test the production code;
* `npm run build` fully builds the app, to a directory called `dist` in your cloned repo;
* `npm start` runs the unbundled app in the Electron version specified in `package.json`. The various `dist-*` scripts in `package.json` build the packaged Electron app. Note that you can only build for the OS you are currently on, though the Linux app can be built on Windows with WSL.

The app's source is ES6, which is transpiled by [rollup.js](https://rollupjs.org/) and [Babel](https://babeljs.io/) to code that runs on much older browsers. We take support for old browsers and platforms seriously, because many of our users have no access to anything newer, so please check that anything modern you use will transpile or is polyfilled. Upstream's CONTRIBUTING explains the coding target in more detail.

## Please test your code before asking for review

Please fork the repository, set up the development tools, and test your PR thoroughly, following the instructions in upstream's [CONTRIBUTING](https://github.com/kiwix/kiwix-js/blob/main/CONTRIBUTING.md). Full instructions are provided there, and the setup for this Repo is almost identical, bar the specific scripts that package Kiwix JS as an Electron, UWP, NW.js or PWA app.

There is one important difference from upstream, however: **this Repo has no unit or end-to-end test suite**. Upstream runs automated tests on every PR, whereas here the CI only checks that the app builds. This means that if you do not test your change, nobody will before it reaches users, many of whom install this app from an app store and receive updates automatically.

At a minimum, please test:

* the source code (`npm run serve`) *and* the bundled code (`npm run preview`) — a change can easily work in one and fail in the other;
* in both Restricted and ServiceWorker content-injection modes (see Configuration);
* in at least Chromium (Edge or Chrome) and Firefox;
* in the Electron app (`npm start`) if your change touches anything outside `www/`.

### Seeing your changes: the app caches its own code

Because this is an offline-first PWA, the app caches its own code, which means that it is very easy to spend time puzzling over a change that is in fact working, but which you are not being shown. While developing:

* Turn on "Developer Mode" in Configuration -> Expert settings -> Troubleshooting and development (this option was previously called "Bypass AppCache"). It disables the app's offline caching of its own code, and is turned on automatically if you are using the Vite server with `npm run serve`. The app has to be in ServiceWorker mode for the option to be available (see Content injection mode);
* If your changes cause the app to load in a disordered way, you should still be able to find and turn on that setting, so long as the app is in ServiceWorker mode. Then refresh the app with Ctrl-R;
* Open DevTools (F12) and tick "Disable cache" in the Network tab, so that the browser's own cache does not sit on top of the app's;
* With DevTools open, a hard refresh with Ctrl-Shift-R is often needed to clear the old Service Worker and pick up your new code;
* Remember to turn "Developer Mode" off again for your final round of testing, so that you are testing the app as users will actually experience it.

**Please state in the PR body what testing you have done**: what you ran, in which modes, and on which platforms. There is no required format, but if you do not tell us, we reserve the right not to review the PR until you do.

## Using AI assistants

We have no objection to code written with the help of an LLM, provided you meet the same standard as any other contributor: you understand every line you are submitting, you can explain and defend it in review, and you have run and tested it yourself. If you cannot do that, please do not open the PR. It is unfair to treat us as free testers of code that you do not understand, and it is we who will have to maintain it long after you have moved on.

## Repository hygiene

A few things that make a PR much easier to review, and much more likely to be merged quickly:

* Follow the coding style of the code you are editing, and please do not reformat or prettify code you are not working on: it buries your actual change in a wall of diff;
* Keep your PR to a single issue or feature;
* Do not commit build output, such as the contents of `dist/`;
* Please leave version bumps, CHANGELOG entries and anything else release-related to the maintainer.

## Licence

This app is released under the [GPL v3](https://www.gnu.org/licenses/gpl-3.0) licence. By contributing, you agree that your contribution is licensed under the same terms.
