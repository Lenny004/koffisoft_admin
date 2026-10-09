export interface ProductFixture {
  id: string;
  name: string;
  slug: string;
  category: string;
  active: boolean;
  image: string;
}

export const productFixtures: ProductFixture[] = [
  {
    id: 'fixture-product-1',
    name: 'Crepa de fresa',
    slug: 'crepa-de-fresa',
    category: 'Postres',
    active: true,
    image: '/fixtures/products/crepe-strawberry.jpg',
  },
  {
    id: 'fixture-product-2',
    name: 'Bebida fría de cola',
    slug: 'bebida-fria-de-cola',
    category: 'Bebidas frías',
    active: true,
    image: '/fixtures/products/cola-ice.jpg',
  },
  {
    id: 'fixture-product-3',
    name: 'Café especial',
    slug: 'cafe-especial',
    category: 'Bebidas calientes',
    active: false,
    image: '/fixtures/products/coffee-special.png',
  },
];
