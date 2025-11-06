/**
 * Products hooks - Data access for products
 */

import { useEffect } from 'react';
import { useProductManagementEntityStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all products for an organization
 */
export function useProducts(organizationId: string) {
  const products = useProductManagementEntityStore((state) => state.products);
  const loading = useProductManagementEntityStore((state) => state.loading.products);
  const error = useProductManagementEntityStore((state) => state.errors.products);
  const fetchProducts = useProductManagementEntityStore((state) => state.fetchProducts);

  useEffect(() => {
    fetchProducts(organizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]); // Only re-fetch when organizationId changes

  return { products, loading, error };
}

/**
 * Hook to access a single product by ID
 */
export function useProduct(productId: string | undefined) {
  const product = useProductManagementEntityStore((state) =>
    productId ? state.products.find((p) => p.id === productId) : undefined
  );
  const loading = useProductManagementEntityStore((state) => state.loading.products);
  const error = useProductManagementEntityStore((state) => state.errors.products);

  return { product, loading, error };
}
