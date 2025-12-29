export const asyncHandler = (fn) => (...args) => Promise.resolve(fn(...args));
