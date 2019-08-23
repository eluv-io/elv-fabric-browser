const Crypt = {
  strToArrayBuffer: (str) => {
    var buf = new ArrayBuffer(str.length * 2);
    var bufView = new Uint16Array(buf);
    for(var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  },

  arrayBufferToString: (buf) => {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  },

  generateKey: async (password) => {
    let utf8Password = new TextEncoder().encode(password);
    let passwordHash = await crypto.subtle.digest("SHA-256", utf8Password);

    let keygenAlgorithm = {
      name: "AES-GCM",
      length: 256
    };

    return crypto.subtle.importKey("raw", passwordHash, keygenAlgorithm, false, ["encrypt", "decrypt"]);
  },

  encrypt: async (plainText, password="bG9uZ2RlZmF1bHRwYXNzd29yZA") => {
    let iv = crypto.getRandomValues(new Uint8Array(12));
    let key = await Crypt.generateKey(password);

    let encryptionAlgorithm = {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128
    };

    let encryptedText = await window.crypto.subtle.encrypt(encryptionAlgorithm, key, Crypt.strToArrayBuffer(plainText));

    return {
      iv: Crypt.arrayBufferToString(iv.buffer),
      encryptedText: Crypt.arrayBufferToString(encryptedText)
    };
  },

  decrypt: async (encryptedTextString, ivString, password="bG9uZ2RlZmF1bHRwYXNzd29yZA") => {
    let encryptedTextBuffer = Crypt.strToArrayBuffer(encryptedTextString);
    let iv = Crypt.strToArrayBuffer(ivString);
    let key = await Crypt.generateKey(password);

    let encryptionAlgorithm = {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128
    };

    return Crypt.arrayBufferToString(
      await window.crypto.subtle.decrypt(encryptionAlgorithm, key, encryptedTextBuffer)
    );
  }
};

export default Crypt;
