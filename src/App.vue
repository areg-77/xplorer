<script setup>
import { ref, watch, provide, onMounted, onBeforeUnmount } from 'vue';
import Tree from './components/Tree.vue';
import TreeTools from './components/TreeTools.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';
import { TNode, nodeByPath, nodeEmitter } from './components/model/TNode';
import { SNode } from './components/model/SNode';
import ButtonDefault from './components/ButtonDefault.vue';

const isDev = window?.env?.isDev ?? false;
provide('isDev', isDev);

const dir = ref('');
const tree = ref(null);

async function toTNode(node, parent = null) {
  const tnode = TNode(node.label, node.type);
  tnode.parent = parent;

  if (node.children && node.children.length > 0) {
    for (const child of node.children)
      await toTNode(child, tnode);
  }

  return tnode;
}

async function loadTree(directory) {
  const rawTree = await window.explorer.readFolder(directory);
  const newTree = await toTNode(rawTree);
  tree.value = newTree;
  tree.value.path = directory;
}

const ctrlCmdPressed = ref(false);
const shiftPressed = ref(false);

provide('ctrlCmdPressed', ctrlCmdPressed);
provide('shiftPressed', shiftPressed);

const selected = new SNode(ctrlCmdPressed, shiftPressed);

// ctrl/cmd and shift tracking
function handleKeyHold(e) {
  ctrlCmdPressed.value = e.ctrlKey || e.metaKey;
  shiftPressed.value = e.shiftKey;
}

onMounted(() => {
  window.nodeByPath = nodeByPath;
  window.selected = selected;

  window.electronAPI.on('open-folder', async () => openFolder());

  window.watcher?.on('add', (path, type) => {
    // console.log(`add: ${path} [${type}]`);
    const node = TNode(window.explorer.basename(path), type);
    const parent = nodeByPath(window.explorer.dirname(path), tree.value);
    if (node && parent) node.parent = parent;
  });
  window.watcher?.on('delete', (path) => {
    // console.log(`delete: ${path}`);
    const node = nodeByPath(path, tree.value);
    if (node) node.parent = null;
  });
  window.watcher?.on('rename', (oldPath, newPath) => {
    // console.log(`rename: ${oldPath} -> ${newPath}`);
    const node = nodeByPath(oldPath, tree.value);
    if (node) node.label = window.explorer.basename(newPath);
  });
  window.watcher?.on('move', (oldPath, newPath) => {
    // console.log(`move: ${oldPath} -> ${newPath}`);
    const node = nodeByPath(oldPath, tree.value);
    const newParent = nodeByPath(window.explorer.dirname(newPath), tree.value);
    if (node && newParent) node.parent = newParent;
  });

  watch(dir, async (newDir, oldDir) => {
    if (!newDir) return;
    await loadTree(newDir);

    // stop bug found
    if (oldDir)
      window.watcher.stop();
    window.watcher.start(newDir);
  }, { immediate: true });

  // version index switch
  nodeEmitter.on('version-index-changed', ({ node, oldIndex, newIndex }) => {
    const containerNode = node.version.node.value;

    const oldNode = containerNode.version.children[oldIndex];
    const newNode = containerNode.version.children[newIndex];

    // temp area
    selected.remove(oldNode);
    selected.add(newNode);

    const oldDir = window.explorer.dirname(oldNode.path);
    const newDir = window.explorer.dirname(newNode.path);

    window.explorer.rename(oldNode.path, newDir + '/' + oldNode.label);
    window.explorer.rename(newNode.path, oldDir + '/' + newNode.label);
  });
  
  window.addEventListener('keydown', handleKeyHold);
  window.addEventListener('keyup', handleKeyHold);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyHold);
  window.removeEventListener('keyup', handleKeyHold);
});

async function openFolder() {
  const folderPath = await window.explorer.openFolder();
  if (folderPath)
    dir.value = folderPath;
}
</script>

<template>
  <main class="maingrid">
    <div class="tree-container">
      <TreeTools :source="tree" :selected="selected"/>
      <Tree v-if="tree" :source="tree" :selected="selected" :draggable="true"/>
      <Tree v-else>
        <div v-if="!dir" class="tree-control-box">
          You haven't opened a folder yet.
          <ButtonDefault class="version" @click="openFolder">
            <span class="icon ui open-folder"></span>
            Open Folder
          </ButtonDefault>
        </div>
        <div v-else class="tree-control-box">
          <span class="icon ui loading" style="height: 4rem;"></span>
          Loading...
        </div>
      </Tree>
    </div>
    <TreeData :selected="selected"/>
  </main>
  <BottomPanel :selected="selected"/>
</template>

<style>
#app, .maingrid {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  box-sizing: border-box;
}

#app {
  display: flex;
  flex-direction: column;
}

.maingrid {
  display: grid;
  padding: 1rem;
  grid-template-columns: 55fr 45fr;
  gap: 0.5rem;
}

.tree-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 0.5rem;
}

.tree-control-box {
  font-size: 14px;
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -35%);
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  background-color: var(--secondary-dark);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 0.5rem);
  padding: 0.5rem 2rem;
  gap: 0.5rem;
}
</style>
