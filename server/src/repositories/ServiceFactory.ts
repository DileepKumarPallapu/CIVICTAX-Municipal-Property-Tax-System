
import { ICivicTaxRepository } from './ICivicTaxRepository.js';
import { LocalRepository } from './LocalRepository.js';
import { SalesforceRepository } from './SalesforceRepository.js';
import { SalesforceConnectionStore } from '../services/salesforceConnectionStore.js';
import { config } from '../config/index.js';

export class BackendServiceFactory {
  public static async getRepository(
    civicTaxUserId: string
  ): Promise<ICivicTaxRepository> {
    try {
      const session = await SalesforceConnectionStore.get();

      if (session?.accessToken && session?.instanceUrl) {
        return new SalesforceRepository(session, civicTaxUserId);
      }

      if (!config.isProduction) {
        console.warn(
          'Salesforce is not connected. Using LocalRepository for development.'
        );

        return new LocalRepository();
      }

      throw new Error(
        'CENTRAL_SALESFORCE_NOT_CONNECTED: The administrator must connect Salesforce before municipal operations can continue.'
      );
    } catch (error) {
      // Never fall back to local data in production.
      if (config.isProduction) {
        throw error;
      }

      console.error(
        'Salesforce connection unavailable:',
        error instanceof Error ? error.message : error
      );

      return new LocalRepository();
    }
  }
}
