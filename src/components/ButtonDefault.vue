<script setup>
import { ref, computed, useSlots } from 'vue';

defineOptions({ inheritAttrs: false })

const { dropdownOffset } = defineProps({
  dropdownOffset: {
    type: String,
    default: '50%',
  }
});

const showDropdown = ref(false);
function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

const slots = useSlots();
const hasDropdown = computed(() => !!(slots.dropdown && slots.dropdown().length));

const emit = defineEmits(['click']);
</script>

<template>
  <div class="dropdown-container">
    <button v-bind="$attrs" @click="hasDropdown ? toggleDropdown() : emit('click')">
      <slot></slot>
    </button>
    
    <div v-if="showDropdown && hasDropdown" class="dropdown-menu" :style="{ left: dropdownOffset, transform: `translateX(-${dropdownOffset})` }">
      <slot name="dropdown"></slot>
    </div>
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
  margin-top: 0.35rem;
  z-index: 100;
  min-width: 12px;
  padding: 3px;
  gap: 3px;
}

.dropdown-item {
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  color: var(--fg-dark);
}

.dropdown-item:hover {
  background-color: var(--secondary);
}
</style>
