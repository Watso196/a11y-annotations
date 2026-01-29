# A11y Annotations Figma Plugin

A Figma plugin for adding accessibility annotations (dev notes and issues) to your designs.

## Features

- Add predefined dev notes with suggestions for accessible implementations
- Add accessibility issue annotations
- Auto-numbered annotations for easy reference
- Searchable and filterable annotation lists

## Development Setup

### Prerequisites

- Download and install [Node.js](https://nodejs.org/en/download/) which includes NPM.
- To use the Plugin in development mode, you must have the Figma desktop app.

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Build Process

This plugin uses a build process to compile TypeScript and bundle HTML/CSS/JS separately.

### Build Commands

- Build once: `npm run build`
  - Compiles TypeScript (src/code.ts → dist/code.js)
  - Bundles UI files (src/ui.html, src/ui.js, src/ui.css → dist/ui.html)
- Watch mode (recommended for development): `npm run watch`
  - Automatically rebuilds when you save changes to any source files
  - Runs both TypeScript and UI watchers concurrently

If this is your first time running the project, or running a new branch, you should build once before kicking off a watch command.

### Project Structure
```
src/
  [code.ts](http://_vscodecontentref_/0)              # Plugin logic (runs in Figma context)
  [ui.html](http://_vscodecontentref_/1)              # UI template
  [ui.js](http://_vscodecontentref_/2)                # UI JavaScript (runs in browser context)
  ui.css               # UI styles
  [devNotesData.json](http://_vscodecontentref_/3)    # Predefined dev note annotations
  [issuesData.json](http://_vscodecontentref_/4)      # Predefined accessibility issues

dist/
  code.js              # Compiled plugin code (generated)
  [ui.html](http://_vscodecontentref_/5)              # Final bundled UI (generated)

[build-ui.cjs](http://_vscodecontentref_/6)           # Build script for bundling UI files
[manifest.json](http://_vscodecontentref_/7)          # Figma plugin manifest
```

### Managing Annotation Data

Edit the JSON files in the `src/` directory to add/update annotations:
- `src/devNotesData.json` - Add development suggestions
- `src/issuesData.json` - Add accessibility issues

The data is automatically bundled into the plugin when you build.

## Running the Plugin in Figma
1. Run `npm run watch` to start the build process
2. In Figma, go to Menu > Plugins > Development > Import plugin from manifest
3. Select the `manifest.json` file from this directory
4. The plugin will appear in your plugins list

Changes to source files will automatically rebuild - just reload the plugin in Figma to see updates.

