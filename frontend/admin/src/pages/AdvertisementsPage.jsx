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
import Dialog from '../components/Dialog';

const AdvertisementsPage = () => {
    const { notify } = useNotification();
    const { csrfToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [showFormDialog, setShowFormDialog] = useState(false);

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
        setShowFormDialog(false);
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
        setShowFormDialog(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!formData.server_name.trim() || !formData.invite_url.trim()) {
            notify.error('Server name and invite URL are required');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                server_name: formData.server_name,
                invite_url: formData.invite_url,
                icon_url: formData.icon_url || null,
                description: formData.description || null,
                message: formData.message || null,
            };
            await updateAdvertisement(editingId, payload, csrfToken);
            notify.success('Advertisement updated successfully');
            resetForm();
            load();
        } catch (e) {
            console.error('Update error:', e);
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 pt-20 lg:pt-8">
            <header className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Advertisement Management</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-white uppercase tracking-wide">Advertisements</h1>
                <p className="mt-2 text-sm text-zinc-400">Manage community server advertisements displayed on the public site.</p>
            </header>

            <section className="bg-surface-dark border border-border-dark rounded-lg p-5 md:p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">Advertisement List</h2>
                        <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">
                            {activeAd ? (
                                <span className="text-primary">Active: {activeAd.server_name}</span>
                            ) : (
                                <span className="text-zinc-500">No active advertisement</span>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setShowFormDialog(true);
                        }}
                        className="bg-primary hover:brightness-95 text-black font-semibold px-4 py-2 rounded-md text-sm transition-colors whitespace-nowrap"
                    >
                        Create New
                    </button>
                </div>

                {loading ? (
                    <div className="mt-6 space-y-3">
                        <div className="skeleton h-4 w-48 rounded"></div>
                        <div className="skeleton h-40 w-full rounded"></div>
                    </div>
                ) : error ? (
                    <div className="mt-6 text-red-400 text-sm">{error}</div>
                ) : items.length === 0 ? (
                    <div className="mt-6 text-zinc-500 text-sm">No advertisements yet. Create one to get started.</div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="rounded-md border border-zinc-800 bg-black/20 p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{item.server_name}</span>
                                            {item.is_active && (
                                                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-semibold">Active</span>
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
                                                className="text-xs rounded-md border border-zinc-800 bg-black/40 px-3 py-1.5 text-white font-semibold transition-colors hover:bg-zinc-800"
                                            >
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(item.id)}
                                                className="text-xs rounded-md bg-primary px-3 py-1.5 text-black font-semibold transition-colors hover:brightness-95"
                                            >
                                                Activate
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-xs rounded-md border border-zinc-800 bg-black/40 px-3 py-1.5 text-white font-semibold transition-colors hover:bg-zinc-800"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-xs rounded-md border border-red-900/50 bg-red-900/20 px-3 py-1.5 text-red-300 font-semibold transition-colors hover:bg-red-900/30"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <Dialog
                isOpen={showFormDialog}
                onClose={resetForm}
                title={editingId ? 'Edit Advertisement' : 'Create Advertisement'}
                size="lg"
            >
                <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Server Name *</label>
                        <input
                            type="text"
                            value={formData.server_name}
                            onChange={(e) => setFormData({ ...formData, server_name: e.target.value.slice(0, 100) })}
                            disabled={submitting}
                            className="mt-1 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                            className="mt-1 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                            className="mt-1 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 500) })}
                            disabled={submitting}
                            className="mt-1 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-20"
                            maxLength={500}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Message</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value.slice(0, 500) })}
                            disabled={submitting}
                            className="mt-1 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-20"
                            maxLength={500}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={submitting}
                            className="rounded-md border border-zinc-800 bg-black/40 text-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-primary hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-4 py-2 rounded-md text-sm transition-colors"
                        >
                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </Dialog>
        </main>
    );
};

export default AdvertisementsPage;
