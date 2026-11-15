export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  thumbnailUrl: string | null;
  categoryName: string;
}

export interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  active: boolean;
  category: { id: number; name: string };
  images: ProductImage[];
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface ProductQuery {
  search?: string;
  categoryId?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  sort?: string;
  page?: number;
  size?: number;
}

// The API returns a flat list; the sidebar shows it as a tree, sorted by name at every level.
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>(
    categories.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId === null ? undefined : nodes.get(node.parentId);
    (parent ? parent.children : roots).push(node);
  }
  const sort = (list: CategoryNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((node) => sort(node.children));
    return list;
  };
  return sort(roots);
}
