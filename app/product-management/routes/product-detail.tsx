/**
 * Product Detail Page
 * Displays product details and its features in a table
 */

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome } from 'react-icons/fi';
import { MdDesignServices } from 'react-icons/md';
import { useParams, Link, useNavigate } from 'react-router';
import { AppLayout, PageHeader, PageContent } from '~/core/components';
import { Button, Input, HStack, Breadcrumb, Table, Form, useForm, Modal } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { Feature } from '~/core/entities/product-management';
import { useProduct, useFeatures, useFeatureCRUD } from '../hooks';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  const form = useForm<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });

  // Use new hooks
  const { product } = useProduct(productId);
  const { features, loading } = useFeatures(productId);
  const { handleCreate, handleUpdate, handleDelete } = useFeatureCRUD();

  const handleOpenDesignStudio = () => {
    navigate(`/studio/${productId}`);
  };

  if (!product) {
    return (
      <AppLayout>
        <PageContent>
          <p>Product not found</p>
        </PageContent>
      </AppLayout>
    );
  }

  const handleAdd = () => {
    setEditingFeature(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    form.setValue('name', feature.name);
    form.setValue('description', feature.description);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (feature: Feature) => {
    await handleDelete(feature.id);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingFeature) {
        await handleUpdate(editingFeature.id, values);
      } else {
        await handleCreate({
          productId: productId!,
          ...values,
        });
      }

      setIsModalOpen(false);
      form.reset();
      setEditingFeature(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const columns: TableColumn<Feature>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Link to={`/products/${productId}/features/${record.id}`} className="text-[var(--primary)] hover:underline">
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
              if (confirm('Are you sure you want to delete this feature? All related changes and requirements will also be deleted.')) {
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
        title={product.name}
        extra={
          <Breadcrumb
            items={[
              {
                title: <Link to="/products"><FiHome /> Products</Link>,
              },
              {
                title: product.name,
              },
            ]}
          />
        }
        actions={
          <HStack gap="sm">
            <Button variant="secondary" icon={<MdDesignServices />} onClick={handleOpenDesignStudio}>
              Open Design Studio
            </Button>
            <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
              Add Feature
            </Button>
          </HStack>
        }
      />

      <PageContent>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666' }}>{product.description}</p>
        </div>

        <Table
          columns={columns}
          dataSource={features}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </PageContent>

      <Modal
        title={editingFeature ? 'Edit Feature' : 'Add Feature'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingFeature ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="name"
              label="Feature Name"
              required
              rules={{
                required: 'Please enter a feature name',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="Enter feature name"
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
                  placeholder="Enter feature description"
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
