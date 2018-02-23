'use babel';

import path from 'path';
import fs from 'fs';

export default {

    path: path.sep,
    commands: null,

    config: {
        scriptsFilePath: {
            type: 'string',
            default: path.sep,
            description: 'The path **for the directory** where you place the scripts file (relative to the project root path `' + path.sep + '`).'
        }
    },

    getProjectRootForEditor(editor){
        var r = false;
        for(let p of atom.project.getPaths())
            if(editor.getPath().indexOf(p) >= 0)
                r = p;
        return r;
    },

    activate(state){

        // Read and observe config custom scripts path.
        this.path = atom.config.get('atom-scripts.scriptsFilePath') || path.sep;
        atom.config.observe('atom-scripts.scriptsFilePath', (value) => { this.path = value || path.sep; });

        // Subscribe to atom change editor for updating scirpts available.
        atom.workspace.observeActiveTextEditor( (editor) => {

            // Ignore if editor is odd.
            if(!editor)
                return;

            // Remove previously added commands.
            if(this.commands)
                this.commands.dispose();

            // Remove previously added hotkeys.
            atom.keymaps.add('atom-scripts', {});
            atom.keymaps.removeBindingsFromSource('atom-scripts');

            // Get scripts dynamic location for current file.
            var project = this.getProjectRootForEditor(editor) || process.cwd;
            var file = editor.getPath();
            var scriptsFilePath = project + this.path + 'scripts.js';

            // Read a possible scripts file.
            fs.readFile(scriptsFilePath, 'utf8', (error, data) => {

                // Ignore package if scripts not found.
                if(error)
                    return;

                // Loop trough scripts.
                var scripts = require(scriptsFilePath);
                var commands = {};
                var keymaps = {};
                var {exec} = require('child_process');
                for(let s of scripts){

                    // Apply regex to match script and file name/ext.
                    if(typeof s.match == 'string')
                        if(!path.basename(file).match(new RegExp(s.match)))
                            continue;

                    // Add pallete command.
                    commands['script:' + s.name] = s.script.bind(null, {
                        project: project,
                        file: file,
                        exec: exec,
                        atom: atom
                    });

                    // Add keymaps.
                    if(typeof s.hotkey == 'string')
                        keymaps[s.hotkey] = 'script:' + s.name;

    /* TODO: support TOOL-BAR package.
            title: 'Build',
            icon: 'octicon', */
                }

                // Effectivelly apply commands and keymaps to atom.
                this.commands = atom.commands.add('atom-text-editor', commands);
                atom.keymaps.add('atom-scripts', { 'atom-text-editor': keymaps });
            });

        } );
    },

    deactivate(){

        // Remove previously added commands.
        if(this.commands)
            this.commands.dispose();

        // Remove previously added hotkeys.
        atom.keymaps.add('atom-scripts', {});
        atom.keymaps.removeBindingsFromSource('atom-scripts');
    },

    serialize(){
        return {};
    }
};
