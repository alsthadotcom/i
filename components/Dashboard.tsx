/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { DocumentIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export interface Creation {
    id: string;
    name: string;
    timestamp: Date;
    originalImage?: string;
    description?: string;
}

interface DashboardProps {
    history: Creation[];
    onSelect: (item: Creation) => void;
    onDelete?: (id: string) => void; // Optional delete for future
}

export const Dashboard: React.FC<DashboardProps> = ({ history, onSelect }) => {
    return (
        <div className="w-full max-w-7xl mx-auto pt-24 px-4 sm:px-6 animate-in fade-in duration-500">
            <div className="flex items-end justify-between mb-8 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-zinc-400">Manage and review your generated marketplace listings.</p>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-mono font-bold text-green-500">{history.length}</span>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total Assets</p>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <DocumentIcon className="w-16 h-16 text-zinc-600 mb-4" />
                    <h3 className="text-xl font-medium text-zinc-300">No listings yet</h3>
                    <p className="text-zinc-500 mt-2 max-w-sm text-center">Upload a sketch or idea on the generator page to create your first business listing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="group relative bg-[#09090b] border border-zinc-800 hover:border-zinc-600 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-green-900/10 hover:-translate-y-1 flex flex-col h-[280px]"
                        >
                            {/* Preview Image Area */}
                            <div className="h-40 bg-zinc-900 relative overflow-hidden border-b border-zinc-800">
                                {item.originalImage ? (
                                    item.originalImage.startsWith('data:application/pdf') ? (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                            <DocumentIcon className="w-12 h-12 text-zinc-500" />
                                        </div>
                                    ) : (
                                        <img
                                            src={item.originalImage}
                                            alt="Preview"
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                                        />
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/50 p-4">
                                        <span className="text-4xl">💎</span>
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent opacity-80"></div>

                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                    <div className="px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-zinc-300 border border-zinc-700 font-mono">
                                        {item.timestamp.toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 truncate pr-4 group-hover:text-green-500 transition-colors">
                                    {item.name}
                                </h3>
                                <p className="text-xs text-zinc-500 font-mono mb-4">
                                    ID: {item.id.slice(0, 8)}
                                </p>

                                <div className="mt-auto flex items-center justify-between">
                                    <button
                                        onClick={() => onSelect(item)}
                                        className="text-sm font-medium text-white flex items-center gap-2 group/btn hover:text-green-400 transition-colors"
                                    >
                                        View Listing
                                        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
