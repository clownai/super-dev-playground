const { ipcMain } = require('electron');
const Store = require('electron-store');
const keytar = require('keytar');

const SERVICE_NAME = 'SuperDevPlayground';
const store = new Store({
    name: 'projects',
    defaults: {
        projects: [],
        lastActiveProject: null
    }
});

// Helper function to generate a secure key name for keytar
const getSecretKey = (projectId, key) => `${projectId}_${key}`;

// Initialize IPC handlers for project management
function initializeProjectHandlers() {
    // Project management
    ipcMain.handle('get-projects', () => {
        return store.get('projects', []);
    });

    ipcMain.handle('save-project', async (_event, project) => {
        const projects = store.get('projects', []);
        projects.push(project);
        store.set('projects', projects);
        return project;
    });

    ipcMain.handle('update-project', async (_event, project) => {
        const projects = store.get('projects', []);
        const index = projects.findIndex(p => p.id === project.id);
        if (index === -1) {
            throw new Error('Project not found');
        }
        projects[index] = project;
        store.set('projects', projects);
        return project;
    });

    ipcMain.handle('delete-project', async (_event, projectId) => {
        const projects = store.get('projects', []);
        const filteredProjects = projects.filter(p => p.id !== projectId);
        store.set('projects', filteredProjects);

        // Clean up any secrets associated with this project
        try {
            const credentials = await keytar.findCredentials(SERVICE_NAME);
            const projectSecrets = credentials.filter(cred => cred.account.startsWith(`${projectId}_`));
            await Promise.all(projectSecrets.map(secret => 
                keytar.deletePassword(SERVICE_NAME, secret.account)
            ));
        } catch (error) {
            console.error('Failed to clean up project secrets:', error);
            // Continue with project deletion even if secret cleanup fails
        }

        return projectId;
    });

    ipcMain.handle('get-last-active-project', () => {
        return store.get('lastActiveProject');
    });

    ipcMain.handle('set-last-active-project', (_event, projectId) => {
        store.set('lastActiveProject', projectId);
        return projectId;
    });

    // Secret management
    ipcMain.handle('save-secret', async (_event, projectId, key, value) => {
        const secretKey = getSecretKey(projectId, key);
        await keytar.setPassword(SERVICE_NAME, secretKey, value);
        return true;
    });

    ipcMain.handle('get-secret', async (_event, projectId, key) => {
        const secretKey = getSecretKey(projectId, key);
        return await keytar.getPassword(SERVICE_NAME, secretKey);
    });

    ipcMain.handle('delete-secret', async (_event, projectId, key) => {
        const secretKey = getSecretKey(projectId, key);
        await keytar.deletePassword(SERVICE_NAME, secretKey);
        return true;
    });
}

module.exports = {
    initializeProjectHandlers
}; 