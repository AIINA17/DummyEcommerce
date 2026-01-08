import products from "../../data/products.json";

export let orders: any[] = [];

export function findProduct(id: number) {
  return (products as any[]).find(p => p.id === id);
}
