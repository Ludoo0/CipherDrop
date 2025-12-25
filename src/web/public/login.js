function loginToggle() {
    const loginDiv = document.querySelector('.login');
    const registerDiv = document.querySelector('.register');
    if (loginDiv.style.display === 'none') {
        loginDiv.style.display = 'block';
        registerDiv.style.display = 'none';
        localStorage.setItem('showLogin', 'true');
    } else {
        loginDiv.style.display = 'none';
        registerDiv.style.display = 'block';
        localStorage.setItem('showLogin', 'false');
    }
}

window.onload = function() {
    const showLogin = localStorage.getItem('showLogin');
    if (showLogin === 'true') {
        document.querySelector('.login').style.display = 'block';
        document.querySelector('.register').style.display = 'none';
    } else {
        document.querySelector('.login').style.display = 'none';
        document.querySelector('.register').style.display = 'block';
    } 
};


function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const resultDiv = document.getElementById('login-result');

    if (!(password.length >= 8)) {
        resultDiv.innerText = 'Password must be at least 8 characters long.';
        return;
    }

    const payload = {
        username: username,
        password: password
    };
    const result=fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    result.then(response => {
        if (response.ok) {
            window.location.href = '/dashboard';
        } else if (response.status === 401) {
            resultDiv.innerText = 'Invalid username or password.';           
        } else {
            resultDiv.innerText = 'An error occurred during login.';
        }
    }).catch(error => {
        console.error('Error during login:', error);
        alert('An error occurred during login.');
    });

}

function register(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;   
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const resultDiv = document.getElementById('reg-result');

    const payload = {
        username: username,
        email: email,
        password: password
    };
    if (password.length < 8) {
        resultDiv.innerText = 'Password must be at least 8 characters long.';
        return;
    }
    if (password !== confirmPassword) {
        resultDiv.innerText = 'Passwords do not match.';
        return;
    }
    const result=fetch('/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    result.then(response => {
        if (response.ok) {
            alert('Registration successful! You can now log in.');
            window.location.href = '/dashboard';
        } else if (response.status === 409) {
            resultDiv.innerText = 'Username or email already exists.';           
        } else {
            resultDiv.innerText = 'An error occurred during registration.';
        }
    }).catch(error => {
        console.error('Error during registration:', error);
        alert('An error occurred during registration.');
    });


}