<script setup>
import { ref, computed, watch } from 'vue';

const { value, borderRadiusMask, editable } = defineProps({
  value: {
    required: true
  },
  borderRadiusMask: {
    type: String,
    default: '1111'
  },
  editable: Boolean
});

const borderRadiusStyle = computed(() => {
  const corners = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'];
  const mask = borderRadiusMask.padEnd(4, '1');

  return Object.fromEntries(corners.map((corner, i) => mask[i] === '0' ? [`border${corner}Radius`, '0 !important'] : null).filter(Boolean));
});

const emit = defineEmits(['set:value']);
const contentRef = ref(null);

// if value was changed outside
watch(() => value, (newVal) => {
  const text = newVal ?? '';
  if (contentRef.value && contentRef.value.innerText !== text)
    contentRef.value.innerText = text;
});

function onInput() {
  emit('set:value', contentRef.value?.innerText ?? '');
}
</script>

<template>
  <span ref="contentRef" class="data-text" :style="borderRadiusStyle" :contenteditable="editable" spellcheck="false" @input="onInput"></span>
</template>

<style scoped>
.data-text {
  flex: 1;
  font-size: 13px;
  background-color: var(--region);
  color: var(--fg-dark);
  border: 1px solid var(--border-darker);
  display: flex;
  overflow: hidden;
  overflow-x: auto;
  scroll-behavior: smooth;
  align-items: center;
  white-space: nowrap;
  height: 100%;
  border-radius: var(--border-radius);
  padding: 0 0.3em;
}
.data-text::-webkit-scrollbar {
  display: none;
}
</style>
