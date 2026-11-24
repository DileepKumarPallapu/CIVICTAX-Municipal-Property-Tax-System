import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import CivicTaxDashboard from "c/civicTaxDashboard";
import getExecutiveMetrics from "@salesforce/apex/CivicTaxDashboardService.getExecutiveMetrics";

const getMetricsAdapter = registerApexTestWireAdapter(getExecutiveMetrics);

describe("civicTaxDashboard", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders live dashboard metrics from Apex", async () => {
    const element = createElement("c-civic-tax-dashboard", {
      is: CivicTaxDashboard
    });
    document.body.appendChild(element);

    getMetricsAdapter.emit({
      totalProperties: 42,
      verifiedProperties: 31,
      collectionEfficiencyRate: 73.5
    });

    await Promise.resolve();

    const values = [...element.shadowRoot.querySelectorAll("h2")].map(
      (node) => node.textContent
    );
    expect(values).toEqual(["42", "31", "73.5%"]);
  });

  it("shows an error state when metrics cannot be loaded", async () => {
    const element = createElement("c-civic-tax-dashboard", {
      is: CivicTaxDashboard
    });
    document.body.appendChild(element);

    getMetricsAdapter.error();

    await Promise.resolve();

    expect(element.shadowRoot.querySelector('[role="alert"]')).not.toBeNull();
  });
});
