'use babel';

import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import exec from 'child_process';

const DEFAULT_FILEPATH = path.sep;
const DEFAULT_FILENAME = '.scripts.js';

export default {

  filepath: DEFAULT_FILEPATH,
  filename: DEFAULT_FILENAME,

  commands: null,

  config: {
    scriptsFilepath: {
      type: 'string',
      default: DEFAULT_FILEPATH,
      description: `The path **for the directory** where you place your scripts file (relative to the project root path '${this.filepath}').`
    },
    scriptsFilename: {
      type: 'string',
      default: DEFAULT_FILENAME,
      description: 'The *name* of the file where you keep your scripts'
    }
  },

  getProjectRootForEditor (project, editor) {
    var result = '';
    var editorPath = editor.getPath();
    var projectPaths = project.getPaths();

    for (let projectPath of project.getPaths()) {
      if (editorPath.indexOf(projectPath) >= 0) {
        result = projectPath;
        break;
      }
    }
    return result;
  },

  activate (state) {
    // Read and observe config custom scripts path.
    this.filepath = atom.config.get('atom-scripts.scriptsFilePath') || DEFAULT_FILEPATH;
    atom.config.observe('atom-scripts.scriptsFilePath', (value) => {
      this.filepath = value || DEFAULT_FILEPATH;
    });

    this.filename = atom.config.get('atom-scripts.scriptsFileName') || DEFAULT_FILENAME;
    atom.config.observe('atom-scripts.scriptsFileName', (value) => {
      this.filename = value || DEFAULT_FILENAME;
    });

    // Subscribe to atom change editor for updating scirpts available.
    atom.workspace.observeActiveTextEditor((editor) => {
      if (!editor) { // no editor? no way!
        return;
      }

      const project = _.get(atom, 'project');

      const currentFilePath = editor.getPath();

      if (this.commands) {
        this.commands.dispose();
      }

      // Remove previously added hotkeys.
      atom.keymaps.add('atom-scripts', {});
      atom.keymaps.removeBindingsFromSource('atom-scripts');

      // Get scripts dynamic location for current file.
      const projectRootPath = this.getProjectRootForEditor(project, editor) || process.cwd();
      const scriptsFilePath = `${projectRootPath}${this.filepath}${this.filename}`;

      // console.log(`scriptsFilePath: '${scriptsFilePath}'`);

      // Read a possible scripts file.
      fs.readFile(scriptsFilePath, 'utf8', (error, data) => {
        // Ignore package if scripts not found.
        if (error) {
          // console.log(`Scripts: no scripts found at '${scriptsFilePath}'`);
          return;
        }

        const scripts = require(scriptsFilePath);
        const commands = {};
        const keymaps = {};

        // Loop trough scripts.
        for (let s of scripts) {
          // Apply regex to match script and file name/ext.
          if (typeof s.match === 'string') {
            if (!path.basename(currentFilePath).match(new RegExp(s.match))) {
              continue;
            }

            // Add pallete command.
            commands['script:' + s.name] = s.script.bind(null, {
              atom: atom,
              editor: editor,
              notifications: atom.notifications,
              project: project,
              file: currentFilePath,
              exec: exec
            });

            // Add keymaps.
            if (typeof s.hotkey === 'string') {
              keymaps[s.hotkey] = 'script:' + s.name;
            }

            /* TODO: support TOOL-BAR package.
                  title: 'Build',
                  icon: 'octicon', */

            // Effectively apply commands and keymaps to atom.
            this.commands = atom.commands.add('atom-text-editor', commands);
            atom.keymaps.add('atom-scripts', { 'atom-text-editor': keymaps });
          } // typeof
        } // for
      }); // readFile
    }); // observeActiveTextEditor
  }, // activate

  /**
   * Removes active commands and keymaps
   * @return {[type]} [description]
   */
  deactivate () {
    if (this.commands) {
      this.commands.dispose();
    }
    atom.keymaps.add('atom-scripts', {});
    atom.keymaps.removeBindingsFromSource('atom-scripts');
  },

  serialize () {
    return {};
  }

}; // exports
