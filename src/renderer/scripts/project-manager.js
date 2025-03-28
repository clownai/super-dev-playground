// Project Manager for handling projects and secrets
class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.projects = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Load projects from electron-store via IPC
            this.projects = await window.api.getProjects();
            
            // Load last active project if any
            const lastProjectId = await window.api.getLastActiveProject();
            if (lastProjectId) {
                this.currentProject = this.projects.find(p => p.id === lastProjectId);
            }

            this.initialized = true;
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize ProjectManager:', error);
            throw error;
        }
    }

    async createProject(name, description = '') {
        const project = {
            id: crypto.randomUUID(),
            name,
            description,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            urls: [],
            headers: {}
        };

        try {
            await window.api.saveProject(project);
            this.projects.push(project);
            this.emit('projectCreated', project);
            return project;
        } catch (error) {
            console.error('Failed to create project:', error);
            throw error;
        }
    }

    async updateProject(projectId, updates) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const updatedProject = {
            ...project,
            ...updates,
            modified: new Date().toISOString()
        };

        try {
            await window.api.updateProject(updatedProject);
            const index = this.projects.findIndex(p => p.id === projectId);
            this.projects[index] = updatedProject;
            this.emit('projectUpdated', updatedProject);
            return updatedProject;
        } catch (error) {
            console.error('Failed to update project:', error);
            throw error;
        }
    }

    async deleteProject(projectId) {
        try {
            await window.api.deleteProject(projectId);
            this.projects = this.projects.filter(p => p.id !== projectId);
            
            if (this.currentProject?.id === projectId) {
                this.currentProject = null;
                await window.api.setLastActiveProject(null);
            }
            
            this.emit('projectDeleted', projectId);
        } catch (error) {
            console.error('Failed to delete project:', error);
            throw error;
        }
    }

    async setActiveProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        try {
            await window.api.setLastActiveProject(projectId);
            this.currentProject = project;
            this.emit('activeProjectChanged', project);
        } catch (error) {
            console.error('Failed to set active project:', error);
            throw error;
        }
    }

    async saveSecret(projectId, key, value) {
        try {
            await window.api.saveSecret(projectId, key, value);
            this.emit('secretSaved', { projectId, key });
        } catch (error) {
            console.error('Failed to save secret:', error);
            throw error;
        }
    }

    async getSecret(projectId, key) {
        try {
            return await window.api.getSecret(projectId, key);
        } catch (error) {
            console.error('Failed to get secret:', error);
            throw error;
        }
    }

    async deleteSecret(projectId, key) {
        try {
            await window.api.deleteSecret(projectId, key);
            this.emit('secretDeleted', { projectId, key });
        } catch (error) {
            console.error('Failed to delete secret:', error);
            throw error;
        }
    }

    // Event handling
    #listeners = new Map();

    on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(callback);
    }

    off(event, callback) {
        const listeners = this.#listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    emit(event, data) {
        const listeners = this.#listeners.get(event);
        if (listeners) {
            for (const callback of listeners) {
                callback(data);
            }
        }
    }
}

// Create and export singleton instance
const projectManager = new ProjectManager();
export default projectManager; 