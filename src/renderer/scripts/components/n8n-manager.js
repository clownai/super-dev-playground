import notifications from '../notifications.js';

export default class N8nManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'n8n-manager';
        this.selectedInstance = null;
        this.selectedWorkflow = null;
        this.render();
        this.setupEventListeners();
        this.loadInstances();
    }

    render() {
        this.container.innerHTML = `
            <div class="n8n-manager-header">
                <h2>n8n Manager</h2>
                <div class="instance-actions">
                    <button class="button" id="addInstanceBtn">Add Instance</button>
                </div>
            </div>
            <div class="n8n-manager-content">
                <div class="instances-section">
                    <h3>n8n Instances</h3>
                    <div class="instances-list" id="instancesList"></div>
                </div>
                <div class="workflows-section" style="display: none;">
                    <h3>Workflows</h3>
                    <div class="workflow-list" id="workflowList"></div>
                </div>
                <div class="executions-section" style="display: none;">
                    <h3>Recent Executions</h3>
                    <div class="execution-list" id="executionList"></div>
                </div>
            </div>

            <!-- Add Instance Modal -->
            <div class="modal" id="addInstanceModal" style="display: none;">
                <div class="modal-content">
                    <h3>Add n8n Instance</h3>
                    <form id="addInstanceForm">
                        <div class="form-group">
                            <label for="instanceName">Name:</label>
                            <input type="text" id="instanceName" required>
                        </div>
                        <div class="form-group">
                            <label for="instanceUrl">URL:</label>
                            <input type="url" id="instanceUrl" required placeholder="https://n8n.example.com">
                        </div>
                        <div class="form-group">
                            <label for="apiKey">API Key:</label>
                            <input type="password" id="apiKey" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="button secondary" id="cancelAddInstance">Cancel</button>
                            <button type="submit" class="button">Add Instance</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Workflow Input Modal -->
            <div class="modal" id="workflowInputModal" style="display: none;">
                <div class="modal-content">
                    <h3>Workflow Input Parameters</h3>
                    <form id="workflowInputForm">
                        <div id="workflowInputFields"></div>
                        <div class="form-actions">
                            <button type="button" class="button secondary" id="cancelWorkflowInput">Cancel</button>
                            <button type="submit" class="button">Run Workflow</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async loadInstances() {
        try {
            const instances = await window.n8n.listInstances();
            const instancesList = this.container.querySelector('#instancesList');
            instancesList.innerHTML = '';

            instances.forEach(instance => {
                const instanceCard = document.createElement('div');
                instanceCard.className = 'instance-card';
                instanceCard.dataset.instanceId = instance.id;
                instanceCard.innerHTML = `
                    <div class="instance-info">
                        <h4>${instance.name}</h4>
                        <p class="instance-url">${instance.url}</p>
                        <p class="instance-created">Added: ${new Date(instance.createdAt).toLocaleString()}</p>
                    </div>
                    <div class="instance-actions">
                        <button class="button test-connection" data-instance-id="${instance.id}">Test Connection</button>
                        <button class="button secondary remove-instance" data-instance-id="${instance.id}">Remove</button>
                    </div>
                `;
                instancesList.appendChild(instanceCard);
            });
        } catch (error) {
            console.error('Failed to load n8n instances:', error);
            notifications.error('Failed to load n8n instances: ' + error.message);
        }
    }

    async loadWorkflows(instanceId) {
        try {
            const workflows = await window.n8n.listWorkflows(instanceId);
            const workflowList = this.container.querySelector('#workflowList');
            workflowList.innerHTML = '';

            workflows.forEach(workflow => {
                const workflowCard = document.createElement('div');
                workflowCard.className = `workflow-card ${workflow.active ? 'active' : 'inactive'}`;
                workflowCard.dataset.workflowId = workflow.id;
                workflowCard.innerHTML = `
                    <div class="workflow-info">
                        <h4>${workflow.name}</h4>
                        <p class="workflow-status">Status: ${workflow.active ? 'Active' : 'Inactive'}</p>
                        <p class="workflow-updated">Updated: ${new Date(workflow.updatedAt).toLocaleString()}</p>
                        ${workflow.tags.length ? `
                            <div class="workflow-tags">
                                ${workflow.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="workflow-actions">
                        <button class="button run-workflow" data-workflow-id="${workflow.id}">Run</button>
                        <button class="button secondary view-executions" data-workflow-id="${workflow.id}">View Executions</button>
                    </div>
                `;
                workflowList.appendChild(workflowCard);
            });

            this.container.querySelector('.workflows-section').style.display = 'block';
        } catch (error) {
            console.error('Failed to load workflows:', error);
            notifications.error('Failed to load workflows: ' + error.message);
        }
    }

    async loadExecutions(instanceId, workflowId) {
        try {
            const executions = await window.n8n.getExecutions(instanceId, workflowId);
            const executionList = this.container.querySelector('#executionList');
            executionList.innerHTML = '';

            executions.forEach(execution => {
                const executionCard = document.createElement('div');
                executionCard.className = `execution-card ${execution.status}`;
                executionCard.innerHTML = `
                    <div class="execution-info">
                        <div class="execution-status">
                            <span class="status-badge ${execution.status}"></span>
                            ${execution.status}
                        </div>
                        <div class="execution-details">
                            <p>Mode: ${execution.mode}</p>
                            <p>Started: ${new Date(execution.startedAt).toLocaleString()}</p>
                            ${execution.stoppedAt ? `<p>Finished: ${new Date(execution.stoppedAt).toLocaleString()}</p>` : ''}
                        </div>
                    </div>
                    <div class="execution-data">
                        <pre>${JSON.stringify(execution.data, null, 2)}</pre>
                    </div>
                `;
                executionList.appendChild(executionCard);
            });

            this.container.querySelector('.executions-section').style.display = 'block';
        } catch (error) {
            console.error('Failed to load executions:', error);
            notifications.error('Failed to load executions: ' + error.message);
        }
    }

    async showWorkflowInputModal(instanceId, workflowId) {
        try {
            const workflow = await window.n8n.getWorkflow(instanceId, workflowId);
            const modal = this.container.querySelector('#workflowInputModal');
            const inputFields = this.container.querySelector('#workflowInputFields');
            inputFields.innerHTML = '';

            if (workflow.parameters?.properties) {
                Object.entries(workflow.parameters.properties).forEach(([key, value]) => {
                    const field = document.createElement('div');
                    field.className = 'form-group';
                    field.innerHTML = `
                        <label for="param_${key}">${key}:</label>
                        <input type="${value.type === 'number' ? 'number' : 'text'}" 
                               id="param_${key}" 
                               name="${key}"
                               ${value.required ? 'required' : ''}
                               placeholder="${value.description || ''}">
                    `;
                    inputFields.appendChild(field);
                });
            } else {
                inputFields.innerHTML = '<p>No input parameters required</p>';
            }

            modal.style.display = 'block';
            this.selectedWorkflow = { instanceId, workflowId };
        } catch (error) {
            console.error('Failed to get workflow details:', error);
            notifications.error('Failed to get workflow details: ' + error.message);
        }
    }

    setupEventListeners() {
        // Add instance button
        this.container.querySelector('#addInstanceBtn').addEventListener('click', () => {
            this.container.querySelector('#addInstanceModal').style.display = 'block';
        });

        // Add instance form
        this.container.querySelector('#addInstanceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = this.container.querySelector('#instanceName').value;
            const url = this.container.querySelector('#instanceUrl').value;
            const apiKey = this.container.querySelector('#apiKey').value;

            try {
                const instance = await window.n8n.addInstance({ name, url });
                await window.n8n.saveApiKey(instance.id, apiKey);
                const testResult = await window.n8n.testConnection(instance.id);
                
                if (testResult.success) {
                    notifications.success('n8n instance added successfully');
                    this.container.querySelector('#addInstanceModal').style.display = 'none';
                    this.loadInstances();
                } else {
                    throw new Error(testResult.error);
                }
            } catch (error) {
                console.error('Failed to add n8n instance:', error);
                notifications.error('Failed to add n8n instance: ' + error.message);
            }
        });

        // Cancel add instance
        this.container.querySelector('#cancelAddInstance').addEventListener('click', () => {
            this.container.querySelector('#addInstanceModal').style.display = 'none';
        });

        // Instance list actions
        this.container.querySelector('#instancesList').addEventListener('click', async (e) => {
            const instanceId = e.target.dataset.instanceId;
            if (!instanceId) return;

            if (e.target.classList.contains('test-connection')) {
                try {
                    const result = await window.n8n.testConnection(instanceId);
                    if (result.success) {
                        notifications.success('Connection successful');
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    notifications.error('Connection failed: ' + error.message);
                }
            } else if (e.target.classList.contains('remove-instance')) {
                if (confirm('Are you sure you want to remove this instance?')) {
                    try {
                        await window.n8n.removeInstance(instanceId);
                        notifications.success('Instance removed successfully');
                        this.loadInstances();
                    } catch (error) {
                        notifications.error('Failed to remove instance: ' + error.message);
                    }
                }
            } else if (e.target.closest('.instance-card')) {
                this.selectedInstance = instanceId;
                this.loadWorkflows(instanceId);
            }
        });

        // Workflow list actions
        this.container.querySelector('#workflowList').addEventListener('click', async (e) => {
            const workflowId = e.target.dataset.workflowId;
            if (!workflowId) return;

            if (e.target.classList.contains('run-workflow')) {
                this.showWorkflowInputModal(this.selectedInstance, workflowId);
            } else if (e.target.classList.contains('view-executions')) {
                this.loadExecutions(this.selectedInstance, workflowId);
            }
        });

        // Workflow input form
        this.container.querySelector('#workflowInputForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = Object.fromEntries(formData.entries());

            try {
                await window.n8n.triggerWorkflow(
                    this.selectedWorkflow.instanceId,
                    this.selectedWorkflow.workflowId,
                    payload
                );
                notifications.success('Workflow triggered successfully');
                this.container.querySelector('#workflowInputModal').style.display = 'none';
                
                // Reload executions after a short delay
                setTimeout(() => {
                    this.loadExecutions(
                        this.selectedWorkflow.instanceId,
                        this.selectedWorkflow.workflowId
                    );
                }, 1000);
            } catch (error) {
                notifications.error('Failed to trigger workflow: ' + error.message);
            }
        });

        // Cancel workflow input
        this.container.querySelector('#cancelWorkflowInput').addEventListener('click', () => {
            this.container.querySelector('#workflowInputModal').style.display = 'none';
        });
    }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    .n8n-manager {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 16px;
        gap: 16px;
        overflow-y: auto;
    }

    .n8n-manager-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .n8n-manager-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .instance-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: border-color 0.2s;
    }

    .instance-card:hover {
        border-color: var(--accent-color);
    }

    .instance-info h4 {
        margin: 0 0 8px 0;
    }

    .instance-url {
        color: var(--text-secondary);
        font-size: 12px;
        margin: 0;
    }

    .instance-created {
        color: var(--text-secondary);
        font-size: 12px;
        margin: 4px 0 0 0;
    }

    .instance-actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
    }

    .workflow-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 8px;
    }

    .workflow-card.active {
        border-left: 4px solid var(--success-color);
    }

    .workflow-card.inactive {
        border-left: 4px solid var(--warning-color);
    }

    .workflow-info h4 {
        margin: 0 0 8px 0;
    }

    .workflow-status {
        color: var(--text-secondary);
        font-size: 12px;
        margin: 0;
    }

    .workflow-updated {
        color: var(--text-secondary);
        font-size: 12px;
        margin: 4px 0 0 0;
    }

    .workflow-tags {
        margin-top: 8px;
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
    }

    .tag {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
    }

    .workflow-actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
    }

    .execution-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 8px;
    }

    .execution-status {
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

    .status-badge.success {
        background-color: var(--success-color);
    }

    .status-badge.error {
        background-color: var(--error-color);
    }

    .status-badge.running {
        background-color: var(--warning-color);
    }

    .execution-details {
        color: var(--text-secondary);
        font-size: 12px;
    }

    .execution-details p {
        margin: 4px 0;
    }

    .execution-data {
        margin-top: 12px;
        background: var(--bg-tertiary);
        padding: 8px;
        border-radius: 4px;
        overflow-x: auto;
    }

    .execution-data pre {
        margin: 0;
        font-size: 12px;
        white-space: pre-wrap;
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: var(--bg-primary);
        padding: 24px;
        border-radius: 4px;
        width: 100%;
        max-width: 500px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 4px;
    }

    .form-group input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
    }
`;
document.head.appendChild(style); 