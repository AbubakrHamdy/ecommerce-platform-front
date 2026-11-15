import { pageItems } from '../../shared/pagination';
import { buildCategoryTree } from './catalog.models';

describe('buildCategoryTree', () => {
  it('nests subcategories under their parent, sorted by name', () => {
    const tree = buildCategoryTree([
      { id: 3, name: 'Laptops', parentId: 1, parentName: 'Electronics' },
      { id: 2, name: 'Clothing', parentId: null, parentName: null },
      { id: 1, name: 'Electronics', parentId: null, parentName: null },
      { id: 5, name: 'Audio', parentId: 1, parentName: 'Electronics' },
    ]);

    expect(tree.map((c) => c.name)).toEqual(['Clothing', 'Electronics']);
    expect(tree[1].children.map((c) => c.name)).toEqual(['Audio', 'Laptops']);
  });
});

describe('pageItems', () => {
  it('shows every page when there are few', () => {
    expect(pageItems(0, 3)).toEqual([0, 1, 2]);
  });

  it('keeps the first, last and neighbouring pages, with gaps in between', () => {
    expect(pageItems(5, 10)).toEqual([0, null, 4, 5, 6, null, 9]);
    expect(pageItems(0, 10)).toEqual([0, 1, null, 9]);
  });
});
