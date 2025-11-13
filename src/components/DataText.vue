<script setup>
import { ref, computed, watch } from 'vue';

const { value, invalidChars, borderRadiusMask, fontSize, focusMode, type } = defineProps({
  value: {
    required: true
  },
  invalidChars: {
    type: String,
    default: ''
  },
  borderRadiusMask: {
    type: String,
    default: '1111'
  },
  fontSize: {
    type: String,
    default: '13px'
  },
  focusMode: {
    type: String,
    default: 'none',
    validator: v => ['none', 'select', 'select-name'].includes(v)
  },
  type: {
    type: String,
    default: 'none',
    validator: v => ['none', 'edit', 'select'].includes(v)
  },
});

const dataTextStyle = computed(() => {
  const corners = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'];
  const mask = borderRadiusMask.padEnd(4, '1');

  const borderStyles = Object.fromEntries(
    corners.map((corner, i) => mask[i] === '0' ? [`border${corner}Radius`, '0 !important'] : null)
      .filter(Boolean)
  );

  return {
    fontSize,
    ...borderStyles
  };
});

const emit = defineEmits(['setvalue', 'livevalue']);
const valueRef = ref(null);
function focus() {
  if (!valueRef.value) return;
  valueRef.value.focus();

  if (focusMode === 'none') return;

  const sel = window.getSelection();
  sel.removeAllRanges();

  const textNode = valueRef.value.firstChild;
  if (!textNode) return;

  const range = document.createRange();
  if (focusMode === 'select')
    range.selectNodeContents(valueRef.value);
  else if (focusMode === 'select-name') {
    const text = textNode.textContent || '';
    const lastDot = text.lastIndexOf('.');
    const endPos = lastDot > 0 ? lastDot : text.length;
    range.setStart(textNode, 0);
    range.setEnd(textNode, endPos);
  }

  sel.addRange(range);
}
defineExpose({ focus });

// if value was changed outside
watch(() => value, (newVal) => {
  const text = newVal ?? '';
  if (valueRef.value && valueRef.value.innerText !== text)
    valueRef.value.innerText = text;
});

function sanitizeText(text) {
  if (!invalidChars) return text;
  const regex = new RegExp(`[${invalidChars.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}]`, 'g');
  return text.replace(regex, '');
}

function onInput() {
  if (!valueRef.value) return;
  let text = valueRef.value.innerText ?? '';
  const sanitized = sanitizeText(text);
  if (sanitized !== text) {
    valueRef.value.innerText = sanitized;
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(valueRef.value);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    text = sanitized;
  }
  emit('livevalue', text);
}

let committed = false;

function onKeyDown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
    valueRef.value?.blur();
  }

  if ((invalidChars && invalidChars.includes(e.key)) || type !== 'edit') {
    e.preventDefault();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    committed = true;
    emit('setvalue', valueRef.value?.innerText ?? '');
    valueRef.value?.blur();
  }
}

function cancelEdit() {
  if (!committed && valueRef.value && value && valueRef.value.innerText !== value) {
    valueRef.value.innerText = value;
    emit('livevalue', value);
  }
  committed = false;
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
}
</script>

<template>
  <div class="data-text" :style="dataTextStyle">
    <div class="value-container">
      <slot></slot>
      <div class="value" ref="valueRef" :contenteditable="type !== 'none'" spellcheck="false" @input="type === 'edit' && onInput()" @keydown="onKeyDown" @blur="cancelEdit" @focus="focus"></div>
    </div>
  </div>
</template>

<style scoped>
.data-text {
  flex: 1;
  overflow: hidden;
  background-color: var(--region);
  border: 1px solid var(--border-darker);
  height: 100%;
  /* height: 1.5em; */
  box-sizing: border-box;
  border-radius: var(--border-radius);

  transition: border-color 200ms;
}
.data-text:has(.value:focus) {
  border-color: var(--border);
}

.value-container {
  opacity: 0.7;
  display: flex;
  gap: 0.3em;
  align-items: center;
  height: 100%;
  padding: 0 0.3em;

  transition: opacity 200ms;
}
.value-container:has(> .value:focus) {
  border-color: var(--border);
  opacity: 1;
}

.value {
  flex: 1;
  overflow: hidden;
  overflow-x: auto;
  scroll-behavior: smooth;
  white-space: nowrap;
}
.value::-webkit-scrollbar {
  display: none;
}
.value:focus {
  opacity: 1;
}
</style>
