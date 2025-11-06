/**
 * Products List Page
 * Displays all products in a table with CRUD operations
 */

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router';
import { AppLayout, PageHeader, PageContent } from '~/core/components';
import { Button, Input, HStack, Table, Form, useForm, Modal } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Product } from '~/core/entities/product-management';
import { useProducts, useProductCRUD } from '../hooks';
import { useProductManagementUIStore } from '../store/productManagementUIStore';

export default function ProductsListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const form = useForm<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });

  // Use new hooks
  const { products, loading } = useProducts('org-1'); // Mock organization ID
  const { handleCreate, handleUpdate, handleDelete } = useProductCRUD();

  const handleAdd = () => {
    setEditingProduct(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setValue('name', product.name);
    form.setValue('description', product.description);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (product: Product) => {
    await handleDelete(product.id);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingProduct) {
        await handleUpdate(editingProduct.id, values);
      } else {
        await handleCreate({
          organizationId: 'org-1', // Mock organization ID
          ...values,
        });
      }

      setIsModalOpen(false);
      form.reset();
      setEditingProduct(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const columns: TableColumn<Product>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Link to={`/products/${record.id}`} className="text-[var(--primary)] hover:underline">
          {value as string}
        </Link>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: unknown) => new Date(value as Date).toLocaleDateString(),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <HStack gap="sm">
          <Button
            variant="text"
            icon={<FiEdit2 />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            variant="danger"
            icon={<FiTrash2 />}
            size="small"
            onClick={() => {
              if (confirm('Are you sure you want to delete this product? All related features, changes, and requirements will also be deleted.')) {
                handleDeleteClick(record);
              }
            }}
          />
        </HStack>
      ),
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Products"
        actions={
          <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
            Add Product
          </Button>
        }
      />

      <PageContent>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </PageContent>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingProduct ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="name"
              label="Product Name"
              required
              rules={{
                required: 'Please enter a product name',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="Enter product name"
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              required
              rules={{
                required: 'Please enter a description',
              }}
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Enter product description"
                  rows={4}
                  error={!!error}
                />
              )}
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </AppLayout>
  );
}
