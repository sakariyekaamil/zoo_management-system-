import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResourcePage } from '../../components/ResourcePage';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { speciesApi } from '../../services/resources';
import { Species } from '../../types';

const schema = z.object({
  name: z.string().min(1),
  conservationStatus: z.string().optional(),
  description: z.string().optional(),
});

const SpeciesForm = ({ onSubmit, initialData, loading }: {
  onSubmit: (data: Partial<Species>) => void;
  initialData?: Species;
  loading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" error={errors.name?.message as string} {...register('name')} />
      <Input label="Conservation Status" {...register('conservationStatus')} />
      <Textarea label="Description" rows={3} {...register('description')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const SpeciesPage = () => (
  <ResourcePage<Species>
    title="Species"
    description="Manage animal species catalog"
    queryKey="species"
    api={speciesApi}
    columns={[
      { key: 'name', header: 'Name' },
      { key: 'conservationStatus', header: 'Status' },
    ]}
    renderForm={(props) => <SpeciesForm {...props} />}
  />
);
