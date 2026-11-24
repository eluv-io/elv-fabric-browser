import Utils from "@eluvio/elv-client-js/src/Utils";
import BigNumber from "bignumber.js";

import SharedStyles from "@/assets/stylesheets/modules/shared.module.scss";
import {ValidateAddress} from "@eluvio/elv-client-js/src/Validation";

export const JoinClassNames = (...cs) => cs.map(c => c || "").join(" ");

export const CreateModuleClassMatcher = (...modules) => {
  modules = [SharedStyles, ...modules];

  return (...classes) => JoinClassNames(
    ...(classes.map(c => {
      return modules
        .map(m => m?.[c])
        .filter(c => c)
        .join(" ");
    }))
  );
};


// Traverse through a hashmap without throwing errors on undefined keys
// If any keys undefined, returns undefined
export const SafeTraverse = (object, ...keys) => {
  if(keys.length === 1 && Array.isArray(keys[0])) {
    keys = keys[0];
  }

  let result = object;

  for(let i = 0; i < keys.length; i++){
    result = result[keys[i]];

    if(result === undefined) { return undefined; }
  }

  return result;
};

export const Wait = async (ms) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

export const FormatAddress = (address) => {
  return Utils.FormatAddress(address);
};

export const EqualAddress = (address1, address2) => {
  return FormatAddress(address1) === FormatAddress(address2);
};

export const AddressToHash = (address) => {
  return Utils.AddressToHash(address);
};

export const HashToAddress = (hash) => {
  return Utils.HashToAddress(hash);
};

export const LROStatus = async ({client, libraryId, objectId, metadata}) => {
  // New convention "/lro_draft" - check first
  try {
    if(metadata.lro_draft) {
      const offeringKey = metadata.lro_draft.offering;
      const status = await client.LROStatus({libraryId, objectId});
      return [{
        offeringKey,
        status
      }];
    }
  } catch(error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load LRO status from /lro_draft:");
    // eslint-disable-next-line no-console
    console.error(error);
  }

  const oldKeys = Object.keys(metadata)
    .filter(key => key.startsWith("lro_draft_"));

  // Old convention "/lro_draft_*"
  return (await Promise.all(
    oldKeys.map(
      async lroKey => {
        const offeringKey = lroKey.replace(/^lro_draft_/, "");
        try {
          const status = await client.LROStatus({libraryId, objectId, offeringKey});
          return {
            offeringKey,
            status
          };
        } catch(error) {
          // eslint-disable-next-line no-console
          console.error(`Failed to load LRO status from /lro_draft_${offeringKey}:`);
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }
    )
  )).filter(status => status); // remove failed responses
};

export const Percentage = (done, total) => {
  return total > 0 ? `${(done * 100 / total).toFixed(1)}%` : "100.0%";
};

export const ParseBytes32 = (bytes32String) => {
  try {
    return Bytes32ToUtf8(bytes32String);
  } catch(error) {
    if(bytes32String.startsWith("0x0000")) {
      return new BigNumber(bytes32String).toString();
    } else {
      return bytes32String;
    }
  }
};

// Adapted from ethers.js/utils/utf8.js#toUtf8String
export const Bytes32ToUtf8 = (bytes32String) => {
  const bytes = Buffer.from(bytes32String.replace("0x", ""), "hex");

  let result = "";
  let i = 0;
  // Invalid bytes are ignored
  while(i < bytes.length) {
    let c = bytes[i++];
    // 0xxx xxxx
    if(c >> 7 === 0) {
      result += String.fromCharCode(c);
      continue;
    }
    // Multibyte; how many bytes left for this character?
    let extraLength = null;
    let overlongMask = null;
    // 110x xxxx 10xx xxxx
    if((c & 0xe0) === 0xc0) {
      extraLength = 1;
      overlongMask = 0x7f;
      // 1110 xxxx 10xx xxxx 10xx xxxx
    } else if((c & 0xf0) === 0xe0) {
      extraLength = 2;
      overlongMask = 0x7ff;
      // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
    } else if((c & 0xf8) === 0xf0) {
      extraLength = 3;
      overlongMask = 0xffff;
    } else {
      if((c & 0xc0) === 0x80) {
        throw new Error("invalid utf8 byte sequence; unexpected continuation byte");
      }
      throw new Error("invalid utf8 byte sequence; invalid prefix");
    }

    if(i + extraLength > bytes.length) {
      throw new Error("invalid utf8 byte sequence; too short");
    }

    // Remove the length prefix from the char
    let res = c & ((1 << (8 - extraLength - 1)) - 1);
    for(let j = 0; j < extraLength; j++) {
      let nextChar = bytes[i];
      // Invalid continuation byte
      if((nextChar & 0xc0) !== 0x80) {
        res = null;
        break;
      }
      res = (res << 6) | (nextChar & 0x3f);
      i++;
    }

    if(res === null) {
      throw new Error("invalid utf8 byte sequence; invalid continuation byte");
    }

    // Check for overlong seuences (more bytes than needed)
    if(res <= overlongMask) {
      throw new Error("invalid utf8 byte sequence; overlong");
    }

    // Maximum code point
    if(res > 0x10ffff) {
      throw new Error("invalid utf8 byte sequence; out-of-range");
    }

    // Reserved for UTF-16 surrogate halves
    if(res >= 0xd800 && res <= 0xdfff) {
      throw new Error("invalid utf8 byte sequence; utf-16 surrogate");
    }

    if(res <= 0xffff) {
      result += String.fromCharCode(res);
      continue;
    }

    res -= 0x10000;
    result += String.fromCharCode(((res >> 10) & 0x3ff) + 0xd800, (res & 0x3ff) + 0xdc00);
  }

  return result;
};

// Parse JSON for input values
// -- Allows whitespace and blank
// -- Rejects quoted strings which JSON.parse allows (e.g. JSON.parse('"string"')
export const ParseInputJson = (metadata) => {
  if(typeof metadata === "string") {
    metadata = metadata.trim();

    if(metadata === "") { return {}; }

    if(!metadata.startsWith("{") && !metadata.startsWith("[")) { throw Error("Invalid JSON"); }

    try {
      return JSON.parse(metadata);
    } catch(error) {
      throw Error(
        error.message
          .replace("JSON.parse: ", "")
          .replace("JSON Parse error: ", "")
          .replace(" of the JSON data", "")
      );
    }
  }

  return metadata || {};
};

export const onEnterPressed = (fn) => {
  return (event) => {
    if(event.key && event.key.toLowerCase() !== "enter") {
      return;
    }

    fn(event);
  };
};

export const FormatDate = (date) => {
  if(!date) { return; }

  try {
    return new Date(date)
      .toLocaleDateString(navigator.language, {month: "short", day: "numeric", year: "numeric"});
  // eslint-disable-next-line no-unused-vars
  } catch(error) {
    return "";
  }
};

export const FormatDateTime = (date) => {
  if(!date) { return; }

  try {
    return new Date(date)
      .toLocaleDateString(
        navigator.language,
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        }
      );
  // eslint-disable-next-line no-unused-vars
  } catch(error) {
    return "";
  }
};

export const ParseRat = (str) => {
  if(str.includes("/")) {
    const num = parseInt(str.split("/")[0]);
    const denom = parseInt(str.split("/")[1]);

    return (num / denom).toFixed(3);
  } else {
    return parseInt(str);
  }
};

export const FormatDuration = (duration) => {
  if(!duration) { return; }

  duration = duration.toString();
  if(duration.includes("/")) {
    duration = parseInt(duration.split("/")[0]) / parseInt(duration.split("/")[1]);
  }

  let hours = Math.floor(Math.max(0, duration) / 60 / 60) % 24;
  let minutes = Math.floor(Math.max(0, duration) / 60 % 60);
  let seconds = Math.ceil(Math.max(duration, 0) % 60);

  return [hours, minutes, seconds]
    .map(t => (!t || isNaN(t) ? "" : t.toString()).padStart(2, "0"))
    .join(":");
};


export const ScrollParent = el =>
  !(el instanceof HTMLElement) || typeof window.getComputedStyle !== "function"
    ? null
    : el.scrollHeight >= el.clientHeight && !/^(visible|hidden)/.test(window.getComputedStyle(el).overflowY || 'visible')
      ? el
      : ScrollParent(el.parentElement) || document.body;

export const ValidAddress = address => {
  try {
    ValidateAddress(address);
    return true;
  // eslint-disable-next-line no-unused-vars
  } catch(error) {
    console.log(error);
    return false;
  }
};
