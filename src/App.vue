<script setup>
import { ref, watch, provide, onMounted, computed } from 'vue';
import Tree from './components/Tree.vue';
import TreeTools from './components/TreeTools.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';
import { TNode, nodeEmitter } from './components/model/TNode';
import { addNode, deleteNodes, nodeByPath } from './components/model/nodeFunctions';
import { SNode } from './components/model/SNode';
import ButtonDefault from './components/ButtonDefault.vue';
import { useActiveElement, useKeyModifier, useMagicKeys, whenever } from '@vueuse/core';

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

async function openFolder() {
  const folderPath = await window.explorer.openFolder();
  if (folderPath)
    dir.value = folderPath;
}

const treeRef = ref(null);
const activeElement = useActiveElement();

const treeActive = computed(() => {
  const treeEl = treeRef.value?.$el;
  return treeEl ? treeEl.contains(activeElement.value) : false;
});

const selected = new SNode(true);

onMounted(() => {
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

  // hotkeys
  window.electronAPI.on('menu-select-all', () => {
    if (!(tree.value && treeActive.value)) return;

    const lastNode = selected.nodes.at(-1);
    if (lastNode)
      lastNode.siblings().forEach(c => selected.add(c)); // siblings select
    else
      tree.value.children.forEach(c => selected.add(c)); // top level select
    selected.last = null;
  });
  window.electronAPI.on('menu-delete', () => {
    if (!(tree.value && treeActive.value)) return;
    deleteNodes(selected.nodes);
  });
  window.electronAPI.on('menu-new-folder', () => {
    if (!(tree.value && treeActive.value && selected.nodes.at(-1))) return;
    addNode(selected.nodes.at(-1), 'New Folder', 'folder');
  });
});

const [ctrlPressed, shiftPressed] = ['Control', 'Shift'].map(k => useKeyModifier(k));
const { ctrl_a, Delete } = useMagicKeys();

whenever(ctrl_a, () => window.electronAPI.sendToMain('menu-select-all'));
whenever(Delete, () => window.electronAPI.sendToMain('menu-delete'));
</script>

<template>
  <main class="maingrid">
    <div class="tree-container">
      <TreeTools :source="tree" :selected="selected"/>
      <Tree v-if="tree" ref="treeRef" :source="tree" :selected="selected" :draggable="true" tabindex="0"/>
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

      <div class="tree-overlay">
        <transition name="kbd">
          <kbd v-if="treeActive && ctrlPressed">ctrl</kbd>
        </transition>
        <transition name="kbd">
          <kbd v-if="treeActive && shiftPressed">shift</kbd>
        </transition>
      </div>
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
</style>

<style scoped>
.tree-container {
  position: relative;
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

  color: var(--fg-dark);
  background-color: var(--secondary-dark);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 0.5rem);
  padding: 0.5rem 2rem;
  gap: 0.5rem;
}

.tree-overlay {
  position: absolute;
  bottom: 0.7rem;
  right: 0.7rem;

  display: flex;
  align-items: center;
  gap: 0.3rem;
  pointer-events: none;
  opacity: 0.8;
}
.tree-overlay kbd {
  box-shadow: var(--box-shadow-small);
}

.kbd-enter-from {
  opacity: 0;
  transform: translateY(-0.6em);
}

.kbd-leave-from,
.kbd-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.kbd-leave-to {
  opacity: 0;
  transform: translateY(1em);
}

.kbd-enter-active, .kbd-leave-active {
  transition: opacity 150ms, transform 150ms;
}
</style>
