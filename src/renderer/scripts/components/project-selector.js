import projectManager from '../project-manager.js';
import { showModal } from '../modal.js';
import notifications from '../notifications.js';

export default class ProjectSelector {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'project-selector';
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="project-selector-header">
                <select class="select" id="projectSelect">
                    <option value="">Select Project</option>
                </select>
                <button class="button" id="newProjectBtn">New Project</button>
            </div>
        `;

        this.updateProjectList();
    }

    updateProjectList() {
        const select = this.container.querySelector('#projectSelect');
        const currentValue = select.value;
        
        // Clear existing options except the placeholder
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add project options
        projectManager.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });

        // Restore selection
        if (currentValue) {
            select.value = currentValue;
        } else if (projectManager.currentProject) {
            select.value = projectManager.currentProject.id;
        }
    }

    setupEventListeners() {
        // Project selection change
        const select = this.container.querySelector('#projectSelect');
        select.addEventListener('change', async (e) => {
            const projectId = e.target.value;
            if (projectId) {
                try {
                    await projectManager.setActiveProject(projectId);
                    notifications.success(`Switched to project: ${projectManager.currentProject.name}`);
                } catch (error) {
                    notifications.error('Failed to switch project: ' + error.message);
                    this.updateProjectList(); // Reset selection
                }
            }
        });

        // New project button
        const newProjectBtn = this.container.querySelector('#newProjectBtn');
        newProjectBtn.addEventListener('click', () => {
            this.showNewProjectModal();
        });

        // Listen for project manager events
        projectManager.on('projectCreated', () => this.updateProjectList());
        projectManager.on('projectUpdated', () => this.updateProjectList());
        projectManager.on('projectDeleted', () => this.updateProjectList());
    }

    showNewProjectModal() {
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <h2>Create New Project</h2>
            <form id="newProjectForm">
                <div class="form-group">
                    <label for="projectName">Project Name</label>
                    <input type="text" id="projectName" class="input" required>
                </div>
                <div class="form-group">
                    <label for="projectDescription">Description</label>
                    <textarea id="projectDescription" class="input" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="button secondary" data-close-modal>Cancel</button>
                    <button type="submit" class="button">Create Project</button>
                </div>
            </form>
        `;

        const form = modalContent.querySelector('#newProjectForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = modalContent.querySelector('#projectName').value.trim();
            const description = modalContent.querySelector('#projectDescription').value.trim();

            try {
                const project = await projectManager.createProject(name, description);
                await projectManager.setActiveProject(project.id);
                notifications.success(`Project "${name}" created successfully`);
                showModal(null); // Close modal
            } catch (error) {
                notifications.error('Failed to create project: ' + error.message);
            }
        });

        showModal(modalContent);
        modalContent.querySelector('#projectName').focus();
    }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    .project-selector {
        padding: 8px;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
    }

    .project-selector-header {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .project-selector select {
        flex: 1;
    }

    /* Form styles */
    .form-group {
        margin-bottom: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 4px;
        color: var(--text-secondary);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
    }
`;
document.head.appendChild(style); 