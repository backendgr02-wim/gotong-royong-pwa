// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports */
const { serwist } = require("@serwist/next/config");

const revision = crypto.randomUUID();

module.exports = serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});
