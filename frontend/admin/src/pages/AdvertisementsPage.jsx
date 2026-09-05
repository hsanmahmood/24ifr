import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
    loadAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    activateAdvertisement,
    deactivateAdvertisement,
} from '../services/api';

const AdvertisementsPage = () => {
    const { notify } = useNotification();
    const { csrfToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formData, setFormData] = useState({
        server_name: '',
        invite_url: '',
        icon_url: '',
        description: '',
        message: '',
    });

    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await loadAdvertisements();
            setItems(data || []);
        } catch (e) {
            setError('Failed to load advertisements');
            notify.error('Failed to load advertisements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [notify]);

    const resetForm = () => {
        setFormData({
            server_name: '',
            invite_url: '',
            icon_url: '',
            description: '',
            message: '',
        });
        setEditingId(null);
        setShowCreateForm(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.server_name.trim() || !formData.invite_url.trim()) {
            notify.error('Server name and invite URL are required');
            return;
        }

        setSubmitting(true);
        try {
            await createAdvertisement(formData, csrfToken);
            notify.success('Advertisement created successfully');
            resetForm();
            load();
        } catch (e) {
            notify.error('Failed to create advertisement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            server_name: item.server_name,
            invite_url: item.invite_url,
            icon_url: item.icon_url || '',
            description: item.description || '',
            message: item.message || '',
        });
        setShowCreateForm(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!formData.server_name.trim() || !formData.invite_url.trim()) {
            notify.error('Server name and invite URL are required');
            return;
        }

        setSubmitting(true);
        try {
            await updateAdvertisement(editingId, formData, csrfToken);
            notify.success('Advertisement updated successfully');
            resetForm();
            load();
        } catch (e) {
            notify.error('Failed to update advertisement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this advertisement?')) return;

        try {
            await deleteAdvertisement(id, csrfToken);
            notify.success('Advertisement deleted successfully');
            load();
        } catch (e) {
            if (e.message.includes('409')) {
                notify.error('Cannot delete active advertisement. Deactivate it first.');
            } else {
                notify.error('Failed to delete advertisement');
            }
        }
    };

    const handleActivate = async (id) => {
        try {
            await activateAdvertisement(id, csrfToken);
            notify.success('Advertisement activated successfully');
            load();
        } catch (e) {
            notify.error('Failed to activate advertisement');
        }
    };

    const handleDeactivate = async (id) => {
        try {
            await deactivateAdvertisement(id, csrfToken);
            notify.success('Advertisement deactivated successfully');
            load();
        } catch (e) {
            notify.error('Failed to deactivate advertisement');
        }
    };

    const activeAd = items.find(item => item.is_active);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
                    <h1 className="text-lg font-display font-bold text-white tracking-wide uppercase">Advertisements</h1>
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setShowCreateForm(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-medium px-4 py-2 rounded text-sm transition-colors whitespace-nowrap"
                    >
                        Create New
                    </button>
                </div>

                {(showCreateForm || editingId) && (
                    <div className="mt-6 p-4 border border-zinc-800 rounded-lg bg-black/20">
                        <h2 className="text-sm font-bold text-white mb-4">
                            {editingId ? 'Edit Advertisement' : 'Create Advertisement'}
                        </h2>
                        <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Server Name *</label>
                                <input
                                    type="text"
                                    value={formData.server_name}
                                    onChange={(e) => setFormData({ ...formData, server_name: e.target.value.slice(0, 100) })}
                                    disabled={submitting}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-amber-500"
                                    maxLength={100}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Invite URL *</label>
                                <input
                                    type="url"
                                    value={formData.invite_url}
                                    onChange={(e) => setFormData({ ...formData, invite_url: e.target.value })}
                                    disabled={submitting}
                                    placeholder="https://discord.gg/..."
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Icon URL</label>
                                <input
                                    type="url"
                                    value={formData.icon_url}
                                    onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                                    disabled={submitting}
                                    placeholder="https://..."
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 500) })}
                                    disabled={submitting}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-amber-500 resize-none h-20"
                                    maxLength={500}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value.slice(0, 500) })}
                                    disabled={submitting}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-amber-500 resize-none h-20"
                                    maxLength={500}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-medium px-4 py-2 rounded text-sm transition-colors"
                                >
                                    {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={submitting}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="mt-6 space-y-3">
                        <div className="skeleton h-4 w-48 rounded"></div>
                        <div className="skeleton h-40 w-full rounded"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-400 mt-4">{error}</div>
                ) : items.length === 0 ? (
                    <div className="text-zinc-500 text-sm mt-6">No advertisements yet. Create one to get started.</div>
                ) : (
                    <div className="mt-6">
                        <div className="text-xs text-zinc-500 mb-4">
                            {activeAd ? (
                                <span className="text-green-400">Active: {activeAd.server_name}</span>
                            ) : (
                                <span className="text-zinc-500">No active advertisement</span>
                            )}
                        </div>
                        {items.map((item) => (
                            <div key={item.id} className="py-4 border-t border-zinc-800 first:border-t-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{item.server_name}</span>
                                            {item.is_active && (
                                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-semibold">Active</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1">{item.invite_url}</div>
                                        {item.description && (
                                            <div className="text-sm text-zinc-300 mt-2">{item.description}</div>
                                        )}
                                        {item.message && (
                                            <div className="text-sm text-zinc-400 mt-1 italic">{item.message}</div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.is_active ? (
                                            <button
                                                onClick={() => handleDeactivate(item.id)}
                                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition-colors"
                                            >
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(item.id)}
                                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors"
                                            >
                                                Activate
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 px-3 py-1.5 rounded transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvertisementsPage;
