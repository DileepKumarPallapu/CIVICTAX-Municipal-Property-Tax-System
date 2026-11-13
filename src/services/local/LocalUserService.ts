import { IUserService } from '../interfaces';
import { User } from '../../types';
import { StorageService } from '../storageService';

export class LocalUserService implements IUserService {
  async login(email: string, password?: string): Promise<User> {
    const users = StorageService.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    
    // Check credentials against demo accounts
    if (cleanEmail === 'admin@civictax.demo') {
      if (password && password !== 'Admin@123') {
        throw new Error('Invalid credentials. Password for demo admin is Admin@123');
      }
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) throw new Error('Demo admin user record not found in storage');
      StorageService.setCurrentUser(user);
      return user;
    }

    if (cleanEmail === 'officer@civictax.demo') {
      if (password && password !== 'Officer@123') {
        throw new Error('Invalid credentials. Password for demo officer is Officer@123');
      }
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) throw new Error('Demo officer user record not found in storage');
      StorageService.setCurrentUser(user);
      return user;
    }

    if (cleanEmail === 'citizen@civictax.demo') {
      if (password && password !== 'Citizen@123') {
        throw new Error('Invalid credentials. Password for demo citizen is Citizen@123');
      }
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) throw new Error('Demo citizen user record not found in storage');
      StorageService.setCurrentUser(user);
      return user;
    }

    // Generic demo user lookup
    const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (foundUser) {
      StorageService.setCurrentUser(foundUser);
      return foundUser;
    }

    throw new Error('User not found. Please use one of the demo accounts provided on screen.');
  }

  async getCurrentUser(): Promise<User | null> {
    return StorageService.getCurrentUser();
  }

  async logout(): Promise<void> {
    StorageService.setCurrentUser(null);
  }

  async getUsers(): Promise<User[]> {
    return StorageService.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    const users = StorageService.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const users = StorageService.getUsers();
    const newUser: User = {
      id: `usr-cit-${Date.now().toString().slice(-4)}`,
      name: userData.name || 'Anonymous User',
      email: (userData.email || '').toLowerCase(),
      role: userData.role || 'CITIZEN',
      phone: userData.phone || '',
      address: userData.address || '',
      designation: userData.designation,
      department: userData.department,
      zoneId: userData.zoneId,
      zoneName: userData.zoneName,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    StorageService.setUsers(users);
    return newUser;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const users = StorageService.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`User with ID ${id} not found`);

    const updated: User = {
      ...users[index],
      ...userData,
    };
    users[index] = updated;
    StorageService.setUsers(users);

    const current = StorageService.getCurrentUser();
    if (current && current.id === id) {
      StorageService.setCurrentUser(updated);
    }
    return updated;
  }
}
