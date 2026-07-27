import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResourcePage } from '../../components/ResourcePage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Common';
import { employeesApi } from '../../services/resources';
import { Employee } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().min(1),
  salary: z.coerce.number().min(0),
});

const EmployeeForm = ({ onSubmit, initialData, loading }: {
  onSubmit: (data: Partial<Employee>) => void;
  initialData?: Employee;
  loading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" error={errors.firstName?.message as string} {...register('firstName')} />
        <Input label="Last Name" error={errors.lastName?.message as string} {...register('lastName')} />
      </div>
      <Input label="Email" type="email" error={errors.email?.message as string} {...register('email')} />
      <Input label="Phone" {...register('phone')} />
      <Input label="Position" error={errors.position?.message as string} {...register('position')} />
      <Input label="Salary" type="number" error={errors.salary?.message as string} {...register('salary')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const EmployeesPage = () => (
  <ResourcePage<Employee>
    title="Employees"
    description="Manage zoo staff and personnel"
    queryKey="employees"
    api={employeesApi}
    columns={[
      { key: 'name', header: 'Name', render: (e) => `${e.firstName} ${e.lastName}` },
      { key: 'email', header: 'Email' },
      { key: 'position', header: 'Position' },
      { key: 'salary', header: 'Salary', render: (e) => formatCurrency(e.salary) },
      { key: 'hireDate', header: 'Hired', render: (e) => formatDate(e.hireDate) },
      { key: 'isActive', header: 'Status', render: (e) => (
        <Badge className={e.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {e.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )},
    ]}
    renderForm={(props) => <EmployeeForm {...props} />}
  />
);
