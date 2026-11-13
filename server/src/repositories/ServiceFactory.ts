// server/src/repositories/ServiceFactory.ts
import { ICivicTaxRepository } from './ICivicTaxRepository.js';
import { LocalRepository } from './LocalRepository.js';

export class BackendServiceFactory {
  private static localRepo: ICivicTaxRepository = new LocalRepository();

  public static getRepository(): ICivicTaxRepository {
    return this.localRepo;
  }
}
