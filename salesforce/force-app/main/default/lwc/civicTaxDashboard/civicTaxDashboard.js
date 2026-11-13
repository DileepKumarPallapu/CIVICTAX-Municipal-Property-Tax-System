import { LightningElement, track, wire } from 'lwc';

export default class CivicTaxDashboard extends LightningElement {
    @track totalProperties = 20;
    @track verifiedProperties = 16;
    @track collectionEfficiency = 78.4;
}
