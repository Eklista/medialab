import apiClient, { handleApiError } from './api';
import { User } from './auth.service';

export interface UserCreateRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  birthDate?: string;
  joinDate: string;
  isActive?: boolean;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  isActive?: boolean;
  profileImage?: string;
  bannerImage?: string;
}

class UserService {
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async createUser(userData: UserCreateRequest): Promise<User> {
    try {
      const response = await apiClient.post<User>('/users', userData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async updateUser(userId: number, userData: UserUpdateRequest): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async updateCurrentUser(userData: UserUpdateRequest): Promise<User> {
    try {
      const response = await apiClient.patch<User>('/users/me', userData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new UserService();