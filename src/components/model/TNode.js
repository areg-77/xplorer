let idCounter = 1;

export class TNode {
  constructor(label, type, children = []) {
    this.id = idCounter++;
    this.parent = null;
    this.label = label;
    this.type = type;
    this.children = children;

    this.children.forEach(child => child.parent = this);
  }

  equals(other) {
    return other instanceof TNode && this.id === other.id;
  }
}
