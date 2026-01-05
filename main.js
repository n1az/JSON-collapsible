const { Plugin } = require('obsidian');

class JsonCollapsiblePlugin extends Plugin {
  async onload() {
    console.log('Loading JSON Collapsible Plugin');

    this.registerMarkdownCodeBlockProcessor('json', (source, el, ctx) => {
      this.renderJsonTree(source, el);
    });

    this.addStyles();
  }

  onunload() {
    console.log('Unloading JSON Collapsible Plugin');
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .json-tree {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
        background: var(--background-primary);
        padding: 10px;
        border-radius: 4px;
      }

      .json-node {
        margin-left: 20px;
      }

      .json-line {
        display: flex;
        align-items: flex-start;
        padding: 2px 0;
      }

      .json-toggle {
        cursor: pointer;
        user-select: none;
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 4px;
        color: var(--text-muted);
        flex-shrink: 0;
      }

      .json-toggle:hover {
        color: var(--text-normal);
      }

      .json-toggle.empty {
        visibility: hidden;
      }

      .json-key {
        color: var(--text-accent);
        font-weight: 500;
        margin-right: 4px;
      }

      .json-colon {
        margin-right: 4px;
        color: var(--text-muted);
      }

      .json-value {
        color: var(--text-normal);
      }

      .json-value.string {
        color: var(--text-success);
      }

      .json-value.number {
        color: var(--text-warning);
      }

      .json-value.boolean {
        color: var(--color-blue);
      }

      .json-value.null {
        color: var(--text-faint);
        font-style: italic;
      }

      .json-bracket {
        color: var(--text-muted);
        margin-left: 4px;
      }

      .json-collapsed {
        display: none;
      }

      .json-count {
        color: var(--text-faint);
        font-size: 0.9em;
        margin-left: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  renderJsonTree(source, container) {
    try {
      const data = JSON.parse(source);
      const treeContainer = container.createDiv({ cls: 'json-tree' });
      this.renderNode(data, treeContainer, '', true);
    } catch (e) {
      container.createDiv({ text: `Invalid JSON: ${e.message}` });
    }
  }

  renderNode(value, container, key = '', isRoot = false) {
    const type = this.getType(value);
    const line = container.createDiv({ cls: 'json-line' });

    if (type === 'object' || type === 'array') {
      const isArray = type === 'array';
      const children = isArray ? value : Object.entries(value);
      const isEmpty = children.length === 0;

      const toggle = line.createSpan({ cls: 'json-toggle' });
      toggle.textContent = isEmpty ? '' : '▼';
      if (isEmpty) toggle.addClass('empty');

      if (!isRoot && key) {
        line.createSpan({ cls: 'json-key', text: `"${key}"` });
        line.createSpan({ cls: 'json-colon', text: ':' });
      }

      const openBracket = isArray ? '[' : '{';
      const closeBracket = isArray ? ']' : '}';

      if (isEmpty) {
        line.createSpan({ cls: 'json-bracket', text: openBracket + closeBracket });
      } else {
        line.createSpan({ cls: 'json-bracket', text: openBracket });
        const count = line.createSpan({ cls: 'json-count', text: `${children.length} items` });
        
        const childrenContainer = container.createDiv({ cls: 'json-node' });

        if (isArray) {
          value.forEach((item, index) => {
            this.renderNode(item, childrenContainer, String(index), false);
          });
        } else {
          Object.entries(value).forEach(([k, v]) => {
            this.renderNode(v, childrenContainer, k, false);
          });
        }

        const closingLine = container.createDiv({ cls: 'json-line' });
        closingLine.createSpan({ cls: 'json-toggle empty' });
        closingLine.createSpan({ cls: 'json-bracket', text: closeBracket });

        let isExpanded = true;
        toggle.onclick = () => {
          isExpanded = !isExpanded;
          toggle.textContent = isExpanded ? '▼' : '▶';
          childrenContainer.toggleClass('json-collapsed', !isExpanded);
          closingLine.toggleClass('json-collapsed', !isExpanded);
          count.toggleClass('json-collapsed', isExpanded);
        };
      }
    } else {
      line.createSpan({ cls: 'json-toggle empty' });
      
      if (key) {
        line.createSpan({ cls: 'json-key', text: `"${key}"` });
        line.createSpan({ cls: 'json-colon', text: ':' });
      }

      const valueSpan = line.createSpan({ cls: `json-value ${type}` });
      valueSpan.textContent = this.formatValue(value, type);
    }
  }

  getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  formatValue(value, type) {
    if (type === 'string') return `"${value}"`;
    if (type === 'null') return 'null';
    return String(value);
  }
}

module.exports = JsonCollapsiblePlugin;