import { ref, reactive, computed, watch } from 'vue';

let idCounter = 1;

class VNode {
  constructor(label) {
    this.label = ref(label);
    this.children = reactive([]);
  }
}

export class TNodeBase {
  constructor(label, type, children = []) {
    this.id = idCounter++;
    this.parent = ref(null);
    this.vIndex = ref(0);

    this.node = reactive([new VNode(label), new VNode('_versiontest')]);

    this.label = computed({
      get: () => this.node[this.vIndex.value].label,
      set: (value) => this.node[this.vIndex.value].label = value
    });

    this.children = computed({
      get: () => this.node[this.vIndex.value].children,
      set: (value) => this.node[this.vIndex.value].children.splice(0, arr.length, ...value)
    });

    this.type = ref(type);
    this.mimeType = ref(false);
    this.expanded = ref(false);

    // dynamic mimeType
    watch([this.type, this.label], ([newType, newLabel]) => {
      if (newType === 'folder')
        this.mimeType.value = false;
      else
        window.electronAPI.getMimeType(newLabel).then(mime => this.mimeType.value = mime);
    }, { immediate: true });

    // dynamic parent
    watch(this.parent, (newParent, oldParent) => {
      if (newParent?.equals(oldParent)) return;
      if (oldParent)
        oldParent.children.splice(oldParent.children.indexOf(this), 1);

      if (newParent)
        newParent.children.push(this);
    });

    // expanding validation
    watch(this.expanded, newExpanded => {
      this.expanded.value = ((this.type.value === 'folder' && this.children.value.length > 0) ? newExpanded : false);
    }, { immediate: true });

    // auto sort
    watch(() => this.children.value.map(child => [child.type, child.label]), () => {
      if (this.children.value.length <= 1) return;
      // console.log(`%csorted "${this.label.value}"`, 'color: yellow;');

      this.children.value.sort((a, b) => (b.type === 'folder') - (a.type === 'folder') || a.label.localeCompare(b.label));
    }, { deep: true });

    // auto expand/collapse
    watch(() => this.children.value.length, len => {
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

  childrens() {
    const allChildren = [];
    const collect = (node) => {
      for (const child of node.children) {
        allChildren.push(child);
        collect(child);
      }
    };
    collect(this);
    return allChildren;
  }

  get extension() {
    if (this.type.value === 'folder') return null;
    return this.label.includes('.') ? this.label.split('.').pop() : null;
  }

  get path() {
    return [this._path ?? (this.parent?.path ?? '..'), this.label].join('/');
  }
  set path(customPath) {
    const parts = customPath.split('/');
    this.label = parts.pop();
    this._path = parts.join('/');
  }

  equals(other) {
    return other instanceof TNodeBase && this.id === other.id;
  }
}

export function TNode(label, type, children = []) {
  return reactive(new TNodeBase(label, type, children));
}

export function nodeById(id, tree) {
  id = Number(id);
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = nodeById(id, child);
    if (found) return found;
  }
  return null;
}

export function nodeByPath(path, tree) {
  path = path.replace(/\\/g, '/');
  if (tree.path === path) return tree;
  for (const child of tree.children) {
    const found = nodeByPath(path, child);
    if (found) return found;
  }
  return null;
}
