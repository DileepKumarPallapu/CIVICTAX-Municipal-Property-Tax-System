import { IZoneService } from '../interfaces';
import { MunicipalZone } from '../../types';
import { StorageService } from '../storageService';

export class LocalZoneService implements IZoneService {
  async getZones(): Promise<MunicipalZone[]> {
    return StorageService.getZones();
  }

  async getZoneById(id: string): Promise<MunicipalZone | null> {
    const zones = StorageService.getZones();
    return zones.find((z) => z.id === id) || null;
  }

  async createZone(data: Omit<MunicipalZone, 'id'>): Promise<MunicipalZone> {
    const zones = StorageService.getZones();
    const newZone: MunicipalZone = {
      ...data,
      id: `zone-${Date.now()}`,
    };
    zones.push(newZone);
    StorageService.setZones(zones);
    return newZone;
  }

  async updateZone(id: string, data: Partial<MunicipalZone>): Promise<MunicipalZone> {
    const zones = StorageService.getZones();
    const index = zones.findIndex((z) => z.id === id);
    if (index === -1) throw new Error(`Zone ${id} not found`);

    const updated: MunicipalZone = {
      ...zones[index],
      ...data,
    };
    zones[index] = updated;
    StorageService.setZones(zones);
    return updated;
  }
}
