import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom in CRA's jest does not expose TextEncoder/TextDecoder, which
// react-router 7 requires at import time.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// jsdom implements neither. Both are used by scroll-reveal and the world
// canvas, so stub them rather than let every page test throw.
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

window.scrollTo = window.scrollTo || (() => {});
