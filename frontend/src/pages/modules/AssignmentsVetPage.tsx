import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ResourcePage } from '../../components/ResourcePage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import {
  assignmentsApi, animalsApi, employeesApi, veterinaryApi, vaccinationsApi,
} from '../../services/resources';
import { formatDate, getErrorMessage, mediaUrl } from '../../utils';

const schema = z.object({
  animalId: z.string().uuid(),
  employeeId: z.string().uuid(),
  role: z.enum(['KEEPER', 'VETERINARIAN']),
  notes: z.string().optional(),
});

interface Assignment {
  id: string;
  animalId: string;
  employeeId: string;
  role: string;
  assignedDate: string;
  isActive: boolean;
  animal?: { name: string; species?: { name: string } };
  employee?: { firstName: string; lastName: string };
}

const AssignmentForm = ({ onSubmit, initialData, loading }: {
  onSubmit: (data: Partial<Assignment>) => void;
  initialData?: Assignment;
  loading: boolean;
}) => {
  const { data: animalsRes } = useQuery({ queryKey: ['animals-all'], queryFn: () => animalsApi.getAll({ limit: 100 }) });
  const { data: employeesRes } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeesApi.getAll({ limit: 100 }) });
  const animals = animalsRes?.data?.data || [];
  const employees = employeesRes?.data?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || { role: 'KEEPER' },
  });

  useEffect(() => { if (initialData) reset(initialData); }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Animal" options={animals.map((a: { id: string; name: string }) => ({ value: a.id, label: a.name }))} error={errors.animalId?.message as string} {...register('animalId')} />
      <Select label="Employee" options={employees.map((e: { id: string; firstName: string; lastName: string }) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))} error={errors.employeeId?.message as string} {...register('employeeId')} />
      <Select label="Role" options={[{ value: 'KEEPER', label: 'Keeper' }, { value: 'VETERINARIAN', label: 'Veterinarian' }]} {...register('role')} />
      <Textarea label="Notes" rows={2} {...register('notes')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const AssignmentsPage = () => (
  <ResourcePage<Assignment>
    title="Animal Assignments"
    description="Assign keepers and veterinarians to animals"
    queryKey="assignments"
    api={assignmentsApi}
    columns={[
      { key: 'animal', header: 'Animal', render: (a) => a.animal?.name || '-' },
      { key: 'employee', header: 'Employee', render: (a) => a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : '-' },
      { key: 'role', header: 'Role' },
      { key: 'assignedDate', header: 'Assigned', render: (a) => formatDate(a.assignedDate) },
      { key: 'isActive', header: 'Active', render: (a) => a.isActive ? 'Yes' : 'No' },
    ]}
    renderForm={(props) => <AssignmentForm {...props} />}
  />
);

// Veterinary
const vetSchema = z.object({
  animalId: z.string().uuid(),
  diagnosis: z.string().min(1),
  treatment: z.string().optional(),
  medicine: z.string().optional(),
  nextVisit: z.string().optional(),
  notes: z.string().optional(),
});

interface VetRecord {
  id: string;
  animalId: string;
  diagnosis: string;
  treatment?: string;
  medicine?: string;
  certificateUrl?: string;
  certificateFile?: File;
  visitDate: string;
  nextVisit?: string;
  animal?: { name: string };
}

const MEDICAL_CERTIFICATE_ACCEPT =
  '.pdf,.doc,.docx,.jpeg,.jpg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,image/webp';

const CertificateCell = ({ record }: { record: VetRecord }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const uploadMutation = useMutation({
    mutationFn: (file: File) => veterinaryApi.uploadCertificate(record.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veterinary'] });
      toast.success('Medical certificate uploaded');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleFile = (file?: File) => {
    if (file) uploadMutation.mutate(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {record.certificateUrl && (
        <>
          <a
            href={mediaUrl(record.certificateUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 hover:underline dark:text-primary-300"
          >
            View
          </a>
          <a
            href={mediaUrl(record.certificateUrl)}
            download
            className="text-primary-700 hover:underline dark:text-primary-300"
          >
            Download
          </a>
        </>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        loading={uploadMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {record.certificateUrl ? 'Replace' : 'Upload'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={MEDICAL_CERTIFICATE_ACCEPT}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
};

const VetForm = ({ onSubmit, initialData, loading }: { onSubmit: (data: Partial<VetRecord>) => void; initialData?: VetRecord; loading: boolean }) => {
  const { data: animalsRes } = useQuery({ queryKey: ['animals-all'], queryFn: () => animalsApi.getAll({ limit: 100 }) });
  const animals = animalsRes?.data?.data || [];
  const [certificateFile, setCertificateFile] = useState<File>();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(vetSchema), defaultValues: initialData });
  useEffect(() => {
    setCertificateFile(undefined);
    if (initialData) reset({ ...initialData, nextVisit: initialData.nextVisit?.split('T')[0] });
  }, [initialData, reset]);

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({ ...data, certificateFile }))}
      className="space-y-4"
    >
      <Select label="Animal" options={animals.map((a: { id: string; name: string }) => ({ value: a.id, label: a.name }))} error={errors.animalId?.message as string} {...register('animalId')} />
      <Input label="Diagnosis" error={errors.diagnosis?.message as string} {...register('diagnosis')} />
      <Input label="Treatment" {...register('treatment')} />
      <Input label="Medicine" {...register('medicine')} />
      <Input label="Next Visit" type="date" {...register('nextVisit')} />
      <Textarea label="Notes" rows={2} {...register('notes')} />
      <Input
        label="Medical Certificate (Optional)"
        type="file"
        accept={MEDICAL_CERTIFICATE_ACCEPT}
        onChange={(event) => setCertificateFile(event.target.files?.[0])}
      />
      <p className="text-xs text-gray-500">
        Accepted: PDF, DOC, DOCX, JPEG, PNG, GIF, or WEBP (maximum 5 MB).
      </p>
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

const uploadAttachedCertificate = async (record: VetRecord, formData: Partial<VetRecord>) => {
  if (formData.certificateFile) {
    await veterinaryApi.uploadCertificate(record.id, formData.certificateFile);
  }
};

export const VeterinaryPage = () => (
  <ResourcePage<VetRecord>
    title="Veterinary Records"
    description="Medical records and treatment history"
    queryKey="veterinary"
    api={veterinaryApi}
    columns={[
      { key: 'animal', header: 'Animal', render: (v) => v.animal?.name || '-' },
      { key: 'diagnosis', header: 'Diagnosis' },
      { key: 'treatment', header: 'Treatment' },
      { key: 'medicine', header: 'Medicine' },
      { key: 'visitDate', header: 'Visit', render: (v) => formatDate(v.visitDate) },
      { key: 'nextVisit', header: 'Next Visit', render: (v) => v.nextVisit ? formatDate(v.nextVisit) : '-' },
      { key: 'certificateUrl', header: 'Certificate', render: (v) => <CertificateCell record={v} /> },
    ]}
    renderForm={(props) => <VetForm {...props} />}
    afterCreate={uploadAttachedCertificate}
    afterUpdate={uploadAttachedCertificate}
  />
);

// Vaccinations
const vacSchema = z.object({
  animalId: z.string().uuid(),
  vaccineName: z.string().min(1),
  administeredDate: z.string().optional(),
  expiryDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  administeredBy: z.string().optional(),
  notes: z.string().optional(),
});

interface Vaccination {
  id: string;
  animalId: string;
  vaccineName: string;
  administeredDate: string;
  expiryDate?: string;
  nextDueDate?: string;
  animal?: { name: string };
}

const VacForm = ({ onSubmit, initialData, loading }: { onSubmit: (data: Partial<Vaccination>) => void; initialData?: Vaccination; loading: boolean }) => {
  const { data: animalsRes } = useQuery({ queryKey: ['animals-all'], queryFn: () => animalsApi.getAll({ limit: 100 }) });
  const animals = animalsRes?.data?.data || [];
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(vacSchema), defaultValues: initialData });
  useEffect(() => {
    if (initialData) reset({
      ...initialData,
      administeredDate: initialData.administeredDate?.slice(0, 10),
      expiryDate: initialData.expiryDate?.slice(0, 10),
      nextDueDate: initialData.nextDueDate?.slice(0, 10),
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Animal" options={animals.map((a: { id: string; name: string }) => ({ value: a.id, label: a.name }))} error={errors.animalId?.message as string} {...register('animalId')} />
      <Input label="Vaccine Name" error={errors.vaccineName?.message as string} {...register('vaccineName')} />
      <Input label="Administered Date" type="date" {...register('administeredDate')} />
      <Input label="Expiry Date" type="date" {...register('expiryDate')} />
      <Input label="Next Due Date" type="date" {...register('nextDueDate')} />
      <Input label="Administered By" {...register('administeredBy')} />
      <Textarea label="Notes" rows={2} {...register('notes')} />
      <Button type="submit" loading={loading} className="w-full">Save</Button>
    </form>
  );
};

export const VaccinationsPage = () => (
  <ResourcePage<Vaccination>
    title="Vaccinations"
    description="Track animal vaccinations and schedules"
    queryKey="vaccinations"
    api={vaccinationsApi}
    columns={[
      { key: 'animal', header: 'Animal', render: (v) => v.animal?.name || '-' },
      { key: 'vaccineName', header: 'Vaccine' },
      { key: 'administeredDate', header: 'Administered', render: (v) => formatDate(v.administeredDate) },
      { key: 'expiryDate', header: 'Expires', render: (v) => v.expiryDate ? formatDate(v.expiryDate) : '-' },
      { key: 'nextDueDate', header: 'Next Due', render: (v) => v.nextDueDate ? formatDate(v.nextDueDate) : '-' },
    ]}
    renderForm={(props) => <VacForm {...props} />}
  />
);
