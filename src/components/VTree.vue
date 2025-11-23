<script setup>
import { ref, nextTick, watch } from 'vue';
import VTreeNode from './VTreeNode.vue';
import { nodeById } from './model/nodeFunctions';

const { source: tree, index, treeSource } = defineProps({
  source: Object,
  index: Number,
  treeSource: Object
});

const emit = defineEmits(['set-index']);

const treeRef = ref(null);
async function scrollToSelected(behavior) {
  await nextTick();
  const selectedNode = treeRef.value?.querySelector('.tree-node.selected');
  if (selectedNode) {
    selectedNode.scrollIntoView({
      behavior,
      block: 'nearest'
    });
  }
}

watch(() => tree, () => scrollToSelected('auto'));
watch(() => index, () => scrollToSelected('smooth'));

function onDrop(e) {
  const currentNodeId = e.dataTransfer.getData('node-id');
  const currentNode = nodeById(currentNodeId, treeSource);

  window.explorer.rename(currentNode.path, tree.path + '/' + currentNode.label)
}
</script>

<template>
  <div ref="treeRef" class="tree-view" @drop.prevent="onDrop" @dragover.prevent>
    <slot>
      <ul>
        <VTreeNode v-for="(node, i) in tree?.version.children" :key="node.id" :node="node" :is-selected="i === index" @select="emit('set-index', i)"/>
      </ul>
    </slot>
  </div>
</template>

<style scoped>
.tree-view {
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
/* .tree-view:focus {
  border-color: var(--border);
} */
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
</style>
