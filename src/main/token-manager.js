const keytar = require('keytar');

const SERVICE_NAME = 'SuperDevPlayground';
const GITHUB_ACCOUNT = 'github';

class TokenManager {
    async setGitHubToken(token) {
        await keytar.setPassword(SERVICE_NAME, GITHUB_ACCOUNT, token);
    }

    async getGitHubToken() {
        return await keytar.getPassword(SERVICE_NAME, GITHUB_ACCOUNT);
    }

    async deleteGitHubToken() {
        await keytar.deletePassword(SERVICE_NAME, GITHUB_ACCOUNT);
    }
}

module.exports = new TokenManager(); 