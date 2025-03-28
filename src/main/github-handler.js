const { ipcMain, shell } = require('electron');
const { Octokit } = require('@octokit/rest');
const keytar = require('keytar');
const crypto = require('crypto');
const axios = require('axios');

const SERVICE_NAME = 'SuperDevPlayground';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = 'superdevplayground://oauth/callback';

// Store the state parameter temporarily
let pendingState = null;

// Initialize Octokit instance
let octokit = null;

async function initializeGitHubHandlers(mainWindow) {
    // Check if we have a stored token and initialize Octokit
    const token = await keytar.getPassword(SERVICE_NAME, 'github_accessToken');
    if (token) {
        octokit = new Octokit({ auth: token });
    }

    // Start GitHub OAuth flow
    ipcMain.handle('github-start-auth', async () => {
        try {
            // Generate and store state parameter
            pendingState = crypto.randomBytes(32).toString('hex');
            
            // Construct GitHub authorization URL
            const authUrl = new URL('https://github.com/login/oauth/authorize');
            authUrl.searchParams.append('client_id', GITHUB_CLIENT_ID);
            authUrl.searchParams.append('redirect_uri', GITHUB_REDIRECT_URI);
            authUrl.searchParams.append('scope', 'repo workflow');
            authUrl.searchParams.append('state', pendingState);
            
            // Open the authorization URL in default browser
            await shell.openExternal(authUrl.toString());
            return { success: true };
        } catch (error) {
            console.error('Failed to start GitHub auth:', error);
            throw error;
        }
    });

    // Handle OAuth callback
    async function handleOAuthCallback(url) {
        try {
            const urlParams = new URL(url).searchParams;
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            // Verify state parameter
            if (state !== pendingState) {
                throw new Error('Invalid state parameter');
            }

            // Exchange code for access token
            const response = await axios.post('https://github.com/login/oauth/access_token', {
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: GITHUB_REDIRECT_URI
            }, {
                headers: {
                    Accept: 'application/json'
                }
            });

            const { access_token } = response.data;

            // Store token securely
            await keytar.setPassword(SERVICE_NAME, 'github_accessToken', access_token);

            // Initialize Octokit with new token
            octokit = new Octokit({ auth: access_token });

            // Notify renderer process
            mainWindow.webContents.send('github-auth-status', { success: true });
        } catch (error) {
            console.error('Failed to handle OAuth callback:', error);
            mainWindow.webContents.send('github-auth-status', { 
                success: false, 
                error: error.message 
            });
        } finally {
            // Clear pending state
            pendingState = null;
        }
    }

    // GitHub API interactions
    ipcMain.handle('github-list-repos', async () => {
        try {
            if (!octokit) {
                throw new Error('GitHub not authenticated');
            }

            const { data: repos } = await octokit.repos.listForAuthenticatedUser({
                sort: 'updated',
                per_page: 100
            });

            return repos.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                url: repo.html_url,
                defaultBranch: repo.default_branch
            }));
        } catch (error) {
            console.error('Failed to list repos:', error);
            throw error;
        }
    });

    ipcMain.handle('github-list-workflows', async (_event, { owner, repo }) => {
        try {
            if (!octokit) {
                throw new Error('GitHub not authenticated');
            }

            const { data: { workflows } } = await octokit.actions.listRepoWorkflows({
                owner,
                repo
            });

            return workflows.map(workflow => ({
                id: workflow.id,
                name: workflow.name,
                path: workflow.path,
                state: workflow.state,
                createdAt: workflow.created_at,
                updatedAt: workflow.updated_at
            }));
        } catch (error) {
            console.error('Failed to list workflows:', error);
            throw error;
        }
    });

    ipcMain.handle('github-trigger-workflow', async (_event, { owner, repo, workflowId, ref, inputs }) => {
        try {
            if (!octokit) {
                throw new Error('GitHub not authenticated');
            }

            const { data: workflow } = await octokit.actions.createWorkflowDispatch({
                owner,
                repo,
                workflow_id: workflowId,
                ref,
                inputs
            });

            return { success: true, workflow };
        } catch (error) {
            console.error('Failed to trigger workflow:', error);
            throw error;
        }
    });

    ipcMain.handle('github-get-workflow-runs', async (_event, { owner, repo, workflowId }) => {
        try {
            if (!octokit) {
                throw new Error('GitHub not authenticated');
            }

            const { data: { workflow_runs } } = await octokit.actions.listWorkflowRuns({
                owner,
                repo,
                workflow_id: workflowId,
                per_page: 10
            });

            return workflow_runs.map(run => ({
                id: run.id,
                status: run.status,
                conclusion: run.conclusion,
                headBranch: run.head_branch,
                headSha: run.head_sha,
                event: run.event,
                url: run.html_url,
                createdAt: run.created_at,
                updatedAt: run.updated_at
            }));
        } catch (error) {
            console.error('Failed to get workflow runs:', error);
            throw error;
        }
    });

    // Check GitHub connection status
    ipcMain.handle('github-check-auth', async () => {
        try {
            if (!octokit) {
                return { authenticated: false };
            }

            // Test the connection by getting the authenticated user
            const { data: user } = await octokit.users.getAuthenticated();
            return {
                authenticated: true,
                user: {
                    login: user.login,
                    name: user.name,
                    avatarUrl: user.avatar_url
                }
            };
        } catch (error) {
            console.error('Failed to check GitHub auth:', error);
            return { authenticated: false };
        }
    });

    return {
        handleOAuthCallback
    };
}

module.exports = {
    initializeGitHubHandlers
}; 