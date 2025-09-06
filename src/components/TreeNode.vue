<script setup>
import { ref, computed, inject, onUpdated } from 'vue';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['select', 'drag-drop']);

const selectedNodes = inject('selectedNodes', ref([]));
const selected = computed(() => selectedNodes.value.some(n => n.equals(props.node)));

function onDragStart(e) {
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('node-id', props.node.id);

  e.dataTransfer.setData('text/plain', props.node.label);

  const img = document.createElement('img');
  img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
  e.dataTransfer.setDragImage(img, 0, 0);
}

function onDrop(e) {
  e.preventDefault();
  emit('drag-drop', { currentNodeId: e.dataTransfer.getData('node-id'), targetNode: props.node });
}

onUpdated(() => {
  console.log(`%c"${props.node.label}" updated`, 'color: greenyellow;');
});
</script>

<template>
  <li @dragenter.prevent @dragover.prevent>
    <div class="tree-node" :class="{ selected: selected }" draggable="true" @dragstart="onDragStart" @drop="onDrop" @dragenter.prevent @dragover.prevent>
      <div class="expander-container" :class="{ hidden: node.type !== 'folder' || !node.children?.length }" @click="node.expanded = !node.expanded">
        <span class="expander" :class="{ opened: node.expanded }"></span>
      </div>
      <div class="label-container" @click="emit('select', props.node)">
        <span :class="['tree-icon', 'icon', node.type, node.mimeType ? node.mimeType.replace('/', ' ') : null, node.extension].filter(Boolean).join(' ')"></span>
        <span class="tree-label">{{ node.label }}</span>

        <span class="tree-parameter">id: {{ node.id }}</span>
        <span v-if="node.type !== 'folder'" class="tree-parameter">mime: "{{ node.mimeType }}"</span>
        <span v-if="node.type !== 'folder'" class="tree-parameter">ext: "{{ node.extension }}"</span>
        <span class="tree-parameter">parent: "{{ node.parent?.label }}"</span>
      </div>
    </div>
    <div class="children-container" :class="{ opened: node.expanded }">
      <transition-group tag="ul" name="list">
        <TreeNode v-for="child in node.children" :key="child.id" :node="child" @select="$emit('select', $event)" @drag-drop="$emit('drag-drop', $event)"/>
      </transition-group>
    </div>
  </li>
</template>

<style scoped>
ul {
  padding-left: 0.9em !important;
  border-radius: calc(var(--border-radius) + 1px);
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;

  transition: background-color 200ms;
}
.tree-node.selected + .children-container > ul {
  transition-delay: 100ms;
  background-color: var(--secondary-dark);
}

li {
  list-style: none;
}
li:hover > .children-container {
  border-color: var(--border-light);
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 1px;
  border: 1px solid transparent;
  border-radius: var(--border-radius);

  transition: background-color 150ms;
}
.tree-node:hover {
  background-color: var(--secondary);
  border-color: var(--border);
}
.tree-node.selected {
  background-color: var(--secondary-light);
  border-color: var(--border-light);
}
.tree-node.selected:hover {
  background-color: var(--secondary-lighter);
}

.expander-container {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  flex: 0 0 1.8em;

  cursor: pointer;
}
.expander-container.hidden {
  visibility: hidden;
}

.expander {
  border-right: 1px solid var(--border-lighter);
  border-bottom: 1px solid var(--border-lighter);
  height: 0.5em;
  aspect-ratio: 1;
  transform: rotate(-45deg);

  transition: transform 250ms;
}
.expander.opened {
  transform: rotate(45deg);
}

.label-container {
  flex: 1;
  display: flex;
  align-items: center;
  white-space: nowrap; 
  padding: 2px 0.9em 2px 0px;
  gap: 0.3em;
}

.tree-icon {
  flex: 0 0 auto;
  height: calc(1em + 3px);
}

.tree-label {
  flex: 1 1 auto;
  white-space: nowrap;
}

.tree-parameter {
  color: var(--fg-darker);
  font-size: 0.82em;
  opacity: 0;

  transition: opacity 125ms;
}
.tree-node:hover .tree-parameter,
.tree-node.selected .tree-parameter {
  transition-delay: 100ms;
  opacity: 1;
}

.children-container {
  display: grid;
  grid-template-rows: 0fr;
  border-left: 1px solid var(--border-dark);
  margin-left: 1em;
  opacity: 0;

  transition: grid-template-rows 250ms cubic-bezier(0.33, 0.13, 0.19, 1), border-color 350ms 100ms, opacity 450ms;
}
.children-container.opened {
  grid-template-rows: 1fr;
  opacity: 1;
}
</style>
