import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { PageHeader, EmptyState, LoadingSkeleton } from './ui/Common';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal, ConfirmDialog, Pagination, SearchInput } from './ui/Modal';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { getErrorMessage } from '../utils';
import type { PaginatedResponse } from '../types';
import type { AxiosResponse } from 'axios';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface ResourceApi<T> {
  getAll: (params?: Record<string, unknown>) => Promise<AxiosResponse<PaginatedResponse<T>>>;
  getById?: (id: string) => Promise<AxiosResponse<{ data: T }>>;
  create: (data: Partial<T>) => Promise<AxiosResponse<{ data: T }>>;
  update: (id: string, data: Partial<T>) => Promise<AxiosResponse<{ data: T }>>;
  delete: (id: string) => Promise<AxiosResponse<unknown>>;
}

interface ResourcePageProps<T extends { id: string }> {
  title: string;
  description?: string;
  queryKey: string;
  api: ResourceApi<T> | Record<string, unknown>;
  columns: Column<T>[];
  renderForm: (props: {
    onSubmit: (data: Partial<T>) => void;
    initialData?: T;
    loading: boolean;
  }) => ReactNode;
  afterCreate?: (item: T, formData: Partial<T>) => Promise<void>;
  afterUpdate?: (item: T, formData: Partial<T>) => Promise<void>;
  filters?: ReactNode;
  extraActions?: (item: T) => ReactNode;
}

export function ResourcePage<T extends { id: string }>({
  title,
  description,
  queryKey,
  api,
  columns,
  renderForm,
  afterCreate,
  afterUpdate,
  filters,
  extraActions,
}: ResourcePageProps<T>) {
  const queryClient = useQueryClient();
  const { page, setPage, search, setSearch, params } = usePagination();
  const debouncedSearch = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey, page, debouncedSearch, params],
    queryFn: () => (api as ResourceApi<T>).getAll({ ...params, search: debouncedSearch }),
  });

  const createMutation = useMutation({
    mutationFn: (formData: Partial<T>) => (api as ResourceApi<T>).create(formData),
    onSuccess: async (response, formData) => {
      try {
        if (afterCreate) await afterCreate(response.data.data, formData);
        toast.success('Created successfully');
      } catch (error) {
        toast.error(`Record created, but attachment upload failed: ${getErrorMessage(error)}`);
      }
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<T> }) => (api as ResourceApi<T>).update(id, formData),
    onSuccess: async (response, { formData }) => {
      try {
        if (afterUpdate) await afterUpdate(response.data.data, formData);
        toast.success('Updated successfully');
      } catch (error) {
        toast.error(`Record updated, but attachment upload failed: ${getErrorMessage(error)}`);
      }
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => (api as ResourceApi<T>).delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success('Deleted successfully');
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const items = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const handleSubmit = (formData: Partial<T>) => {
    const cleaned = Object.fromEntries(
      Object.entries(formData as Record<string, unknown>).filter(
        ([, value]) => value !== '' && value !== undefined && value !== null
      )
    ) as Partial<T>;

    if (editing) {
      updateMutation.mutate({ id: editing.id, formData: cleaned });
    } else {
      createMutation.mutate(cleaned);
    }
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <PlusIcon className="w-4 h-4" /> Add New
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}...`} />
          </div>
          {filters}
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-8 text-red-500">{getErrorMessage(error)}</div>
        ) : items.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={() => setModalOpen(true)}>
                <PlusIcon className="w-4 h-4" /> Add First Record
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      {col.header}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    {columns.map((col) => (
                      <td key={col.key} className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {extraActions?.(item)}
                        <button
                          onClick={() => { setEditing(item); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? `Edit ${title}` : `Add ${title}`}
      >
        {renderForm({
          onSubmit: handleSubmit,
          initialData: editing || undefined,
          loading: createMutation.isPending || updateMutation.isPending,
        })}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Confirm Delete"
        message="Are you sure you want to delete this record? This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
