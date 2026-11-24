import { LightningElement, wire } from "lwc";
import getExecutiveMetrics from "@salesforce/apex/CivicTaxDashboardService.getExecutiveMetrics";

export default class CivicTaxDashboard extends LightningElement {
  @wire(getExecutiveMetrics)
  metrics;

  get totalProperties() {
    return this.metrics?.data?.totalProperties ?? 0;
  }

  get verifiedProperties() {
    return this.metrics?.data?.verifiedProperties ?? 0;
  }

  get collectionEfficiency() {
    return this.metrics?.data?.collectionEfficiencyRate ?? 0;
  }

  get hasError() {
    return Boolean(this.metrics?.error);
  }
}
