import { ref, reactive, watch, computed } from 'vue';

let idCounter = 1;

export class TNodeBase {
  constructor(label, type, children = []) {
    this.id = idCounter++;
    this.parent = ref(null);

    this.label = ref(label);
    this.children = reactive([]);

    this.type = ref(type);
    this.mimeType = ref(false);
    this.expanded = ref(false);

    this.extension = computed(() =>{
      if (this.type.value === 'folder') return null;
      return window.explorer.extname(this.label.value).replace('.', '');
    });

    // dynamic mimeType
    watch([this.type, this.extension], ([newType, newExtension]) => {
      if (newType === 'folder')
        this.mimeType.value = false;
      else
        window.electronAPI.getMimeType(newExtension).then(mime => this.mimeType.value = mime);
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
      this.expanded.value = ((this.type.value === 'folder' && this.children.length > 0) ? newExpanded : false);
    }, { immediate: true });

    // auto sort
    watch(() => this.children.map(child => [child.type, child.label]), () => {
      if (this.children.length <= 1) return;
      // console.log(`%csorted "${this.label.value}"`, 'color: yellow;');

      this.children.sort((a, b) => (b.type === 'folder') - (a.type === 'folder') || a.label.localeCompare(b.label));
    });

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

  siblings() {
    return this.parent.value?.children.filter(c => !c.equals(this));
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
