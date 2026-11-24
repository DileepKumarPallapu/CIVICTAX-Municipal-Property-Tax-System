import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, Eye, Edit3, Building2, MapPin, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/serviceFactory';
import { Property, PropertyCategory, PropertyVerificationStatus } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatDate } from '../../utils';

export const MyPropertiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PropertyCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<PropertyVerificationStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Selected property for view/edit modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editCategory, setEditCategory] = useState<PropertyCategory>('RESIDENTIAL');
  const [editArea, setEditArea] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editConstructionYear, setEditConstructionYear] = useState('');
  const [editDocumentReference, setEditDocumentReference] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadProperties = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const list = await services.propertyService.getProperties({ ownerId: currentUser.id });
      setProperties(list);
    } catch (e: any) {
      error('Failed to load properties', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, error]);

  useEffect(() => {
    loadProperties();

    const handleStorageUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key === 'civictax_properties' || e.type === 'civictax_data_reset') {
        loadProperties();
      }
    };
    window.addEventListener('civictax_storage_update', handleStorageUpdate);
    window.addEventListener('civictax_data_reset', handleStorageUpdate);
    return () => {
      window.removeEventListener('civictax_storage_update', handleStorageUpdate);
      window.removeEventListener('civictax_data_reset', handleStorageUpdate);
    };
  }, [loadProperties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && p.verificationStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.propertyNumber.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.documentReference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [properties, categoryFilter, statusFilter, search]);

  const handleOpenDetails = (prop: Property) => {
    setSelectedProperty(prop);
    setEditAddress(prop.address);
    setEditCategory(prop.category);
    setEditArea(String(prop.builtUpArea));
    setEditZone(prop.zoneName || prop.zoneId);
    setEditConstructionYear(String(prop.constructionYear));
    setEditDocumentReference(prop.documentReference);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedProperty) return;
    setIsSaving(true);
    try {
      const updated = await services.propertyService.updateProperty(selectedProperty.id, {
        address: editAddress,
        category: editCategory,
        builtUpArea: Number(editArea),
        zoneId: editZone,
        zoneName: editZone,
        constructionYear: Number(editConstructionYear),
        documentReference: editDocumentReference,
      });
      success('Property Updated', `Property ${updated.propertyNumber} was saved.`);
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedProperty(updated);
      setIsEditing(false);
    } catch (err: any) {
      error('Update Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Property>[] = [
    {
      key: 'propertyNumber',
      header: 'Property No.',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
          {item.propertyNumber}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Address & Zone',
      render: (item) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1 text-xs">
            {item.address}
          </div>
          <div className="text-[11px] text-slate-400">{item.zoneName}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (item) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {item.category}
        </span>
      ),
    },
    {
      key: 'builtUpArea',
      header: 'Area',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
          {item.builtUpArea.toLocaleString('en-IN')} sq.ft
        </span>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.verificationStatus} size="sm" />,
    },
    {
      key: 'registrationDate',
      header: 'Registered',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{formatDate(item.registrationDate)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetails(item);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Registered Properties"
        subtitle="View, inspect, and update property details registered under your taxpayer account."
        breadcrumbs={[{ label: 'Dashboard', path: '/citizen/dashboard' }, { label: 'My Properties' }]}
        actions={
          <Link
            to="/citizen/register-property"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Register New Property
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by property number, address, or deed..."
        />

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="RESUBMISSION_REQUIRED">Resubmission Required</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredProperties}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyTitle="No properties found"
        emptyDescription="No registered properties matched your query or filter criteria."
        emptyAction={
          <Link
            to="/citizen/register-property"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Register First Property
          </Link>
        }
        onRowClick={handleOpenDetails}
      />

      {/* Property Details & Edit Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {selectedProperty.propertyNumber}
                  </h3>
                  <p className="text-xs text-slate-400">Parcel Registration Details</p>
                </div>
              </div>
              <StatusBadge status={selectedProperty.verificationStatus} />
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400">Category:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedProperty.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400">Built-up Area:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedProperty.builtUpArea} sq.ft</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400">Construction Year:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedProperty.constructionYear}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400">Municipal Zone:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedProperty.zoneName}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400">Property Address:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedProperty.address}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400">Ownership Deed Document:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono">{selectedProperty.documentReference}</p>
              </div>

              {selectedProperty.verificationComments && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
                  <span className="text-blue-700 dark:text-blue-300 font-bold">Officer Verification Remarks:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{selectedProperty.verificationComments}</p>
                  {selectedProperty.verifiedByOfficerName && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Verified by {selectedProperty.verifiedByOfficerName} on {formatDate(selectedProperty.verificationDate)}
                    </p>
                  )}
                </div>
              )}

              {/* Editable Fields */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Property Details</span>
                  {!isEditing && selectedProperty.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Info
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Property Address
                      </label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Category
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as PropertyCategory)}
                          className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        >
                          <option value="RESIDENTIAL">Residential</option>
                          <option value="COMMERCIAL">Commercial</option>
                          <option value="INDUSTRIAL">Industrial</option>
                        </select>
                      </label>
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Built-up Area (sq.ft)
                        <input
                          type="number"
                          min="1"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </label>
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Municipal Zone
                        <input
                          type="text"
                          value={editZone}
                          onChange={(e) => setEditZone(e.target.value)}
                          className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </label>
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Construction Year
                        <input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={editConstructionYear}
                          onChange={(e) => setEditConstructionYear(e.target.value)}
                          className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </label>
                      <label className="col-span-2 block text-[11px] font-semibold text-slate-500">
                        Ownership Document Reference
                        <input
                          type="text"
                          value={editDocumentReference}
                          onChange={(e) => setEditDocumentReference(e.target.value)}
                          className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      {selectedProperty.verificationStatus === 'VERIFIED'
                        ? 'Verified properties cannot be edited directly. Submit a reassessment request.'
                        : 'Property details can be edited until verification is complete.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/citizen/assessments?propertyNumber=${selectedProperty.propertyNumber}`}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                View Linked Tax Assessments →
              </Link>
              <button
                onClick={() => setSelectedProperty(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
