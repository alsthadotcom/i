/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, CheckBadgeIcon, ChartBarIcon, DocumentTextIcon, ShieldCheckIcon, LinkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { getIdeaDetailById } from '../services/database';
import type { IdeaDetailView } from '../types/database';

interface ItemDetailsProps {
    ideaId: string;
    onBack: () => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ ideaId, onBack }) => {
    const [item, setItem] = useState<IdeaDetailView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchIdeaDetails();
    }, [ideaId]);

    const fetchIdeaDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await getIdeaDetailById(ideaId);
            if (fetchError) throw fetchError;
            if (!data) throw new Error('Idea not found');
            setItem(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load idea details');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 pt-24 pb-12">
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-400">Loading idea details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 pt-24 pb-12">
                <button
                    onClick={onBack}
                    className="group flex items-center space-x-2 text-zinc-500 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Marketplace</span>
                </button>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
                    <p className="text-red-500 text-lg mb-4">{error || 'Idea not found'}</p>
                    <button
                        onClick={onBack}
                        className="text-green-400 hover:text-green-300 font-medium"
                    >
                        Return to Marketplace →
                    </button>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        if (score >= 25) return 'text-orange-500';
        return 'text-red-500';
    };

    const getDemandColor = (demand: string) => {
        if (demand === 'High') return 'text-green-500';
        if (demand === 'Mid-High') return 'text-green-400';
        if (demand === 'Mid') return 'text-yellow-500';
        if (demand === 'Low-Mid') return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 pt-24 pb-12 animate-in fade-in duration-500">
            <button
                onClick={onBack}
                className="group flex items-center space-x-2 text-zinc-500 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Marketplace</span>
            </button>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-8 md:p-12 border-b border-zinc-800">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs text-zinc-500 font-mono uppercase border border-zinc-800 px-2 py-1 rounded">
                                    {item.username}
                                </span>
                                {item.mvp && (
                                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
                                        <CheckBadgeIcon className="w-3 h-3" />
                                        MVP Available
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{item.title}</h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <StarIcon className="w-5 h-5 text-yellow-500" />
                                    <span className="text-lg font-semibold text-white">{item.overall_score.toFixed(1)}</span>
                                    <span className="text-sm text-zinc-500">Overall Score</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-zinc-500 mb-1">Asking Price</div>
                            <div className="text-3xl font-bold text-green-400">${item.price.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="p-8 md:p-12 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-green-500" />
                        Description
                    </h2>
                    <p className="text-zinc-300 leading-relaxed">{item.description}</p>
                </div>

                {/* AI Scoring Metrics */}
                <div className="p-8 md:p-12 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-green-500" />
                        AI Analysis & Scoring
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                            <div className="text-xs text-zinc-500 uppercase mb-2">Uniqueness</div>
                            <div className={`text-3xl font-bold ${getScoreColor(item.uniqueness)}`}>
                                {item.uniqueness}
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                            <div className="text-xs text-zinc-500 uppercase mb-2">Demand</div>
                            <div className={`text-2xl font-bold ${getDemandColor(item.demand)}`}>
                                {item.demand}
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">Market demand</div>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                            <div className="text-xs text-zinc-500 uppercase mb-2">Problem Impact</div>
                            <div className={`text-3xl font-bold ${getScoreColor(item.problem_impact)}`}>
                                {item.problem_impact}
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                            <div className="text-xs text-zinc-500 uppercase mb-2">Viability</div>
                            <div className={`text-3xl font-bold ${getScoreColor(item.viability)}`}>
                                {item.viability}
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                            <div className="text-xs text-zinc-500 uppercase mb-2">Scalability</div>
                            <div className={`text-3xl font-bold ${getScoreColor(item.scalability)}`}>
                                {item.scalability}
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 col-span-2 md:col-span-1">
                            <div className="text-xs text-zinc-500 uppercase mb-2">Overall Score</div>
                            <div className={`text-3xl font-bold ${getScoreColor(item.overall_score)}`}>
                                {item.overall_score.toFixed(1)}
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">Average</div>
                        </div>
                    </div>

                    {/* Profitability */}
                    <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                        <div className="text-xs text-green-400 uppercase mb-2">Profitability Estimate</div>
                        <div className="text-zinc-300">{item.profitability}</div>
                    </div>
                </div>

                {/* MVP Information */}
                {item.mvp && (
                    <div className="p-8 md:p-12 border-b border-zinc-800">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                            Minimum Viable Product
                        </h2>
                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                                <span className="text-lg font-semibold text-white">
                                    {item.mvp_type} MVP Available
                                </span>
                            </div>

                            {item.mvp_type === 'Digital/Saas' && item.digital_mvp && (
                                <div>
                                    <div className="text-sm text-zinc-500 mb-2">Demo URL:</div>
                                    <a
                                        href={item.digital_mvp}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        {item.digital_mvp}
                                    </a>
                                </div>
                            )}

                            {item.mvp_type === 'Physical' && (item.physical_mvp_image || item.physical_mvp_video) && (
                                <div className="space-y-4">
                                    {item.physical_mvp_image && (
                                        <div>
                                            <div className="text-sm text-zinc-500 mb-2">Product Image:</div>
                                            <img
                                                src={item.physical_mvp_image}
                                                alt="MVP"
                                                className="rounded-lg border border-zinc-700 max-w-md"
                                            />
                                        </div>
                                    )}
                                    {item.physical_mvp_video && (
                                        <div>
                                            <div className="text-sm text-zinc-500 mb-2">Demo Video:</div>
                                            <video
                                                src={item.physical_mvp_video}
                                                controls
                                                className="rounded-lg border border-zinc-700 max-w-md"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Documents */}
                <div className="p-8 md:p-12">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-green-500" />
                        Supporting Documents
                    </h2>
                    <div className="space-y-3">
                        <a
                            href={item.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 transition-colors group"
                        >
                            <DocumentTextIcon className="w-5 h-5 text-zinc-500 group-hover:text-green-500 transition-colors" />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white">Main Document</div>
                                <div className="text-xs text-zinc-500">Click to view PDF</div>
                            </div>
                            <LinkIcon className="w-4 h-4 text-zinc-600 group-hover:text-green-500 transition-colors" />
                        </a>

                        {item.additional_doc_1 && (
                            <a
                                href={item.additional_doc_1}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 transition-colors group"
                            >
                                <DocumentTextIcon className="w-5 h-5 text-zinc-500 group-hover:text-green-500 transition-colors" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">Additional Document 1</div>
                                    <div className="text-xs text-zinc-500">Click to view PDF</div>
                                </div>
                                <LinkIcon className="w-4 h-4 text-zinc-600 group-hover:text-green-500 transition-colors" />
                            </a>
                        )}

                        {item.additional_doc_2 && (
                            <a
                                href={item.additional_doc_2}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 transition-colors group"
                            >
                                <DocumentTextIcon className="w-5 h-5 text-zinc-500 group-hover:text-green-500 transition-colors" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">Additional Document 2</div>
                                    <div className="text-xs text-zinc-500">Click to view PDF</div>
                                </div>
                                <LinkIcon className="w-4 h-4 text-zinc-600 group-hover:text-green-500 transition-colors" />
                            </a>
                        )}

                        {item.additional_doc_3 && (
                            <a
                                href={item.additional_doc_3}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 transition-colors group"
                            >
                                <DocumentTextIcon className="w-5 h-5 text-zinc-500 group-hover:text-green-500 transition-colors" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">Additional Document 3</div>
                                    <div className="text-xs text-zinc-500">Click to view PDF</div>
                                </div>
                                <LinkIcon className="w-4 h-4 text-zinc-600 group-hover:text-green-500 transition-colors" />
                            </a>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <div className="p-8 md:p-12 bg-zinc-950/50 border-t border-zinc-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <div className="text-sm text-zinc-500 mb-1">Ready to acquire this idea?</div>
                            <div className="text-2xl font-bold text-white">
                                ${item.price.toLocaleString()}
                            </div>
                        </div>
                        <button className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_25px_rgba(34,197,94,0.4)] hover:shadow-[0_0_35px_rgba(34,197,94,0.6)]">
                            Contact Seller
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
