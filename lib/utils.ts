import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  console.error(`Supabase Error [${operationType}] on ${path}:`, error);
  throw error;
}

export function belongsToDirector(recordDirectorId: string | null | undefined, currentUser: any): boolean {
  if (!currentUser) return false;
  
  const currentUserId = currentUser.id;
  const currentUserRole = currentUser.role;
  const isBolacha = currentUser.username?.toUpperCase() === 'BOLACHA' || currentUserRole === 'admin';
  
  if (currentUserRole === 'director') {
    return recordDirectorId === currentUserId;
  }
  
  if (isBolacha) {
    // Bolacha's own students/items have director_id === null, Bolacha's ID, or fallback ID
    return !recordDirectorId || 
           recordDirectorId === currentUserId || 
           recordDirectorId === '00000000-0000-0000-0000-000000000000';
  }
  
  // For a normal student, their director is user.director_id
  const studentDirectorId = currentUser.director_id;
  if (!studentDirectorId) {
    // Student of Bolacha (Sede Geral)
    return !recordDirectorId || 
           recordDirectorId === '00000000-0000-0000-0000-000000000000';
  } else {
    // Student of another director
    return recordDirectorId === studentDirectorId;
  }
}
