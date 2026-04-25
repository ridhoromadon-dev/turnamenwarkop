export type ThemeType = string;

export interface ThemeConfig {
  bg: string;
  text: string;
  primary: string;
  card: string;
  navbar: string;
  accent: string;
}

export interface CustomTheme extends ThemeConfig {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  USER = 'USER'
}

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  teamName: string;
  registrationDate: string;
  isAdmin?: boolean;
  role?: UserRole;
  avatarUrl?: string;
  totalWins?: number;
}

export interface Testimonial {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  dateUploaded: string;
  username?: string;
}

export interface TournamentSettings {
  theme: ThemeType;
  posterPath: string;
  tournamentDate: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
