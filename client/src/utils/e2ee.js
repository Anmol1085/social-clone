// E2EE Utilities using Web Crypto API

// Generate ECDH Key Pair
export const generateKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
};

// Export Key to JWK (for storage/transmission)
export const exportKey = async (key) => {
    return await window.crypto.subtle.exportKey("jwk", key);
};

// Import Key from JWK
export const importKey = async (jwk, type = "public") => {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        type === "public" ? [] : ["deriveKey", "deriveBits"]
    );
};

// Derive Shared Secret (AES-GCM Key)
export const deriveSharedKey = async (privateKey, publicKey) => {
    return await window.crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey,
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        false,
        ["encrypt", "decrypt"]
    );
};

// Encrypt Message
export const encryptMessage = async (sharedKey, text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        sharedKey,
        data
    );

    // Return as hex strings
    return {
        ciphertext: arrayBufferToHex(ciphertext),
        iv: arrayBufferToHex(iv.buffer)
    };
};

// Decrypt Message
export const decryptMessage = async (sharedKey, ciphertextHex, ivHex) => {
    try {
        const ciphertext = hexToArrayBuffer(ciphertextHex);
        const iv = hexToArrayBuffer(ivHex);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            sharedKey,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return "**Encrypted Message**"; // Fallback
    }
};

// Helpers
const arrayBufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

const hexToArrayBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
};
