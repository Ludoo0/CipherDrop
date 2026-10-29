import CryptoJS from "crypto-js";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const pbkdf2Iterations = 600_000;

function asArrayBuffer(bytes: Uint8Array<ArrayBufferLike>): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function toBase64Url(bytes: Uint8Array) {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveKeys(password: string, salt: Uint8Array) {
    if (!globalThis.crypto?.subtle) throw new Error("Sichere Verschlüsselung ist nur über HTTPS oder localhost verfügbar.");
    const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: asArrayBuffer(salt), iterations: pbkdf2Iterations, hash: "SHA-256" },
        passwordKey,
        512,
    );
    const rootKey = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
    const [encryptionKey, verifierKey] = await Promise.all([
        crypto.subtle.deriveKey(
            { name: "HKDF", hash: "SHA-256", salt: new ArrayBuffer(0), info: encoder.encode("CipherDrop v2 message encryption") },
            rootKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"],
        ),
        crypto.subtle.deriveKey(
            { name: "HKDF", hash: "SHA-256", salt: new ArrayBuffer(0), info: encoder.encode("CipherDrop v2 access verifier") },
            rootKey,
            { name: "HMAC", hash: "SHA-256", length: 256 },
            false,
            ["sign"],
        ),
    ]);
    return { encryptionKey, verifierKey };
}

function makeEnvelope(salt: Uint8Array, iv: Uint8Array, data: Uint8Array) {
    return `cd2:${toBase64Url(salt)}:${toBase64Url(iv)}:${toBase64Url(data)}`;
}

function parseEnvelope(value: string) {
    const [version, salt, iv, data] = value.split(":");
    if (version !== "cd2" || !salt || !iv || !data) throw new Error("Das verschlüsselte Format ist ungültig.");
    return { salt: fromBase64Url(salt), iv: fromBase64Url(iv), data: fromBase64Url(data) };
}

export async function createEncryptionContext(password: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const { encryptionKey, verifierKey } = await deriveKeys(password, salt);
    const verifier = new Uint8Array(await crypto.subtle.sign("HMAC", verifierKey, encoder.encode("ControlMessage")));
    const controlmessage = `v2:${toBase64Url(verifier)}`;

    async function encrypt(bytes: Uint8Array) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, encryptionKey, asArrayBuffer(bytes)));
        return makeEnvelope(salt, iv, ciphertext);
    }

    return {
        controlmessage,
        encryptText: (text: string) => encrypt(encoder.encode(text)),
        encryptFile: async (file: File) => ({
            name: file.name,
            type: file.type || "application/octet-stream",
            data: await encrypt(new Uint8Array(await file.arrayBuffer())),
        }),
    };
}

export async function controlMessageForRead(password: string, version: number, salt?: string) {
    if (version !== 2) {
        const key = CryptoJS.SHA256(password).toString();
        return CryptoJS.HmacSHA256("ControlMessage", key).toString();
    }
    if (!salt) throw new Error("Der Verschlüsselungsschlüssel fehlt.");
    const { verifierKey } = await deriveKeys(password, fromBase64Url(salt));
    const verifier = new Uint8Array(await crypto.subtle.sign("HMAC", verifierKey, encoder.encode("ControlMessage")));
    return `v2:${toBase64Url(verifier)}`;
}

export async function decryptText(value: string, password: string) {
    if (!value.startsWith("cd2:")) {
        const plaintext = CryptoJS.AES.decrypt(value, password).toString(CryptoJS.enc.Utf8);
        if (!plaintext && value) throw new Error("Die Nachricht konnte nicht entschlüsselt werden.");
        return plaintext;
    }
    const { salt, iv, data } = parseEnvelope(value);
    const { encryptionKey } = await deriveKeys(password, salt);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, encryptionKey, asArrayBuffer(data));
    return decoder.decode(plaintext);
}

export async function decryptFile(value: string, password: string) {
    if (!value.startsWith("cd2:")) {
        const legacy = CryptoJS.AES.decrypt(value, password);
        const bytes = new Uint8Array(legacy.sigBytes);
        for (let i = 0; i < legacy.sigBytes; i += 1) {
            bytes[i] = (legacy.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }
        return bytes;
    }
    const { salt, iv, data } = parseEnvelope(value);
    const { encryptionKey } = await deriveKeys(password, salt);
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, encryptionKey, asArrayBuffer(data)));
}

export function saltFromEnvelope(value: string) {
    return value.startsWith("cd2:") ? value.split(":")[1] : undefined;
}
