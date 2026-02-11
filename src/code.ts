// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

import devNotesData from './devNotesData.json';

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
  width: 420,
  height: 600
});

const DEV_NOTE_COMPONENT_KEY =
  "200d37cc7ee0b135ad3000ab68524a3e7c3e40c5";

const DEV_NOTE_NUMBER_COMPONENT_KEY =
  "6e8f44f95a8a73341396811e6c5e7c91932df4c5";

function findNodeByName(
  node: SceneNode,
  name: string
): SceneNode | null {
  if (node.name === name) {
    return node;
  }

  if ("children" in node) {
    for (const child of node.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }

  return null;
}

function findBodyTextNode(instance: InstanceNode): TextNode | null {
  const bodyNode = findNodeByName(instance, "body");

  if (!bodyNode || !("children" in bodyNode)) return null;

  return bodyNode.children.find(
    (child): child is TextNode => child.type === "TEXT"
  ) ?? null;
}

function findFirstTextNode(node: BaseNode): TextNode | null {
  if (node.type === "TEXT") {
    return node as TextNode;
  }

  if ("children" in node) {
    for (const child of node.children) {
      const found = findFirstTextNode(child);
      if (found) return found;
    }
  }

  return null;
}

// Send data to UI when it loads
figma.ui.postMessage({ 
  type: 'loadData', 
  devNotes: devNotesData.devNotes
}); 

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg: { type: string; text: string }) => {
  if (msg.type !== "devNote") return;

  const devNoteText = msg.text;

  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify("Please select a node to attach the Dev Note to.");
    return;
  }

  const selectedNode = selection[0];

  // 1️⃣ Import the helper-library component
  const component = await figma.importComponentByKeyAsync(
    DEV_NOTE_COMPONENT_KEY
  );

  const componentNumber = await figma.importComponentByKeyAsync(
    DEV_NOTE_NUMBER_COMPONENT_KEY
  );

  // 2️⃣ Create an instance
  const instance = component.createInstance();
  const instanceNumber = componentNumber.createInstance();

  const existingDevNoteNumbers = figma.currentPage.findAll(node => {
    const devNoteNumber = node.getPluginData("devNoteNumber");
    return devNoteNumber !== "";
  });

  const nextDevNoteNumber = existingDevNoteNumbers.length + 1;
  const textNodeNumber = findFirstTextNode(instanceNumber);
  if (textNodeNumber) {
    await figma.loadFontAsync(textNodeNumber.fontName as FontName);
    textNodeNumber.characters = `${nextDevNoteNumber}`;
  }
  instanceNumber.setPluginData("devNoteNumber", `${nextDevNoteNumber}`);
  instanceNumber.x = selectedNode.x;
  instanceNumber.y = selectedNode.y;
  figma.currentPage.appendChild(instanceNumber);

  // 3️⃣ Position it near the selected node
  instance.x = selectedNode.x + selectedNode.width + 20;
  instance.y = selectedNode.y;

  if ("children" in selectedNode) {
    selectedNode.appendChild(instance);
  } else {
    figma.currentPage.appendChild(instance);
  }

  // 4️⃣ Find the text node inside the instance
  const textNode = findBodyTextNode(instance);

  if (!textNode) {
    figma.notify("Could not find body text layer in Dev Note.");
    return;
  }

  await figma.loadFontAsync(textNode.fontName as FontName);
  textNode.characters = `Dev Note: ${devNoteText}`;

  await figma.loadFontAsync(textNode.fontName as FontName);

  // 5️⃣ Find and update the number text inside the dev note component
  const numberTextNode = findFirstTextNode(instance);
  if (numberTextNode) {
    await figma.loadFontAsync(numberTextNode.fontName as FontName);
    numberTextNode.characters = `${nextDevNoteNumber}`;
  }

  // Optional: store metadata
  instance.setPluginData("devNoteText", devNoteText);
  figma.notify("Dev Note added ✨");

  // Set the text field to be empty
  figma.ui.postMessage({ type: "clearTextField", field: "dev-note" });
};

