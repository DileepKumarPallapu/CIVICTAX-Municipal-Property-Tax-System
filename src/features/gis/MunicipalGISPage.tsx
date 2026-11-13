import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StorageService } from '../../services/storageService';
import { Property, MunicipalZone } from '../../types';
import { MapPin, Search, Filter, Layers, Building2, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils';

export const MunicipalGISPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [zones, setZones] = useState<MunicipalZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);

  useEffect(() => {
    // Populate properties with realistic synthetic coordinates around Pune municipal boundaries (18.5204° N, 73.8567° E)
    const storedProps = StorageService.getProperties();
    const storedZones = StorageService.getZones();

    const propsWithCoords = storedProps.map((p, idx) => {
      if (!p.latitude || !p.longitude) {
        // Deterministic synthetic offset based on index and zone
        const baseLat = 18.5204 + (idx % 5) * 0.012 - 0.024;
        const baseLng = 73.8567 + Math.floor(idx / 5) * 0.015 - 0.03;
        return {
          ...p,
          latitude: Number(baseLat.toFixed(5)),
          longitude: Number(baseLng.toFixed(5)),
          geospatialVerificationStatus: 'SYNTHETIC_DEMO' as const,
        };
      }
      return p;
    });

    setProperties(propsWithCoords);
    setZones(storedZones);
    if (propsWithCoords.length > 0) {
      setActiveProperty(propsWithCoords[0]);
    }
  }, []);

  const filteredProperties = properties.filter((p) => {
    const matchZone = selectedZone === 'ALL' || p.zoneId === selectedZone;
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch =
      searchQuery === '' ||
      p.propertyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchZone && matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Geospatial (GIS) Property Intelligence"
        subtitle="Spatial property distribution, ward boundaries, zoning classification, and collection density overview."
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#13A58B]/10 text-[#13A58B] border border-[#13A58B]/20 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>GIS Smart City Engine</span>
          </span>
        }
      />

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search parcel #, owner, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-[#405CF5]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="ALL">All Municipal Wards/Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="RESIDENTIAL">Residential Only</option>
            <option value="COMMERCIAL">Commercial Only</option>
            <option value="INDUSTRIAL">Industrial Only</option>
          </select>
        </div>
      </div>

      {/* Map & List Synchronized Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Spatial Grid View */}
        <div className="lg:col-span-8 rounded-3xl bg-slate-900 border border-slate-800 p-6 min-h-[460px] flex flex-col justify-between relative overflow-hidden shadow-xl text-white">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Municipal Vector Layer Active • Pune Corp (18.5204° N, 73.8567° E)
              </span>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
              {filteredProperties.length} Parcels In View
            </span>
          </div>

          {/* Interactive Synthetic Vector Grid */}
          <div className="my-8 relative h-72 w-full rounded-2xl bg-[#0A1220] border border-slate-800/80 p-4 overflow-hidden flex items-center justify-center">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#19283D_1px,transparent_1px),linear-gradient(to_bottom,#19283D_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

            {/* Spatial Markers */}
            <div className="absolute inset-0 p-8 grid grid-cols-4 sm:grid-cols-5 gap-4 items-center justify-items-center">
              {filteredProperties.slice(0, 15).map((p, i) => {
                const isSelected = activeProperty?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveProperty(p)}
                    className={`relative p-2 rounded-2xl border transition-all transform hover:scale-110 cursor-pointer ${
                      isSelected
                        ? 'bg-[#405CF5] border-white ring-4 ring-indigo-500/30 z-20 scale-105'
                        : p.category === 'COMMERCIAL'
                        ? 'bg-amber-600/80 border-amber-400 text-white'
                        : p.category === 'INDUSTRIAL'
                        ? 'bg-purple-600/80 border-purple-400 text-white'
                        : 'bg-teal-600/80 border-teal-400 text-white'
                    }`}
                    title={`${p.propertyNumber}: ${p.ownerName}`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="absolute -top-2 -right-2 px-1 text-[8px] font-bold rounded-full bg-slate-900 border border-slate-700">
                      {p.category[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Footer Note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3 z-10">
            <span>Synthetic Demo Spatial Projection (OpenStreetMap Vector Model)</span>
            <span>Category: R (Res) • C (Comm) • I (Ind)</span>
          </div>
        </div>

        {/* Selected Parcel Inspector */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#101D32] border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spatial Parcel Inspector</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#405CF5]">
              {activeProperty?.geospatialVerificationStatus || 'SYNTHETIC'}
            </span>
          </div>

          {activeProperty ? (
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parcel Number</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{activeProperty.propertyNumber}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owner Title</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{activeProperty.ownerName}</p>
                <p className="text-[11px] text-slate-400">{activeProperty.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#19283D] border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400">Category:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{activeProperty.category}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Built-Up Area:</span>
                  <p className="font-bold text-[#405CF5]">{activeProperty.builtUpArea} sq ft</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Latitude:</span>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{activeProperty.latitude}° N</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Longitude:</span>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{activeProperty.longitude}° E</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    activeProperty.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  Status: {activeProperty.verificationStatus}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{activeProperty.zoneName}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">Select a parcel marker to inspect spatial attributes.</div>
          )}
        </div>
      </div>
    </div>
  );
};
