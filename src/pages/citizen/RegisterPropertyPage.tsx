import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { MunicipalZone, PropertyCategory } from '../../types';

// Validation Schema using Zod
const currentYear = new Date().getFullYear();
const propertySchema = z.object({
  ownerName: z.string().min(3, 'Owner name must be at least 3 characters'),
  ownerEmail: z.string().email('Please enter a valid email address'),
  ownerPhone: z.string().min(10, 'Please enter a valid 10-digit mobile number'),
  address: z.string().min(10, 'Full address must be at least 10 characters'),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']),
  zoneId: z.string().min(1, 'Please select a municipal zone'),
  builtUpArea: z.number().positive('Built-up area must be greater than zero'),
  constructionYear: z
    .number()
    .int()
    .min(1900, 'Construction year must be 1900 or later')
    .max(currentYear, `Construction year cannot be in the future (max ${currentYear})`),
  documentReference: z
    .string()
    .min(5, 'Ownership document registration reference is required (e.g. DOC-MH-2024-XXXX)'),
  contactDetails: z.string().optional(),
  description: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export const RegisterPropertyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [zones, setZones] = useState<MunicipalZone[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    services.zoneService.getZones().then(setZones);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
     defaultValues: {
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      category: undefined,
      zoneId: '',
      builtUpArea: undefined,
      constructionYear: undefined,
      address: '',
      documentReference: '',
      contactDetails: '',
      description: '',
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      const selectedZone = zones.find((z) => z.id === data.zoneId);
      const zoneName = selectedZone ? selectedZone.name : 'Zone 1 - Central Urban Core';

      const newProp = await services.propertyService.createProperty({
        ownerId: currentUser.id,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPhone: data.ownerPhone,
        address: data.address,
        category: data.category as PropertyCategory,
        zoneId: data.zoneId,
        zoneName,
        builtUpArea: data.builtUpArea,
        constructionYear: data.constructionYear,
        documentReference: data.documentReference,
        contactDetails: data.contactDetails || '',
        description: data.description || '',
      });

      success(
        'Property Application Submitted',
        `Property ${newProp.propertyNumber} registered successfully in ${zoneName}. Status: Pending Verification.`
      );
      navigate('/citizen/my-properties');
    } catch (err: any) {
      error('Submission Error', err.message || 'Failed to submit property application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Register New Property"
        subtitle="Submit property ownership details, built-up dimensions, and municipal parcel documents for verification."
        breadcrumbs={[
          { label: 'Dashboard', path: '/citizen/dashboard' },
          { label: 'My Properties', path: '/citizen/my-properties' },
          { label: 'Register Property' },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official Property Registration Form
            </h3>
            <p className="text-xs text-slate-400">
              Mandatory fields are marked with an asterisk (*). All details will be audited by the assigned municipal revenue inspector.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Ownership Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Title & Ownership Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Property Owner Name *
                </label>
                <input
                  type="text"
                  {...register('ownerName')}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
                {errors.ownerName && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.ownerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('ownerEmail')}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
                {errors.ownerEmail && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.ownerEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  {...register('ownerPhone')}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
                {errors.ownerPhone && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.ownerPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Category, Zone, Dimensions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Classification, Zone & Built Dimensions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Property Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-semibold"
                >
                <option value="">Select property category</option>
                  <option value="RESIDENTIAL">Residential (₹10/sq.ft)</option>
                  <option value="COMMERCIAL">Commercial (₹18/sq.ft)</option>
                  <option value="INDUSTRIAL">Industrial (₹15/sq.ft)</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Municipal Zone *
                </label>
                <select
                  {...register('zoneId')}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-semibold"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
                {errors.zoneId && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.zoneId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Built-up Area (Sq.Ft) *
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('builtUpArea', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono"
                />
                {errors.builtUpArea && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.builtUpArea.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Construction Year *
                </label>
                <input
                  type="number"
                  {...register('constructionYear', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono"
                />
                {errors.constructionYear && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.constructionYear.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Address and Deeds */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Location & Legal Verification Reference
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Property Address (Plot/Flat, Building, Street, Ward) *
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="e.g. Flat 301, Silver Oaks CHS, Baner Road, Ward 26"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
                {errors.address && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ownership Document Registration Reference (Deed / Index-II / Title Number) *
                </label>
                <input
                  type="text"
                  {...register('documentReference')}
                  placeholder="e.g. DOC-MH-PUN-2024-91829"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono"
                />
                {errors.documentReference && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.documentReference.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Remarks / Architectural Details (Optional)
                </label>
                <textarea
                  rows={2}
                  {...register('description')}
                  placeholder="e.g. 2-story independent bungalow with rooftop solar panels..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Submission and Safety Note */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Certified under Municipal Corporation E-Governance Rules</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/citizen/my-properties')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit for Verification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
