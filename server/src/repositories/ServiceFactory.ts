
import { ICivicTaxRepository } from './ICivicTaxRepository.js';
import { LocalRepository } from './LocalRepository.js';
import { SalesforceRepository } from './SalesforceRepository.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';

export class BackendServiceFactory {
  public static async getRepository(): Promise<ICivicTaxRepository> {
    try {
      const session = await SalesforceConnectionStore.get();

      if (session?.accessToken && session?.instanceUrl) {
        return new SalesforceRepository(session);
      }

      if (process.env.NODE_ENV !== 'production') {
        return new LocalRepository();
      }

      throw new Error(
        'CENTRAL_SALESFORCE_NOT_CONNECTED: The administrator must connect Salesforce before municipal operations can continue.'
      );
    } catch (error) {
      // Never silently fall back to local data in production.
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }

      // Local development fallback only.
      console.error(
        'Salesforce connection unavailable:',
        error instanceof Error ? error.message : error
      );

      return new LocalRepository();
    }
  }
}
