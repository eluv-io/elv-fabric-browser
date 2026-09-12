/* Colour scheme — the contained-app half of the ElvCore propagation contract.

ElvCore hosts this app in a sandboxed iframe on a separate origin, so nothing
about core's appearance reaches us on its own. In particular
`prefers-color-scheme` inside this frame reports the *operating system*, not
core's preference, so honouring the media query would put us in light mode
whenever the viewer has explicitly chosen dark in core, and vice versa. Reading
core's choice is the only way to agree with it.

Core offers two halves and an app needs both:

  - GetColorScheme  (pull) the value we start with
  - ColorSchemeChanged (push) every subsequent change

An app that only listens misses the initial value; an app that only pulls never
notices the viewer changing their mind.

Both are best-effort. Running against a core that predates this contract, or
standalone outside a frame, must not break the app — every failure path here
leaves the light scheme in place.

The result is stamped on <html> as data-color-scheme, which is what
static/stylesheets/color-scheme.scss keys off.
*/

import Fabric from "../clients/Fabric";

const SCHEMES = ["light", "dark"];
const DEFAULT_SCHEME = "light";
const ATTRIBUTE = "data-color-scheme";

// Core resolves "auto" against the viewer's OS before sending, so only the two
// concrete values should ever arrive. Anything else is treated as absent
// rather than trusted onto the document.
const Normalize = scheme => SCHEMES.includes(scheme) ? scheme : DEFAULT_SCHEME;

// Fabric Browser is a host as well as a guest: the Display tab embeds a display app
// in a frame of its own, and that app has exactly the problem this file exists
// to solve — it cannot see our scheme, and its own media query reports the OS.
// Offering it the same two halves core offers us costs almost nothing and is
// the only mechanism by which it could ever follow along. Until a display app
// implements its side, it simply never asks.
const subscribers = new Set();

export const CurrentColorScheme = () =>
  document.documentElement.getAttribute(ATTRIBUTE) || DEFAULT_SCHEME;

export const SubscribeColorScheme = callback => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

export const ApplyColorScheme = scheme => {
  const normalized = Normalize(scheme);

  document.documentElement.setAttribute(ATTRIBUTE, normalized);

  // A failing subscriber must not stop the others, nor the scheme being applied.
  subscribers.forEach(callback => {
    try {
      callback(normalized);
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  });
};

// FrameClient's own timeout is 240s, which is right for fabric operations and
// far too long to hold the initial paint behind. A core without this operation
// answers "Access denied" quickly, but a core that never answers at all should
// not leave us waiting either.
const PULL_TIMEOUT = 5000;

const PullColorScheme = async () => {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(undefined), PULL_TIMEOUT));
  const request = Fabric.client.SendMessage({
    options: {operation: "GetColorScheme"}
  }).then(result => typeof result === "string" ? result : result?.response);

  return await Promise.race([request, timeout]);
};

export const InitializeColorScheme = () => {
  ApplyColorScheme(DEFAULT_SCHEME);

  // Not framed — nothing to agree with. index.js redirects to core in this
  // case, but the redirect is async and this must not throw in the meantime.
  if(window.self === window.top) { return; }

  let pushed = false;

  window.addEventListener("message", event => {
    if(event.data?.type !== "ElvFrameEvent") { return; }
    if(event.data.event !== "ColorSchemeChanged") { return; }

    pushed = true;
    ApplyColorScheme(event.data.colorScheme);
  });

  PullColorScheme()
    .then(scheme => {
      // The viewer can change the scheme while the pull is still in flight. A
      // push that already landed is newer than the value being carried back,
      // so it must not be overwritten by it.
      if(!scheme || pushed) { return; }

      ApplyColorScheme(scheme);
    })
    .catch(() => {
      // Older core, or the operation was refused. Light stays.
    });
};
