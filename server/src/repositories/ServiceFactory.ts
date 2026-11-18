
import { ICivicTaxRepository } from './ICivicTaxRepository.js';
import { LocalRepository } from './LocalRepository.js';
import { SalesforceRepository } from './SalesforceRepository.js';
import { SalesforceSessionData } from '../types/index.js';

export class BackendServiceFactory {
  public static getRepository(
    session?: SalesforceSessionData
  ): ICivicTaxRepository {
    if (session?.accessToken && session?.instanceUrl) {
      return new SalesforceRepository(session);
    }

    return new LocalRepository();
  }
}
