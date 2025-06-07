# DataTable Component

A reusable, flexible table component with built-in pagination, loading states, and error handling.

## Features

- **Flexible Column Configuration**: Define custom columns with render functions
- **Loading States**: Built-in loading indicator
- **Error Handling**: Displays error messages gracefully
- **Empty State**: Customizable message when no data is available
- **Pagination**: Optional pagination with customizable rows per page
- **TypeScript Support**: Fully typed with generics

## Usage

### Basic Usage

```tsx
import { DataTable, DataTableColumn } from '@/components/ui/data-table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
];

const columns: DataTableColumn<User>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (user) => user.name,
  },
  {
    key: 'email',
    header: 'Email',
    render: (user) => user.email,
  },
  {
    key: 'role',
    header: 'Role',
    render: (user) => <Badge>{user.role}</Badge>,
  },
];

function UserTable() {
  return (
    <DataTable
      data={users}
      columns={columns}
      getRowKey={(user) => user.id}
      emptyMessage="No users found"
    />
  );
}
```

### With Pagination

```tsx
function UserTableWithPagination() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowKey={(user) => user.id}
      showPagination={true}
      currentPage={currentPage}
      totalPages={10}
      rowsPerPage={rowsPerPage}
      totalItems={100}
      onPageChange={setCurrentPage}
      onRowsPerPageChange={setRowsPerPage}
    />
  );
}
```

### With Loading and Error States

```tsx
function UserTableWithStates() {
  const { data: users, isLoading, error } = useUsers();

  return (
    <DataTable
      data={users || []}
      columns={columns}
      isLoading={isLoading}
      error={!!error}
      getRowKey={(user) => user.id}
      emptyMessage="No users found"
    />
  );
}
```

### Complex Column Rendering

```tsx
const columns: DataTableColumn<User>[] = [
  {
    key: 'user',
    header: 'User Info',
    render: (user) => (
      <div>
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => (
      <Badge variant={user.active ? 'success' : 'secondary'}>
        {user.active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (user) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => editUser(user.id)}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>
          Delete
        </Button>
      </div>
    ),
  },
];
```

## Props

### DataTableProps<T>

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `T[]` | ✅ | - | Array of data items to display |
| `columns` | `DataTableColumn<T>[]` | ✅ | - | Column configuration |
| `getRowKey` | `(item: T) => string \| number` | ✅ | - | Function to get unique key for each row |
| `isLoading` | `boolean` | ❌ | `false` | Show loading state |
| `error` | `boolean` | ❌ | `false` | Show error state |
| `emptyMessage` | `string` | ❌ | `"No data found"` | Message when no data |
| `showPagination` | `boolean` | ❌ | `false` | Enable pagination |
| `currentPage` | `number` | ❌ | `1` | Current page number |
| `totalPages` | `number` | ❌ | `1` | Total number of pages |
| `rowsPerPage` | `string` | ❌ | `"10"` | Number of rows per page |
| `totalItems` | `number` | ❌ | `0` | Total number of items |
| `onPageChange` | `(page: number) => void` | ❌ | - | Page change handler |
| `onRowsPerPageChange` | `(rows: string) => void` | ❌ | - | Rows per page change handler |

### DataTableColumn<T>

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | ✅ | Unique identifier for the column |
| `header` | `string` | ✅ | Column header text |
| `render` | `(item: T) => React.ReactNode` | ✅ | Function to render cell content |

## Examples in Codebase

- **Team Members Table**: `frontend/src/features/team/pages/Team.tsx`
- **Invoices Table**: `frontend/src/features/billing/pages/Billing.tsx` 