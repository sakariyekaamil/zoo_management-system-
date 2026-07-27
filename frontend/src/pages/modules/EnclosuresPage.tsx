import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResourcePage } from '../../components/ResourcePage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Common';
import { enclosuresApi } from '../../services/resources';
import { Enclosure } from '../../types';

const schema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  capacity: z.coerce.number().min(1),
  temperature: z.coerce.number().optional(),
  maintenanceStatus: z.enum(['OPERATIONAL', 'UNDER_MAINTENANCE', 'CLOSED']),
  description: z.string().optional(),
});

const EnclosureForm = ({ onSubmit, initialData, loading }: {
  onSubmit: (data: Partial<Enclosure>) => void;
  initialData?: Enclosure;
  loading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || { maintenanceStatus: 'OPERATIONAL', capacity: 1 },
  });

  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" error={errors.name?.message as string} {...register('name')} />
      <Input label="Location" {...register('location')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Capacity" type="number" error={errors.capacity?.message as string} {...register('capacity')} />
        <Input label="Temperature (°C)" type="number" step="0.1" {...register('temperature')} />
      </div>
      <Select label="Maintenance Status" options={[
        { value: 'OPERATIONAL', label: 'Operational' },
        { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
        { value: 'CLOSED', label: 'Closed' },
      ]} {...register('maintenanceStatus')} />
      <Textarea label="Description" rows={3} {...register('description')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const EnclosuresPage = () => (
  <ResourcePage<Enclosure>
    title="Enclosures"
    description="Manage animal enclosures and habitats"
    queryKey="enclosures"
    api={enclosuresApi}
    columns={[
      { key: 'name', header: 'Name' },
      { key: 'location', header: 'Location' },
      { key: 'capacity', header: 'Capacity' },
      { key: 'temperature', header: 'Temp', render: (e) => e.temperature ? `${e.temperature}°C` : '-' },
      { key: 'maintenanceStatus', header: 'Status', render: (e) => (
        <Badge className={
          e.maintenanceStatus === 'OPERATIONAL' ? 'bg-green-100 text-green-800' :
          e.maintenanceStatus === 'UNDER_MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }>{e.maintenanceStatus.replace('_', ' ')}</Badge>
      )},
    ]}
    renderForm={(props) => <EnclosureForm {...props} />}
  />
);
