<script setup>
import { ref, onMounted, inject } from 'vue';
import { TNode, nodeById } from './model/TNode';
import TreeNode from './TreeNode.vue';

const props = defineProps({
  path: {
    type: String,
    required: true
  }
});

const tree = ref(null);
onMounted(async () => {
  const rawTree = await window.electronAPI.readFolder(props.path);
  function toTNode(node) {
    return TNode(node.label, node.type, node.children ? node.children.map(toTNode) : []);
  }
  tree.value = toTNode(rawTree);
});

const selectedNodes = inject('selectedNodes', ref([]));

// for debug
window.tree = tree;
window.TNode = TNode;
window.nodeById = nodeById;
window.selectedNodes = selectedNodes;

function clickAway(e) {
  if (!e.target.closest('.tree-node'))
    selectedNodes.value = [];
}

function handleDragDrop({ currentNodeId, targetNode }) {
  const currentNode = nodeById(currentNodeId, tree.value);
  
  if (currentNode && targetNode) {
    if (targetNode.type !== 'folder') targetNode = targetNode.parent;
    
    if (!currentNode.equals(targetNode) && !currentNode.parent.equals(targetNode))
      currentNode.parent = targetNode;
  }
}

function handleTreeDrop(e) {
  e.preventDefault();
  if (e.target === e.currentTarget) {
    const currentNodeId = e.dataTransfer.getData('node-Id');
    handleDragDrop({ currentNodeId, targetNode: tree.value });
  }
}
</script>

<template>
  <div class="treeview scroll-buffer" @click="clickAway" @drop="handleTreeDrop" @dragenter.prevent @dragover.prevent>
    <transition-group tag="ul" name="list">
      <TreeNode v-for="node in tree?.children" :key="node.id" :node="node" @drag-drop="handleDragDrop"/>
    </transition-group>
  </div>
</template>

<style scoped>
.treeview {
  background-color: var(--region-light);
  padding: 1px;
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
  font-size: 13px;

  overflow: auto;
}
.treeview.scroll-buffer::after {
  content: "";
  display: block;
  height: 100%;
  pointer-events: none;
  visibility: hidden;
}
</style>

<style>
.treeview ul {
  margin: 0;
  padding: 0;
  min-width: fit-content;
  overflow: hidden;
}
.treeview .children-container:not(.opened) > ul {
  min-width: 0;
}

.treeview .list-move,
.treeview .list-enter-active,
.treeview .list-leave-active {
  transform-origin: left;
  transition: transform 250ms, opacity 150ms;
}

.treeview .list-enter-from,
.treeview .list-leave-to {
  transform: translateX(-1rem);
  transform: scaleX(0.9);
  opacity: 0;
}

.treeview .list-leave-active {
  position: absolute;
}
</style>
