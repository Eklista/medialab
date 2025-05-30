// ===================================================================
// frontend/src/services/users/types/requests.types.ts - 🔧 COMPLETO
// ===================================================================
export interface UserCreateRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId?: string;
  areaId?: string;
  joinDate?: string;
  first_name?: string;
  last_name?: string;
  join_date?: string;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  areaId?: string;
  isActive?: boolean;
  phone?: string;
  birthDate?: string;
  profileImage?: string;
  bannerImage?: string;
}

export interface UserPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserRoleAssignmentRequest {
  roleId: string;
  areaId: string;
}

export interface UserImageUploadRequest {
  file: File;
  type: 'profile' | 'banner';
}