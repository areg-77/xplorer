<script setup>
import { ref, onMounted, inject, provide } from 'vue';
import { nodeById } from './model/TNode';
import TreeNode from './TreeNode.vue';
import { isSNode } from './model/SNode';

const { source: tree, selected, draggable } = defineProps({
  source: Object,
  selected: Object,
  draggable: Boolean
});

const [ctrlCmdPressed, shiftPressed] = [inject('ctrlCmdPressed'), inject('shiftPressed')];

provide('selected', selected);
provide('draggable', draggable);

const treeRef = ref(null);
onMounted(() => {
  if (!isSNode(selected)) return;

  // select sibilings when pressing ctrl+a
  window.electronAPI.on('menu-select-all', () => {
    if (document.activeElement === treeRef.value && selected.nodes.at(-1))
      selected.nodes.at(-1).parent.children.forEach(c => selected.add(c));
  });
});

function handleKeyDown(e) {
  if (!isSNode(selected)) return;

  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault();
    window.electronAPI.sendToMain('menu-select-all');
  }
}

let mousePos = { x: 0, y: 0 };
function handleMouseDown(e) {
  if (!draggable) return;

  if (!e.target.closest('.tree-node'))
    mousePos = { x: e.clientX, y: e.clientY };
}

function clickAway(e) {
  if (!draggable) return;

  if (!e.target.closest('.tree-node') && !ctrlCmdPressed.value && !shiftPressed.value) {
    const dx = Math.abs(e.clientX - mousePos.x);
    const dy = Math.abs(e.clientY - mousePos.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // filter accidentally clicking away
    if (distance < 5)
      selected.nodes.splice(0, selected.nodes.length);
  }
}

function handleDragDrop({ currentNodeId, targetNode }) {
  if (!draggable) return;

  const currentNode = nodeById(currentNodeId, tree);
  
  if (currentNode && targetNode) {
    if (targetNode.type !== 'folder') targetNode = targetNode.parent;

    const moveNodes = selected.nodes.some(n => n.equals(currentNode)) ? selected.nodes : [currentNode];
    
    if (selected.nodes.some(n => n.equals(currentNode)))
      selected.last = null;
    
    if (moveNodes.every(node => !node.equals(targetNode) && !node.parent.equals(targetNode) && !node.childrens().some(c => c.equals(targetNode))))
      moveNodes.forEach(node => window.explorer.rename(node.path, targetNode.path + '/' + node.label));
  }
}

function handleTreeDrop(e) {
  if (!draggable) return;

  e.preventDefault();
  if (e.target === e.currentTarget)
    handleDragDrop({ currentNodeId: e.dataTransfer.getData('node-id'), targetNode: tree });
}
</script>

<template>
  <div class="tree-view scroll-buffer" @mousedown="handleMouseDown" @click="clickAway" @drop="handleTreeDrop" @dragenter.prevent @dragover.prevent @keydown="handleKeyDown" ref="treeRef" tabindex="0">
    <slot>
      <transition-group v-if="source" tag="ul" name="list">
        <TreeNode v-for="node in tree?.children" :key="node.id" :node="node" @select="(node) => selected.handle(node)" @deselect="(node) => selected.remove(node)" @dragdrop="handleDragDrop"/>
      </transition-group>
    </slot>
  </div>
</template>

<style scoped>
.tree-view {
  flex: 1;
  width: 100%;
  background-color: var(--region-light);
  padding: 1px;
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
  font-size: 13px;

  overflow: auto;
  position: relative;
  box-sizing: border-box;
}
.tree-view.scroll-buffer::after {
  content: "";
  display: block;
  height: 100%;
  pointer-events: none;
  visibility: hidden;
}
</style>

<style>
.tree-view ul {
  margin: 0;
  padding: 0;
  min-width: fit-content;
  overflow: hidden;
}
.tree-view .children-container:not(.opened) > ul {
  min-width: 0;
}

/* nodes transitions */
.list-move,
.list-enter-active,
.list-leave-active {
  transform-origin: left;
  transition: transform 250ms, opacity 150ms;
}

.list-enter-from,
.list-leave-to {
  transform: translateX(-1rem);
  transform: scaleX(0.9);
  opacity: 0;
}

.list-leave-active {
  position: absolute;
}
</style>
