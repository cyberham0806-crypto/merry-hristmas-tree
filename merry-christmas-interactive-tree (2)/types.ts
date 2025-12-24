
export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface OrnamentData {
  scatterPos: [number, number, number];
  treePos: [number, number, number];
  type: 'ball' | 'box' | 'star' | 'light';
  scale: number;
  weight: number;
}
