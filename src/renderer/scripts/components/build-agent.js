import notifications from '../notifications.js';

export default class BuildAgent {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'build-agent';
        this.selectedRepo = null;
        this.selectedWorkflow = null;
        this.render();
        this.setupEventListeners();
        this.checkGitHubAuth();
    }

    render() {
        this.container.innerHTML = `
            <div class="build-agent-header">
                <h2>Build Agent</h2>
                <div class="connection-status">
                    <div class="github-status">
                        <i class="fab fa-github"></i>
                        <span id="githubStatus">Checking connection...</span>
                        <button class="button" id="connectGitHubBtn">Connect GitHub</button>
                    </div>
                </div>
            </div>
            <div class="build-agent-content">
                <div class="repo-section" style="display: none;">
                    <h3>Select Repository</h3>
                    <select class="select" id="repoSelect">
                        <option value="">Choose a repository</option>
                    </select>
                </div>
                <div class="workflow-section" style="display: none;">
                    <h3>Workflows</h3>
                    <div class="workflow-list" id="workflowList"></div>
                </div>
                <div class="workflow-runs-section" style="display: none;">
                    <h3>Recent Runs</h3>
                    <div class="workflow-runs" id="workflowRuns"></div>
                </div>
            </div>
        `;
    }

    async checkGitHubAuth() {
        try {
            const { authenticated, user } = await window.github.checkAuth();
            this.updateGitHubStatus(authenticated, user);
        } catch (error) {
            console.error('Failed to check GitHub auth:', error);
            this.updateGitHubStatus(false);
        }
    }

    updateGitHubStatus(authenticated, user = null) {
        const statusElement = this.container.querySelector('#githubStatus');
        const connectButton = this.container.querySelector('#connectGitHubBtn');
        const repoSection = this.container.querySelector('.repo-section');

        if (authenticated && user) {
            statusElement.textContent = `Connected as ${user.login}`;
            connectButton.style.display = 'none';
            repoSection.style.display = 'block';
            this.loadRepositories();
        } else {
            statusElement.textContent = 'Not connected';
            connectButton.style.display = 'inline-block';
            repoSection.style.display = 'none';
            this.container.querySelector('.workflow-section').style.display = 'none';
            this.container.querySelector('.workflow-runs-section').style.display = 'none';
        }
    }

    async loadRepositories() {
        try {
            const repos = await window.github.listRepos();
            const select = this.container.querySelector('#repoSelect');
            
            // Clear existing options except the placeholder
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add repository options
            repos.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo.fullName;
                option.textContent = repo.fullName;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load repositories:', error);
            notifications.error('Failed to load repositories: ' + error.message);
        }
    }

    async loadWorkflows(owner, repo) {
        try {
            const workflows = await window.github.listWorkflows(owner, repo);
            const workflowList = this.container.querySelector('#workflowList');
            workflowList.innerHTML = '';

            workflows.forEach(workflow => {
                const workflowCard = document.createElement('div');
                workflowCard.className = 'workflow-card';
                workflowCard.dataset.workflowId = workflow.id;
                workflowCard.innerHTML = `
                    <div class="workflow-info">
                        <h4>${workflow.name}</h4>
                        <p class="workflow-path">${workflow.path}</p>
                        <p class="workflow-state">State: ${workflow.state}</p>
                    </div>
                    <div class="workflow-actions">
                        <button class="button trigger-workflow" data-workflow-id="${workflow.id}">
                            Run Workflow
                        </button>
                    </div>
                `;
                workflowList.appendChild(workflowCard);
            });

            this.container.querySelector('.workflow-section').style.display = 'block';
        } catch (error) {
            console.error('Failed to load workflows:', error);
            notifications.error('Failed to load workflows: ' + error.message);
        }
    }

    async loadWorkflowRuns(owner, repo, workflowId) {
        try {
            const runs = await window.github.getWorkflowRuns(owner, repo, workflowId);
            const runsContainer = this.container.querySelector('#workflowRuns');
            runsContainer.innerHTML = '';

            runs.forEach(run => {
                const runCard = document.createElement('div');
                runCard.className = `run-card ${run.status} ${run.conclusion || ''}`;
                runCard.innerHTML = `
                    <div class="run-info">
                        <div class="run-status">
                            <span class="status-badge ${run.status}"></span>
                            ${run.status}${run.conclusion ? ` - ${run.conclusion}` : ''}
                        </div>
                        <div class="run-details">
                            <p>Branch: ${run.headBranch}</p>
                            <p>Event: ${run.event}</p>
                            <p>Started: ${new Date(run.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="run-actions">
                        <a href="${run.url}" target="_blank" class="button secondary">View Details</a>
                    </div>
                `;
                runsContainer.appendChild(runCard);
            });

            this.container.querySelector('.workflow-runs-section').style.display = 'block';
        } catch (error) {
            console.error('Failed to load workflow runs:', error);
            notifications.error('Failed to load workflow runs: ' + error.message);
        }
    }

    async triggerWorkflow(owner, repo, workflowId) {
        try {
            const ref = this.selectedRepo?.defaultBranch || 'main';
            await window.github.triggerWorkflow(owner, repo, workflowId, ref);
            notifications.success('Workflow triggered successfully');
            
            // Reload runs after a short delay
            setTimeout(() => {
                this.loadWorkflowRuns(owner, repo, workflowId);
            }, 1000);
        } catch (error) {
            console.error('Failed to trigger workflow:', error);
            notifications.error('Failed to trigger workflow: ' + error.message);
        }
    }

    setupEventListeners() {
        // GitHub connection
        const connectButton = this.container.querySelector('#connectGitHubBtn');
        connectButton.addEventListener('click', async () => {
            try {
                await window.github.startAuth();
            } catch (error) {
                console.error('Failed to start GitHub auth:', error);
                notifications.error('Failed to start GitHub authentication: ' + error.message);
            }
        });

        // Listen for GitHub auth status changes
        window.github.on('github-auth-status', ({ success, error }) => {
            if (success) {
                this.checkGitHubAuth();
                notifications.success('Successfully connected to GitHub');
            } else {
                notifications.error('GitHub authentication failed: ' + (error || 'Unknown error'));
            }
        });

        // Repository selection
        const repoSelect = this.container.querySelector('#repoSelect');
        repoSelect.addEventListener('change', (e) => {
            const [owner, repo] = e.target.value.split('/');
            if (owner && repo) {
                this.loadWorkflows(owner, repo);
            } else {
                this.container.querySelector('.workflow-section').style.display = 'none';
                this.container.querySelector('.workflow-runs-section').style.display = 'none';
            }
        });

        // Workflow actions
        this.container.querySelector('#workflowList').addEventListener('click', (e) => {
            const triggerButton = e.target.closest('.trigger-workflow');
            if (triggerButton) {
                const workflowId = triggerButton.dataset.workflowId;
                const [owner, repo] = repoSelect.value.split('/');
                if (owner && repo && workflowId) {
                    this.triggerWorkflow(owner, repo, workflowId);
                    this.loadWorkflowRuns(owner, repo, workflowId);
                }
            }
        });
    }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    .build-agent {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 16px;
        gap: 16px;
        overflow-y: auto;
    }

    .build-agent-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .connection-status {
        display: flex;
        gap: 16px;
    }

    .github-status {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .build-agent-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .workflow-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .workflow-info h4 {
        margin: 0 0 8px 0;
    }

    .workflow-path {
        color: var(--text-secondary);
        font-size: 12px;
        margin: 0;
    }

    .workflow-state {
        color: var(--text-secondary);
        font-size: 12px;
        margin: 4px 0 0 0;
    }

    .run-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .run-info {
        flex: 1;
    }

    .run-status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .status-badge {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }

    .status-badge.completed {
        background-color: var(--success-color);
    }

    .status-badge.in_progress {
        background-color: var(--warning-color);
    }

    .status-badge.queued {
        background-color: var(--info-color);
    }

    .status-badge.failed {
        background-color: var(--error-color);
    }

    .run-details {
        color: var(--text-secondary);
        font-size: 12px;
    }

    .run-details p {
        margin: 4px 0;
    }

    .run-actions {
        margin-left: 16px;
    }
`;
document.head.appendChild(style); 