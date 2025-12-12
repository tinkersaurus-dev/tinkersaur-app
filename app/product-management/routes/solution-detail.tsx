/**
 * Solution Detail Page
 * Displays solution details and its use cases in a table
 */

import { useState, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome } from 'react-icons/fi';
import { MdDesignServices } from 'react-icons/md';
import { useParams, Link, useNavigate, useLoaderData } from 'react-router';
import { PageHeader, PageContent } from '~/core/components';
import { SolutionManagementLayout } from '../components';
import { Button, Input, HStack, Breadcrumb, Table, Form, useForm, Modal } from '~/core/components/ui';
import type { TableColumn } from '~/core/components/ui';
import type { UseCase } from '~/core/entities/product-management';
import { useUseCaseCRUD } from '../hooks';
import { useUseCaseStore } from '~/core/entities/product-management/store/useCase/useUseCaseStore';
import { loadSolutionDetail } from '../loaders';
import type { SolutionDetailLoaderData } from '../loaders';
import { useHydrateSolution, useHydrateUseCases } from '../utils/hydrateStores';
import type { Route } from './+types/solution-detail';

// Loader function for SSR data fetching
export async function loader({ params }: Route.LoaderArgs) {
  const { solutionId } = params;
  if (!solutionId) {
    throw new Response('Solution ID required', { status: 400 });
  }
  return loadSolutionDetail(solutionId);
}

export default function SolutionDetailPage() {
  // Get data from loader - guaranteed to exist (loader throws 404 otherwise)
  const { solution, useCases: initialUseCases } = useLoaderData<SolutionDetailLoaderData>();

  // Hydrate stores for client-side navigation continuity
  useHydrateSolution(solution);
  useHydrateUseCases(initialUseCases);

  const { solutionId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);

  // Use store state, falling back to initial loader data
  const storeUseCases = useUseCaseStore((state) => state.entities);
  const storeLoading = useUseCaseStore((state) => state.loading);

  // Derive use cases from store (after CRUD operations) or initial loader data
  const useCases = useMemo(() => {
    const filteredUseCases = storeUseCases.filter(uc => uc.solutionId === solutionId);
    // Use store data if available, otherwise fall back to initial loader data
    return filteredUseCases.length > 0 || storeUseCases.length > 0
      ? filteredUseCases
      : initialUseCases;
  }, [storeUseCases, solutionId, initialUseCases]);

  const form = useForm<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });

  const { handleCreate, handleUpdate, handleDelete } = useUseCaseCRUD();

  const handleOpenDesignStudio = () => {
    navigate(`/studio/${solutionId}`);
  };

  const handleAdd = () => {
    setEditingUseCase(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (useCase: UseCase) => {
    setEditingUseCase(useCase);
    form.setValue('name', useCase.name);
    form.setValue('description', useCase.description);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (useCase: UseCase) => {
    await handleDelete(useCase.id);
    // Store will update, useEffect will sync local state
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      if (editingUseCase) {
        await handleUpdate(editingUseCase.id, values);
      } else {
        await handleCreate({
          solutionId: solutionId!,
          ...values,
        });
      }
      // Store will update, useEffect will sync local state

      setIsModalOpen(false);
      form.reset();
      setEditingUseCase(null);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const columns: TableColumn<UseCase>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Link to={`/solutions/${solutionId}/use-cases/${record.id}`} className="text-[var(--primary)] hover:underline">
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
              if (confirm('Are you sure you want to delete this use case? All related changes and requirements will also be deleted.')) {
                handleDeleteClick(record);
              }
            }}
          />
        </HStack>
      ),
    },
  ];

  return (
    <SolutionManagementLayout>
      <PageHeader
        title={solution.name}
        extra={
          <Breadcrumb
            items={[
              {
                title: <><FiHome /> Solutions</>,
                href: '/solutions',
              },
              {
                title: solution.name,
              },
            ]}
          />
        }
        actions={
          <HStack gap="sm">
            <Button variant="default" icon={<MdDesignServices />} onClick={handleOpenDesignStudio}>
              Open Design Studio
            </Button>
            <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
              Add Use Case
            </Button>
          </HStack>
        }
      />

      <PageContent>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666' }}>{solution.description}</p>
        </div>

        <Table
          columns={columns}
          dataSource={useCases}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={storeLoading}
        />
      </PageContent>

      <Modal
        title={editingUseCase ? 'Edit Use Case' : 'Add Use Case'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingUseCase ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="name"
              label="Use Case Name"
              required
              rules={{
                required: 'Please enter a use case name',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="Enter use case name"
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
                  placeholder="Enter use case description"
                  rows={4}
                  error={!!error}
                />
              )}
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </SolutionManagementLayout>
  );
}
