// This file holds the main code for the A11y Annotations Figma plugin.
// Code here has access to the Figma document via the figma global object.

import devNotesData from './devNotesData.json';

figma.showUI(__html__, {
  width: 460,
  height: 720
});

// ---- Component library keys ----
const DEV_NOTE_COMPONENT_KEY        = "200d37cc7ee0b135ad3000ab68524a3e7c3e40c5";
const DEV_NOTE_NUMBER_COMPONENT_KEY = "6e8f44f95a8a73341396811e6c5e7c91932df4c5";
const BADGE_COMPONENT_KEY           = "b46358d4ef5d1ddde24e0b33df6bfce8e259b653";

// ---- Node-finding helpers ----
function findNodeByName(node: SceneNode, name: string): SceneNode | null {
  if (node.name === name) return node;
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
  if (!bodyNode) return null;
  // The "body" node may itself be the TextNode
  if (bodyNode.type === "TEXT") return bodyNode as TextNode;
  if ("children" in bodyNode) {
    return bodyNode.children.find(
      (child): child is TextNode => child.type === "TEXT"
    ) ?? null;
  }
  return null;
}

function findFirstTextNode(node: BaseNode): TextNode | null {
  if (node.type === "TEXT") return node as TextNode;
  if ("children" in node) {
    for (const child of node.children) {
      const found = findFirstTextNode(child);
      if (found) return found;
    }
  }
  return null;
}

async function setTextByName(
  parent: InstanceNode,
  name: string,
  value: string
): Promise<boolean> {
  const node = parent.findOne(
    n => n.type === "TEXT" && n.name === name
  );
  if (node?.type !== "TEXT") return false;
  const textNode = node as TextNode;
  await figma.loadFontAsync(textNode.fontName as FontName);
  textNode.characters = value;
  return true;
}

// ---- Send data to the UI on load ----
figma.ui.postMessage({
  type: 'loadData',
  devNotes:    devNotesData.devNotes,
  appDevNotes: devNotesData.appDevNotes,
});

// ---- Find the enclosing frame or section for a given node ----
function findEnclosingContainer(node: SceneNode): FrameNode | SectionNode | null {
  let current: BaseNode | null = node;
  while (current) {
    if ((current.type === "FRAME" || current.type === "SECTION") && current.parent?.type === "PAGE") {
      return current as FrameNode | SectionNode;
    }
    current = current.parent;
  }
  return null;
}

// ---- Handle messages from the UI ----
figma.ui.onmessage = async (msg: {
  type: string;
  text?: string;
  source?: 'web' | 'app';
}) => {
  if (msg.type === "approveDesign") return handleApproveDesign();
  if (msg.type === "devNote")       return handleDevNote(msg.text ?? '', msg.source ?? 'web');
};

// ---- Approve Design ----
async function handleApproveDesign() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify("Please select a frame or a layer within a frame.");
    return;
  }

  const selectedNode = selection[0];
  const isTopLevelContainer = (selectedNode.type === "FRAME" || selectedNode.type === "SECTION")
    && selectedNode.parent?.type === "PAGE";
  const targetContainer = isTopLevelContainer
    ? selectedNode as FrameNode | SectionNode
    : findEnclosingContainer(selectedNode);

  if (!targetContainer) {
    figma.notify("Could not find a top-level frame or section. Please select one or a layer inside one.");
    return;
  }

  const badgeComponent = await figma.importComponentByKeyAsync(BADGE_COMPONENT_KEY);
  const badge = badgeComponent.createInstance();

  badge.x = 20;
  badge.y = 20;
  targetContainer.appendChild(badge);

  await setTextByName(badge, "Status", "Approved");

  const today = new Date();
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  await setTextByName(badge, "date", dateStr);

  const userName = figma.currentUser?.name ?? "Unknown";
  await setTextByName(badge, "stakeholder", `Accessibility: ${userName}`);

  badge.setPluginData("approvalBadge", "true");
  badge.setPluginData("approvedBy", userName);

  figma.notify("Design approved ✅");
}

// ---- Dev Note ----
async function handleDevNote(devNoteText: string, source: 'web' | 'app') {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify("Please select a layer to attach the annotation to.");
    return;
  }

  const selectedNode = selection[0];

  const [component, componentNumber] = await Promise.all([
    figma.importComponentByKeyAsync(DEV_NOTE_COMPONENT_KEY),
    figma.importComponentByKeyAsync(DEV_NOTE_NUMBER_COMPONENT_KEY),
  ]);

  const instance       = component.createInstance();
  const instanceNumber = componentNumber.createInstance();

  const existingDevNoteNumbers = figma.currentPage.findAll(
    node => node.getPluginData("devNoteNumber") !== ""
  );
  const nextDevNoteNumber = existingDevNoteNumbers.length + 1;

  const absBounds = selectedNode.absoluteBoundingBox;
  if (!absBounds) {
    figma.notify("Cannot determine the position of the selected layer.");
    return;
  }

  // Set number badge on the selected node (always placed on the page)
  const textNodeNumber = findFirstTextNode(instanceNumber);
  if (textNodeNumber) {
    await figma.loadFontAsync(textNodeNumber.fontName as FontName);
    textNodeNumber.characters = `${nextDevNoteNumber}`;
  }
  instanceNumber.setPluginData("devNoteNumber", `${nextDevNoteNumber}`);
  instanceNumber.x = absBounds.x;
  instanceNumber.y = absBounds.y;
  figma.currentPage.appendChild(instanceNumber);

  // Position annotation callout beside the selected node
  const parent = selectedNode.parent;
  if (parent && parent.type !== "PAGE") {
    const parentBounds = (parent as SceneNode).absoluteBoundingBox;
    if (parentBounds) {
      instance.x = absBounds.x - parentBounds.x + absBounds.width + 20;
      instance.y = absBounds.y - parentBounds.y;
    } else {
      instance.x = selectedNode.x + selectedNode.width + 20;
      instance.y = selectedNode.y;
    }
    parent.appendChild(instance);
  } else {
    instance.x = absBounds.x + absBounds.width + 20;
    instance.y = absBounds.y;
    figma.currentPage.appendChild(instance);
  }

  // Populate the body text
  const label = source === 'app' ? 'App Note' : 'Dev Note';
  const textNode = findBodyTextNode(instance);
  if (textNode) {
    await figma.loadFontAsync(textNode.fontName as FontName);
    textNode.characters = `${label}: ${devNoteText}`;
  } else {
    figma.notify("Could not find body text layer in Dev Note component.");
  }

  // Populate the number inside the callout
  const numberTextNode = findFirstTextNode(instance);
  if (numberTextNode) {
    await figma.loadFontAsync(numberTextNode.fontName as FontName);
    numberTextNode.characters = `${nextDevNoteNumber}`;
  }

  // Store metadata
  instance.setPluginData("devNoteText",   devNoteText);
  instance.setPluginData("devNoteSource", source);

  figma.notify(`${label} added ✨`);

  const field = source === 'app' ? 'app-note' : 'dev-note';
  figma.ui.postMessage({ type: "clearTextField", field });
}