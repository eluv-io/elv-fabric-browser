import React from "react";
import Utils from "@eluvio/elv-client-js/src/Utils";
import BigNumber from "bignumber.js";
import {Balance} from "elv-components-js";

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

export const AccessChargeDisplay = (accessCharge) => {
  if(!accessCharge) { return; }

  accessCharge = Utils.ToBigNumber(accessCharge).toNumber();

  if(accessCharge <= 0) { return; }

  if(accessCharge > 2 ** 150) {
    return "Not Accessible";
  }

  return <Balance balance={accessCharge} />;
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
