import { Grievance, GrievanceFilterOptions, GrievanceStatus } from '../../types';
import { IGrievanceService } from '../interfaces';
import { StorageService } from '../storageService';
import { generateGrievanceNumber } from '../../utils';

export class LocalGrievanceService implements IGrievanceService {
  public async getGrievances(filter?: GrievanceFilterOptions): Promise<Grievance[]> {
    let grievances = StorageService.getGrievances();

    if (!filter) return grievances;

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      grievances = grievances.filter(
        (g) =>
          g.grievanceNumber.toLowerCase().includes(q) ||
          g.subject.toLowerCase().includes(q) ||
          g.propertyNumber.toLowerCase().includes(q) ||
          g.citizenName.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
      );
    }

    if (filter.status && filter.status !== 'ALL') {
      grievances = grievances.filter((g) => g.status === filter.status);
    }

    if (filter.priority && filter.priority !== 'ALL') {
      grievances = grievances.filter((g) => g.priority === filter.priority);
    }

    if (filter.category && filter.category !== 'ALL') {
      grievances = grievances.filter((g) => g.category === filter.category);
    }

    if (filter.citizenId) {
      grievances = grievances.filter((g) => g.citizenId === filter.citizenId);
    }

    if (filter.officerId) {
      grievances = grievances.filter((g) => g.assignedOfficerId === filter.officerId);
    }

    // Advanced Officer Workspace Views (V4.0)
    if (filter.filterView) {
      switch (filter.filterView) {
        case 'NEW':
          grievances = grievances.filter((g) => g.status === 'SUBMITTED');
          break;
        case 'HIGH_PRIORITY':
          grievances = grievances.filter((g) => g.priority === 'HIGH' || g.priority === 'CRITICAL');
          break;
        case 'ASSIGNED_TO_ME':
          if (filter.officerId) {
            grievances = grievances.filter((g) => g.assignedOfficerId === filter.officerId);
          }
          break;
        case 'RESOLVED':
          grievances = grievances.filter((g) => g.status === 'RESOLVED');
          break;
      }
    }

    return grievances;
  }

  public async getGrievanceById(id: string): Promise<Grievance | null> {
    const grievances = StorageService.getGrievances();
    return grievances.find((g) => g.id === id) || null;
  }

  public async createGrievance(
    data: Omit<Grievance, 'id' | 'grievanceNumber' | 'submissionDate' | 'status' | 'timeline'>
  ): Promise<Grievance> {
    const grievances = StorageService.getGrievances();
    const id = `grv-${Date.now()}`;
    const grievanceNumber = generateGrievanceNumber();
    const now = new Date().toISOString();

    const newGrievance: Grievance = {
      ...data,
      id,
      grievanceNumber,
      submissionDate: now,
      status: 'SUBMITTED',
      timeline: [
        {
          status: 'SUBMITTED',
          timestamp: now,
          updatedBy: data.citizenName,
          comment: 'Grievance ticket created and lodged by citizen.',
        },
      ],
    };

    StorageService.setGrievances([newGrievance, ...grievances]);

    // Citizen Notification
    const notifications = StorageService.getNotifications();
    StorageService.setNotifications([
      {
        id: `notif-${Date.now()}`,
        userId: data.citizenId,
        title: 'Grievance Ticket Lodged',
        message: `Your grievance ticket ${grievanceNumber} (${data.subject}) has been logged. Our municipal officer will review it shortly.`,
        category: 'GRIEVANCE',
        isRead: false,
        timestamp: now,
        linkUrl: `/citizen/grievances`,
      },
      ...notifications,
    ]);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: data.citizenId,
      actorName: data.citizenName,
      actorRole: 'CITIZEN',
      action: 'SUBMIT_GRIEVANCE',
      recordType: 'GRIEVANCE',
      recordId: id,
      newStatus: 'SUBMITTED',
      description: `Citizen submitted grievance ${grievanceNumber} on parcel ${data.propertyNumber} (${data.category}).`,
    });

    return newGrievance;
  }

  public async updateGrievanceStatus(
    id: string,
    status: GrievanceStatus,
    officerId: string,
    officerName: string,
    comment?: string,
    internalRemarks?: string
  ): Promise<Grievance> {
    const grievances = StorageService.getGrievances();
    const index = grievances.findIndex((g) => g.id === id);

    if (index === -1) {
      throw new Error(`Grievance with id ${id} not found.`);
    }

    const existing = grievances[index];
    const now = new Date().toISOString();

    const updated: Grievance = {
      ...existing,
      status,
      assignedOfficerId: officerId || existing.assignedOfficerId,
      assignedOfficerName: officerName || existing.assignedOfficerName,
      internalRemarks: internalRemarks !== undefined ? internalRemarks : existing.internalRemarks,
      resolutionComments: status === 'RESOLVED' ? comment : existing.resolutionComments,
      resolvedDate: status === 'RESOLVED' ? now : existing.resolvedDate,
      timeline: [
        ...existing.timeline,
        {
          status,
          timestamp: now,
          updatedBy: officerName,
          comment: comment || `Status progressed to ${status}`,
        },
      ],
    };

    grievances[index] = updated;
    StorageService.setGrievances([...grievances]);

    // Citizen Notification
    const notifications = StorageService.getNotifications();
    StorageService.setNotifications([
      {
        id: `notif-${Date.now()}`,
        userId: existing.citizenId,
        title: `Grievance Status: ${status}`,
        message: `Ticket ${existing.grievanceNumber} status updated to ${status} by Officer ${officerName}.`,
        category: 'GRIEVANCE',
        isRead: false,
        timestamp: now,
        linkUrl: `/citizen/grievances`,
      },
      ...notifications,
    ]);

    // Audit Log
    StorageService.recordAuditLog({
      actorId: officerId,
      actorName: officerName,
      actorRole: 'OFFICER',
      action: `UPDATE_GRIEVANCE_${status}`,
      recordType: 'GRIEVANCE',
      recordId: id,
      previousStatus: existing.status,
      newStatus: status,
      description: `Grievance ${existing.grievanceNumber} moved to ${status}. Comment: ${comment || 'None'}.`,
    });

    return updated;
  }

  public async assignOfficer(id: string, officerId: string, officerName: string): Promise<Grievance> {
    return this.updateGrievanceStatus(
      id,
      'ASSIGNED',
      officerId,
      officerName,
      `Case assigned to ${officerName} for municipal investigation.`
    );
  }
}
