import React, { useEffect, useState } from 'react';
import { getActiveAdvertisement } from '../services/api';

const AdvertisementWidget = () => {
    const [advertisement, setAdvertisement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const loadAdvertisement = async () => {
            try {
                const data = await getActiveAdvertisement();
                if (active) {
                    setAdvertisement(data);
                }
            } catch (e) {
                if (active) {
                    setAdvertisement(null);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadAdvertisement();
        return () => {
            active = false;
        };
    }, []);

    if (loading || !advertisement) {
        return null;
    }

    const { server_name, invite_url, icon_url, description, message } = advertisement;

    const iconDisplay = icon_url ? (
        <img
            src={icon_url}
            alt={server_name}
            className="w-12 h-12 rounded-lg object-cover"
            onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
            }}
        />
    ) : null;

    const fallbackIcon = !icon_url ? (
        <div className="w-12 h-12 rounded-lg bg-[#5865F2] flex items-center justify-center text-white font-bold text-lg">
            {server_name.charAt(0).toUpperCase()}
        </div>
    ) : (
        <div className="w-12 h-12 rounded-lg bg-[#5865F2] flex items-center justify-center text-white font-bold text-lg hidden">
            {server_name.charAt(0).toUpperCase()}
        </div>
    );

    return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="relative">
                    {iconDisplay}
                    {fallbackIcon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{server_name}</h3>
                    {description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{description}</p>
                    )}
                    {message && (
                        <p className="text-xs text-zinc-500 mt-1 italic line-clamp-2">{message}</p>
                    )}
                    <a
                        href={invite_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[#f5c518] hover:text-[#f5c518]/80 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Join Server
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdvertisementWidget;
