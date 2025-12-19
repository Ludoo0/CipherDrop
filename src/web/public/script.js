const params = new URLSearchParams(window.location.search);
const messageId = params.get('messageId');
if (messageId && document.getElementById('messageId')) document.getElementById('messageId').value = messageId;

// Hilfsfunktionen
function escapeHtml(str){ if (!str) return ''; return str.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]); }

// Konvertierungen
function uint8ArrayToWordArray(u8) { return CryptoJS.lib.WordArray.create(u8); }
function wordArrayToUint8Array(wordArray) {
    const len = wordArray.sigBytes;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    return u8;
}

// Encryption/Decryption
function encryptMessage(message, passphrase){
    // message: string or CryptoJS.lib.WordArray
    return CryptoJS.AES.encrypt(message, passphrase).toString();
}
function decryptMessage(encryptedString, passphrase){
    if (!encryptedString || typeof encryptedString !== 'string') throw new Error('Invalid encrypted input');
    // Guard: if server returned HTML (error page), abort
    if (encryptedString.trim().startsWith('<')) throw new Error('Invalid encrypted payload (looks like HTML)');
    const bytes = CryptoJS.AES.decrypt(encryptedString, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
}
function decryptFileToUint8(encryptedString, passphrase){
    const wordArray = CryptoJS.AES.decrypt(encryptedString, passphrase);
    return wordArrayToUint8Array(wordArray);
}

// API helper mit robusten Checks
async function fetchRegisterAPi(payload){
    const res = await fetch('/api/secrets/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const ct = res.headers.get('content-type')||'';
    if (!res.ok) throw new Error(`Register API error ${res.status}: ${await res.text()}`);
    if (!ct.includes('application/json')) throw new Error('Register API did not return JSON');
    return res.json();
}
async function fetchExistsAPi(id){
    const res = await fetch(`/api/secrets/exists/${id}`);
    const ct = res.headers.get('content-type')||'';
    if (!res.ok) return { exists: false, raw: await res.text() };
    if (!ct.includes('application/json')) return { error: 'Invalid response', raw: await res.text() };
    return res.json();
}
async function fetchReadAPi(payload, id){
    const params = new URLSearchParams(payload).toString();
    const res = await fetch(`/api/secrets/${id}?${params}`);
    const ct = res.headers.get('content-type')||'';
    const txt = await res.text();
    if (!res.ok) {
        // try parse JSON
        try { return JSON.parse(txt); } catch(e) { return { error: `Server error ${res.status}`, raw: txt }; }
    }
    if (!ct.includes('application/json')) {
        try { return JSON.parse(txt); } catch(e) { return { error: 'Invalid response format', raw: txt }; }
    }
    return JSON.parse(txt);
}

// Register message (Form)
async function registerMessage(event){
    event.preventDefault();
    const message = document.getElementById('message').value || '';
    const password = document.getElementById('password').value || '';
    const ttl = parseInt(document.getElementById('ttl').value) || 3600;
    const burns = parseInt(document.getElementById('burnAfter').value) || 1;
    const fileEl = document.getElementById('fileInput');

    if (!password) { alert('Password required'); return; }

    const hmacKey = CryptoJS.SHA256(password).toString(); // only for HMAC/control

    let payload = { controlmessage: CryptoJS.HmacSHA256('ControlMessage', hmacKey).toString(), ttl, burnsAfterXOpens: burns };

    // encrypt message
    payload.message = encryptMessage(message, password);

    // optional file
    if (fileEl && fileEl.files && fileEl.files[0]){
        const file = fileEl.files[0];
        const buf = await file.arrayBuffer();
        const wa = uint8ArrayToWordArray(new Uint8Array(buf));
        payload.file = { name: file.name, type: file.type, data: encryptMessage(wa, password) };
    }

    try{
        const resp = await fetchRegisterAPi(payload);
        const resultEl = document.getElementById('result'); resultEl.innerHTML = '';
        if (resp.id) resultEl.innerHTML = `<p>Message registered with ID: <strong>${resp.id}</strong></p>`;
        if (resp.qrCodeDataURL){ const img = new Image(); img.src = resp.qrCodeDataURL; resultEl.appendChild(img); }
    } catch(e){ console.error(e); alert('Register failed: '+e.message); }
}

// Read message (Form)
async function readMessage(event) {
    event.preventDefault();
    const id = document.getElementById('messageId').value;
    const password = document.getElementById('password').value;
    if (!id || !password) {
        alert('ID and password required');
        return;
    }

    const hmacKey = CryptoJS.SHA256(password).toString();
    const payload = {controlmessage: CryptoJS.HmacSHA256('ControlMessage', hmacKey).toString()};

    try {
        const exists = await fetchExistsAPi(id);
        const resultEl = document.getElementById('result');
        resultEl.innerHTML = '';
        if (exists.exists === false) {
            resultEl.innerHTML = `<p>Error: <strong>Message does not exist or has expired!</strong></p>`;
            return;
        }

        const data = await fetchReadAPi(payload, id);
        if (data.error) {
            resultEl.innerHTML = `<p>Error: <strong>${escapeHtml(data.error || 'Unknown')}</strong></p>`;
            console.error('read API error raw:', data.raw);
            return;
        }

        if (!data.message || typeof data.message !== 'string') {
            resultEl.innerHTML = `<p>Error: <strong>Invalid encrypted message format from server.</strong></p>`;
            console.error('Invalid message from server', data);
            return;
        }

        // decrypt
        let decrypted;
        try {
            decrypted = decryptMessage(data.message, password);
        } catch (e) {
            resultEl.innerHTML = `<p>Error: <strong>Decryption failed (wrong password or corrupt data).</strong></p>`;
            console.error(e);
            return;
        }
        resultEl.innerHTML = `<p>Decrypted Message: <strong>${escapeHtml(decrypted)}</strong></p><p>Opens: <strong>${data.opens}/${data.burnsAfterXOpens}</strong></p>`;

        if (data.file && data.file.data) {
            try {
                const fileBytes = decryptFileToUint8(data.file.data, password);
                const blob = new Blob([fileBytes], {type: data.file.type || 'application/octet-stream'});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = data.file.name || 'file';
                a.textContent = `Download ${data.file.name || 'file'}`;
                resultEl.appendChild(a);
            } catch (e) {
                console.error('file decrypt failed', e);
                resultEl.innerHTML += `<p>Error: <strong>File decryption failed.</strong></p>`;
            }
        }

    } catch (e) {
        console.error(e);
        alert('Read failed: ' + e.message);
    }
}
