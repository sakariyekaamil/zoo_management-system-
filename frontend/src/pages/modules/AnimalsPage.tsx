import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, EmptyState, LoadingSkeleton, Badge } from '../../components/ui/Common';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { animalsApi, speciesApi, enclosuresApi } from '../../services/resources';
import { HEALTH_STATUS_COLORS } from '../../constants';
import { Animal } from '../../types';
import { formatDate, getErrorMessage, mediaUrl } from '../../utils';

type AnimalDraft = {
  key: string;
  name: string;
  speciesId: string;
  enclosureId: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  healthStatus: 'HEALTHY' | 'SICK' | 'RECOVERING' | 'CRITICAL' | 'DECEASED';
  origin: 'BIRTH' | 'OTHER';
  originPlace: string;
  originDescription: string;
  weight: string;
  dateOfBirth: string;
  notes: string;
  photoFile?: File;
  photoPreview?: string;
};

type SpeciesGroup = {
  speciesId: string;
  speciesName: string;
  habitat?: string;
  animals: Animal[];
  balance: number;
  coverPhoto?: string;
  enclosureLabel: string;
};

const emptyDraft = (partial?: Partial<AnimalDraft>): AnimalDraft => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  speciesId: '',
  enclosureId: '',
  gender: 'UNKNOWN',
  healthStatus: 'HEALTHY',
  origin: 'BIRTH',
  originPlace: '',
  originDescription: '',
  weight: '',
  dateOfBirth: '',
  notes: '',
  ...partial,
});

const cleanPayload = (draft: AnimalDraft) => {
  const payload: Record<string, unknown> = {
    name: draft.name.trim(),
    speciesId: draft.speciesId,
    enclosureId: draft.enclosureId,
    gender: draft.gender,
    healthStatus: draft.healthStatus,
    quantity: 1,
    origin: draft.origin,
  };
  if (draft.origin === 'OTHER') {
    payload.originPlace = draft.originPlace.trim();
    if (draft.originDescription.trim()) payload.originDescription = draft.originDescription.trim();
  }
  if (draft.weight !== '') payload.weight = Number(draft.weight);
  if (draft.dateOfBirth) payload.dateOfBirth = draft.dateOfBirth;
  if (draft.notes.trim()) payload.notes = draft.notes.trim();
  return payload;
};

const validateDraft = (draft: AnimalDraft) => {
  if (!draft.name.trim()) return 'Animal name is required';
  if (!draft.speciesId) return 'Species is required';
  if (!draft.enclosureId) return 'Enclosure is required';
  if (draft.origin === 'OTHER' && !draft.originPlace.trim()) {
    return 'Please enter where the animal was transferred/bought from';
  }
  return null;
};

export const AnimalsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [drafts, setDrafts] = useState<AnimalDraft[]>([emptyDraft()]);
  const [detailGroup, setDetailGroup] = useState<SpeciesGroup | null>(null);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [editOrigin, setEditOrigin] = useState<'BIRTH' | 'OTHER'>('BIRTH');
  const [editPhoto, setEditPhoto] = useState<File>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: animalsRes, isLoading } = useQuery({
    queryKey: ['animals', 'cards'],
    queryFn: () => animalsApi.getAll({ limit: 500 }),
  });
  const { data: speciesRes } = useQuery({
    queryKey: ['species-all'],
    queryFn: () => speciesApi.getAll({ limit: 100 }),
  });
  const { data: enclosuresRes } = useQuery({
    queryKey: ['enclosures-all'],
    queryFn: () => enclosuresApi.getAll({ limit: 100 }),
  });

  const animals = (animalsRes?.data?.data || []) as Animal[];
  const species = speciesRes?.data?.data || [];
  const enclosures = enclosuresRes?.data?.data || [];

  const speciesOptions = species.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }));
  const enclosureOptions = enclosures.map((e: { id: string; name: string }) => ({ value: e.id, label: e.name }));

  const groups = useMemo(() => {
    const map = new Map<string, SpeciesGroup>();
    for (const animal of animals) {
      const speciesId = animal.speciesId;
      const existing = map.get(speciesId);
      const quantity = Number(animal.quantity) || 1;
      if (!existing) {
        map.set(speciesId, {
          speciesId,
          speciesName: animal.species?.name || 'Unknown species',
          habitat: animal.species?.habitat,
          animals: [animal],
          balance: quantity,
          coverPhoto: animal.photo,
          enclosureLabel: animal.enclosure?.name || '-',
        });
      } else {
        existing.animals.push(animal);
        existing.balance += quantity;
        if (!existing.coverPhoto && animal.photo) existing.coverPhoto = animal.photo;
        if (existing.enclosureLabel === '-' && animal.enclosure?.name) {
          existing.enclosureLabel = animal.enclosure.name;
        } else if (
          animal.enclosure?.name &&
          existing.enclosureLabel !== animal.enclosure.name &&
          !existing.enclosureLabel.includes(animal.enclosure.name)
        ) {
          existing.enclosureLabel = `${existing.enclosureLabel}, ${animal.enclosure.name}`;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.speciesName.localeCompare(b.speciesName));
  }, [animals]);

  const filteredGroups = groups.filter((group) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      group.speciesName.toLowerCase().includes(q) ||
      group.animals.some((a) => a.name.toLowerCase().includes(q)) ||
      group.enclosureLabel.toLowerCase().includes(q)
    );
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['animals'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => animalsApi.delete(id),
    onSuccess: (_data, id) => {
      toast.success('Animal deleted');
      setDeleteId(null);
      refresh();
      setDetailGroup((prev) => {
        if (!prev) return prev;
        const nextAnimals = prev.animals.filter((a) => a.id !== id);
        if (!nextAnimals.length) return null;
        return {
          ...prev,
          animals: nextAnimals,
          balance: nextAnimals.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0),
        };
      });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateDraft = (key: string, patch: Partial<AnimalDraft>) => {
    setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  };

  const removeDraft = (key: string) => {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.key !== key)));
  };

  const openAdd = (preset?: Partial<AnimalDraft>) => {
    setDrafts([emptyDraft(preset)]);
    setAddOpen(true);
  };

  const handleSaveAll = async () => {
    for (const draft of drafts) {
      const error = validateDraft(draft);
      if (error) {
        toast.error(`${draft.name || 'Animal'}: ${error}`);
        return;
      }
    }

    setSaving(true);
    try {
      for (const draft of drafts) {
        const response = await animalsApi.create(cleanPayload(draft) as Partial<Animal>);
        const created = response.data.data;
        if (draft.photoFile && created?.id) {
          await animalsApi.uploadPhoto(created.id, draft.photoFile);
        }
      }
      toast.success(drafts.length === 1 ? 'Animal created' : `${drafts.length} animals created`);
      setAddOpen(false);
      setDrafts([emptyDraft()]);
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const origin = String(form.get('origin') || 'BIRTH') as 'BIRTH' | 'OTHER';
    const payload: Partial<Animal> = {
      name: String(form.get('name') || ''),
      speciesId: String(form.get('speciesId') || ''),
      enclosureId: String(form.get('enclosureId') || ''),
      gender: String(form.get('gender') || 'UNKNOWN'),
      healthStatus: String(form.get('healthStatus') || 'HEALTHY'),
      quantity: 1,
      origin,
      weight: form.get('weight') ? Number(form.get('weight')) : undefined,
      dateOfBirth: String(form.get('dateOfBirth') || '') || undefined,
      notes: String(form.get('notes') || '') || undefined,
    };
    if (origin === 'OTHER') {
      payload.originPlace = String(form.get('originPlace') || '').trim();
      payload.originDescription = String(form.get('originDescription') || '').trim() || undefined;
      if (!payload.originPlace) {
        toast.error('Please enter where the animal was transferred/bought from');
        return;
      }
    }

    setSaving(true);
    try {
      await animalsApi.update(editing.id, payload);
      if (editPhoto) await animalsApi.uploadPhoto(editing.id, editPhoto);
      toast.success('Animal updated');
      setEditing(null);
      setEditPhoto(undefined);
      refresh();
      setDetailGroup(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openGroupDetails = (group: SpeciesGroup) => {
    const latest = groups.find((g) => g.speciesId === group.speciesId) || group;
    setDetailGroup(latest);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Animal Records"
        description="Manage animals, stock, and enclosures"
        action={
          <Button onClick={() => openAdd()}>
            <PlusIcon className="h-4 w-4" /> Add Animal
          </Button>
        }
      />

      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or species..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          title="No animals yet"
          description="Add your first animal to start building the zoo records."
          action={
            <Button onClick={() => openAdd()}>
              <PlusIcon className="h-4 w-4" /> Add Animal
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <button
              key={group.speciesId}
              type="button"
              onClick={() => openGroupDetails(group)}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
                {group.coverPhoto ? (
                  <img src={mediaUrl(group.coverPhoto)} alt={group.speciesName} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">No photo</div>
                )}
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                  Active
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.speciesName}</h3>
                  <p className="text-sm text-gray-500">{group.habitat || 'Animal group'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4" />
                  <span className="truncate">{group.enclosureLabel}</span>
                </div>
                <div className="flex items-end justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Balance</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{group.balance}</p>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      title="Add another"
                      onClick={() => openAdd({ speciesId: group.speciesId, name: group.speciesName })}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="View details"
                      onClick={() => openGroupDetails(group)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Animals" size="xl">
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Fill all details for one animal, then press <strong>+ Add another</strong> to register more in the same save.
          </p>
          {drafts.map((draft, index) => (
            <Card key={draft.key} className="space-y-4 border border-primary-100 dark:border-primary-900/40">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-white">Animal {index + 1}</h4>
                {drafts.length > 1 && (
                  <button type="button" onClick={() => removeDraft(draft.key)} className="rounded-lg p-1 text-red-500 hover:bg-red-50">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Name" value={draft.name} onChange={(e) => updateDraft(draft.key, { name: e.target.value })} />
                <Select
                  label="Species"
                  options={speciesOptions}
                  placeholder="Select species"
                  value={draft.speciesId}
                  onChange={(e) => updateDraft(draft.key, { speciesId: e.target.value })}
                />
                <Select
                  label="Enclosure"
                  options={enclosureOptions}
                  placeholder="Select enclosure"
                  value={draft.enclosureId}
                  onChange={(e) => updateDraft(draft.key, { enclosureId: e.target.value })}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  value={draft.weight}
                  onChange={(e) => updateDraft(draft.key, { weight: e.target.value })}
                />
                <Select
                  label="Gender"
                  options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'UNKNOWN', label: 'Unknown' }]}
                  value={draft.gender}
                  onChange={(e) => updateDraft(draft.key, { gender: e.target.value as AnimalDraft['gender'] })}
                />
                <Select
                  label="Health Status"
                  options={['HEALTHY', 'SICK', 'RECOVERING', 'CRITICAL', 'DECEASED'].map((s) => ({ value: s, label: s }))}
                  value={draft.healthStatus}
                  onChange={(e) => updateDraft(draft.key, { healthStatus: e.target.value as AnimalDraft['healthStatus'] })}
                />
                <Select
                  label="Origin"
                  options={[
                    { value: 'BIRTH', label: 'Birth (born at zoo)' },
                    { value: 'OTHER', label: 'Other (bought / transferred)' },
                  ]}
                  value={draft.origin}
                  onChange={(e) => updateDraft(draft.key, {
                    origin: e.target.value as AnimalDraft['origin'],
                    ...(e.target.value === 'BIRTH' ? { originPlace: '', originDescription: '' } : {}),
                  })}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={draft.dateOfBirth}
                  onChange={(e) => updateDraft(draft.key, { dateOfBirth: e.target.value })}
                />
                {draft.origin === 'OTHER' && (
                  <>
                    <Input
                      label="Transferred / bought from"
                      placeholder="e.g. Nairobi Zoo, private farm..."
                      value={draft.originPlace}
                      onChange={(e) => updateDraft(draft.key, { originPlace: e.target.value })}
                    />
                    <Textarea
                      label="Origin description"
                      rows={2}
                      placeholder="General description about the transfer or purchase"
                      value={draft.originDescription}
                      onChange={(e) => updateDraft(draft.key, { originDescription: e.target.value })}
                    />
                  </>
                )}
                <Input
                  label="Photo"
                  type="file"
                  accept="image/*,.jfif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    updateDraft(draft.key, {
                      photoFile: file,
                      photoPreview: file ? URL.createObjectURL(file) : undefined,
                    });
                  }}
                />
              </div>
              {draft.photoPreview && (
                <img src={draft.photoPreview} alt="Preview" className="h-24 w-24 rounded-xl object-cover" />
              )}
              <Textarea
                label="Notes"
                rows={2}
                value={draft.notes}
                onChange={(e) => updateDraft(draft.key, { notes: e.target.value })}
              />
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setDrafts((prev) => [...prev, emptyDraft({
              speciesId: prev[0]?.speciesId || '',
              enclosureId: prev[0]?.enclosureId || '',
              name: prev[0]?.name || '',
            })])}
          >
            <PlusIcon className="h-4 w-4" /> Add another animal
          </Button>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSaveAll}>
              Save {drafts.length > 1 ? `${drafts.length} Animals` : 'Animal'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(detailGroup)}
        onClose={() => setDetailGroup(null)}
        title={detailGroup ? `${detailGroup.speciesName} Details` : 'Details'}
        size="xl"
      >
        {detailGroup && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {detailGroup.balance} animal{detailGroup.balance === 1 ? '' : 's'} in this group
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setDetailGroup(null);
                  openAdd({ speciesId: detailGroup.speciesId, name: detailGroup.speciesName });
                }}
              >
                <PlusIcon className="h-4 w-4" /> Add to this group
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {detailGroup.animals.map((animal) => (
                <Card key={animal.id} className="space-y-3 overflow-hidden !p-0">
                  <div className="h-40 bg-gray-100 dark:bg-gray-800">
                    {animal.photo ? (
                      <img src={mediaUrl(animal.photo)} alt={animal.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">No photo</div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{animal.name}</h4>
                        <p className="text-sm text-gray-500">{animal.enclosure?.name || '-'}</p>
                      </div>
                      <Badge className={HEALTH_STATUS_COLORS[animal.healthStatus] || ''}>{animal.healthStatus}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <p><span className="text-gray-400">Gender:</span> {animal.gender}</p>
                      <p><span className="text-gray-400">Weight:</span> {animal.weight ? `${animal.weight} kg` : '-'}</p>
                      <p><span className="text-gray-400">Date of Birth:</span> {animal.dateOfBirth ? formatDate(animal.dateOfBirth) : '-'}</p>
                      <p><span className="text-gray-400">Origin:</span> {animal.origin === 'OTHER' ? 'Other' : 'Birth'}</p>
                      <p><span className="text-gray-400">Arrival:</span> {formatDate(animal.arrivalDate)}</p>
                    </div>
                    {animal.origin === 'OTHER' && (
                      <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800/60">
                        <p><span className="text-gray-400">From:</span> {animal.originPlace || '-'}</p>
                        {animal.originDescription && (
                          <p className="mt-1 text-gray-500">{animal.originDescription}</p>
                        )}
                      </div>
                    )}
                    {animal.notes && <p className="text-sm text-gray-500">{animal.notes}</p>}
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditing(animal);
                        setEditOrigin((animal.origin === 'OTHER' ? 'OTHER' : 'BIRTH'));
                        setEditPhoto(undefined);
                      }}>
                        <PencilIcon className="h-4 w-4" /> Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteId(animal.id)}>
                        <TrashIcon className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(editing)} onClose={() => { setEditing(null); setEditOrigin('BIRTH'); }} title="Edit Animal" size="lg">
        {editing && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input name="name" label="Name" defaultValue={editing.name} required />
            <Select name="speciesId" label="Species" options={speciesOptions} defaultValue={editing.speciesId} />
            <Select name="enclosureId" label="Enclosure" options={enclosureOptions} defaultValue={editing.enclosureId} />
            <div className="grid grid-cols-2 gap-4">
              <Select
                name="gender"
                label="Gender"
                options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'UNKNOWN', label: 'Unknown' }]}
                defaultValue={editing.gender}
              />
              <Select
                name="healthStatus"
                label="Health Status"
                options={['HEALTHY', 'SICK', 'RECOVERING', 'CRITICAL', 'DECEASED'].map((s) => ({ value: s, label: s }))}
                defaultValue={editing.healthStatus}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input name="weight" label="Weight (kg)" type="number" step="0.1" defaultValue={editing.weight ?? ''} />
              <Input name="dateOfBirth" label="Date of Birth" type="date" defaultValue={editing.dateOfBirth?.slice(0, 10) || ''} />
            </div>
            <Select
              name="origin"
              label="Origin"
              options={[
                { value: 'BIRTH', label: 'Birth (born at zoo)' },
                { value: 'OTHER', label: 'Other (bought / transferred)' },
              ]}
              value={editOrigin}
              onChange={(e) => setEditOrigin(e.target.value as 'BIRTH' | 'OTHER')}
            />
            {editOrigin === 'OTHER' && (
              <>
                <Input
                  name="originPlace"
                  label="Transferred / bought from"
                  defaultValue={editing.originPlace || ''}
                  required
                />
                <Textarea
                  name="originDescription"
                  label="Origin description"
                  rows={2}
                  defaultValue={editing.originDescription || ''}
                />
              </>
            )}
            {editing.photo && <img src={mediaUrl(editing.photo)} alt={editing.name} className="h-24 w-24 rounded-xl object-cover" />}
            <Input label="Replace Photo" type="file" accept="image/*,.jfif" onChange={(e) => setEditPhoto(e.target.files?.[0])} />
            <Textarea name="notes" label="Notes" rows={3} defaultValue={editing.notes || ''} />
            <Button type="submit" loading={saving} className="w-full">Save Changes</Button>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Animal"
        message="Are you sure you want to delete this animal record?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
