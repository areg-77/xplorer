<script setup>
import { ref, reactive } from 'vue';
import { TNode } from './model/TNode';
import TreeNode from './TreeNode.vue';

const tree = TNode('Project', 'folder', [
  TNode('Assets', 'folder', [
    TNode('Characters', 'folder', [
      TNode('hero', 'folder', [
        TNode('hero.fbx', 'file')
      ])
    ]),
    TNode('Environment', 'folder', [
      TNode('building', 'folder', [
        TNode('building.fbx', 'file')
      ])
    ])
  ]),
  TNode('Settings', 'folder', [
    TNode('graphics.dll', 'file'),
    TNode('sfx.dll', 'file')
  ]),
  TNode('project.json', 'file')
]);

const selectedNodes = ref([]);

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

</script>

<template>
  <div class="treeview scroll-buffer" @click="clickAway">
    <ul>
      <TreeNode v-for="node in tree.children" :key="node.id" :node="node" @select="handleSelect" :selected-nodes="selectedNodes"/>
    </ul>
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
</style>
