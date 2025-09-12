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

const { selectedNodes, lastNode } = inject('selection');
const [ctrlCmdPressed, shiftPressed] = [inject('ctrlCmdPressed'), inject('shiftPressed')];

// for debug
window.tree = tree;
window.TNode = TNode;
window.nodeById = nodeById;
window.selectedNodes = selectedNodes;

function addSelect(node) {
  if (!selectedNodes.value.some(n => n.equals(node)))
    selectedNodes.value.push(node);
}

function removeSelected(node) {
  const idx = selectedNodes.value.findIndex(n => n.equals(node))
  if (idx !== -1) selectedNodes.value.splice(idx, 1);
}

function handleSelect(node) {
  const select = !selectedNodes.value.some(n => n.equals(node));

  // parents/childrens deselecting
  if (select) {
    if (ctrlCmdPressed.value || shiftPressed.value) {
      node.parents().forEach(p => removeSelected(p));
      node.childrens().forEach(c => removeSelected(c));
    }
  }

  if (ctrlCmdPressed.value) {
    (select ? addSelect(node) : removeSelected(node));
    lastNode.value = node;
  }
  else if (shiftPressed.value) {
    const beginIndex = node.parent.children.findIndex(n => n.equals(lastNode.value));
    const endIndex = node.parent.children.findIndex(n => n.equals(node));

    if (beginIndex !== -1 && endIndex !== -1) {
      const [start, stop] = beginIndex < endIndex ? [beginIndex, endIndex] : [endIndex, beginIndex];
      for (let i = start; i <= stop; i++)
        (select ? addSelect(node.parent.children[i]) : removeSelected(node.parent.children[i]));
      
      lastNode.value = node;
    }
    else if (endIndex !== -1) {
      (select ? selectedNodes.value = [node] : removeSelected(node));
      lastNode.value = node;
    }
  }
  else {
    (select || selectedNodes.value.length > 1 ? selectedNodes.value = [node] : removeSelected(node));
    lastNode.value = node;
  }

  if (selectedNodes.value.length === 0)
    lastNode.value = null;
}

function clickAway(e) {
  if (!e.target.closest('.tree-node') && !ctrlCmdPressed.value && !shiftPressed.value) {
    selectedNodes.value = [];
    lastNode.value = null;
  }
}

function handleDragDrop({ currentNodeId, targetNode }) {
  const currentNode = nodeById(currentNodeId, tree.value);
  
  if (currentNode && targetNode) {
    if (targetNode.type !== 'folder') targetNode = targetNode.parent;
    const moveNodes = selectedNodes.value.some(n => n.equals(currentNode)) ? selectedNodes.value : [currentNode];
    if (selectedNodes.value.some(n => n.equals(currentNode)))
      lastNode.value = null;
    
    moveNodes.forEach(node => {
      if (!node.equals(targetNode) && !node.parent.equals(targetNode) && !node.childrens().some(c => c.equals(targetNode))) {
        node.parent = targetNode;
        console.log(`-> "${node.label}".parent = "${targetNode.label}"`);
      }
    });
  }
}

function handleTreeDrop(e) {
  e.preventDefault();
  if (e.target === e.currentTarget)
    handleDragDrop({ currentNodeId: e.dataTransfer.getData('node-id'), targetNode: tree.value });
}
</script>

<template>
  <div class="tree-view scroll-buffer" @click="clickAway" @drop="handleTreeDrop" @dragenter.prevent @dragover.prevent>
    <transition-group tag="ul" name="list">
      <TreeNode v-for="node in tree?.children" :key="node.id" :node="node" @select="handleSelect" @drag-drop="handleDragDrop"/>
    </transition-group>
  </div>
</template>

<style scoped>
.tree-view {
  background-color: var(--region-light);
  padding: 1px;
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
  font-size: 13px;

  overflow: auto;
  position: relative;
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

.tree-view .list-move,
.tree-view .list-enter-active,
.tree-view .list-leave-active {
  transform-origin: left;
  transition: transform 250ms, opacity 150ms;
}

.tree-view .list-enter-from,
.tree-view .list-leave-to {
  transform: translateX(-1rem);
  transform: scaleX(0.9);
  opacity: 0;
}

.tree-view .list-leave-active {
  position: absolute;
}
</style>
