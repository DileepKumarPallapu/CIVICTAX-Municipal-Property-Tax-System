import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import provisionKeys from '@salesforce/apex/CivicTaxGatewayProvisioning.provisionKeys';

export default class CivicTaxGatewayKeySetup extends LightningElement {
    activeKeyId = '';
    activeSecret = '';
    previousKeyId = '';
    previousSecret = '';
    previousKeyExpiresAt = '';
    isSaving = false;

    handleActiveKeyId(event) { this.activeKeyId = event.target.value; }
    handleActiveSecret(event) { this.activeSecret = event.target.value; }
    handlePreviousKeyId(event) { this.previousKeyId = event.target.value; }
    handlePreviousSecret(event) { this.previousSecret = event.target.value; }
    handlePreviousKeyExpiresAt(event) { this.previousKeyExpiresAt = event.target.value; }

    async saveKeys() {
        this.isSaving = true;
        try {
            const expiry = this.previousKeyExpiresAt
                ? new Date(this.previousKeyExpiresAt).toISOString()
                : null;
            const message = await provisionKeys({
                activeKeyId: this.activeKeyId,
                activeSecret: this.activeSecret,
                previousKeyId: this.previousKeyId || null,
                previousSecret: this.previousSecret || null,
                previousKeyExpiresAt: expiry
            });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Gateway configuration saved',
                message,
                variant: 'success'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Gateway configuration was not saved',
                message: error?.body?.message || 'Check the values and your assigned permission.',
                variant: 'error'
            }));
        } finally {
            this.activeSecret = '';
            this.previousSecret = '';
            this.isSaving = false;
        }
    }
}
