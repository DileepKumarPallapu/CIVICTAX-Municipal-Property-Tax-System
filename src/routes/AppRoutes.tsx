import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { ServicesPage } from '../pages/public/ServicesPage';
import { ContactPage } from '../pages/public/ContactPage';
import { LoginPage } from '../pages/public/LoginPage';
import { DemoRegistrationPage } from '../pages/public/DemoRegistrationPage';

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard';
import { MyPropertiesPage } from '../pages/citizen/MyPropertiesPage';
import { RegisterPropertyPage } from '../pages/citizen/RegisterPropertyPage';
import { CitizenAssessmentsPage } from '../pages/citizen/CitizenAssessmentsPage';
import { CitizenPaymentPortalPage } from '../pages/citizen/CitizenPaymentPortalPage';
import { CitizenGrievancesPage } from '../pages/citizen/CitizenGrievancesPage';
import { CitizenReassessmentsPage } from '../pages/citizen/CitizenReassessmentsPage';
import { CitizenNotificationsPage } from '../pages/citizen/CitizenNotificationsPage';
import { CitizenProfilePage } from '../pages/citizen/CitizenProfilePage';

// Officer Pages
import { OfficerDashboard } from '../pages/officer/OfficerDashboard';
import { AssignedPropertiesPage } from '../pages/officer/AssignedPropertiesPage';
import { PropertyVerificationPage } from '../pages/officer/PropertyVerificationPage';
import { OfficerAssessmentsPage } from '../pages/officer/OfficerAssessmentsPage';
import { OfficerReassessmentsPage } from '../pages/officer/OfficerReassessmentsPage';
import { OfficerGrievancesPage } from '../pages/officer/OfficerGrievancesPage';
import { OfficerPaymentsPage } from '../pages/officer/OfficerPaymentsPage';
import { OfficerZoneAnalyticsPage } from '../pages/officer/OfficerZoneAnalyticsPage';
import { OfficerProfilePage } from '../pages/officer/OfficerProfilePage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { PropertyManagementPage } from '../pages/admin/PropertyManagementPage';
import { ZoneManagementPage } from '../pages/admin/ZoneManagementPage';
import { TaxRateConfigPage } from '../pages/admin/TaxRateConfigPage';
import { AdminAssessmentsPage } from '../pages/admin/AdminAssessmentsPage';
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage';
import { AdminGrievancesPage } from '../pages/admin/AdminGrievancesPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { SystemSettingsPage } from '../pages/admin/SystemSettingsPage';
import { AuditTrailPage } from '../pages/admin/AuditTrailPage';
import { MunicipalCommandCenter } from '../pages/admin/MunicipalCommandCenter';

// CivicTax 7.0 Smart City Intelligence Features
import { MunicipalGISPage } from '../features/gis/MunicipalGISPage';
import { RevenueRecoveryPage } from '../features/recovery/RevenueRecoveryPage';
import { ComplianceCenterPage } from '../features/compliance/ComplianceCenterPage';
import { RevenueForecastingPage } from '../features/forecasting/RevenueForecastingPage';
import { PublicTransparencyPage } from '../features/transparency/PublicTransparencyPage';
import { SalesforceSettingsPage } from '../features/salesforce/SalesforceSettingsPage';
import { AcademicEvidenceCenter } from '../features/evidence/AcademicEvidenceCenter';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/transparency" element={<PublicTransparencyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/demo-registration" element={<DemoRegistrationPage />} />
      </Route>

      {/* Citizen Portal */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['CITIZEN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CitizenDashboard />} />
        <Route path="properties" element={<MyPropertiesPage />} />
        <Route path="register-property" element={<RegisterPropertyPage />} />
        <Route path="assessments" element={<CitizenAssessmentsPage />} />
        <Route path="payments" element={<CitizenPaymentPortalPage />} />
        <Route path="grievances" element={<CitizenGrievancesPage />} />
        <Route path="reassessments" element={<CitizenReassessmentsPage />} />
        <Route path="notifications" element={<CitizenNotificationsPage />} />
        <Route path="profile" element={<CitizenProfilePage />} />
      </Route>

      {/* Municipal Officer Portal */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={['OFFICER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OfficerDashboard />} />
        <Route path="assigned-properties" element={<AssignedPropertiesPage />} />
        <Route path="verification" element={<PropertyVerificationPage />} />
        <Route path="assessments" element={<OfficerAssessmentsPage />} />
        <Route path="reassessments" element={<OfficerReassessmentsPage />} />
        <Route path="grievances" element={<OfficerGrievancesPage />} />
        <Route path="payments" element={<OfficerPaymentsPage />} />
        <Route path="zone-analytics" element={<OfficerZoneAnalyticsPage />} />
        <Route path="gis" element={<MunicipalGISPage />} />
        <Route path="recovery" element={<RevenueRecoveryPage />} />
        <Route path="compliance" element={<ComplianceCenterPage />} />
        <Route path="profile" element={<OfficerProfilePage />} />
      </Route>

      {/* Administrator Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="command-center" element={<MunicipalCommandCenter />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="properties" element={<PropertyManagementPage />} />
        <Route path="zones" element={<ZoneManagementPage />} />
        <Route path="tax-rates" element={<TaxRateConfigPage />} />
        <Route path="assessments" element={<AdminAssessmentsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="grievances" element={<AdminGrievancesPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="gis" element={<MunicipalGISPage />} />
        <Route path="recovery" element={<RevenueRecoveryPage />} />
        <Route path="compliance" element={<ComplianceCenterPage />} />
        <Route path="forecasting" element={<RevenueForecastingPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="salesforce" element={<SalesforceSettingsPage />} />
        <Route path="evidence" element={<AcademicEvidenceCenter />} />
        <Route path="audit" element={<AuditTrailPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
