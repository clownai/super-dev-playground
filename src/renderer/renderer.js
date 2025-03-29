// JSON Formatter
function formatJSON() {
    const input = document.getElementById('jsonInput');
    try {
        const parsed = JSON.parse(input.value);
        input.value = JSON.stringify(parsed, null, 2);
    } catch (error) {
        alert('Invalid JSON: ' + error.message);
    }
}

// Base64 Encoder/Decoder
function encodeBase64() {
    const input = document.getElementById('base64Input');
    try {
        const encoded = btoa(input.value);
        input.value = encoded;
    } catch (error) {
        alert('Error encoding to Base64: ' + error.message);
    }
}

function decodeBase64() {
    const input = document.getElementById('base64Input');
    try {
        const decoded = atob(input.value);
        input.value = decoded;
    } catch (error) {
        alert('Error decoding from Base64: ' + error.message);
    }
} 