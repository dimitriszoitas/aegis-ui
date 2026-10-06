import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './pagination';
const meta = {
  title: 'Components/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  args: { page: 1, pageSize: 25, total: 150, onPageChange: () => undefined },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;
function PaginationDemo({ total = 150, startPage = 1 }: { total?: number; startPage?: number }) {
  const [page, setPage] = useState(startPage);
  const [pageSize, setPageSize] = useState(25);
  return (
    <div className="surface">
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        noun="alerts"
      />
    </div>
  );
}
export const Interactive: Story = { render: () => <PaginationDemo /> };
export const ManyPages: Story = { render: () => <PaginationDemo total={12840} startPage={16} /> };
export const States: Story = {
  render: () => (
    <div className="stack">
      <PaginationDemo total={0} />
      <PaginationDemo total={12} />
      <PaginationDemo total={150} startPage={6} />
      <div className="surface">
        <Pagination
          page={3}
          pageSize={25}
          total={150}
          onPageChange={() => undefined}
          onPageSizeChange={() => undefined}
          disabled
          noun="alerts"
        />
      </div>
    </div>
  ),
};
