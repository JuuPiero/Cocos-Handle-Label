import { join } from 'path';

export const methods: { [name: string]: (...args: any[]) => any } = {
    /** Extension > Scene Handles > Show / Hide Labels */
    async toggleLabels() {
        try {
            await Editor.Message.request('scene', 'execute-scene-script', { name: 'scene-handles', method: 'toggle', args: [] });
        } catch (e) {
            console.warn('[SceneHandles] No scene is open:', e);
        }
    },

    /** Extension > Scene Handles > Open README */
    async openDocs() {
        try {
            const { shell } = require('electron');
            await shell.openPath(join(__dirname, '..', 'README.md'));
        } catch (e) {
            console.error('[SceneHandles] Could not open the README:', e);
        }
    },
};

export function load() {}

export function unload() {}
