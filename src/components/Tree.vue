<script setup>
import { ref, provide, watch, onMounted } from 'vue';
import { TNode } from './model/TNode';
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

const selectedNodes = ref([]);
provide('selectedNodes', selectedNodes);

// for debug
window.tree = tree;
window.TNode = TNode;
window.selectedNodes = selectedNodes;

function handleSelect(node) {
  const idx = selectedNodes.value.findIndex(n => n.equals(node));
  if (idx === -1)
    selectedNodes.value.push(node);
  else
    selectedNodes.value.splice(idx, 1);
}

function clickAway(e) {
  if (!e.target.closest('.tree-node'))
    selectedNodes.value = [];
}

// for debug
watch(selectedNodes, () => {
  if (selectedNodes.value.length === 2) {
    selectedNodes.value[0].parent = selectedNodes.value[1];
    selectedNodes.value = [];
  }
}, { deep: true })
</script>

<template>
  <div class="treeview scroll-buffer" @click="clickAway">
    <transition-group tag="ul" name="list">
      <TreeNode v-for="node in tree?.children" :key="node.id" :node="node" @select="handleSelect"/>
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

.treeview .list-move,
.treeview .list-enter-active,
.treeview .list-leave-active {
  transform-origin: left;
  transition: transform 250ms, opacity 150ms;
}

.treeview .list-enter-from,
.treeview .list-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
  transform: scaleX(0.9);
}

.treeview .list-leave-active {
  position: absolute;
}
</style>
