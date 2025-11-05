<script setup>
const { node, isSelected } = defineProps({
  node: {
    type: Object,
    required: true
  },
  isSelected: Boolean
});

const emit = defineEmits(['select']);
</script>

<template>
  <li>
    <div class="tree-node" :class="{ selected: isSelected }">
      <div class="content-container" @click="emit('select')">
        <span class="tree-icon icon" :class="[node.type, ...(node.type !== 'folder' ? [node.mimeType ? node.mimeType.replace('/', ' ') : null, node.extension] : [])].filter(Boolean).join(' ')"></span>
        <div class="label-container">
          <transition name="label-scroll">
            <span class="tree-label" :key="node.label">{{ node.label }}</span>
          </transition>
        </div>

        <!-- <span class="tree-parameter">id: "{{ node.id }}"</span> -->
        <!-- <span v-if="node.type !== 'folder'" class="tree-parameter">mime: "{{ node.mimeType }}"</span> -->
        <!-- <span v-if="node.type !== 'folder'" class="tree-parameter">ext: "{{ node.extension }}"</span> -->
        <!-- <span class="tree-parameter">path: "{{ node.path }}"</span> -->
        <!-- <span class="tree-parameter">childrens: "{{ node.childrens().map(c => c.label) }}"</span> -->
      </div>
    </div>
  </li>
</template>

<style scoped>
li {
  list-style: none;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 1px;
  border: 1px solid transparent;
  border-radius: var(--border-radius);

  transition: background-color 150ms, border-radius 150ms;
}
.tree-node:hover {
  background-color: var(--secondary);
  border-color: var(--border);
}
.tree-node.selected {
  color: var(--version-fg);
  background-color: var(--secondary-light);
  border-color: var(--border-light);
}
.tree-node.selected:hover {
  background-color: var(--secondary-lighter);
}

.content-container {
  flex: 1;
  display: flex;
  align-items: center;
  white-space: nowrap; 
  padding: 2px 0.9em 2px 0.5em;
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

.label-container {
  position: relative;
  overflow: hidden;
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
}

.label-scroll-enter-active,
.label-scroll-leave-active {
  transition: transform 250ms;
}

.label-scroll-enter-from {
  transform: translateY(-100%);
}

.label-scroll-enter-to,
.label-scroll-leave-from {
  transform: translateY(0);
}

.label-scroll-leave-to {
  transform: translateY(100%);
}

.label-scroll-leave-active {
  position: absolute;
}
</style>
