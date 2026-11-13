import { Property, PropertyFilterOptions, PropertyVerificationStatus, User } from '../../types';
import { IPropertyService } from '../interfaces';
import { StorageService } from '../storageService';
import { generatePropertyNumber } from '../../utils';
import { PropertyRules } from '../businessRules';

export class LocalPropertyService implements IPropertyService {
  public async getProperties(filter?: PropertyFilterOptions): Promise<Property[]> {
    let properties = StorageService.getProperties();

    if (!filter) return properties;

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      properties = properties.filter(
        (p) =>
          p.propertyNumber.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.documentReference.toLowerCase().includes(q)
      );
    }

    if (filter.category && filter.category !== 'ALL') {
      properties = properties.filter((p) => p.category === filter.category);
    }

    if (filter.zoneId && filter.zoneId !== 'ALL') {
      properties = properties.filter((p) => p.zoneId === filter.zoneId);
    }

    if (filter.verificationStatus && filter.verificationStatus !== 'ALL') {
      properties = properties.filter((p) => p.verificationStatus === filter.verificationStatus);
    }

    if (filter.ownerId) {
      properties = properties.filter((p) => p.ownerId === filter.ownerId);
    }

    return properties;
  }

  public async getPropertyById(id: string): Promise<Property | null> {
    const properties = StorageService.getProperties();
    return properties.find((p) => p.id === id) || null;
  }

  public async getPropertyByNumber(propertyNumber: string): Promise<Property | null> {
    const properties = StorageService.getProperties();
    return properties.find((p) => p.propertyNumber.toUpperCase() === propertyNumber.toUpperCase()) || null;
  }

  public async createProperty(
    data: Omit<Property, 'id' | 'propertyNumber' | 'registrationDate' | 'updatedAt' | 'verificationStatus'>
  ): Promise<Property> {
    const properties = StorageService.getProperties();

    // 1. Validate Business Rules (check title, built area, duplicate detection)
    PropertyRules.validateRegistration(data, properties);

    const now = new Date().toISOString();
    const id = `prop-${Date.now()}`;
    const propertyNumber = generatePropertyNumber(properties.length);

    const newProperty: Property = {
      ...data,
      id,
      propertyNumber,
      verificationStatus: 'PENDING',
      registrationDate: now,
      updatedAt: now,
      revisions: [
        {
          id: `rev-${Date.now()}`,
          timestamp: now,
          actorId: data.ownerId,
          actorName: data.ownerName,
          action: 'PROPERTY_REGISTERED',
          remarks: 'Initial property registration filed by citizen.',
        },
      ],
    };

    StorageService.setProperties([newProperty, ...properties]);

    // 2. Automated Notification
    const notifications = StorageService.getNotifications();
    const newNotification = {
      id: `notif-${Date.now()}`,
      userId: data.ownerId,
      title: 'Property Registration Submitted',
      message: `Property ${propertyNumber} has been recorded and submitted for physical/deed verification.`,
      category: 'PROPERTY' as const,
      isRead: false,
      timestamp: now,
      linkUrl: `/citizen/properties`,
    };
    StorageService.setNotifications([newNotification, ...notifications]);

    // 3. Record Audit Log
    StorageService.recordAuditLog({
      actorId: data.ownerId,
      actorName: data.ownerName,
      actorRole: 'CITIZEN',
      action: 'REGISTER_PROPERTY',
      recordType: 'PROPERTY',
      recordId: id,
      newStatus: 'PENDING',
      description: `Registered new parcel ${propertyNumber} at ${data.address} (${data.builtUpArea} sq ft).`,
    });

    return newProperty;
  }

  public async updateProperty(id: string, data: Partial<Property>): Promise<Property> {
    const properties = StorageService.getProperties();
    const index = properties.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error(`Property with id ${id} not found.`);
    }

    const existing = properties[index];
    const now = new Date().toISOString();

    const updated: Property = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    properties[index] = updated;
    StorageService.setProperties([...properties]);

    // Audit log
    StorageService.recordAuditLog({
      actorId: updated.ownerId,
      actorName: updated.ownerName,
      actorRole: 'CITIZEN',
      action: 'UPDATE_PROPERTY',
      recordType: 'PROPERTY',
      recordId: id,
      description: `Updated property attributes for ${updated.propertyNumber}.`,
    });

    return updated;
  }

  public async verifyProperty(
    id: string,
    status: PropertyVerificationStatus,
    officerId: string,
    officerName: string,
    comments?: string
  ): Promise<Property> {
    const properties = StorageService.getProperties();
    const index = properties.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error(`Property with id ${id} not found.`);
    }

    const existing = properties[index];
    const now = new Date().toISOString();

    const updated: Property = {
      ...existing,
      verificationStatus: status,
      verificationDate: now,
      verifiedByOfficerId: officerId,
      verifiedByOfficerName: officerName,
      verificationComments: comments,
      rejectionReason: status === 'REJECTED' ? comments : undefined,
      updatedAt: now,
      revisions: [
        ...(existing.revisions || []),
        {
          id: `rev-${Date.now()}`,
          timestamp: now,
          actorId: officerId,
          actorName: officerName,
          action: `VERIFICATION_${status}`,
          remarks: comments || `Status transitioned to ${status}`,
        },
      ],
    };

    properties[index] = updated;
    StorageService.setProperties([...properties]);

    // Citizen Notification
    const notifications = StorageService.getNotifications();
    const newNotification = {
      id: `notif-${Date.now()}`,
      userId: existing.ownerId,
      title: status === 'VERIFIED' ? 'Property Verification Approved' : 'Property Verification Flagged/Rejected',
      message:
        status === 'VERIFIED'
          ? `Your property ${existing.propertyNumber} has been verified by Officer ${officerName}. Tax assessment is now enabled.`
          : `Your property ${existing.propertyNumber} was reviewed: ${comments || 'Action required.'}`,
      category: 'PROPERTY' as const,
      isRead: false,
      timestamp: now,
      linkUrl: `/citizen/properties`,
    };
    StorageService.setNotifications([newNotification, ...notifications]);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: officerId,
      actorName: officerName,
      actorRole: 'OFFICER',
      action: `VERIFY_PROPERTY_${status}`,
      recordType: 'PROPERTY',
      recordId: id,
      previousStatus: existing.verificationStatus,
      newStatus: status,
      description: `Officer ${officerName} reviewed ${existing.propertyNumber}: status set to ${status}. Remarks: ${comments || 'None'}.`,
    });

    return updated;
  }

  public async deleteProperty(id: string): Promise<boolean> {
    const properties = StorageService.getProperties();
    const toDelete = properties.find((p) => p.id === id);
    if (!toDelete) return false;

    const filtered = properties.filter((p) => p.id !== id);
    StorageService.setProperties(filtered);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: 'usr-admin-01',
      actorName: 'Administrator',
      actorRole: 'ADMIN',
      action: 'DELETE_PROPERTY',
      recordType: 'PROPERTY',
      recordId: id,
      description: `Deleted property record ${toDelete.propertyNumber}.`,
    });

    return true;
  }
}
