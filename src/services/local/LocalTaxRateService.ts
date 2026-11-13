import { ITaxRateService } from '../interfaces';
import { PropertyCategory, TaxRate } from '../../types';
import { StorageService } from '../storageService';

export class LocalTaxRateService implements ITaxRateService {
  async getTaxRates(): Promise<TaxRate[]> {
    return StorageService.getTaxRates();
  }

  async getTaxRateById(id: string): Promise<TaxRate | null> {
    const rates = StorageService.getTaxRates();
    return rates.find((r) => r.id === id) || null;
  }

  async getActiveRateForCategory(category: PropertyCategory): Promise<number> {
    const rates = StorageService.getTaxRates();
    const active = rates.find((r) => r.category === category && r.isActive);
    if (active) return active.ratePerSqFt;

    // Fallbacks as per problem statement
    if (category === 'RESIDENTIAL') return 10;
    if (category === 'COMMERCIAL') return 18;
    if (category === 'INDUSTRIAL') return 15;
    return 10;
  }

  async createTaxRate(
    data: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TaxRate> {
    const rates = StorageService.getTaxRates();

    // Check for conflicting active rate
    if (data.isActive) {
      const conflicting = rates.find(
        (r) => r.category === data.category && r.isActive && r.id !== undefined
      );
      if (conflicting) {
        // Automatically deactivate previous active rate or throw if overlapping
        conflicting.isActive = false;
        conflicting.effectiveEndDate = data.effectiveStartDate;
        conflicting.updatedAt = new Date().toISOString();
      }
    }

    const now = new Date().toISOString();
    const newRate: TaxRate = {
      ...data,
      id: `rate-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    rates.unshift(newRate);
    StorageService.setTaxRates(rates);
    return newRate;
  }

  async updateTaxRate(id: string, data: Partial<TaxRate>): Promise<TaxRate> {
    const rates = StorageService.getTaxRates();
    const index = rates.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Tax rate ${id} not found`);

    // If making active, deactivate other active rate for same category
    if (data.isActive) {
      const category = data.category || rates[index].category;
      rates.forEach((r) => {
        if (r.id !== id && r.category === category && r.isActive) {
          r.isActive = false;
          r.updatedAt = new Date().toISOString();
        }
      });
    }

    const updated: TaxRate = {
      ...rates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    rates[index] = updated;
    StorageService.setTaxRates(rates);
    return updated;
  }

  async deactivateTaxRate(id: string): Promise<TaxRate> {
    return this.updateTaxRate(id, {
      isActive: false,
      effectiveEndDate: new Date().toISOString().split('T')[0],
    });
  }
}
