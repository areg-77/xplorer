let idCounter = 1;

export class TNode {
  constructor(label, type, children = []) {
    this.id = idCounter++;
    this.label = label;
    this.type = type;
    this.children = children;
  }

  equals(other) {
    return other instanceof TNode && this.id === other.id;
  }
}
