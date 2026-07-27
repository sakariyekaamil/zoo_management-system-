import { AuthRequest } from '../types';

export const paramId = (req: AuthRequest, name = 'id'): string => {
  const value = req.params[name];
  if (Array.isArray(value)) return String(value[0]);
  return String(value);
};
