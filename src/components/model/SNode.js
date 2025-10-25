import { ref, reactive, watch } from "vue";

export class SNode {
  constructor(ctrlCmdPressed, shiftPressed) {
    this.ctrlCmdPressed = ctrlCmdPressed;
    this.shiftPressed = shiftPressed;

    this.nodes = reactive([]);
    this.last = ref(null);

    watch(() => this.nodes.slice(), (newNodes) => {
      for (const node of newNodes)
        if (!node.parent) this.remove(node);

      if (this.nodes.length === 0)
        this.last = null;

      this.nodes.forEach(node => node.parents().forEach(p => p.expanded = true));
    }, { deep: true });
  }

  add(node) {
    if (!this.nodes.some(n => n.equals(node))) {
      this.nodes.push(node);
      this.last = node;
    }
  }

  remove(node) {
    const idx = this.nodes.findIndex(n => n.equals(node))
    if (idx !== -1) {
      this.nodes.splice(idx, 1);
      this.last = node;
    }
  }

  clear(node) {
    if (node) {
      this.nodes.splice(0, this.nodes.length, node);
      this.last = node;
    }
    else
      this.nodes.splice(0, this.nodes.length);
  }

  handle(node) {
    const select = !this.nodes.some(n => n.equals(node));

    // parents/childrens deselecting
    if (select) {
      if (this.ctrlCmdPressed.value || this.shiftPressed.value) {
        node.parents().forEach(p => this.remove(p));
        node.childrens().forEach(c => this.remove(c));
      }
    }

    if (this.ctrlCmdPressed.value)
      (select ? this.add(node) : this.remove(node));
    else if (this.shiftPressed.value) {
      const beginIndex = node.parent.children.findIndex(n => n.equals(this.last));
      const endIndex = node.parent.children.findIndex(n => n.equals(node));

      if (beginIndex !== -1 && endIndex !== -1) {
        const [start, stop] = beginIndex < endIndex ? [beginIndex, endIndex] : [endIndex, beginIndex];
        for (let i = start; i <= stop; i++)
          (select ? this.add(node.parent.children[i]) : this.remove(node.parent.children[i]));
      }
      else if (endIndex !== -1)
        (select ? this.clear(node) : this.remove(node));
    }
    else
      (select || this.nodes.length > 1 ? this.clear(node) : this.remove(node));
  }
}

export function isSNode(obj) {
  return obj instanceof SNode;
}
