import { UserWithoutPassword, UserRole } from '../types/User';
import { api } from './api';

export async function getAllUsers(): Promise<UserWithoutPassword[]> {
  return api.get<UserWithoutPassword[]>('/users');
}

export async function getUserById(id: number): Promise<UserWithoutPassword | null> {
  try {
    return await api.get<UserWithoutPassword>(`/users/${id}`);
  } catch {
    return null;
  }
}

export async function updateUserRole(id: number, role: UserRole): Promise<UserWithoutPassword | null> {
  try {
    return await api.put<UserWithoutPassword>(`/users/${id}/role`, { role });
  } catch {
    return null;
  }
}

export async function deleteUser(id: number, _currentUserId?: number): Promise<boolean> {
  try {
    await api.delete(`/users/${id}`);
    return true;
  } catch {
    return false;
  }
}
