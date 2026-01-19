import React, { useState, useRef, useEffect } from 'react';

const Combobox = ({ options, value, onChange, placeholder, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(option.value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-1.5" ref={wrapperRef}>
            {label && <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
            <div className="relative">
                <div
                    className={`w-full bg-black/50 border ${isOpen ? 'border-primary ring-1 ring-primary' : 'border-zinc-800'} text-white text-sm rounded px-3 py-2.5 flex items-center justify-between cursor-pointer transition-all hover:border-zinc-700`}
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            setSearchTerm('');
                            setTimeout(() => searchInputRef.current?.focus(), 50);
                        }
                    }}
                >
                    <span className={`truncate ${selectedOption ? 'text-white' : 'text-zinc-500'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span className={`material-symbols-outlined text-zinc-500 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-dark border border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-fadeIn">
                        {/* Search Input */}
                        <div className="p-2 border-b border-zinc-800 sticky top-0 bg-surface-dark">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded pl-8 pr-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`px-3 py-2 text-xs rounded cursor-pointer transition-colors flex justify-between items-center group ${option.value === value ? 'bg-primary/20 text-primary' : 'text-zinc-300 hover:bg-zinc-800'}`}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <span className="font-medium truncate mr-2">{option.label}</span>
                                        {option.subtext && <span className={`text-[10px] ${option.value === value ? 'text-primary/70' : 'text-zinc-600 group-hover:text-zinc-500'}`}>{option.subtext}</span>}
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-xs text-zinc-600">No results found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Combobox;
