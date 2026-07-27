import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PencilIcon, PlusIcon, TrashIcon, TicketIcon } from '@heroicons/react/24/outline';
import { PageHeader, EmptyState, LoadingSkeleton, Badge } from '../../components/ui/Common';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ticketTypesApi } from '../../services/resources';
import { formatCurrency, getErrorMessage } from '../../utils';

export type TicketCardStyle = 'STANDARD' | 'VIP' | 'PREMIUM' | 'FAMILY' | 'CHILD' | 'STUDENT' | 'GROUP';

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  cardStyle?: TicketCardStyle | string;
  isActive: boolean;
}

const CARD_STYLES: Record<string, {
  label: string;
  wrapper: string;
  minHeight: string;
  badge: string;
  price: string;
}> = {
  STANDARD: {
    label: 'Standard',
    wrapper: 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-white',
    minHeight: 'min-h-[180px]',
    badge: 'bg-white/20 text-white',
    price: 'text-emerald-100',
  },
  VIP: {
    label: 'VIP (taller)',
    wrapper: 'bg-gradient-to-b from-zinc-900 via-amber-950 to-black text-amber-50 border border-amber-400/40',
    minHeight: 'min-h-[280px]',
    badge: 'bg-amber-400 text-zinc-900',
    price: 'text-amber-300',
  },
  PREMIUM: {
    label: 'Premium',
    wrapper: 'bg-gradient-to-br from-slate-800 to-teal-900 text-white',
    minHeight: 'min-h-[230px]',
    badge: 'bg-teal-300 text-slate-900',
    price: 'text-teal-200',
  },
  FAMILY: {
    label: 'Family',
    wrapper: 'bg-gradient-to-br from-sky-700 to-indigo-900 text-white',
    minHeight: 'min-h-[200px]',
    badge: 'bg-sky-200 text-sky-950',
    price: 'text-sky-100',
  },
  CHILD: {
    label: 'Child (compact)',
    wrapper: 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white',
    minHeight: 'min-h-[150px]',
    badge: 'bg-yellow-300 text-blue-950',
    price: 'text-cyan-50',
  },
  STUDENT: {
    label: 'Student',
    wrapper: 'bg-gradient-to-br from-violet-700 to-fuchsia-900 text-white',
    minHeight: 'min-h-[170px]',
    badge: 'bg-fuchsia-200 text-fuchsia-950',
    price: 'text-fuchsia-100',
  },
  GROUP: {
    label: 'Group',
    wrapper: 'bg-gradient-to-br from-lime-700 to-green-950 text-white',
    minHeight: 'min-h-[190px]',
    badge: 'bg-lime-200 text-lime-950',
    price: 'text-lime-100',
  },
};

const styleOptions = Object.entries(CARD_STYLES).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

const ttSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  cardStyle: z.enum(['STANDARD', 'VIP', 'PREMIUM', 'FAMILY', 'CHILD', 'STUDENT', 'GROUP']),
});

const guessStyleFromName = (name: string): TicketCardStyle => {
  const value = name.toLowerCase();
  if (value.includes('vip')) return 'VIP';
  if (value.includes('premium')) return 'PREMIUM';
  if (value.includes('family')) return 'FAMILY';
  if (value.includes('child') || value.includes('kid')) return 'CHILD';
  if (value.includes('student')) return 'STUDENT';
  if (value.includes('group')) return 'GROUP';
  return 'STANDARD';
};

const TTForm = ({
  onSubmit,
  initialData,
  loading,
}: {
  onSubmit: (d: Partial<TicketType>) => void;
  initialData?: TicketType;
  loading: boolean;
}) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(ttSchema),
    defaultValues: initialData || { cardStyle: 'STANDARD', price: 0 },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        cardStyle: (initialData.cardStyle as TicketCardStyle) || guessStyleFromName(initialData.name),
      });
    }
  }, [initialData, reset]);

  const name = watch('name');
  const cardStyle = watch('cardStyle');

  useEffect(() => {
    if (!initialData && name) {
      setValue('cardStyle', guessStyleFromName(name));
    }
  }, [name, initialData, setValue]);

  const preview = CARD_STYLES[cardStyle || 'STANDARD'] || CARD_STYLES.STANDARD;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" error={errors.name?.message as string} {...register('name')} />
      <Input label="Description" {...register('description')} />
      <Input label="Price" type="number" step="0.01" error={errors.price?.message as string} {...register('price')} />
      <Select
        label="Card Style (each type can look different)"
        options={styleOptions}
        {...register('cardStyle')}
      />
      <div className={`rounded-2xl p-4 ${preview.wrapper} ${preview.minHeight}`}>
        <p className="text-xs uppercase tracking-wide opacity-80">Preview</p>
        <p className="mt-2 text-xl font-bold">{name || 'Ticket Name'}</p>
        <p className={`mt-6 text-2xl font-semibold ${preview.price}`}>$00.00</p>
      </div>
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const TicketTypesPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ticket-types'],
    queryFn: () => ticketTypesApi.getAll({ limit: 100 }),
  });

  const items = (data?.data?.data || []) as TicketType[];

  const createMutation = useMutation({
    mutationFn: (formData: Partial<TicketType>) => ticketTypesApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      toast.success('Ticket type created');
      setModalOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<TicketType> }) =>
      ticketTypesApi.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      toast.success('Ticket type updated');
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      toast.success('Ticket type deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (formData: Partial<TicketType>) => {
    if (editing) updateMutation.mutate({ id: editing.id, formData });
    else createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Types"
        description="Each ticket type can have its own card look — VIP is taller and premium"
        action={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <PlusIcon className="h-4 w-4" /> Add Ticket Type
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No ticket types"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <PlusIcon className="h-4 w-4" /> Add First Type
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((ticket) => {
            const styleKey = (ticket.cardStyle || guessStyleFromName(ticket.name)) as string;
            const style = CARD_STYLES[styleKey] || CARD_STYLES.STANDARD;
            return (
              <div
                key={ticket.id}
                className={`relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 shadow-lg ${style.wrapper} ${style.minHeight}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`}>
                      {CARD_STYLES[styleKey]?.label || 'Standard'}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight">{ticket.name}</h3>
                    <p className="mt-2 text-sm opacity-80">{ticket.description || 'No description'}</p>
                  </div>
                  <TicketIcon className="h-8 w-8 opacity-40" />
                </div>

                <div className="mt-auto pt-6">
                  <p className={`text-3xl font-extrabold ${style.price}`}>{formatCurrency(ticket.price)}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge className={ticket.isActive ? 'bg-white/20 text-white' : 'bg-black/30 text-white/70'}>
                      {ticket.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg bg-white/15 p-2 hover:bg-white/25"
                        onClick={() => { setEditing(ticket); setModalOpen(true); }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-black/20 p-2 hover:bg-red-500/80"
                        onClick={() => setDeleteId(ticket.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Ticket Type' : 'Add Ticket Type'}
        size="lg"
      >
        <TTForm
          initialData={editing || undefined}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Ticket Type"
        message="Are you sure you want to delete this ticket type?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
