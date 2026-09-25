import axios from "axios";
import { API_DEV, API_PROD, API_USERNAME, API_PASSWORD } from "@env";

//Base settings
//const rawBase = __DEV__ ? API_DEV : API_PROD;
//const baseURL = rawBase?.replace(/\/+$/, "");

//Dev settings
/* OLD IMPLEMENTATION:
const rawBase = API_DEV || "http://192.168.68.1/ApiBackend";
const baseURL = rawBase ? rawBase.trim().replace(/\s+/g, "").replace(/\/+$/, "") : "";
*/

/**
 * MODIFICATION: Enhanced baseURL resolution supporting both DEV and PROD environments.
 * - In __DEV__ mode: Uses API_DEV first, falls back to API_PROD or local fallback IP.
 * - In production/APK builds (__DEV__ is false): Prefers API_PROD, but gracefully falls back to API_DEV
 *   so standalone test APKs targeting dev servers won't break if API_PROD is omitted in .env.
 * - Strips any accidental whitespace/spaces and trailing slashes.
 */
const rawBase = __DEV__
  ? (API_DEV || API_PROD || "http://192.168.68.1/ApiBackend")
  : (API_PROD || API_DEV || "http://192.168.68.1/ApiBackend");
const baseURL = rawBase ? rawBase.trim().replace(/\s+/g, "").replace(/\/+$/, "") : "";
console.log("====================================");
console.log("Resolved Base URL:", baseURL);
console.log("Is DEV mode?", __DEV__);
console.log("====================================");


// Build a Basic auth header if credentials are provided in .env
const makeAuthHeader = () => {
  if (!API_USERNAME || !API_PASSWORD) return undefined;

  const toEncode = `${API_USERNAME}:${API_PASSWORD}`;
  // Prefer btoa (available in React Native); fall back to Buffer/manual encode.
  const encoded =
    typeof globalThis.btoa === "function"
      ? globalThis.btoa(toEncode)
      : (() => {
          const buf = (globalThis as any)?.Buffer;
          if (buf?.from) return buf.from(toEncode, "binary").toString("base64");
          // Simple manual base64 as a last resort
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          let output = "";
          let i = 0;
          while (i < toEncode.length) {
            const c1 = toEncode.charCodeAt(i++);
            const c2 = toEncode.charCodeAt(i++);
            const c3 = toEncode.charCodeAt(i++);
            const b1 = c1 >> 2;
            const b2 = ((c1 & 3) << 4) | (c2 >> 4);
            const b3 = ((c2 & 15) << 2) | (c3 >> 6);
            const b4 = c3 & 63;
            if (Number.isNaN(c2)) {
              output += `${chars[b1]}${chars[b2]}==`;
            } else if (Number.isNaN(c3)) {
              output += `${chars[b1]}${chars[b2]}${chars[b3]}=`;
            } else {
              output += `${chars[b1]}${chars[b2]}${chars[b3]}${chars[b4]}`;
            }
          }
          return output;
        })();

  if (!encoded) return undefined;
  return `Basic ${encoded}`;
};

export const authHeader = makeAuthHeader();

export default axios.create({
  baseURL,
  headers: {
    ...(authHeader ? { Authorization: authHeader } : {}),
    "ngrok-skip-browser-warning": "69420",
  },
});
