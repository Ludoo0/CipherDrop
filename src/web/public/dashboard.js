window.onload = async function() {
    const result = await fetch('/api/users/loginstatus', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!result.ok) {
        window.location.href = './login.html';
        return alert('You must be logged in to access the dashboard.');
    }
    const secrets = await fetch('/api/users/secrets', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (secrets.ok) {
        const secretsData = await secrets.json();
        console.log(secretsData);
        if (secretsData.secrets.length === 0) {
            const secretsDiv = document.getElementById('secrets-list');
            const secretItem = document.createElement('p');
            secretItem.innerText = 'You have no secret messages registered currently.';
            secretsDiv.appendChild(secretItem);
            return;
        }
        const secretsDiv = document.getElementById('messages-ul');
        secretsData.secrets.forEach(secret => {
            const secretItem = document.createElement('div');
            secretItem.innerText = `Secret: \n\nID: ${secret.id} \nOpenings: (${secret.opens}/${secret.burnsAfterXOpens})\nFile: ${secret.file!==null ? "Yes": "No"}`;
            secretsDiv.appendChild(secretItem);
        });
    }

}