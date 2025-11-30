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

function readMessage(event) {
    event.preventDefault();
    const id = document.getElementById('messageId').value;
    const password = document.getElementById('password').value;
    const ControlMessage = "ControlMessage";
    const key = CryptoJS.SHA256(password);
    const hmacControlMessage = CryptoJS.HmacSHA256(ControlMessage, key).toString();

    const payload = {
        controlmessage: hmacControlMessage,
    };

    fetchExistsAPi(id).then(data => {
        if (data.exists === false) {
            document.getElementById('result').innerHTML = `<p>Error: <strong>Message does not exist or has expired!</strong></p>`;
        } else {

            fetchReadAPi(payload, id).then(data => {
                if (data.error && data.error === 'Invalid controlmessage') {
                    document.getElementById('result').innerHTML = `<p>Error: <strong>Password is Wrong!</strong></p>`;
                } else if (data.error) {
                    document.getElementById('result').innerHTML = `<p>Error: <strong>${data.error}</strong></p>`;
                }
                if (!data.error) {
                    const decryptedMessage = decryptMessage(data.securemessage, password);
                    document.getElementById('result').innerHTML = `<p>Decrypted Message: <strong>${decryptedMessage}</strong> </p><p>Opens: <strong>${data.opens}/${data.burnsAfterXOpens}</strong></p>`;
                }
            });
        }
    })
}

function fetchExistsAPi(id){
    return fetch(`/api/secrets/exists/${id}`, {
        method: 'GET',
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

function fetchReadAPi(payload, id){
    const params = new URLSearchParams(payload).toString();
    return fetch(`/api/secrets/${id}?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
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

function decryptMessage(encryptedMessage, password) {
    // AES-Entschlüsselung mit Passwort
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, password);
    return bytes.toString(CryptoJS.enc.Utf8);
}
