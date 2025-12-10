/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, StarIcon } from '@heroicons/react/24/solid';
import { getTopRatedMarketplaceItems } from '../services/database';
import type { MarketplaceView } from '../types/database';

interface TrendingGridProps {
    limit?: number;
    showHeader?: boolean;
    onItemClick?: (item: MarketplaceView) => void;
}

export const TrendingGrid: React.FC<TrendingGridProps> = ({ limit = 4, showHeader = true, onItemClick }) => {
    const [items, setItems] = useState<MarketplaceView[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopRated();
    }, [limit]);

    const fetchTopRated = async () => {
        setLoading(true);
        try {
            const { data } = await getTopRatedMarketplaceItems(limit);
            setItems(data || []);
        } catch (error) {
            console.error('Failed to fetch trending items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (index: number) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 mt-8 md:mt-16">
                {showHeader && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                            Trending Assets
                        </h3>
                    </div>
                )}
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 mt-8 md:mt-16">
                {showHeader && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                            Trending Assets
                        </h3>
                    </div>
                )}
                <div className="text-center py-12 text-zinc-500">
                    No trending ideas yet. Be the first to list one!
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 mt-8 md:mt-16">
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                        Trending Assets
                    </h3>
                    <span className="text-zinc-600 text-xs font-mono">LIVE FEED ●</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                    <div
                        key={item.idea_id}
                        onClick={() => onItemClick && onItemClick(item)}
                        className={`group relative bg-zinc-900/40 border border-zinc-800 hover:border-zinc-600 p-5 rounded-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden ${onItemClick ? 'active:scale-95' : ''}`}
                    >
                        <div className={`absolute top-0 left-0 w-full h-0.5 ${getCategoryColor(index)} opacity-50`}></div>

                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1.5 py-0.5 rounded">
                                @{item.username.replace(/^@/, '').toLowerCase()}
                            </span>
                            <div className="flex items-center space-x-1 text-zinc-400">
                                <StarIcon className="w-3 h-3" />
                                <span className="text-xs">{item.overall_score.toFixed(1)}</span>
                            </div>
                        </div>

                        <h4 className="text-zinc-100 font-medium leading-tight mb-2 group-hover:text-white truncate">
                            {item.title}
                        </h4>
                        <p className="text-zinc-500 text-xs line-clamp-2 mb-4 h-8">
                            {item.description}
                        </p>

                        <div className="flex items-end justify-between border-t border-zinc-800 pt-3 mt-auto">
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase">Price</div>
                                <div className="text-lg font-bold text-zinc-200">
                                    ${item.price.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-500 uppercase">Uniqueness</div>
                                <div className="text-sm font-mono text-green-400">{item.uniqueness}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
