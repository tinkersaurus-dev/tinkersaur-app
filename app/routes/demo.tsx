/**
 * Component Demo Page
 * Showcases all custom UI components for testing and verification
 */

import { useState, useMemo } from 'react';
import { AppLayout, PageHeader, PageContent } from '~/core/components';
import {
  Button,
  Input,
  InputNumber,
  Card,
  Tag,
  Empty,
  HStack,
  VStack,
  Avatar,
  Breadcrumb,
  Menu,
  Dropdown,
  Layout,
  Table,
  Form,
  useForm,
  Select,
  Modal,
  Tabs,
  Descriptions
} from '~/core/components/ui';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSave,
  MdSearch,
  MdHome,
  MdFolder,
  MdDescription,
  MdSettings,
  MdDashboard,
  MdPerson,
  MdLogout
} from 'react-icons/md';
import { FaUser } from 'react-icons/fa';
import { Link } from 'react-router';
import type { TabItem } from '~/core/components/ui';

// Demo component for editable tabs
function EditableTabsDemo() {
  const [activeKey, setActiveKey] = useState('overview');
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      key: 'overview',
      label: 'Overview',
      closable: false,
      children: (
        <div className="p-4">
          <h4 className="font-medium mb-2">Overview</h4>
          <p className="text-[var(--text-muted)]">
            This tab cannot be closed (closable: false). It serves as a permanent home tab.
          </p>
        </div>
      ),
    },
    {
      key: 'diagram-1',
      label: 'System Architecture',
      closable: true,
      children: (
        <div className="p-4">
          <h4 className="font-medium mb-2">System Architecture Diagram</h4>
          <p className="text-[var(--text-muted)]">
            This tab can be closed using the × button. When you close the active tab,
            it automatically switches to an adjacent tab.
          </p>
        </div>
      ),
    },
    {
      key: 'interface-1',
      label: 'User API',
      closable: true,
      children: (
        <div className="p-4">
          <h4 className="font-medium mb-2">User API Interface</h4>
          <p className="text-[var(--text-muted)]">
            This demonstrates how tabs work with different content types, similar to
            the Design Studio's document management.
          </p>
        </div>
      ),
    },
  ]);

  const handleEdit = (targetKey: string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      // Find the tab to close
      const tabIndex = tabs.findIndex((tab) => tab.key === targetKey);
      const newTabs = tabs.filter((tab) => tab.key !== targetKey);

      // If closing the active tab, switch to adjacent tab
      if (activeKey === targetKey) {
        let newActiveKey = activeKey;
        if (tabIndex > 0) {
          newActiveKey = newTabs[tabIndex - 1].key;
        } else if (newTabs.length > 0) {
          newActiveKey = newTabs[0].key;
        }
        setActiveKey(newActiveKey);
      }

      setTabs(newTabs);
    }
  };

  return (
    <Tabs
      type="editable-card"
      activeKey={activeKey}
      onChange={setActiveKey}
      onEdit={handleEdit}
      hideAdd
      items={tabs}
    />
  );
}

// Demo component for controlled tabs
function ControlledTabsDemo() {
  const [activeKey, setActiveKey] = useState('home');
  const [clickCount, setClickCount] = useState(0);

  const handleChange = (key: string) => {
    setActiveKey(key);
    setClickCount((prev) => prev + 1);
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-[var(--bg-muted)] rounded">
        <p className="text-sm">
          <strong>Current Active Tab:</strong> {activeKey}
        </p>
        <p className="text-sm">
          <strong>Tab Changes:</strong> {clickCount}
        </p>
      </div>
      <Tabs
        activeKey={activeKey}
        onChange={handleChange}
        items={[
          {
            key: 'home',
            label: 'Home',
            children: (
              <div className="p-4">
                <p className="text-[var(--text-muted)]">
                  Controlled tabs use activeKey and onChange props for external state management.
                </p>
              </div>
            ),
          },
          {
            key: 'profile',
            label: 'Profile',
            children: (
              <div className="p-4">
                <p className="text-[var(--text-muted)]">
                  The parent component controls which tab is active and responds to changes.
                </p>
              </div>
            ),
          },
          {
            key: 'settings',
            label: 'Settings',
            children: (
              <div className="p-4">
                <p className="text-[var(--text-muted)]">
                  This is useful when you need to sync tab state with other parts of your app.
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export function meta() {
  return [
    { title: "Component Demo - Tinkersaur" },
    { name: "description", content: "Custom component showcase and testing page" },
  ];
}

interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: string;
  age?: number;
}

export default function DemoPage() {
  const [dropdownLog, setDropdownLog] = useState<string[]>([]);
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DemoUser | null>(null);

  const logDropdownAction = (action: string) => {
    setDropdownLog((prev) => [action, ...prev].slice(0, 5));
  };

  // Generate sample table data with useMemo to avoid re-generating on each render
  const paginatedTableData = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        category: ['Electronics', 'Furniture', 'Clothing'][i % 3],
        // Use deterministic price based on index for demo purposes
        price: `$${(((i * 37 + 13) % 90) + 10).toFixed(2)}`,
      })),
    []
  );

  // Basic form
  const basicForm = useForm<{
    name: string;
    email: string;
    age?: number;
  }>({
    name: '',
    email: '',
    age: undefined,
  });

  // Form with validation
  const validationForm = useForm<{
    username: string;
    password: string;
    confirmPassword: string;
  }>({
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Modal form (for create/edit)
  const modalForm = useForm<{
    name: string;
    email: string;
    role: string;
    age?: number;
  }>({
    name: '',
    email: '',
    role: '',
    age: undefined,
  });

  const handleBasicSubmit = (data: { name: string; email: string; age?: number }) => {
    alert(`Form submitted!\nName: ${data.name}\nEmail: ${data.email}\nAge: ${data.age}`);
  };

  const handleValidationSubmit = (_data: { username: string; password: string; confirmPassword: string }) => {
    alert('Form validation passed!');
  };

  const handleModalOk = async () => {
    try {
      const isValid = await modalForm.trigger();
      if (isValid) {
        const data = modalForm.getValues();
        alert(`${editingUser ? 'Updated' : 'Created'} user: ${data.name}`);
        setIsFormModalOpen(false);
        modalForm.reset();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    modalForm.reset();
    setIsFormModalOpen(true);
  };

  const handleEditUser = () => {
    const user: DemoUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'developer',
    };
    setEditingUser(user);
    modalForm.setValue('name', user.name);
    modalForm.setValue('email', user.email);
    modalForm.setValue('role', user.role);
    modalForm.setValue('age', user.age);
    setIsFormModalOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader title="Component Demo" />

      <PageContent>
        <div className="space-y-12">

          {/* Button Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Button Component
            </h2>

            {/* Button Variants */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="default">Default Button</Button>
                <Button variant="text">Text Button</Button>
                <Button variant="link">Link Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="small">Small</Button>
                <Button variant="primary" size="medium">Medium</Button>
                <Button variant="primary" size="large">Large</Button>
              </div>
            </div>

            {/* Button with Icons */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Icons
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" icon={<MdAdd />}>Add</Button>
                <Button variant="default" icon={<MdEdit />}>Edit</Button>
                <Button variant="danger" icon={<MdDelete />}>Delete</Button>
                <Button variant="text" icon={<MdSave />}>Save</Button>
                <Button variant="link" icon={<MdSearch />}>Search</Button>
              </div>
            </div>

            {/* Button States */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                States
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Normal</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" loading icon={<MdSave />}>Loading with Icon</Button>
              </div>
            </div>

            {/* Icon Only Buttons */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Icon Only
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" icon={<MdAdd />} size="small" />
                <Button variant="default" icon={<MdEdit />} size="small" />
                <Button variant="danger" icon={<MdDelete />} size="small" />
                <Button variant="text" icon={<MdSearch />} size="medium" />
              </div>
            </div>
          </section>

          {/* Input Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Input Component
            </h2>

            {/* Input Sizes */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Sizes
              </h3>
              <div className="space-y-3 max-w-md">
                <Input size="small" placeholder="Small input" />
                <Input size="medium" placeholder="Medium input (default)" />
                <Input size="large" placeholder="Large input" />
              </div>
            </div>

            {/* Input States */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                States
              </h3>
              <div className="space-y-3 max-w-md">
                <Input placeholder="Normal input" />
                <Input placeholder="Disabled input" disabled />
                <Input placeholder="Error input" error />
                <Input placeholder="With default value" defaultValue="Some text" />
              </div>
            </div>

            {/* TextArea */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                TextArea Variant
              </h3>
              <div className="space-y-3 max-w-md">
                <Input.TextArea placeholder="Normal textarea (4 rows)" rows={4} />
                <Input.TextArea placeholder="Small textarea" rows={3} size="small" />
                <Input.TextArea placeholder="Disabled textarea" rows={4} disabled />
                <Input.TextArea placeholder="Error textarea" rows={4} error />
              </div>
            </div>
          </section>

          {/* InputNumber Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              InputNumber Component
            </h2>

            {/* InputNumber Sizes */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Sizes
              </h3>
              <div className="space-y-3 max-w-xs">
                <InputNumber size="small" placeholder="Small" defaultValue={5} />
                <InputNumber size="medium" placeholder="Medium" defaultValue={5} />
                <InputNumber size="large" placeholder="Large" defaultValue={5} />
              </div>
            </div>

            {/* InputNumber with Min/Max */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Min/Max Bounds
              </h3>
              <div className="space-y-3 max-w-xs">
                <div>
                  <label className="block text-sm text-[var(--text)] mb-1">
                    Priority (1-10)
                  </label>
                  <InputNumber min={1} max={10} defaultValue={1} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text)] mb-1">
                    Percentage (0-100)
                  </label>
                  <InputNumber min={0} max={100} defaultValue={50} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text)] mb-1">
                    Quantity (min 0)
                  </label>
                  <InputNumber min={0} defaultValue={0} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            {/* InputNumber with Step */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Step Increment
              </h3>
              <div className="space-y-3 max-w-xs">
                <div>
                  <label className="block text-sm text-[var(--text)] mb-1">
                    Step by 1 (default)
                  </label>
                  <InputNumber step={1} defaultValue={10} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text)] mb-1">
                    Step by 5
                  </label>
                  <InputNumber step={5} min={0} max={100} defaultValue={0} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text)] mb-1">
                    Step by 10
                  </label>
                  <InputNumber step={10} min={0} max={100} defaultValue={50} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            {/* InputNumber States */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                States
              </h3>
              <div className="space-y-3 max-w-xs">
                <InputNumber placeholder="Normal" defaultValue={42} style={{ width: '100%' }} />
                <InputNumber placeholder="Disabled" defaultValue={42} disabled style={{ width: '100%' }} />
                <InputNumber placeholder="Error" defaultValue={42} error style={{ width: '100%' }} />
              </div>
            </div>
          </section>

          {/* Card Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Card Component
            </h2>

            {/* Basic Card */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Card (No Title)
              </h3>
              <Card>
                <p className="text-[var(--text-muted)]">
                  This is a basic card with no title. It provides a simple container with consistent styling,
                  padding, and elevation.
                </p>
              </Card>
            </div>

            {/* Card with Title */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Card with String Title
              </h3>
              <Card title="Document Title">
                <p className="text-[var(--text-muted)]">
                  This card has a simple string title. The title appears in a header section with
                  a border separator from the body content.
                </p>
              </Card>
            </div>

            {/* Card with Complex Title */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Card with Complex Title (JSX)
              </h3>
              <Card
                title={
                  <div>
                    Interface Design <Tag color="purple">high fidelity</Tag>
                  </div>
                }
              >
                <p className="text-[var(--text-muted)]">
                  This card demonstrates a complex title with nested JSX elements. The title can contain
                  any React components, such as tags, icons, or other elements.
                </p>
              </Card>
            </div>

            {/* Card with Custom Styling */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Card with Custom Styling
              </h3>
              <Card title="Styled Card" style={{ marginBottom: '16px' }}>
                <p className="text-[var(--text-muted)]">
                  This card has custom inline styles applied. You can use the style prop to customize
                  spacing, colors, or other CSS properties.
                </p>
              </Card>
              <Card title="Another Card">
                <p className="text-[var(--text-muted)]">
                  Multiple cards can be stacked with custom spacing between them.
                </p>
              </Card>
            </div>

            {/* Card States */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Card Variants
              </h3>
              <div className="space-y-4">
                <Card title="Default Card (bordered)" bordered>
                  <p className="text-[var(--text-muted)]">
                    This is a bordered card (default behavior).
                  </p>
                </Card>
                <Card title="Borderless Card" bordered={false}>
                  <p className="text-[var(--text-muted)]">
                    This card has no border, creating a cleaner look.
                  </p>
                </Card>
                <Card title="Hoverable Card" hoverable>
                  <p className="text-[var(--text-muted)]">
                    Hover over this card to see the hover effect with elevation and border color change.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* Tag Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Tag Component
            </h2>

            {/* Tag Colors */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Color Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Tag>Default Tag</Tag>
                <Tag color="blue">Blue Tag</Tag>
                <Tag color="green">Green Tag</Tag>
                <Tag color="orange">Orange Tag</Tag>
                <Tag color="red">Red Tag</Tag>
                <Tag color="purple">Purple Tag</Tag>
              </div>
            </div>

            {/* Tag Usage Examples */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Common Use Cases
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-[var(--text-muted)] text-sm mr-3">Status:</span>
                  <Tag color="green">implemented</Tag>
                  <Tag color="orange">in-design</Tag>
                  <Tag color="blue">locked</Tag>
                  <Tag>draft</Tag>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-sm mr-3">Priority:</span>
                  <Tag color="red">high</Tag>
                  <Tag color="orange">medium</Tag>
                  <Tag color="blue">low</Tag>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-sm mr-3">Types:</span>
                  <Tag color="blue">functional</Tag>
                  <Tag color="orange">non-functional</Tag>
                  <Tag color="red">constraint</Tag>
                </div>
              </div>
            </div>
          </section>

          {/* Empty Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Empty Component
            </h2>

            {/* Basic Empty State */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Empty State
              </h3>
              <Card>
                <Empty description="No data available" />
              </Card>
            </div>

            {/* Empty with String Description */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                String Descriptions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <Empty description="No items found" />
                </Card>
                <Card>
                  <Empty description="Document not found" />
                </Card>
                <Card>
                  <Empty description="Interface not available" />
                </Card>
              </div>
            </div>

            {/* Empty with Image */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Simple Image
              </h3>
              <Card>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No data to display"
                />
              </Card>
            </div>

            {/* Empty with Custom JSX Description */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Custom JSX Description
              </h3>
              <Card>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p>Canvas Component Coming Soon</p>
                      <p style={{ color: '#999', fontSize: '12px' }}>
                        This is where the interactive diagram canvas will be displayed
                      </p>
                    </div>
                  }
                  style={{ padding: '60px 0' }}
                />
              </Card>
            </div>
          </section>

          {/* Layout Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Layout Components
            </h2>

            {/* Basic Layout */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Layout with Header and Content
              </h3>
              <Card>
                <div style={{ height: '200px', border: '1px solid var(--border)' }}>
                  <Layout>
                    <Layout.Header className="bg-gray-800 text-white flex items-center px-4">
                      Header
                    </Layout.Header>
                    <Layout.Content className="p-4">
                      Main Content Area
                    </Layout.Content>
                  </Layout>
                </div>
              </Card>
            </div>

            {/* Layout with Sider */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Layout with Sider
              </h3>
              <Card>
                <div style={{ height: '300px', border: '1px solid var(--border)' }}>
                  <Layout>
                    <Layout.Header className="bg-gray-800 text-white flex items-center px-4">
                      Header
                    </Layout.Header>
                    <div className="flex flex-1">
                      <Layout.Sider width={200} className="p-4 bg-gray-100">
                        <VStack gap="sm">
                          <div className="font-semibold">Navigation</div>
                          <div className="text-sm">Menu Item 1</div>
                          <div className="text-sm">Menu Item 2</div>
                          <div className="text-sm">Menu Item 3</div>
                        </VStack>
                      </Layout.Sider>
                      <Layout.Content className="p-4">
                        Main Content with Sidebar
                      </Layout.Content>
                    </div>
                  </Layout>
                </div>
              </Card>
            </div>

            {/* Layout with Custom Widths */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Layout with Custom Sider Width
              </h3>
              <Card>
                <div style={{ height: '250px', border: '1px solid var(--border)' }}>
                  <Layout>
                    <Layout.Header className="bg-blue-900 text-white flex items-center px-4">
                      Custom Width Example
                    </Layout.Header>
                    <div className="flex flex-1">
                      <Layout.Sider width={300} className="p-4 bg-blue-50">
                        <div className="font-semibold mb-2">Wide Sidebar (300px)</div>
                        <p className="text-sm text-[var(--text-muted)]">
                          This sidebar is wider than the default 200px.
                        </p>
                      </Layout.Sider>
                      <Layout.Content className="p-4">
                        <p>Content area adjusts automatically based on sidebar width.</p>
                      </Layout.Content>
                    </div>
                  </Layout>
                </div>
              </Card>
            </div>

            {/* Nested Layouts */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Nested Layout Example
              </h3>
              <Card>
                <div style={{ height: '350px', border: '1px solid var(--border)' }}>
                  <Layout>
                    <Layout.Header className="bg-purple-900 text-white flex items-center px-4">
                      Application Header
                    </Layout.Header>
                    <div className="flex flex-1">
                      <Layout.Sider width={180} className="bg-purple-50">
                        <Menu
                          mode="vertical"
                          selectedKeys={['dashboard']}
                          items={[
                            { key: 'dashboard', label: 'Dashboard' },
                            { key: 'products', label: 'Products' },
                            { key: 'settings', label: 'Settings' },
                          ]}
                        />
                      </Layout.Sider>
                      <Layout.Content className="p-6">
                        <VStack gap="md">
                          <h3 className="text-lg font-semibold m-0">Page Title</h3>
                          <Card title="Nested Card">
                            <p className="text-[var(--text-muted)]">
                              This demonstrates how Layout components can contain other UI components
                              like cards, menus, and content sections.
                            </p>
                          </Card>
                          <HStack gap="sm">
                            <Button variant="primary" size="small">Action 1</Button>
                            <Button variant="default" size="small">Action 2</Button>
                          </HStack>
                        </VStack>
                      </Layout.Content>
                    </div>
                  </Layout>
                </div>
              </Card>
            </div>
          </section>

          {/* Dropdown Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Dropdown Component
            </h2>

            {/* Basic Dropdown with Button */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Dropdown with Button (Click Trigger)
              </h3>
              <Card>
                <HStack gap="md" align="center">
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'edit', label: 'Edit', onClick: () => logDropdownAction('Edit clicked') },
                        { key: 'duplicate', label: 'Duplicate', onClick: () => logDropdownAction('Duplicate clicked') },
                        { key: 'divider-1', label: '', type: 'divider' },
                        { key: 'delete', label: 'Delete', onClick: () => logDropdownAction('Delete clicked') },
                      ],
                    }}
                    placement="bottomLeft"
                    trigger="click"
                  >
                    <Button variant="default">Actions</Button>
                  </Dropdown>
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'profile', label: 'Profile', onClick: () => logDropdownAction('Profile clicked') },
                        { key: 'settings', label: 'Settings', onClick: () => logDropdownAction('Settings clicked') },
                        { key: 'divider-1', label: '', type: 'divider' },
                        { key: 'logout', label: 'Logout', onClick: () => logDropdownAction('Logout clicked') },
                      ],
                    }}
                    placement="bottomRight"
                    trigger="click"
                  >
                    <Button variant="primary" icon={<MdPerson />}>
                      User Menu
                    </Button>
                  </Dropdown>
                </HStack>
              </Card>
            </div>

            {/* Dropdown with Avatar */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Dropdown with Avatar and HStack
              </h3>
              <Card>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'profile', label: 'View Profile', onClick: () => logDropdownAction('View Profile') },
                      { key: 'settings', label: 'Account Settings', onClick: () => logDropdownAction('Account Settings') },
                      { key: 'divider-1', label: '', type: 'divider' },
                      { key: 'logout', label: 'Sign Out', onClick: () => logDropdownAction('Sign Out') },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <HStack gap="sm" align="center" className="cursor-pointer">
                    <Avatar size="small" icon={<FaUser />} />
                    <span>John Doe</span>
                  </HStack>
                </Dropdown>
              </Card>
            </div>

            {/* Dropdown Placements */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Different Placements
              </h3>
              <Card>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">Bottom Left</p>
                    <Dropdown
                      menu={{
                        items: [
                          { key: '1', label: 'Option 1', onClick: () => logDropdownAction('Option 1') },
                          { key: '2', label: 'Option 2', onClick: () => logDropdownAction('Option 2') },
                          { key: '3', label: 'Option 3', onClick: () => logDropdownAction('Option 3') },
                        ],
                      }}
                      placement="bottomLeft"
                    >
                      <Button size="small">Bottom Left</Button>
                    </Dropdown>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">Bottom Right</p>
                    <Dropdown
                      menu={{
                        items: [
                          { key: '1', label: 'Option 1', onClick: () => logDropdownAction('Option 1') },
                          { key: '2', label: 'Option 2', onClick: () => logDropdownAction('Option 2') },
                          { key: '3', label: 'Option 3', onClick: () => logDropdownAction('Option 3') },
                        ],
                      }}
                      placement="bottomRight"
                    >
                      <Button size="small">Bottom Right</Button>
                    </Dropdown>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">Top Left</p>
                    <Dropdown
                      menu={{
                        items: [
                          { key: '1', label: 'Option 1', onClick: () => logDropdownAction('Option 1') },
                          { key: '2', label: 'Option 2', onClick: () => logDropdownAction('Option 2') },
                          { key: '3', label: 'Option 3', onClick: () => logDropdownAction('Option 3') },
                        ],
                      }}
                      placement="topLeft"
                    >
                      <Button size="small">Top Left</Button>
                    </Dropdown>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">Top Right</p>
                    <Dropdown
                      menu={{
                        items: [
                          { key: '1', label: 'Option 1', onClick: () => logDropdownAction('Option 1') },
                          { key: '2', label: 'Option 2', onClick: () => logDropdownAction('Option 2') },
                          { key: '3', label: 'Option 3', onClick: () => logDropdownAction('Option 3') },
                        ],
                      }}
                      placement="topRight"
                    >
                      <Button size="small">Top Right</Button>
                    </Dropdown>
                  </div>
                </div>
              </Card>
            </div>

            {/* Dropdown with Disabled Items */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Disabled Items
              </h3>
              <Card>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'enabled1', label: 'Enabled Option', onClick: () => logDropdownAction('Enabled 1') },
                      { key: 'disabled1', label: 'Disabled Option', disabled: true },
                      { key: 'divider-1', label: '', type: 'divider' },
                      { key: 'enabled2', label: 'Another Enabled', onClick: () => logDropdownAction('Enabled 2') },
                      { key: 'disabled2', label: 'Another Disabled', disabled: true },
                    ],
                  }}
                >
                  <Button variant="default">Mixed States</Button>
                </Dropdown>
              </Card>
            </div>

            {/* Action Log */}
            {dropdownLog.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                  Recent Actions
                </h3>
                <Card>
                  <VStack gap="xs">
                    {dropdownLog.map((action, index) => (
                      <div key={index} className="text-sm text-[var(--text-muted)]">
                        {action}
                      </div>
                    ))}
                  </VStack>
                </Card>
              </div>
            )}
          </section>

          {/* Menu Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Menu Component
            </h2>

            {/* Horizontal Menu */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Horizontal Menu
              </h3>
              <Card>
                <Menu
                  mode="horizontal"
                  selectedKeys={['dashboard']}
                  items={[
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'products', label: 'Products' },
                    { key: 'settings', label: 'Settings' },
                    { key: 'disabled', label: 'Disabled', disabled: true },
                  ]}
                />
              </Card>
            </div>

            {/* Vertical Menu */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Vertical Menu
              </h3>
              <Card style={{ maxWidth: '300px' }}>
                <Menu
                  mode="vertical"
                  selectedKeys={['settings']}
                  items={[
                    { key: 'dashboard', label: <><MdDashboard className="inline mr-2" /> Dashboard</> },
                    { key: 'products', label: <><MdFolder className="inline mr-2" /> Products</> },
                    { key: 'settings', label: <><MdSettings className="inline mr-2" /> Settings</> },
                    { key: 'disabled', label: <><MdLogout className="inline mr-2" /> Disabled</>, disabled: true },
                  ]}
                />
              </Card>
            </div>

            {/* Vertical Menu with Different Selection */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Vertical Menu with Different Selection
              </h3>
              <Card style={{ maxWidth: '300px' }}>
                <Menu
                  mode="vertical"
                  selectedKeys={['products']}
                  items={[
                    { key: 'dashboard', label: <><MdDashboard className="inline mr-2" /> Dashboard</> },
                    { key: 'products', label: <><MdFolder className="inline mr-2" /> Products</> },
                    { key: 'settings', label: <><MdSettings className="inline mr-2" /> Settings</> },
                    { key: 'disabled', label: <><MdLogout className="inline mr-2" /> Disabled</>, disabled: true },
                  ]}
                />
              </Card>
            </div>
          </section>

          {/* Breadcrumb Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Breadcrumb Component
            </h2>

            {/* Basic Breadcrumb */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Breadcrumb
              </h3>
              <Card>
                <Breadcrumb
                  items={[
                    { title: 'Home' },
                    { title: 'Products' },
                    { title: 'Product Detail' },
                  ]}
                />
              </Card>
            </div>

            {/* Breadcrumb with Links */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With React Router Links
              </h3>
              <Card>
                <Breadcrumb
                  items={[
                    { title: <Link to="/">Home</Link> },
                    { title: <Link to="/products">Products</Link> },
                    { title: 'Product XYZ' },
                  ]}
                />
              </Card>
            </div>

            {/* Breadcrumb with Icons */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Icons
              </h3>
              <Card>
                <Breadcrumb
                  items={[
                    { title: <><MdHome /> Home</> },
                    { title: <><MdFolder /> Documents</> },
                    { title: <><MdDescription /> Readme.md</> },
                  ]}
                />
              </Card>
            </div>

            {/* Long Breadcrumb */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Long Breadcrumb Chain
              </h3>
              <Card>
                <Breadcrumb
                  items={[
                    { title: 'Home' },
                    { title: 'Products' },
                    { title: 'Category' },
                    { title: 'Subcategory' },
                    { title: 'Item' },
                    { title: 'Details' },
                  ]}
                />
              </Card>
            </div>
          </section>

          {/* Avatar Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Avatar Component
            </h2>

            {/* Avatar Sizes */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Sizes
              </h3>
              <HStack gap="lg" align="center">
                <VStack gap="sm" align="center">
                  <Avatar size="small" icon={<FaUser />} />
                  <span className="text-sm text-[var(--text-muted)]">Small</span>
                </VStack>
                <VStack gap="sm" align="center">
                  <Avatar size="medium" icon={<FaUser />} />
                  <span className="text-sm text-[var(--text-muted)]">Medium</span>
                </VStack>
                <VStack gap="sm" align="center">
                  <Avatar size="large" icon={<FaUser />} />
                  <span className="text-sm text-[var(--text-muted)]">Large</span>
                </VStack>
              </HStack>
            </div>

            {/* Avatar Variants */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Variants
              </h3>
              <HStack gap="lg" align="center">
                <VStack gap="sm" align="center">
                  <Avatar size="medium" icon={<FaUser />} />
                  <span className="text-sm text-[var(--text-muted)]">With Icon</span>
                </VStack>
                <VStack gap="sm" align="center">
                  <Avatar size="medium" icon={<MdPerson />} />
                  <span className="text-sm text-[var(--text-muted)]">Different Icon</span>
                </VStack>
                <VStack gap="sm" align="center">
                  <Avatar size="medium" src="https://via.placeholder.com/40" />
                  <span className="text-sm text-[var(--text-muted)]">With Image</span>
                </VStack>
              </HStack>
            </div>

            {/* Avatar in Context */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                In Context (User Menu)
              </h3>
              <Card>
                <HStack gap="sm" align="center" className="cursor-pointer">
                  <Avatar size="small" icon={<FaUser />} />
                  <span>John Doe</span>
                </HStack>
              </Card>
            </div>
          </section>

          {/* HStack & VStack Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              HStack & VStack Components
            </h2>

            {/* HStack Gap Sizes */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                HStack - Gap Sizes
              </h3>
              <VStack gap="md">
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">gap="xs"</p>
                  <HStack gap="xs">
                    <Button size="small">Button 1</Button>
                    <Button size="small">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </HStack>
                </Card>
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">gap="sm"</p>
                  <HStack gap="sm">
                    <Button size="small">Button 1</Button>
                    <Button size="small">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </HStack>
                </Card>
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">gap="md" (default)</p>
                  <HStack gap="md">
                    <Button size="small">Button 1</Button>
                    <Button size="small">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </HStack>
                </Card>
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">gap="lg"</p>
                  <HStack gap="lg">
                    <Button size="small">Button 1</Button>
                    <Button size="small">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </HStack>
                </Card>
              </VStack>
            </div>

            {/* HStack Alignment */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                HStack - Alignment
              </h3>
              <VStack gap="md">
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">align="center"</p>
                  <HStack gap="sm" align="center" className="h-20 bg-gray-100 p-4">
                    <Button size="small">Small</Button>
                    <Button size="large">Large</Button>
                    <Button size="small">Small</Button>
                  </HStack>
                </Card>
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">align="end"</p>
                  <HStack gap="sm" align="end" className="h-20 bg-gray-100 p-4">
                    <Button size="small">Small</Button>
                    <Button size="large">Large</Button>
                    <Button size="small">Small</Button>
                  </HStack>
                </Card>
              </VStack>
            </div>

            {/* HStack Justify */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                HStack - Justify
              </h3>
              <VStack gap="md">
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">justify="between"</p>
                  <HStack gap="sm" justify="between" className="bg-gray-100 p-4">
                    <Button size="small">Left</Button>
                    <Button size="small">Middle</Button>
                    <Button size="small">Right</Button>
                  </HStack>
                </Card>
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">justify="center"</p>
                  <HStack gap="sm" justify="center" className="bg-gray-100 p-4">
                    <Button size="small">Button 1</Button>
                    <Button size="small">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </HStack>
                </Card>
              </VStack>
            </div>

            {/* VStack Examples */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                VStack - Vertical Layout
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">gap="sm", align="start"</p>
                  <VStack gap="sm" align="start">
                    <Button size="small">Button 1</Button>
                    <Button size="medium">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </VStack>
                </Card>
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">gap="md", align="center"</p>
                  <VStack gap="md" align="center">
                    <Button size="small">Button 1</Button>
                    <Button size="medium">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </VStack>
                </Card>
                <Card>
                  <p className="text-sm text-[var(--text-muted)] mb-2">gap="lg", align="stretch"</p>
                  <VStack gap="lg" align="stretch">
                    <Button size="small">Button 1</Button>
                    <Button size="small">Button 2</Button>
                    <Button size="small">Button 3</Button>
                  </VStack>
                </Card>
              </div>
            </div>

            {/* Nested Stacks */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Nested Stacks
              </h3>
              <Card>
                <VStack gap="md">
                  <HStack gap="sm" justify="between">
                    <Tag color="blue">Header Section</Tag>
                    <Button size="small" variant="text" icon={<MdSettings />} />
                  </HStack>
                  <HStack gap="sm">
                    <Button variant="primary" size="small">Save</Button>
                    <Button variant="default" size="small">Cancel</Button>
                    <Button variant="danger" size="small">Delete</Button>
                  </HStack>
                  <VStack gap="sm">
                    <Input placeholder="Field 1" size="small" />
                    <Input placeholder="Field 2" size="small" />
                  </VStack>
                </VStack>
              </Card>
            </div>
          </section>

          {/* Table Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Table Component
            </h2>

            {/* Basic Table */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Table
              </h3>
              <Table
                columns={[
                  { key: 'id', title: 'ID', dataIndex: 'id', width: 80 },
                  { key: 'name', title: 'Name', dataIndex: 'name' },
                  { key: 'status', title: 'Status', dataIndex: 'status', width: 100 },
                  { key: 'date', title: 'Created', dataIndex: 'created', width: 120 },
                ]}
                dataSource={[
                  { id: 1, name: 'Product Alpha', status: 'Active', created: '2024-01-15' },
                  { id: 2, name: 'Product Beta', status: 'Active', created: '2024-02-20' },
                  { id: 3, name: 'Product Gamma', status: 'Inactive', created: '2024-03-10' },
                ]}
                rowKey="id"
                pagination={false}
              />
            </div>

            {/* Table with Pagination */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Pagination
              </h3>
              <Table
                columns={[
                  { key: 'id', title: 'ID', dataIndex: 'id', width: 80 },
                  { key: 'name', title: 'Name', dataIndex: 'name' },
                  { key: 'category', title: 'Category', dataIndex: 'category', width: 150 },
                  { key: 'price', title: 'Price', dataIndex: 'price', width: 100 },
                ]}
                dataSource={paginatedTableData}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            </div>

            {/* Table with Sorting */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Sortable Columns
              </h3>
              <Table
                columns={[
                  {
                    key: 'priority',
                    title: 'Priority',
                    dataIndex: 'priority',
                    width: 100,
                    sorter: (a: { priority: number }, b: { priority: number }) => a.priority - b.priority,
                  },
                  { key: 'task', title: 'Task', dataIndex: 'task' },
                  {
                    key: 'assignee',
                    title: 'Assignee',
                    dataIndex: 'assignee',
                    width: 150,
                    sorter: (a: { assignee: string }, b: { assignee: string }) => a.assignee.localeCompare(b.assignee),
                  },
                ]}
                dataSource={[
                  { id: 1, priority: 1, task: 'Fix critical bug', assignee: 'Alice' },
                  { id: 2, priority: 3, task: 'Update documentation', assignee: 'Charlie' },
                  { id: 3, priority: 2, task: 'Implement feature', assignee: 'Bob' },
                  { id: 4, priority: 1, task: 'Security patch', assignee: 'Diana' },
                  { id: 5, priority: 2, task: 'Code review', assignee: 'Eve' },
                ]}
                rowKey="id"
                pagination={false}
              />
            </div>

            {/* Table with Custom Rendering */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Custom Cell Rendering (Tags, Links, Dates)
              </h3>
              <Table
                columns={[
                  {
                    key: 'name',
                    title: 'Product Name',
                    dataIndex: 'name',
                    render: (value, record) => (
                      <Link to={`/products/${record.id}`} className="text-[var(--primary)] hover:underline">
                        {value as string}
                      </Link>
                    ),
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    dataIndex: 'status',
                    width: 120,
                    render: (value: unknown) => {
                      const status = value as string;
                      const colorMap: Record<string, 'green' | 'orange' | 'blue' | 'red'> = {
                        'Active': 'green',
                        'Pending': 'orange',
                        'Draft': 'blue',
                        'Archived': 'red',
                      };
                      return <Tag color={colorMap[status]}>{status}</Tag>;
                    },
                  },
                  {
                    key: 'created',
                    title: 'Created',
                    dataIndex: 'created',
                    width: 120,
                    render: (value: unknown) => new Date(value as string).toLocaleDateString(),
                  },
                ]}
                dataSource={[
                  { id: 1, name: 'Premium Widget', status: 'Active', created: '2024-01-15' },
                  { id: 2, name: 'Basic Package', status: 'Pending', created: '2024-02-20' },
                  { id: 3, name: 'Enterprise Suite', status: 'Active', created: '2024-03-10' },
                  { id: 4, name: 'Starter Kit', status: 'Draft', created: '2024-03-15' },
                  { id: 5, name: 'Legacy System', status: 'Archived', created: '2023-12-01' },
                ]}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </div>

            {/* Table with Actions */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                With Action Buttons
              </h3>
              <Table
                columns={[
                  { key: 'name', title: 'Name', dataIndex: 'name' },
                  { key: 'email', title: 'Email', dataIndex: 'email' },
                  {
                    key: 'actions',
                    title: 'Actions',
                    width: 150,
                    render: (_, record) => (
                      <HStack gap="sm">
                        <Button
                          variant="text"
                          icon={<MdEdit />}
                          size="small"
                          onClick={() => alert(`Edit ${record.name}`)}
                        />
                        <Button
                          variant="danger"
                          icon={<MdDelete />}
                          size="small"
                          onClick={() => alert(`Delete ${record.name}`)}
                        />
                      </HStack>
                    ),
                  },
                ]}
                dataSource={[
                  { id: 1, name: 'John Doe', email: 'john@example.com' },
                  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
                  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
                ]}
                rowKey="id"
                pagination={false}
              />
            </div>

            {/* Empty Table */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Empty State
              </h3>
              <Table
                columns={[
                  { key: 'name', title: 'Name', dataIndex: 'name' },
                  { key: 'description', title: 'Description', dataIndex: 'description' },
                  { key: 'status', title: 'Status', dataIndex: 'status' },
                ]}
                dataSource={[]}
                rowKey="id"
                pagination={false}
                empty={<Empty description="No products found" />}
              />
            </div>

            {/* Loading Table */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Loading State
              </h3>
              <Table
                columns={[
                  { key: 'name', title: 'Name', dataIndex: 'name' },
                  { key: 'description', title: 'Description', dataIndex: 'description' },
                  { key: 'status', title: 'Status', dataIndex: 'status' },
                ]}
                dataSource={[]}
                rowKey="id"
                pagination={false}
                loading={true}
              />
            </div>
          </section>

          {/* Form Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Form Component
            </h2>

            {/* Basic Form */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Form
              </h3>
              <Card>
                <Form form={basicForm} onSubmit={handleBasicSubmit} layout="vertical">
                  <div className="space-y-4">
                    <Form.Item name="name" label="Name" required>
                      {({ field, error }) => (
                        <Input
                          {...field}
                          placeholder="Enter your name"
                          error={!!error}
                        />
                      )}
                    </Form.Item>

                    <Form.Item name="email" label="Email" required>
                      {({ field, error }) => (
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          error={!!error}
                        />
                      )}
                    </Form.Item>

                    <Form.Item name="age" label="Age">
                      {({ field }) => (
                        <InputNumber
                          value={field.value}
                          onChange={field.onChange}
                          min={1}
                          max={120}
                          placeholder="Enter your age"
                        />
                      )}
                    </Form.Item>

                    <Button type="submit" variant="primary">
                      Submit
                    </Button>
                  </div>
                </Form>
              </Card>
            </div>

            {/* Form with Validation */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Form with Validation
              </h3>
              <Card>
                <Form form={validationForm} onSubmit={handleValidationSubmit} layout="vertical">
                  <div className="space-y-4">
                    <Form.Item
                      name="username"
                      label="Username"
                      required
                      rules={{
                        required: true,
                        minLength: { value: 3, message: 'Username must be at least 3 characters' },
                      }}
                    >
                      {({ field, error }) => (
                        <Input
                          {...field}
                          placeholder="Enter username"
                          error={!!error}
                        />
                      )}
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label="Password"
                      required
                      rules={{
                        required: true,
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      }}
                    >
                      {({ field, error }) => (
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter password"
                          error={!!error}
                        />
                      )}
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="Confirm Password"
                      required
                      rules={{
                        required: true,
                        validate: (value) => {
                          const password = validationForm.getValues('password');
                          return value === password || 'Passwords do not match';
                        },
                      }}
                    >
                      {({ field, error }) => (
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm password"
                          error={!!error}
                        />
                      )}
                    </Form.Item>

                    <Button type="submit" variant="primary">
                      Register
                    </Button>
                  </div>
                </Form>
              </Card>
            </div>

            {/* Form with Select */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Form with Select Component
              </h3>
              <Card>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[var(--text)] text-[var(--font-size-base)] font-medium mb-1">
                      Status
                    </label>
                    <Select
                      placeholder="Select a status"
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'locked', label: 'Locked' },
                        { value: 'in-design', label: 'In Design' },
                        { value: 'implemented', label: 'Implemented' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text)] text-[var(--font-size-base)] font-medium mb-1">
                      Type (with search)
                    </label>
                    <Select
                      placeholder="Select a type"
                      showSearch
                      options={[
                        { value: 'functional', label: 'Functional Requirement' },
                        { value: 'non-functional', label: 'Non-Functional Requirement' },
                        { value: 'constraint', label: 'Constraint' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text)] text-[var(--font-size-base)] font-medium mb-1">
                      Role (small size)
                    </label>
                    <Select
                      size="small"
                      placeholder="Select a role"
                      options={[
                        { value: 'admin', label: 'Administrator' },
                        { value: 'developer', label: 'Developer' },
                        { value: 'designer', label: 'Designer' },
                        { value: 'viewer', label: 'Viewer' },
                      ]}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Modal Component Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Modal Component
            </h2>

            {/* Basic Modal */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Basic Modal
              </h3>
              <Button variant="primary" onClick={() => setIsBasicModalOpen(true)}>
                Open Basic Modal
              </Button>
              <Modal
                open={isBasicModalOpen}
                onCancel={() => setIsBasicModalOpen(false)}
                onOk={() => {
                  alert('OK clicked!');
                  setIsBasicModalOpen(false);
                }}
                title="Basic Modal"
              >
                <p className="text-[var(--text)]">
                  This is a basic modal with a title, content, and footer buttons.
                </p>
                <p className="text-[var(--text-muted)] mt-2">
                  You can close it by clicking OK, Cancel, the X button, clicking outside, or pressing ESC.
                </p>
              </Modal>
            </div>

            {/* Modal with Form */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Modal with Form (Create/Edit Pattern)
              </h3>
              <HStack gap="md">
                <Button variant="primary" icon={<MdAdd />} onClick={handleCreateUser}>
                  Create User
                </Button>
                <Button variant="default" icon={<MdEdit />} onClick={handleEditUser}>
                  Edit User
                </Button>
              </HStack>

              <Modal
                open={isFormModalOpen}
                onCancel={() => {
                  setIsFormModalOpen(false);
                  modalForm.reset();
                  setEditingUser(null);
                }}
                onOk={handleModalOk}
                title={editingUser ? 'Edit User' : 'Create User'}
                okText={editingUser ? 'Update' : 'Create'}
                width={600}
              >
                <Form form={modalForm} layout="vertical">
                  <div className="space-y-4">
                    <Form.Item name="name" label="Name" required>
                      {({ field, error }) => (
                        <Input
                          {...field}
                          placeholder="Enter name"
                          error={!!error}
                        />
                      )}
                    </Form.Item>

                    <Form.Item name="email" label="Email" required>
                      {({ field, error }) => (
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter email"
                          error={!!error}
                        />
                      )}
                    </Form.Item>

                    <Form.Item name="role" label="Role" required>
                      {({ field, error }) => (
                        <Select
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select role"
                          error={!!error}
                          options={[
                            { value: 'admin', label: 'Administrator' },
                            { value: 'developer', label: 'Developer' },
                            { value: 'designer', label: 'Designer' },
                            { value: 'viewer', label: 'Viewer' },
                          ]}
                        />
                      )}
                    </Form.Item>

                    <Form.Item name="age" label="Age">
                      {({ field }) => (
                        <InputNumber
                          value={field.value}
                          onChange={field.onChange}
                          min={18}
                          max={100}
                          placeholder="Enter age"
                        />
                      )}
                    </Form.Item>
                  </div>
                </Form>
              </Modal>
            </div>

            {/* Different Modal Sizes */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Modal Sizes
              </h3>
              <HStack gap="md">
                <Button
                  variant="default"
                  onClick={() => {
                    // Placeholder for modal implementation
                  }}
                >
                  Small (440px)
                </Button>
                <Button
                  variant="default"
                  onClick={() => setIsBasicModalOpen(true)}
                >
                  Medium (520px - default)
                </Button>
                <Button variant="default">
                  Large (600px)
                </Button>
              </HStack>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Default modal width is 520px. The form modal above uses 600px.
              </p>
            </div>
          </section>

          {/* Tabs Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Tabs
            </h2>

            {/* Basic Line Tabs */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Basic Line Tabs
              </h3>
              <Card>
                <Tabs
                  defaultActiveKey="tab1"
                  items={[
                    {
                      key: 'tab1',
                      label: 'Tab 1',
                      children: (
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Content of Tab 1</h4>
                          <p className="text-[var(--text-muted)]">
                            This is the content for tab 1. Line tabs use a simple underline style
                            to indicate the active tab.
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'tab2',
                      label: 'Tab 2',
                      children: (
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Content of Tab 2</h4>
                          <p className="text-[var(--text-muted)]">
                            Line tabs are the default type and work well for simple use cases.
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'tab3',
                      label: 'Tab 3',
                      children: (
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Content of Tab 3</h4>
                          <p className="text-[var(--text-muted)]">
                            Use arrow keys to navigate between tabs when focused.
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>

            {/* Card Tabs */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Card Tabs
              </h3>
              <Card>
                <Tabs
                  type="card"
                  defaultActiveKey="card1"
                  items={[
                    {
                      key: 'card1',
                      label: 'Overview',
                      children: (
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Overview</h4>
                          <p className="text-[var(--text-muted)]">
                            Card tabs provide a more prominent visual appearance with bordered backgrounds.
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'card2',
                      label: 'Details',
                      children: (
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Details</h4>
                          <p className="text-[var(--text-muted)]">
                            Active cards have a white background and connect to the content area.
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'card3',
                      label: 'Settings',
                      children: (
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Settings</h4>
                          <p className="text-[var(--text-muted)]">
                            This tab type is great for settings pages and dashboards.
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>

            {/* Editable Card Tabs (Closeable) */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Editable Card Tabs (Document Management)
              </h3>
              <Card>
                <EditableTabsDemo />
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Editable tabs allow closing individual tabs. Try closing tabs to see the behavior.
                The overview tab cannot be closed.
              </p>
            </div>

            {/* Controlled Tabs */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Controlled Tabs
              </h3>
              <Card>
                <ControlledTabsDemo />
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Controlled tabs allow external state management via activeKey and onChange props.
              </p>
            </div>

            {/* Full-Height Tabs */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Full-Height Layout
              </h3>
              <Card className="p-0" style={{ height: '400px' }}>
                <Tabs
                  type="editable-card"
                  defaultActiveKey="content1"
                  hideAdd
                  style={{ height: '100%' }}
                  items={[
                    {
                      key: 'content1',
                      label: 'Long Content 1',
                      closable: false,
                      children: (
                        <div className="p-4 space-y-4">
                          <h4 className="font-medium">Scrollable Content</h4>
                          {Array.from({ length: 20 }).map((_, i) => (
                            <p key={i} className="text-[var(--text-muted)]">
                              This is paragraph {i + 1}. The tab content area is scrollable when
                              content exceeds the available space. This allows for full-height
                              layouts that work well in application interfaces.
                            </p>
                          ))}
                        </div>
                      ),
                    },
                    {
                      key: 'content2',
                      label: 'Long Content 2',
                      closable: true,
                      children: (
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Another Tab</h4>
                          <p className="text-[var(--text-muted)]">
                            Each tab manages its own scroll position independently.
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Tabs component supports full-height layouts with scrollable content areas.
              </p>
            </div>

            {/* Disabled Tabs */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Disabled Tabs
              </h3>
              <Card>
                <Tabs
                  defaultActiveKey="enabled1"
                  items={[
                    {
                      key: 'enabled1',
                      label: 'Enabled Tab',
                      children: (
                        <div className="p-4">
                          <p className="text-[var(--text-muted)]">
                            This tab is enabled and can be selected.
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'disabled',
                      label: 'Disabled Tab',
                      disabled: true,
                      children: (
                        <div className="p-4">
                          <p className="text-[var(--text-muted)]">
                            This content won't be shown as the tab is disabled.
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'enabled2',
                      label: 'Another Enabled Tab',
                      children: (
                        <div className="p-4">
                          <p className="text-[var(--text-muted)]">
                            Disabled tabs have reduced opacity and cannot be selected.
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>
          </section>

          {/* Descriptions Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Descriptions
            </h2>

            {/* Single Column Bordered */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Single Column (Bordered)
              </h3>
              <Card>
                <Descriptions title="User Profile" bordered column={1}>
                  <Descriptions.Item label="Name">John Doe</Descriptions.Item>
                  <Descriptions.Item label="Email">john.doe@example.com</Descriptions.Item>
                  <Descriptions.Item label="Phone">+1 (555) 123-4567</Descriptions.Item>
                  <Descriptions.Item label="Address">
                    123 Main St, San Francisco, CA 94102
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color="green">Active</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Single column layout with bordered table style, ideal for detailed information display.
              </p>
            </div>

            {/* Multi-Column with Spanning */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Multi-Column with Spanning
              </h3>
              <Card>
                <Descriptions title="Product Details" bordered column={2}>
                  <Descriptions.Item label="Product Name" span={2}>
                    Ultra HD 4K Monitor
                  </Descriptions.Item>
                  <Descriptions.Item label="SKU">MON-4K-27-001</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color="green">In Stock</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Price">$599.99</Descriptions.Item>
                  <Descriptions.Item label="Quantity">42 units</Descriptions.Item>
                  <Descriptions.Item label="Description" span={2}>
                    Professional-grade 27-inch 4K monitor with HDR support,
                    144Hz refresh rate, and USB-C connectivity. Perfect for
                    creative professionals and gaming enthusiasts.
                  </Descriptions.Item>
                  <Descriptions.Item label="Manufacturer">TechCorp</Descriptions.Item>
                  <Descriptions.Item label="Warranty">3 years</Descriptions.Item>
                </Descriptions>
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Two-column layout with span={2} for items that need full width.
              </p>
            </div>

            {/* Three Column Layout */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Three Column Layout
              </h3>
              <Card>
                <Descriptions title="Server Configuration" bordered column={3}>
                  <Descriptions.Item label="Hostname">prod-server-01</Descriptions.Item>
                  <Descriptions.Item label="IP Address">192.168.1.100</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color="green">Running</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="CPU">8 cores</Descriptions.Item>
                  <Descriptions.Item label="Memory">32 GB</Descriptions.Item>
                  <Descriptions.Item label="Disk">512 GB SSD</Descriptions.Item>
                  <Descriptions.Item label="OS" span={3}>
                    Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-76-generic x86_64)
                  </Descriptions.Item>
                  <Descriptions.Item label="Uptime">45 days</Descriptions.Item>
                  <Descriptions.Item label="Load">2.5%</Descriptions.Item>
                  <Descriptions.Item label="Region">US-West</Descriptions.Item>
                </Descriptions>
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Three-column layout efficiently displays multiple fields in a compact format.
              </p>
            </div>

            {/* Unborderd Variant */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Without Borders
              </h3>
              <Card>
                <Descriptions title="Basic Information" column={2}>
                  <Descriptions.Item label="Created">2024-01-15</Descriptions.Item>
                  <Descriptions.Item label="Updated">2024-03-20</Descriptions.Item>
                  <Descriptions.Item label="Author">Jane Smith</Descriptions.Item>
                  <Descriptions.Item label="Version">2.1.0</Descriptions.Item>
                </Descriptions>
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Borderless style for a cleaner, more minimal appearance.
              </p>
            </div>

            {/* Size Variants */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Size Variants
              </h3>
              <VStack gap="md">
                <Card>
                  <Descriptions title="Small Size" bordered column={2} size="small">
                    <Descriptions.Item label="Field 1">Value 1</Descriptions.Item>
                    <Descriptions.Item label="Field 2">Value 2</Descriptions.Item>
                  </Descriptions>
                </Card>
                <Card>
                  <Descriptions title="Medium Size (Default)" bordered column={2} size="medium">
                    <Descriptions.Item label="Field 1">Value 1</Descriptions.Item>
                    <Descriptions.Item label="Field 2">Value 2</Descriptions.Item>
                  </Descriptions>
                </Card>
                <Card>
                  <Descriptions title="Large Size" bordered column={2} size="large">
                    <Descriptions.Item label="Field 1">Value 1</Descriptions.Item>
                    <Descriptions.Item label="Field 2">Value 2</Descriptions.Item>
                  </Descriptions>
                </Card>
              </VStack>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Three size variants (small, medium, large) control padding and spacing.
              </p>
            </div>

            {/* With Items Array API */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-[var(--text)]">
                Items Array API
              </h3>
              <Card>
                <Descriptions
                  title="Alternative API"
                  bordered
                  column={2}
                  items={[
                    { label: 'Field 1', children: 'Value 1' },
                    { label: 'Field 2', children: 'Value 2' },
                    { label: 'Full Width Field', children: 'This spans the entire row', span: 2 },
                    { label: 'Field 3', children: 'Value 3' },
                    { label: 'Field 4', children: <Tag color="blue">Tagged Value</Tag> },
                  ]}
                />
              </Card>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Alternative API using items array instead of JSX children.
              </p>
            </div>
          </section>

          {/* Typography Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Typography System
            </h2>

            {/* Typography Scale */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Font Size Scale
              </h3>
              <Card>
                <VStack gap="md">
                  <div style={{ fontSize: 'var(--font-size-xs)' }}>Extra Small (12px) - Caption text</div>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>Small (13px) - Labels and buttons</div>
                  <div style={{ fontSize: 'var(--font-size-base)' }}>Base (14px) - Body text</div>
                  <div style={{ fontSize: 'var(--font-size-lg)' }}>Large (16px) - Large body text</div>
                  <div style={{ fontSize: 'var(--font-size-xl)' }}>Extra Large (18px) - Subheadings</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)' }}>2XL (20px) - Small headings</div>
                  <div style={{ fontSize: 'var(--font-size-3xl)' }}>3XL (24px) - Medium headings</div>
                  <div style={{ fontSize: 'var(--font-size-4xl)' }}>4XL (30px) - Large headings</div>
                  <div style={{ fontSize: 'var(--font-size-5xl)' }}>5XL (36px) - Extra large headings</div>
                  <div style={{ fontSize: 'var(--font-size-6xl)' }}>6XL (48px) - Display text</div>
                </VStack>
              </Card>
            </div>

            {/* Heading Hierarchy */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Heading Hierarchy
              </h3>
              <Card>
                <VStack gap="lg">
                  <div>
                    <h1 style={{
                      fontSize: 'var(--typography-h1-size)',
                      lineHeight: 'var(--typography-h1-line-height)',
                      fontWeight: 'var(--typography-h1-weight)',
                      letterSpacing: 'var(--typography-h1-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Heading 1
                    </h1>
                    <p className="text-xs text-[var(--text-muted)] mt-1">36px, bold, tight spacing</p>
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: 'var(--typography-h2-size)',
                      lineHeight: 'var(--typography-h2-line-height)',
                      fontWeight: 'var(--typography-h2-weight)',
                      letterSpacing: 'var(--typography-h2-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Heading 2
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">30px, bold, tight spacing</p>
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: 'var(--typography-h3-size)',
                      lineHeight: 'var(--typography-h3-line-height)',
                      fontWeight: 'var(--typography-h3-weight)',
                      letterSpacing: 'var(--typography-h3-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Heading 3
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">24px, semibold, normal spacing</p>
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: 'var(--typography-h4-size)',
                      lineHeight: 'var(--typography-h4-line-height)',
                      fontWeight: 'var(--typography-h4-weight)',
                      letterSpacing: 'var(--typography-h4-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Heading 4
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">20px, semibold, normal spacing</p>
                  </div>
                  <div>
                    <h5 style={{
                      fontSize: 'var(--typography-h5-size)',
                      lineHeight: 'var(--typography-h5-line-height)',
                      fontWeight: 'var(--typography-h5-weight)',
                      letterSpacing: 'var(--typography-h5-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Heading 5
                    </h5>
                    <p className="text-xs text-[var(--text-muted)] mt-1">18px, medium, normal spacing</p>
                  </div>
                  <div>
                    <h6 style={{
                      fontSize: 'var(--typography-h6-size)',
                      lineHeight: 'var(--typography-h6-line-height)',
                      fontWeight: 'var(--typography-h6-weight)',
                      letterSpacing: 'var(--typography-h6-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Heading 6
                    </h6>
                    <p className="text-xs text-[var(--text-muted)] mt-1">16px, medium, normal spacing</p>
                  </div>
                </VStack>
              </Card>
            </div>

            {/* Body Text Variants */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Body Text Variants
              </h3>
              <Card>
                <VStack gap="md">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Body Large</div>
                    <p style={{
                      fontSize: 'var(--typography-body-lg-size)',
                      lineHeight: 'var(--typography-body-lg-line-height)',
                      fontWeight: 'var(--typography-body-lg-weight)',
                      color: 'var(--text)'
                    }}>
                      This is large body text (16px) with relaxed line height. It's ideal for important paragraphs or introductory content that needs to stand out while remaining comfortable to read.
                    </p>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Body Base (Default)</div>
                    <p style={{
                      fontSize: 'var(--typography-body-base-size)',
                      lineHeight: 'var(--typography-body-base-line-height)',
                      fontWeight: 'var(--typography-body-base-weight)',
                      color: 'var(--text)'
                    }}>
                      This is the default body text (14px) with normal line height. It's the most commonly used text style for general content, descriptions, and paragraphs throughout the application.
                    </p>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Body Small</div>
                    <p style={{
                      fontSize: 'var(--typography-body-sm-size)',
                      lineHeight: 'var(--typography-body-sm-line-height)',
                      fontWeight: 'var(--typography-body-sm-weight)',
                      color: 'var(--text)'
                    }}>
                      This is small body text (13px) with normal line height. Use it for secondary information or in contexts where space is limited but readability is still important.
                    </p>
                  </div>
                </VStack>
              </Card>
            </div>

            {/* UI Typography */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                UI Element Typography
              </h3>
              <Card>
                <VStack gap="md">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-2">Labels</div>
                    <label style={{
                      fontSize: 'var(--typography-label-size)',
                      lineHeight: 'var(--typography-label-line-height)',
                      fontWeight: 'var(--typography-label-weight)',
                      color: 'var(--text)',
                      display: 'block'
                    }}>
                      Form Label (13px, medium weight)
                    </label>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-2">Captions</div>
                    <div style={{
                      fontSize: 'var(--typography-caption-size)',
                      lineHeight: 'var(--typography-caption-line-height)',
                      fontWeight: 'var(--typography-caption-weight)',
                      color: 'var(--text-muted)'
                    }}>
                      Caption text (12px, normal weight) - Used for help text and descriptions
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-2">Overline</div>
                    <div style={{
                      fontSize: 'var(--typography-overline-size)',
                      lineHeight: 'var(--typography-overline-line-height)',
                      fontWeight: 'var(--typography-overline-weight)',
                      letterSpacing: 'var(--typography-overline-letter-spacing)',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)'
                    }}>
                      Overline Text
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">12px, semibold, wider spacing, uppercase</p>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-2">Button Typography</div>
                    <div style={{
                      fontSize: 'var(--typography-button-size)',
                      lineHeight: 'var(--typography-button-line-height)',
                      fontWeight: 'var(--typography-button-weight)',
                      color: 'var(--text)'
                    }}>
                      Button Text (14px, medium weight)
                    </div>
                  </div>
                </VStack>
              </Card>
            </div>

            {/* Display Typography */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Display Typography
              </h3>
              <Card>
                <VStack gap="lg">
                  <div>
                    <div style={{
                      fontSize: 'var(--typography-display-lg-size)',
                      lineHeight: 'var(--typography-display-lg-line-height)',
                      fontWeight: 'var(--typography-display-lg-weight)',
                      letterSpacing: 'var(--typography-display-lg-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Large Display
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">48px, extrabold, tighter spacing - For hero sections and landing pages</p>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 'var(--typography-display-md-size)',
                      lineHeight: 'var(--typography-display-md-line-height)',
                      fontWeight: 'var(--typography-display-md-weight)',
                      letterSpacing: 'var(--typography-display-md-letter-spacing)',
                      color: 'var(--text)'
                    }}>
                      Medium Display
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">36px, bold, tight spacing - For prominent headings</p>
                  </div>
                </VStack>
              </Card>
            </div>

            {/* Font Weights */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Font Weights
              </h3>
              <Card>
                <VStack gap="sm">
                  <div style={{ fontWeight: 'var(--font-weight-light)', color: 'var(--text)' }}>Light (300)</div>
                  <div style={{ fontWeight: 'var(--font-weight-normal)', color: 'var(--text)' }}>Normal (400)</div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text)' }}>Medium (500)</div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text)' }}>Semibold (600)</div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--text)' }}>Bold (700)</div>
                  <div style={{ fontWeight: 'var(--font-weight-extrabold)', color: 'var(--text)' }}>Extrabold (800)</div>
                </VStack>
              </Card>
            </div>

            {/* Line Heights */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Line Heights
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <div className="text-xs text-[var(--text-muted)] mb-2">None (1.0)</div>
                  <p style={{ lineHeight: 'var(--line-height-none)', color: 'var(--text)' }}>
                    This text uses no line height spacing.
                    Lines are very close together.
                    Used rarely for compact displays.
                  </p>
                </Card>
                <Card>
                  <div className="text-xs text-[var(--text-muted)] mb-2">Tight (1.25)</div>
                  <p style={{ lineHeight: 'var(--line-height-tight)', color: 'var(--text)' }}>
                    This text uses tight line height.
                    Good for headings and titles.
                    Creates compact visual grouping.
                  </p>
                </Card>
                <Card>
                  <div className="text-xs text-[var(--text-muted)] mb-2">Snug (1.375)</div>
                  <p style={{ lineHeight: 'var(--line-height-snug)', color: 'var(--text)' }}>
                    This text uses snug line height.
                    Slightly more breathing room.
                    Good for subheadings.
                  </p>
                </Card>
                <Card>
                  <div className="text-xs text-[var(--text-muted)] mb-2">Normal (1.5)</div>
                  <p style={{ lineHeight: 'var(--line-height-normal)', color: 'var(--text)' }}>
                    This text uses normal line height.
                    The default for body text.
                    Balanced and readable.
                  </p>
                </Card>
                <Card>
                  <div className="text-xs text-[var(--text-muted)] mb-2">Relaxed (1.625)</div>
                  <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--text)' }}>
                    This text uses relaxed line height.
                    Extra space for comfortable reading.
                    Great for longer paragraphs.
                  </p>
                </Card>
                <Card>
                  <div className="text-xs text-[var(--text-muted)] mb-2">Loose (2.0)</div>
                  <p style={{ lineHeight: 'var(--line-height-loose)', color: 'var(--text)' }}>
                    This text uses loose line height.
                    Maximum breathing room.
                    Used for special emphasis.
                  </p>
                </Card>
              </div>
            </div>

            {/* Letter Spacing */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Letter Spacing
              </h3>
              <Card>
                <VStack gap="md">
                  <div style={{ letterSpacing: 'var(--letter-spacing-tighter)', color: 'var(--text)' }}>Tighter (-0.05em) - Display text compression</div>
                  <div style={{ letterSpacing: 'var(--letter-spacing-tight)', color: 'var(--text)' }}>Tight (-0.025em) - Headings and titles</div>
                  <div style={{ letterSpacing: 'var(--letter-spacing-normal)', color: 'var(--text)' }}>Normal (0em) - Default body text</div>
                  <div style={{ letterSpacing: 'var(--letter-spacing-wide)', color: 'var(--text)' }}>Wide (0.025em) - Slightly open spacing</div>
                  <div style={{ letterSpacing: 'var(--letter-spacing-wider)', color: 'var(--text)' }}>Wider (0.05em) - Open spacing for readability</div>
                  <div style={{ letterSpacing: 'var(--letter-spacing-widest)', textTransform: 'uppercase', color: 'var(--text)' }}>Widest (0.1em) - Overlines and labels</div>
                </VStack>
              </Card>
            </div>

            {/* Dark Mode Comparison */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3 text-[var(--text)]">
                Typography in Dark Mode
              </h3>
              <Card>
                <p style={{
                  fontSize: 'var(--typography-body-base-size)',
                  lineHeight: 'var(--typography-body-base-line-height)',
                  color: 'var(--text)',
                  marginBottom: '1rem'
                }}>
                  Typography tokens automatically adjust for dark mode. The letter spacing is slightly increased in dark mode for better readability on dark backgrounds.
                </p>
                <p style={{
                  fontSize: 'var(--typography-body-sm-size)',
                  color: 'var(--text-muted)'
                }}>
                  Toggle between light and dark themes using the button in the header to see the adjustments.
                </p>
              </Card>
            </div>
          </section>

          {/* Theme Test Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              Theme Testing
            </h2>
            <div className="p-6 border border-[var(--border)] rounded-sm bg-[var(--bg-dark)]">
              <p className="text-[var(--text)] mb-4">
                Toggle between light and dark themes using the button in the header to test all component variants.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="default">Default</Button>
                <Input placeholder="Test input" className="w-64" />
              </div>
            </div>
          </section>

        </div>
      </PageContent>
    </AppLayout>
  );
}
