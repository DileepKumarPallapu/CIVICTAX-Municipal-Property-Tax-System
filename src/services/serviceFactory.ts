import {
  IUserService,
  IPropertyService,
  ITaxRateService,
  IAssessmentService,
  IPaymentService,
  IGrievanceService,
  IReassessmentService,
  INotificationService,
  IDashboardService,
  IZoneService,
} from './interfaces';

import { LocalUserService } from './local/LocalUserService';
import { LocalPropertyService } from './local/LocalPropertyService';
import { LocalTaxRateService } from './local/LocalTaxRateService';
import { LocalAssessmentService } from './local/LocalAssessmentService';
import { LocalPaymentService } from './local/LocalPaymentService';
import { LocalGrievanceService } from './local/LocalGrievanceService';
import { LocalReassessmentService } from './local/LocalReassessmentService';
import { LocalNotificationService } from './local/LocalNotificationService';
import { LocalDashboardService } from './local/LocalDashboardService';
import { LocalZoneService } from './local/LocalZoneService';

class ServiceFactory {
  private static instance: ServiceFactory;

  public readonly userService: IUserService;
  public readonly propertyService: IPropertyService;
  public readonly taxRateService: ITaxRateService;
  public readonly assessmentService: IAssessmentService;
  public readonly paymentService: IPaymentService;
  public readonly grievanceService: IGrievanceService;
  public readonly reassessmentService: IReassessmentService;
  public readonly notificationService: INotificationService;
  public readonly dashboardService: IDashboardService;
  public readonly zoneService: IZoneService;

  private constructor() {
    // Check if future Salesforce environment flag is toggled
    const useSalesforce = import.meta.env.VITE_USE_SALESFORCE === 'true';

    if (useSalesforce) {
      console.info('ServiceFactory: Initializing Salesforce Service Adapters (Phase 2 stub)');
    }

    // Initialize Local implementations for current phase
    this.userService = new LocalUserService();
    this.propertyService = new LocalPropertyService();
    this.taxRateService = new LocalTaxRateService();
    this.assessmentService = new LocalAssessmentService();
    this.paymentService = new LocalPaymentService();
    this.grievanceService = new LocalGrievanceService();
    this.reassessmentService = new LocalReassessmentService();
    this.notificationService = new LocalNotificationService();
    this.dashboardService = new LocalDashboardService();
    this.zoneService = new LocalZoneService();
  }

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }
}

export const services = ServiceFactory.getInstance();
