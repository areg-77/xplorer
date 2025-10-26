<script setup>
import { ref, computed, watch, useSlots, useAttrs, inject, provide, onMounted, onBeforeUnmount } from 'vue';

defineOptions({ inheritAttrs: false })

const { dropdownOffset } = defineProps({
  dropdownOffset: {
    type: String,
    default: '50%'
  },
  parentDropdown: Boolean
});

const $attrs = useAttrs();

const showDropdown = ref(false);
function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

function isValidDropdown(obj) {
  return obj && typeof obj?.value === 'boolean';
}

const parentDropdown = inject('showDropdown', null);
if (!isValidDropdown(parentDropdown))
  provide('showDropdown', showDropdown);

watch(() => !!$attrs.disabled, isDisabled => {
  if (isDisabled) showDropdown.value = false;
}, { immediate: true });

const slots = useSlots();
const hasDropdown = computed(() => !!(slots.dropdown && slots.dropdown().length));

const emit = defineEmits(['click']);
function clickEvent() {
  if (isValidDropdown(parentDropdown))
    parentDropdown.value = false;
  emit('click');
}

const dropdownRef = ref(null);
function handleClickAway(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target))
    showDropdown.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleClickAway);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickAway);
});
</script>

<template>
  <div class="dropdown-container" ref="dropdownRef">
    <button v-bind="$attrs" @click="hasDropdown ? toggleDropdown() : clickEvent()">
      <slot></slot>
    </button>
    
    <transition name="dropdown">
      <div v-if="showDropdown && hasDropdown" class="dropdown-menu" :style="{ left: dropdownOffset, transform: `translateX(-${dropdownOffset})` }">
        <slot name="dropdown"></slot>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
  margin-top: 0.3rem;
  z-index: 100;
  min-width: 12px;
  padding: 2px;
  gap: 2px;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms, margin-top 150ms ease-in-out;
  pointer-events: none;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  margin-top: -0.3rem;
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
}
</style>
