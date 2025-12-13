/**
 * Personas List Page
 * Displays all personas in a responsive card grid
 */

import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, PageContent } from '~/core/components';
import { SolutionManagementLayout } from '../components';
import { Button, Input, Form, useForm, Modal, Empty } from '~/core/components/ui';
import type { Demographics } from '~/core/entities/product-management';
import { usePersonasQuery } from '../queries';
import { useCreatePersona } from '../mutations';
import { PersonaCard } from '../components';
import { useAuthStore } from '~/core/auth';

export default function PersonasListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<{
    name: string;
    role: string;
    description: string;
    goals: string;
    painPoints: string;
    education: string;
    experience: string;
    industry: string;
  }>({
    name: '',
    role: '',
    description: '',
    goals: '',
    painPoints: '',
    education: '',
    experience: '',
    industry: '',
  });

  const currentUser = useAuthStore((state) => state.currentUser);
  const teamId = currentUser?.teamId;

  // TanStack Query hooks
  const { data: personas = [], isLoading } = usePersonasQuery(teamId);
  const createPersona = useCreatePersona();

  const handleAdd = () => {
    form.reset();
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();

      // Parse goals and pain points from newline-separated text
      const goals = values.goals
        .split('\n')
        .map((g) => g.trim())
        .filter((g) => g.length > 0);

      const painPoints = values.painPoints
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      // Build demographics object
      const demographics: Demographics = {};
      if (values.education.trim()) demographics.education = values.education.trim();
      if (values.experience.trim()) demographics.experience = values.experience.trim();
      if (values.industry.trim()) demographics.industry = values.industry.trim();

      if (!teamId) {
        console.error('No team selected');
        return;
      }

      await createPersona.mutateAsync({
        teamId,
        name: values.name,
        role: values.role,
        description: values.description,
        goals,
        painPoints,
        demographics,
      });

      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.reset();
  };

  return (
    <SolutionManagementLayout>
      <PageHeader
        title="Personas"
        actions={
          <Button variant="primary" icon={<FiPlus />} onClick={handleAdd}>
            Add Persona
          </Button>
        }
      />

      <PageContent>
        {!teamId ? (
          <Empty description="No team selected. Please create an organization and team first." />
        ) : isLoading ? (
          <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
        ) : personas.length === 0 ? (
          <Empty description="No personas yet. Click 'Add Persona' to create one." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} />
            ))}
          </div>
        )}
      </PageContent>

      <Modal
        title="Add Persona"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4 mt-6">
            <Form.Item
              name="name"
              label="Persona Name"
              required
              rules={{
                required: 'Please enter a persona name',
              }}
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="e.g., Marketing Manager"
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="role"
              label="Role / Job Title"
            >
              {({ field, error }) => (
                <Input
                  {...field}
                  placeholder="e.g., Senior Marketing Manager"
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Brief description of this persona..."
                  rows={3}
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="goals"
              label="Goals"
              help="Enter each goal on a new line"
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Increase team productivity&#10;Reduce manual work&#10;Better reporting"
                  rows={3}
                  error={!!error}
                />
              )}
            </Form.Item>

            <Form.Item
              name="painPoints"
              label="Pain Points"
              help="Enter each pain point on a new line"
            >
              {({ field, error }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Too many manual processes&#10;Lack of visibility&#10;Disconnected tools"
                  rows={3}
                  error={!!error}
                />
              )}
            </Form.Item>

            <div className="border-t border-[var(--border)] pt-4 mt-4">
              <h4 className="text-sm font-medium text-[var(--text)] mb-3">Demographics (Optional)</h4>

              <div className="space-y-4">
                <Form.Item
                  name="education"
                  label="Education"
                >
                  {({ field, error }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Bachelor's degree in Business"
                      error={!!error}
                    />
                  )}
                </Form.Item>

                <Form.Item
                  name="experience"
                  label="Experience"
                >
                  {({ field, error }) => (
                    <Input
                      {...field}
                      placeholder="e.g., 5-10 years in marketing"
                      error={!!error}
                    />
                  )}
                </Form.Item>

                <Form.Item
                  name="industry"
                  label="Industry"
                >
                  {({ field, error }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Technology, Healthcare"
                      error={!!error}
                    />
                  )}
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </SolutionManagementLayout>
  );
}
