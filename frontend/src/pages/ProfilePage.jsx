import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { authService } from '../services/api';
import { getCurrencySymbol } from '../utils/currency';
import {
  User, Mail, DollarSign, Save, ShieldCheck,
  Calendar, TrendingUp, Wallet, CreditCard, Edit3, X, Camera, ZoomIn, ZoomOut
} from 'lucide-react';

// ─── Simple crop modal (pure CSS/canvas, no library) ─────────────────────────
function CropModal({ imageSrc, onConfirm, onClose }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const imgRef = useRef(null);
  const [fitZoom, setFitZoom] = useState(1); // zoom level that fits full image

  const CANVAS_SIZE = 300;

  // On image load, compute fit zoom so full image is visible
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const scaleW = CANVAS_SIZE / img.naturalWidth;
    const scaleH = CANVAS_SIZE / img.naturalHeight;
    const fit = Math.min(scaleW, scaleH);
    setFitZoom(fit);
    setZoom(fit);
    setOffset({ x: 0, y: 0 });
    draw();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dim outside circle
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image
    const scale = zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (CANVAS_SIZE - w) / 2 + offset.x;
    const y = (CANVAS_SIZE - h) / 2 + offset.y;

    // Clip to circle, draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Circle border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, offset]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e) => {
    setDragging(true);
    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };
  const handleMouseUp = () => setDragging(false);

  // Touch support
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { x: t.clientX - offset.x, y: t.clientY - offset.y };
  };
  const handleTouchMove = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Adjust Photo</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden img for drawing */}
        <img
          ref={imgRef}
          src={imageSrc}
          style={{ display: 'none' }}
          onLoad={handleImageLoad}
          alt=""
        />

        {/* Canvas */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-full cursor-grab active:cursor-grabbing"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-3 mb-5 px-2">
          <button
            onClick={() => setZoom(z => Math.max(fitZoom, z - 0.05))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range" min={fitZoom} max="3" step="0.05"
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-emerald-500"
          />
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.05))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mb-4">Drag to reposition · Zoom in to crop tighter</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm"
          >
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useDialog();
  const sym = getCurrencySymbol(user?.currency);
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthly_income || '');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [saving, setSaving] = useState(false);

  // Profile photo — from user.avatar (DB), crop state for the modal
  const [cropSrc, setCropSrc] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (dataUrl) => {
    setCropSrc(null);
    setUploadingPhoto(true);
    try {
      await authService.updateProfile({ avatar: dataUrl });
      await refreshUser();
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error('Could not save photo. Try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile({
        name,
        monthly_income: parseFloat(monthlyIncome),
        currency
      });
      await refreshUser();
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error('Could not update profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setMonthlyIncome(user?.monthly_income || '');
    setCurrency(user?.currency || 'INR');
    setEditing(false);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Hero Card ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-soft overflow-hidden">
        {/* Banner */}
        <div className="h-20 sm:h-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="px-4 sm:px-6 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar with camera button */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-emerald-100 text-emerald-700 text-2xl font-black flex items-center justify-center">
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : initials
                }
              </div>
              <button
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-2xl bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                title="Change photo"
              >
                {uploadingPhoto
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-5 h-5" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Edit button */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all mt-2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5 break-all">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                <Calendar className="w-3 h-3" />
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Monthly Income</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {user?.monthly_income > 0
              ? `${sym}${Number(user.monthly_income).toLocaleString('en-IN')}`
              : <span className="text-slate-400 text-sm font-semibold">Not set</span>
            }
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Base Currency</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{user?.currency || 'INR'}</div>
          <p className="text-xs text-slate-400 mt-1">
            {user?.currency === 'INR' ? 'Indian Rupee (₹)' : user?.currency === 'USD' ? 'US Dollar ($)' : user?.currency === 'EUR' ? 'Euro (€)' : user?.currency === 'GBP' ? 'British Pound (£)' : user?.currency}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Account ID</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">#{user?.id || '—'}</div>
          <p className="text-xs text-slate-400 mt-1">FinanceX user</p>
        </div>
      </div>

      {/* ── Edit Form ── */}
      {editing && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-6 shadow-soft">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-600" />
            Edit Profile
          </h3>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{sym}</span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Used for savings rate and AI predictions.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="INR">INR (₹) — Indian Rupee</option>
                  <option value="USD">USD ($) — US Dollar</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="SGD">SGD — Singapore Dollar</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Account Details (read-only) ── */}
      {!editing && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Account Details</h3>
          <div className="divide-y divide-slate-100">
            {[
              { icon: User, label: 'Full Name', value: user?.name },
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Wallet, label: 'Monthly Income', value: user?.monthly_income > 0 ? `${sym}${Number(user.monthly_income).toLocaleString('en-IN')}` : 'Not set' },
              { icon: DollarSign, label: 'Currency', value: user?.currency || 'INR' },
              { icon: Calendar, label: 'Member Since', value: memberSince },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 text-right break-all max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
