function registerMessage(event) {
    event.preventDefault();
    const message = document.getElementById('message').value;
    const password = document.getElementById('password').value;
    const ttl = document.getElementById('ttl').value;
    const burnsAfterRead = document.getElementById('burnAfter').value;
    const controlmessage = "ControlMessage";

    const encryptedMessage = encryptMessage(message, password);
    const key = CryptoJS.SHA256(password);
    const hmacControlMessage = CryptoJS.HmacSHA256(controlmessage, key).toString();

    const payload = {
        securemessage: encryptedMessage,
        controlmessage: hmacControlMessage,
        ttl: parseInt(ttl),
        burnsAfterXOpens: parseInt(burnsAfterRead) || 1,
    };
    fetchRegisterAPi(payload).then(data => {
        if (data.id) {
            document.getElementById('result').innerHTML = `<p>Message registered with ID: <strong>${data.id}</strong></p>`;
        }
        if (data.qrCodeDataURL) {
            const image = new Image();
            image.src = data.qrCodeDataURL;
            document.getElementById('result').appendChild(image);
        }
    });
}

function fetchRegisterAPi(payload){
    return fetch("/api/secrets/register", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        return data; // Hier wird der `data`-Wert korrekt zurückgegeben
    })
    .catch(error => {
        console.error("Fehler bei der API-Anfrage:", error);
        return {}; // Rückgabe von leerem Objekt bei Fehler
    });
}

function encryptMessage(message, password) {
    // AES-Verschlüsselung mit Passwort
    return CryptoJS.AES.encrypt(message, password).toString();
}

