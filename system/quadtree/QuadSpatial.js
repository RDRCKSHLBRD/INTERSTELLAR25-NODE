// QuadTree Spatial Layout Module
// Advanced spatial partitioning for RDXEXP following RODUX principles

export class QuadMath {
  static PHI = 1.618033988749895;
  static SQRT2 = 1.414213562373095;
  static BRONZE = 3.302775637731995;
  
  // Round to device pixel for sharp rendering
  static roundToDevice(value, dpr = window.devicePixelRatio || 1) {
    return Math.round(value * dpr) / dpr;
  }
  
  // Calculate golden ratio split
  static goldenSplit(total, reverse = false) {
    const ratio = reverse ? (1 / this.PHI) : (this.PHI - 1);
    return this.roundToDevice(total * ratio);
  }
  
  // Calculate fibonacci-based splits
  static fibonacciSplit(total, n = 5) {
    const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
    const sum = fib.slice(0, n).reduce((a, b) => a + b, 0);
    return fib.slice(0, n).map(f => this.roundToDevice(total * (f / sum)));
  }
  
  // Calculate musical ratios (perfect fifth, fourth, etc.)
  static musicalSplit(total, interval = 'fifth') {
    const ratios = {
      octave: 2,
      fifth: 1.5,
      fourth: 1.333333,
      majorThird: 1.25,
      minorThird: 1.2
    };
    const ratio = ratios[interval] || 1.5;
    const a = total / (1 + ratio);
    return [this.roundToDevice(a), this.roundToDevice(total - a)];
  }
}

export class QuadNode {
  constructor(bounds, depth = 0, config = {}) {
    this.id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.bounds = bounds; // {x, y, width, height}
    this.depth = depth;
    this.config = config;
    this.children = [];
    this.content = null;
    this.weight = 1;
    this.type = 'container';
  }
  
  // Split node into quadrants or custom ratio
  split(strategy = 'quad', ratios = null) {
    const { x, y, width, height } = this.bounds;
    
    switch (strategy) {
      case 'quad': {
        // Traditional quadtree split (4 equal quadrants)
        const hw = width / 2;
        const hh = height / 2;
        
        this.children = [
          new QuadNode({ x, y, width: hw, height: hh }, this.depth + 1),
          new QuadNode({ x: x + hw, y, width: hw, height: hh }, this.depth + 1),
          new QuadNode({ x, y: y + hh, width: hw, height: hh }, this.depth + 1),
          new QuadNode({ x: x + hw, y: y + hh, width: hw, height: hh }, this.depth + 1)
        ];
        break;
      }
      
      case 'golden': {
        // Golden ratio split (vertical or horizontal based on aspect)
        const isWide = width > height;
        
        if (isWide) {
          const split = QuadMath.goldenSplit(width);
          this.children = [
            new QuadNode({ x, y, width: split, height }, this.depth + 1),
            new QuadNode({ x: x + split, y, width: width - split, height }, this.depth + 1)
          ];
        } else {
          const split = QuadMath.goldenSplit(height);
          this.children = [
            new QuadNode({ x, y, width, height: split }, this.depth + 1),
            new QuadNode({ x, y: y + split, width, height: height - split }, this.depth + 1)
          ];
        }
        break;
      }
      
      case 'fibonacci': {
        // Fibonacci spiral split
        const isWide = width > height;
        const splits = QuadMath.fibonacciSplit(isWide ? width : height, 3);
        
        if (isWide) {
          let currentX = x;
          this.children = splits.map(w => {
            const node = new QuadNode(
              { x: currentX, y, width: w, height },
              this.depth + 1
            );
            currentX += w;
            return node;
          });
        } else {
          let currentY = y;
          this.children = splits.map(h => {
            const node = new QuadNode(
              { x, y: currentY, width, height: h },
              this.depth + 1
            );
            currentY += h;
            return node;
          });
        }
        break;
      }
      
      case 'custom': {
        // Custom ratio split
        if (!ratios || ratios.length < 2) {
          throw new Error('Custom split requires ratios array');
        }
        
        const total = ratios.reduce((a, b) => a + b, 0);
        const normalized = ratios.map(r => r / total);
        const isWide = width > height;
        
        if (isWide) {
          let currentX = x;
          this.children = normalized.map(ratio => {
            const w = QuadMath.roundToDevice(width * ratio);
            const node = new QuadNode(
              { x: currentX, y, width: w, height },
              this.depth + 1
            );
            currentX += w;
            return node;
          });
        } else {
          let currentY = y;
          this.children = normalized.map(ratio => {
            const h = QuadMath.roundToDevice(height * ratio);
            const node = new QuadNode(
              { x, y: currentY, width, height: h },
              this.depth + 1
            );
            currentY += h;
            return node;
          });
        }
        break;
      }
    }
    
    return this.children;
  }
  
  // Find node at specific coordinates
  findNodeAt(x, y) {
    const { x: nx, y: ny, width, height } = this.bounds;
    
    // Check if point is within bounds
    if (x < nx || x > nx + width || y < ny || y > ny + height) {
      return null;
    }
    
    // If has children, recurse
    if (this.children.length > 0) {
      for (const child of this.children) {
        const found = child.findNodeAt(x, y);
        if (found) return found;
      }
    }
    
    return this;
  }
  
  // Calculate node area
  getArea() {
    return this.bounds.width * this.bounds.height;
  }
  
  // Get all leaf nodes
  getLeaves() {
    if (this.children.length === 0) {
      return [this];
    }
    
    return this.children.reduce((leaves, child) => {
      return leaves.concat(child.getLeaves());
    }, []);
  }
}

export class QuadTree {
  constructor(config = {}) {
    this.config = {
      maxDepth: config.maxDepth || 4,
      minNodeSize: config.minNodeSize || 64,
      splitStrategy: config.splitStrategy || 'golden',
      rebalanceThreshold: config.rebalanceThreshold || 0.15,
      debug: config.debug || false,
      ...config
    };
    
    this.root = null;
    this.nodes = new Map();
    this.observers = new Set();
  }
  
  // Initialize tree with viewport bounds
  init(bounds = null) {
    if (!bounds) {
      bounds = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    
    this.root = new QuadNode(bounds, 0, this.config);
    this.nodes.set(this.root.id, this.root);
    
    // Apply initial split strategy
    this.applyLayoutStrategy();
    
    return this.root;
  }
  
  // Apply layout strategy to create initial structure
  applyLayoutStrategy() {
    if (!this.root) return;
    
    const { width, height } = this.root.bounds;
    const ar = width / height;
    
    // Determine layout based on aspect ratio and config
    if (Math.abs(ar - QuadMath.PHI) < 0.1) {
      // Golden ratio layout
      this.applyGoldenLayout();
    } else if (ar > 2.1) {
      // Ultra-wide layout
      this.applyUltrawideLayout();
    } else if (ar < 0.8) {
      // Portrait layout
      this.applyPortraitLayout();
    } else {
      // Standard layout
      this.applyStandardLayout();
    }
    
    this.notifyObservers('layout-applied');
  }
  
  applyGoldenLayout() {
    // Split root using golden ratio
    this.root.split('golden');
    
    // Further subdivide if needed
    if (this.root.children[0]) {
      this.root.children[0].type = 'primary';
      this.root.children[0].weight = QuadMath.PHI;
    }
    
    if (this.root.children[1]) {
      this.root.children[1].type = 'secondary';
      this.root.children[1].weight = 1;
      
      // Split secondary area for controls/library
      this.root.children[1].split('custom', [1, QuadMath.PHI]);
    }
  }
  
  applyUltrawideLayout() {
    // Split into three columns using fibonacci ratios
    this.root.split('custom', [2, 3, 2]);
    
    // Assign types
    if (this.root.children[0]) this.root.children[0].type = 'sidebar-left';
    if (this.root.children[1]) this.root.children[1].type = 'main';
    if (this.root.children[2]) this.root.children[2].type = 'sidebar-right';
  }
  
  applyPortraitLayout() {
    // Stack layout for portrait
    this.root.split('custom', [1, 2, 3]);
    
    // Assign types
    if (this.root.children[0]) this.root.children[0].type = 'header';
    if (this.root.children[1]) this.root.children[1].type = 'controls';
    if (this.root.children[2]) this.root.children[2].type = 'content';
  }
  
  applyStandardLayout() {
    // Standard 2-column layout
    this.root.split('custom', [1, 2]);
    
    if (this.root.children[0]) {
      this.root.children[0].type = 'controls';
    }
    
    if (this.root.children[1]) {
      this.root.children[1].type = 'content';
      // Further split content area
      this.root.children[1].split('custom', [3, 1]);
    }
  }
  
  // Rebalance tree based on content weights
  rebalance() {
    if (!this.root) return;
    
    const leaves = this.root.getLeaves();
    const totalWeight = leaves.reduce((sum, leaf) => sum + leaf.weight, 0);
    
    // Check if rebalancing is needed
    const weights = leaves.map(l => l.weight / totalWeight);
    const maxDiff = Math.max(...weights) - Math.min(...weights);
    
    if (maxDiff > this.config.rebalanceThreshold) {
      // Rebuild tree with new weights
      this.rebuild(weights);
      this.notifyObservers('rebalanced');
    }
  }
  
  // Find optimal node for content placement
  findOptimalNode(contentSize) {
    const leaves = this.root.getLeaves();
    
    // Find node with best fit
    let bestNode = null;
    let bestScore = Infinity;
    
    for (const leaf of leaves) {
      const area = leaf.getArea();
      const score = Math.abs(area - contentSize);
      
      if (score < bestScore) {
        bestScore = score;
        bestNode = leaf;
      }
    }
    
    return bestNode;
  }
  
  // Convert tree to CSS variables
  toCSSVariables() {
    const vars = {};
    const leaves = this.root.getLeaves();
    
    leaves.forEach((leaf, index) => {
      const prefix = `--quad-${leaf.type || index}`;
      vars[`${prefix}-x`] = `${leaf.bounds.x}px`;
      vars[`${prefix}-y`] = `${leaf.bounds.y}px`;
      vars[`${prefix}-w`] = `${leaf.bounds.width}px`;
      vars[`${prefix}-h`] = `${leaf.bounds.height}px`;
      vars[`${prefix}-area`] = leaf.getArea();
    });
    
    return vars;
  }
  
  // Apply CSS variables to document
  applyToDOM() {
    const vars = this.toCSSVariables();
    const root = document.documentElement;
    
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    this.notifyObservers('dom-updated');
  }
  
  // Add observer
  observe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }
  
  // Notify observers
  notifyObservers(event, data = {}) {
    this.observers.forEach(callback => {
      callback({ event, data, tree: this });
    });
  }
  
  // Rebuild tree with new configuration
  rebuild(weights = null) {
    const bounds = this.root.bounds;
    this.init(bounds);
    
    if (weights) {
      // Apply custom weights
      this.root.split('custom', weights);
    } else {
      this.applyLayoutStrategy();
    }
  }
  
  // Debug visualization
  renderDebugOverlay() {
    if (!this.config.debug) return;
    
    // Remove existing overlay
    const existing = document.getElementById('quadtree-debug');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'quadtree-debug';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 10000;
    `;
    
    // Render all nodes
    const renderNode = (node, parent) => {
      const div = document.createElement('div');
      div.style.cssText = `
        position: absolute;
        left: ${node.bounds.x}px;
        top: ${node.bounds.y}px;
        width: ${node.bounds.width}px;
        height: ${node.bounds.height}px;
        border: 1px solid rgba(125, 211, 192, ${1 - node.depth * 0.2});
        background: rgba(125, 211, 192, ${0.05 - node.depth * 0.01});
      `;
      
      // Add label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: 2px;
        left: 2px;
        font-size: 10px;
        color: #7dd3c0;
        font-family: monospace;
        background: rgba(0, 0, 0, 0.8);
        padding: 2px 4px;
        border-radius: 2px;
      `;
      label.textContent = `${node.type || 'node'} [${Math.round(node.bounds.width)}×${Math.round(node.bounds.height)}]`;
      div.appendChild(label);
      
      parent.appendChild(div);
      
      // Render children
      node.children.forEach(child => renderNode(child, div));
    };
    
    renderNode(this.root, overlay);
    document.body.appendChild(overlay);
  }
  
  // Get metrics
  getMetrics() {
    const leaves = this.root.getLeaves();
    const areas = leaves.map(l => l.getArea());
    
    return {
      nodeCount: this.nodes.size,
      leafCount: leaves.length,
      maxDepth: Math.max(...leaves.map(l => l.depth)),
      minArea: Math.min(...areas),
      maxArea: Math.max(...areas),
      avgArea: areas.reduce((a, b) => a + b, 0) / areas.length
    };
  }
}

// Export singleton instance for easy use
export const quadTree = new QuadTree();

export default QuadTree;