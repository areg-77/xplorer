import { ref, reactive, watch } from 'vue';

let idCounter = 0;

export class TNodeBase {
  constructor(label, type, children = []) {
    this.id = idCounter++;
    this.parent = ref(null);
    this.type = ref(type);
    this.label = ref(label);
    this.mimeType = ref(false);
    this.children = reactive([]);
    this.expanded = ref(children.length > 0);

    // dynamic mimeType
    watch([this.type, this.label], ([newType, newLabel]) => {
      if (newType === 'folder')
        this.mimeType.value = false;
      else
        window.electronAPI.getMimeType(newLabel).then(mime => this.mimeType.value = mime);
    }, { immediate: true });

    // dynamic parent
    watch(this.parent, (newParent, oldParent) => {
      if (newParent.equals(oldParent)) return;
      if (oldParent)
        oldParent.children.splice(oldParent.children.indexOf(this), 1);

      if (newParent)
        newParent.children.push(this);
    });

    // auto sort
    watch(() => this.children.map(child => [child.type, child.label]), () => {
      if (this.children.length <= 1) return;
      console.log(`%csorted "${this.label.value}"`, 'color: yellow;');

      this.children.sort((a, b) => (b.type === 'folder') - (a.type === 'folder') || a.label.localeCompare(b.label));
    }, { deep: true });

    // auto expand/collapse
    watch(() => this.children.length, len => {
      this.expanded.value = !(len === 0);
    });

    children.forEach(child => child.parent = this);
  }

  parents() {
    const allParents = [];
    let currentNode = this.parent;
    while (currentNode) {
      allParents.push(currentNode);
      currentNode = currentNode.parent;
    }
    return allParents;
  }

  get extension() {
    if (this.type.value === 'folder') return null;
    return this.label.includes('.') ? this.label.split('.').pop() : null;
  }

  get path() {
    return [...this.parents().reverse().map(p => p.label), this.label].join('/');
  }

  equals(other) {
    return other instanceof TNodeBase && this.id === other.id;
  }
}

export function TNode(label, type, children = []) {
  return reactive(new TNodeBase(label, type, children));
}

export function nodeById(id, tree) {
  if (tree.id == id) return tree;
  for (const child of tree.children) {
    const found = nodeById(id, child);
    if (found) return found;
  }
  return null;
}
