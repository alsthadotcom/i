/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeftIcon, DocumentPlusIcon, PhotoIcon, VideoCameraIcon, XMarkIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { analyzeAssetScores } from '../services/gemini';
import { createIdeaListing, createAIScoring, uploadDocument } from '../services/database';
import { supabase } from '../services/supabase';
import type { DemandLevel } from '../types/database';
import { CATEGORIES } from '../constants/categories';
import { suggestCategory } from '../services/analyzeBusinessModel';
import { CategoryDropdown } from './CategoryDropdown';

interface SellIdeaProps {
    onBack: () => void;
}

interface AIScores {
    uniqueness: number;
    demand: DemandLevel;
    problem_impact: number;
    profitability: {
        estimatedRevenue: number;
        estimatedProfit: number;
        marginPercentage: number;
    };
    viability: number;
    scalability: number;
}

export const SellIdea: React.FC<SellIdeaProps> = ({ onBack }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mainDocument, setMainDocument] = useState<File | null>(null);
    const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
    const [showAdditionalDocs, setShowAdditionalDocs] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scores, setScores] = useState<AIScores | null>(null);
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState<string>('');
    const [categoryMode, setCategoryMode] = useState<'Manual' | 'AI'>('Manual');
    const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

    // MVP State
    const [hasMVP, setHasMVP] = useState<boolean | null>(null);
    const [mvpType, setMvpType] = useState<'Physical' | 'Digital/Saas' | null>(null);
    const [mvpUrl, setMvpUrl] = useState('');
    const [mvpMediaFiles, setMvpMediaFiles] = useState<File[]>([]);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const mainFileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);
    const mvpMediaInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Validation State
    const [touched, setTouched] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [description]);

    const handleMainDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                alert("Please upload a PDF document.");
                return;
            }
            setMainDocument(file);

            // Trigger AI Analysis
            // Always run analysis for new file
            await runAnalysis(file);
        }
    };

    const handleAdditionalDocsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: File[] = Array.from(e.target.files);
            const validFiles = newFiles.filter(f => f.type === 'application/pdf');

            if (validFiles.length !== newFiles.length) {
                alert("Only PDF files are allowed.");
            }

            if (additionalDocuments.length + validFiles.length > 3) {
                alert("You can only upload up to 3 additional documents.");
                // Add as many as fit
                const remainingSlots = 3 - additionalDocuments.length;
                const filesToAdd = validFiles.slice(0, remainingSlots);
                setAdditionalDocuments([...additionalDocuments, ...filesToAdd]);
            } else {
                setAdditionalDocuments([...additionalDocuments, ...validFiles]);
            }
        }
    };

    const runAnalysis = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const newScores = await analyzeAssetScores(base64, file.type);
                setScores(newScores);
                setIsAnalyzing(false);
            };
        } catch (error) {
            console.error("Analysis failed", error);
            setIsAnalyzing(false);
        }
    };

    const removeMainDocument = () => {
        setMainDocument(null);
        setScores(null); // Clear scores when document is removed
    };

    const removeAdditionalDocument = (index: number) => {
        setAdditionalDocuments(additionalDocuments.filter((_, i) => i !== index));
    };

    const handleMvpMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setMvpMediaFiles([...mvpMediaFiles, ...newFiles]);
        }
    };

    const removeMvpMedia = (index: number) => {
        setMvpMediaFiles(mvpMediaFiles.filter((_, i) => i !== index));
    };

    const handleCategoryModeChange = async (mode: 'Manual' | 'AI') => {
        setCategoryMode(mode);
        if (mode === 'AI') {
            if (!title || !description) {
                alert('Please enter title and description first.');
                setCategoryMode('Manual');
                return;
            }
            setIsSuggestingCategory(true);
            try {
                const cat = await suggestCategory(title, description);
                setCategory(cat);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSuggestingCategory(false);
            }
        }
    };

    // --- Pricing Logic ---
    const maxPriceLimit = useMemo(() => {
        let limit = 500;

        if (scores) {
            const { uniqueness, viability, scalability } = scores;
            const avgScore = (uniqueness + viability + scalability) / 3;
            const isHighTier = avgScore > 75;

            if (hasMVP) {
                if (isHighTier) {
                    limit = 5000;
                } else {
                    limit = 1000;
                }
            } else {
                if (isHighTier) {
                    limit = 1000;
                } else {
                    limit = 500;
                }
            }
        }

        return limit;
    }, [scores, hasMVP]);

    const isPriceValid = useMemo(() => {
        const p = parseFloat(price);
        return !isNaN(p) && p > 0 && p <= maxPriceLimit;
    }, [price, maxPriceLimit]);

    const formValid = useMemo(() => {
        return title.trim().length > 0 &&
            description.trim().length > 0 &&
            category.length > 0 &&
            mainDocument !== null &&
            isPriceValid;
    }, [title, description, mainDocument, isPriceValid]);

    // --- Submit Handler ---
    const handleSubmit = async () => {
        setTouched(true);
        if (!formValid) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('You must be logged in to sell an idea');
            }

            // 1. Upload Main Document
            let mainDocUrl = '';
            if (mainDocument) {
                const { data, error } = await uploadDocument(mainDocument, user.id, 'documents');
                if (error) throw error;
                mainDocUrl = data!.url;
            }

            // 1.5 Upload Additional Documents
            const additionalDocUrls: string[] = [];
            for (const doc of additionalDocuments) {
                const { data, error } = await uploadDocument(doc, user.id, 'documents');
                if (error) throw error;
                additionalDocUrls.push(data!.url);
            }

            // 2. Upload MVP media if applicable
            let digitalMvpUrl: string | null = null;
            let physicalMvpImage: string | null = null;
            let physicalMvpVideo: string | null = null;

            if (hasMVP && mvpType === 'Digital/Saas' && mvpUrl) {
                digitalMvpUrl = mvpUrl;
            }

            if (hasMVP && mvpType === 'Physical' && mvpMediaFiles.length > 0) {
                for (const file of mvpMediaFiles) {
                    const folder = file.type.startsWith('image/') ? 'mvp-images' : 'mvp-videos';
                    const { data, error } = await uploadDocument(file, user.id, folder);
                    if (error) throw error;

                    if (file.type.startsWith('image/')) {
                        physicalMvpImage = data!.url;
                    } else if (file.type.startsWith('video/')) {
                        physicalMvpVideo = data!.url;
                    }
                }
            }

            // 3. Create idea listing
            const { data: ideaData, error: ideaError } = await createIdeaListing({
                user_id: user.id,
                title,
                description,
                document_url: mainDocUrl,
                additional_doc_1: additionalDocUrls[0] || null,
                additional_doc_2: additionalDocUrls[1] || null,
                additional_doc_3: additionalDocUrls[2] || null,
                mvp: hasMVP || false,
                mvp_type: mvpType,
                digital_mvp: digitalMvpUrl,
                physical_mvp_image: physicalMvpImage,

                physical_mvp_video: physicalMvpVideo,
                category: category,
                price: parseFloat(price)
            });

            if (ideaError) throw ideaError;
            if (!ideaData) throw new Error('Failed to create idea listing');

            // 4. Create AI scoring if available
            if (scores) {
                // Format profitability object to text/string for DB
                const profitabilityText = `Revenue: $${scores.profitability.estimatedRevenue.toLocaleString()}/yr, Profit: $${scores.profitability.estimatedProfit.toLocaleString()}/yr (${scores.profitability.marginPercentage}% Margin)`;

                const { error: scoringError } = await createAIScoring({
                    idea_id: ideaData.idea_id,
                    uniqueness: scores.uniqueness,
                    demand: scores.demand,
                    problem_impact: scores.problem_impact,
                    profitability: profitabilityText,
                    viability: scores.viability,
                    scalability: scores.scalability
                });

                if (scoringError) throw scoringError;
            }

            // Success!
            alert('Your idea has been successfully listed!');
            window.location.href = '/pages/marketplace.html';

        } catch (error: any) {
            console.error('Submission error:', error);
            setSubmitError(error.message || 'Failed to submit idea. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const CircularScore = ({ label, value }: { label: string, value: number }) => {
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;

        const getColor = (val: number) => {
            if (val < 25) return 'text-red-500';
            if (val < 50) return 'text-orange-500';
            if (val < 75) return 'text-yellow-500';
            return 'text-green-500';
        };

        const colorClass = getColor(value);
        const strokeColor = colorClass.replace('text-', 'stroke-');

        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            className="stroke-zinc-800"
                            strokeWidth="6"
                            fill="transparent"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            className={`${strokeColor} transition-all duration-1000 ease-out`}
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-2xl leading-none ${colorClass}`}>
                        {value}
                    </div>
                </div>
                <span className="text-xs font-mono uppercase text-zinc-400 text-center">{label}</span>
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pt-24 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button
                onClick={onBack}
                className="group flex items-center space-x-2 text-zinc-500 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Cancel Listing</span>
            </button>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-2">Sell Your Idea</h1>
                <p className="text-zinc-400 mb-8">List your business concept, IP, or validated startup for sale.</p>

                {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <p className="text-red-500 text-sm">{submitError}</p>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                Listing Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`w-full bg-zinc-950/50 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${touched && title.trim().length === 0 ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-green-500'}`}
                                placeholder="e.g. Autonomous Drone Delivery Network"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                ref={textareaRef}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={`w-full bg-zinc-950/50 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors overflow-hidden resize-none min-h-[100px] ${touched && description.trim().length === 0 ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-green-500'}`}
                                placeholder="Describe the problem, solution, and business model..."
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <div className="flex bg-zinc-950/50 border border-zinc-700 rounded-lg p-1 gap-1 mb-3 max-w-sm">
                            <button
                                onClick={() => handleCategoryModeChange('Manual')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded transition-all ${categoryMode === 'Manual' ? 'bg-zinc-800 text-white shadow border border-zinc-600' : 'text-zinc-400 hover:text-white'}`}
                            >
                                Manual Select
                            </button>
                            <button
                                onClick={() => handleCategoryModeChange('AI')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded flex items-center justify-center gap-2 transition-all ${categoryMode === 'AI' ? 'bg-green-500/10 text-green-400 shadow border border-green-500/30' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <SparklesIcon className="w-4 h-4" />
                                AI Suggested
                            </button>
                        </div>

                        {categoryMode === 'Manual' ? (
                            <div className="relative">
                                <CategoryDropdown
                                    value={category}
                                    onChange={setCategory}
                                    placeholder="Select a category"
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={category || (isSuggestingCategory ? '' : 'Click AI Suggested to generate')}
                                    readOnly
                                    className={`w-full bg-zinc-900/50 border rounded-lg px-4 py-3 font-medium focus:outline-none ${isSuggestingCategory ? 'text-zinc-500 border-zinc-700' : category ? 'text-green-400 border-green-500/30' : 'text-zinc-500 border-zinc-700 italic'}`}
                                />
                                {isSuggestingCategory && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-green-500 bg-zinc-900 px-2 py-1 rounded-full border border-green-500/20">
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Analyzing...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Document Upload & AI Scoring */}
                    {/* Document Upload & AI Scoring */}
                    <div className={`border rounded-xl p-6 bg-zinc-950/30 transition-colors ${touched && !mainDocument ? 'border-red-500/50' : 'border-zinc-800'}`}>
                        {/* Main Document Section */}
                        <div className="mb-6 border-b border-zinc-800 pb-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-medium text-white">
                                    Primary Document <span className="text-red-500">*</span>
                                </h3>
                                <p className="text-sm text-zinc-400 mt-1">
                                    Upload your main business plan or pitch deck (PDF only).
                                </p>
                            </div>

                            <input
                                type="file"
                                ref={mainFileInputRef}
                                className="hidden"
                                accept="application/pdf"
                                onChange={handleMainDocUpload}
                            />

                            {/* Main File Display or Upload Area */}
                            {mainDocument ? (
                                <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-3 rounded-lg border border-zinc-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-500/10 rounded">
                                            <DocumentPlusIcon className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200 truncate max-w-[200px] sm:max-w-xs">{mainDocument.name}</p>
                                            <p className="text-xs text-zinc-500">{(mainDocument.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={removeMainDocument} className="text-zinc-500 hover:text-red-400 p-2">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => mainFileInputRef.current?.click()}
                                    className="border border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-500 transition-colors"
                                >
                                    <DocumentPlusIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                    <span className="text-sm text-zinc-400">Click to upload Document PDF</span>
                                </div>
                            )}
                        </div>

                        {/* Additional Documents Section with Tossle */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-zinc-300">
                                    Additional Documents (Optional)
                                </h3>
                                <button
                                    onClick={() => setShowAdditionalDocs(!showAdditionalDocs)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showAdditionalDocs ? 'bg-green-500' : 'bg-zinc-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${showAdditionalDocs ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {showAdditionalDocs && (
                                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-zinc-400">Up to 3 additional PDFs (Market research, financials, etc.)</p>
                                        <input
                                            type="file"
                                            ref={additionalFileInputRef}
                                            className="hidden"
                                            accept="application/pdf"
                                            multiple
                                            onChange={handleAdditionalDocsUpload}
                                        />
                                        {additionalDocuments.length < 3 && (
                                            <button
                                                onClick={() => additionalFileInputRef.current?.click()}
                                                className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300"
                                            >
                                                <DocumentPlusIcon className="w-4 h-4" />
                                                Add More
                                            </button>
                                        )}
                                    </div>

                                    {/* Additional Files List */}
                                    {additionalDocuments.length > 0 ? (
                                        <div className="space-y-2">
                                            {additionalDocuments.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded border border-zinc-700">
                                                    <span className="text-xs text-zinc-300 truncate">{doc.name}</span>
                                                    <button onClick={() => removeAdditionalDocument(idx)} className="text-zinc-500 hover:text-red-400">
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => additionalFileInputRef.current?.click()}
                                            className="border border-dashed border-zinc-700 rounded p-4 text-center cursor-pointer hover:border-zinc-500 transition-colors"
                                        >
                                            <span className="text-xs text-zinc-500">Click to upload additional PDFs</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Scoring Display */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-8">
                                <SparklesIcon className={`w-5 h-5 ${isAnalyzing ? 'text-green-400 animate-pulse' : 'text-zinc-500'}`} />
                                <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                                    {isAnalyzing ? 'AI Analyzing Documents...' : scores ? 'AI Valuation Score' : 'Upload Primary PDF to Generate Score'}
                                </span>
                            </div>

                            {scores ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                                    <CircularScore label="Uniqueness" value={scores.uniqueness} />
                                    <CircularScore label="Problem Impact" value={scores.problem_impact} />
                                    <CircularScore label="Viability" value={scores.viability} />
                                    <CircularScore label="Scalability" value={scores.scalability} />

                                    {/* Demand */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-24 h-24 flex items-center justify-center">
                                            <div className="text-2xl font-bold text-green-400">{scores.demand}</div>
                                        </div>
                                        <span className="text-xs font-mono uppercase text-zinc-400 text-center">Demand</span>
                                    </div>

                                    {/* Profitability */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-24 h-24 flex flex-col items-center justify-center">
                                            <div className="space-y-0.5 text-center">
                                                <div className="text-xs text-white">
                                                    <span className="font-medium">Revenue:</span> <span className="font-normal">${(scores.profitability.estimatedRevenue / 1000).toFixed(0)}K</span>
                                                </div>
                                                <div className="text-xs text-white">
                                                    <span className="font-medium">Profit:</span> <span className="font-normal">${(scores.profitability.estimatedProfit / 1000).toFixed(0)}K</span>
                                                </div>
                                                <div className="text-xs text-white">
                                                    <span className="font-medium">Margin:</span> <span className="font-normal">{scores.profitability.marginPercentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono uppercase text-zinc-400 text-center">Profitability</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-zinc-600 text-sm border border-dashed border-zinc-800 rounded">
                                    AI metrics will appear here after upload
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MVP Logic */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-zinc-300">Do you have a Minimum Viable Product (MVP)?</label>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                onClick={() => setHasMVP(true)}
                                className={`flex-1 py-3 rounded-lg border transition-colors font-medium ${hasMVP === true ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                            >
                                Yes, I have an MVP
                            </button>
                            <button
                                onClick={() => { setHasMVP(false); setMvpType(null); }}
                                className={`flex-1 py-3 rounded-lg border transition-colors font-medium ${hasMVP === false ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                            >
                                No, just the concept
                            </button>
                        </div>

                        {hasMVP && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4 pt-4 border-t border-zinc-800">
                                <label className="block text-sm font-medium text-zinc-300">Product Type</label>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <button
                                        onClick={() => setMvpType('Physical')}
                                        className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${mvpType === 'Physical' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                    >
                                        Physical Product
                                    </button>
                                    <button
                                        onClick={() => setMvpType('Digital/Saas')}
                                        className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${mvpType === 'Digital/Saas' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                    >
                                        Digital Product (SaaS/App)
                                    </button>
                                </div>

                                {mvpType === 'Physical' && (
                                    <div className="space-y-3 animate-in fade-in">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Product Images & Demo Video</label>
                                            <div
                                                onClick={() => mvpMediaInputRef.current?.click()}
                                                className="border border-dashed border-zinc-700 bg-zinc-900/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors"
                                            >
                                                <div className="flex gap-4 mb-2">
                                                    <PhotoIcon className="w-6 h-6 text-zinc-500" />
                                                    <VideoCameraIcon className="w-6 h-6 text-zinc-500" />
                                                </div>
                                                <span className="text-sm text-zinc-400">Click to upload media</span>
                                                <input
                                                    type="file"
                                                    ref={mvpMediaInputRef}
                                                    className="hidden"
                                                    multiple
                                                    accept="image/*,video/*"
                                                    onChange={handleMvpMediaUpload}
                                                />
                                            </div>
                                            {mvpMediaFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {mvpMediaFiles.map((file, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700">
                                                            <span className="text-xs text-zinc-300 truncate max-w-[100px]">{file.name}</span>
                                                            <button onClick={() => removeMvpMedia(idx)} className="text-zinc-500 hover:text-red-400">
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {mvpType === 'Digital/Saas' && (
                                    <div className="animate-in fade-in">
                                        <label className="block text-xs text-zinc-400 mb-1">Project URL / Link</label>
                                        <input
                                            type="url"
                                            value={mvpUrl}
                                            onChange={(e) => setMvpUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-green-500 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="block text-sm font-medium text-zinc-300">
                                Asking Price <span className="text-red-500">*</span>
                            </label>
                            <span className="text-sm text-zinc-400">
                                Limit: ${maxPriceLimit.toLocaleString()}
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className={`w-full bg-zinc-950/50 border rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none transition-colors text-lg font-mono ${!isPriceValid && price !== '' ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-green-500'}`}
                                placeholder="500"
                                max={maxPriceLimit}
                            />
                        </div>
                        <div className="mt-3 space-y-2">
                            {!scores ? (
                                <p className="text-sm text-zinc-400">Upload a document to unlock higher pricing limits.</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className={`text-sm ${parseFloat(price) > maxPriceLimit ? 'text-red-400 font-medium' : 'text-zinc-400'}`}>
                                        Maximum allowed: ${maxPriceLimit.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Pricing Tier Factors</span>
                                        {hasMVP ? "MVP Verified" : "No MVP"} • Avg Score: {Math.round((scores.uniqueness + scores.viability + scores.scalability) / 3)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                        <button
                            disabled={!formValid || isSubmitting}
                            onClick={handleSubmit}
                            className={`w-full font-bold text-lg py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${formValid && !isSubmitting ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_25px_rgba(34,197,94,0.4)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                                    Publishing...
                                </>
                            ) : formValid ? (
                                <>
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Publish Listing
                                </>
                            ) : (
                                'Complete all fields to Publish'
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div >
    );
};
