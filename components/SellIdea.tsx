/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    ArrowLeftIcon,
    DocumentPlusIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    CheckCircleIcon as CheckCircleIconOutline
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { analyzeAssetScores } from '../services/gemini';
import { createIdeaListing, createAIScoring, uploadDocument, getIdeaDetails, updateIdeaListing, updateAIScoring } from '../services/database';
import { supabase } from '../services/supabase';
import type { DemandLevel } from '../types/database';

// --- Constants ---
const INDUSTRIES = ["Technology", "Finance", "Health", "Education", "Ecommerce", "Media & Content", "Real Estate", "Logistics", "Agriculture", "Energy", "Other"];
const CUSTOMER_TYPES = ["Consumers (B2C)", "Businesses (B2B)", "Enterprises", "Governments / NGOs", "Creators / Freelancers", "Mixed"];
const STAGES = ["Idea / Concept", "Validated (research/interviews)", "MVP built", "Revenue generating"];
const URGENCY_LEVELS = ["Low", "Medium", "High"];
const PRIMARY_ADVANTAGES = ["Lower cost", "Faster", "Better user experience", "New capability", "Better access / availability", "Other"];
const MARKET_SIZES = ["Small (niche)", "Medium", "Large"];
const MARKET_GROWTH_TRENDS = ["Declining", "Stable", "Growing"];
const GEOGRAPHIC_SCOPES = ["Local", "National", "Global"];
const REVENUE_MODELS = ["Subscription", "One-time purchase", "Commission / Marketplace fee", "Advertising", "Licensing", "Usage-based"];
const PRICE_PER_CUSTOMER = ["Under $10", "$10–$50", "$50–$200", "$200–$1,000", "$1,000+"];
const COST_INTENSITIES = ["Low", "Medium", "High"];
const BUILD_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TIMES_TO_VERSION = ["Under 1 month", "1–3 months", "3–6 months", "6+ months"];
const REGULATORY_DEPENDENCIES = ["None", "Moderate", "High"];
const VALIDATION_LEVELS = ["None", "Customer interviews", "Survey data", "Waitlist / signups", "Paying customers"];
const WHATS_INCLUDED = ["Idea only", "Idea + framework", "Full execution plan"];
const BUYER_RIGHTS = ["Yes (allowed)", "No"];
const EXCLUSIVITIES = ["Exclusive sale", "Non-exclusive sale"];

// --- Interfaces ---
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

// --- Reusable Form Components (from Reference) ---

const Label = ({ children }: { children?: React.ReactNode }) => (
    <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-[10px]">
        {children}
    </label>
);

const Input = ({ value, onChange, placeholder, maxLength, type = "text" }: any) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] focus:outline-none transition-colors"
    />
);

const TextArea = ({ value, onChange, placeholder, rows = 4 }: any) => (
    <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] focus:outline-none transition-colors resize-none"
    />
);

const Select = ({ value, onChange, options, placeholder = "Choose an option" }: { value: string, onChange: (val: string) => void, options: string[], placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative group" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
              w-full text-left flex items-center justify-between
              bg-zinc-950/50 border rounded-lg px-4 py-3 
              transition-all duration-200 ease-in-out
              focus:outline-none
              ${isOpen
                        ? 'border-[#22C55E] ring-1 ring-[#22C55E] shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }
          `}
            >
                <span className={`block truncate ${value ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {value || placeholder}
                </span>
                <ChevronDownIcon
                    className={`
                  h-4 w-4 transition-transform duration-300
                  ${isOpen ? 'rotate-180 text-[#22C55E]' : 'text-zinc-500 group-hover:text-zinc-300'}
              `}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-2 bg-[#09090b] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {options.map((opt) => (
                            <div
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`
                      relative px-4 py-3 cursor-pointer text-sm transition-colors border-b border-zinc-900 last:border-0 flex items-center justify-between
                      ${value === opt
                                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                                    }
                  `}
                            >
                                <span className="font-medium">{opt}</span>
                                {value === opt && (
                                    <CheckCircleIconSolid className="w-4 h-4 text-[#22C55E]" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Range = ({ value, onChange, min, max, labels }: any) => {
    const val = value ? parseInt(value) : min;
    const percentage = ((val - min) / (max - min)) * 100;

    return (
        <div className="w-full py-2">
            {/* Labels */}
            <div className="flex justify-between mb-3 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                <span className={val === min ? 'text-[#22C55E] font-bold' : 'transition-colors'}>{labels?.[0] || min}</span>
                <span className={val === max ? 'text-[#22C55E] font-bold' : 'transition-colors'}>{labels?.[1] || max}</span>
            </div>

            {/* Slider Container */}
            <div className="relative h-6 flex items-center group">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={val}
                    onChange={onChange}
                    className="custom-range w-full h-2 rounded-lg cursor-pointer focus:outline-none appearance-none bg-zinc-800"
                    style={{
                        // Dynamic linear gradient to create the "fill" effect
                        background: `linear-gradient(to right, #22C55E 0%, #22C55E ${percentage}%, #27272a ${percentage}%, #27272a 100%)`
                    }}
                />
                {/* Thumb styling is usually handled via CSS (index.css), assuming standard Tailwind/browser behavior or specific global styles */}
            </div>

            {/* Value Display */}
            <div className="mt-1 flex justify-center">
                <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-bold font-mono text-sm shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    <span>{val}</span>
                    <span className="text-zinc-600 font-light mx-1">/</span>
                    <span className="text-zinc-500">{max}</span>
                </div>
            </div>
        </div>
    );
};


export const SellIdea: React.FC<SellIdeaProps> = ({ onBack }) => {
    // --- State ---
    const [editId, setEditId] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Idea Snapshot
    const [title, setTitle] = useState('');
    const [oneLineDescription, setOneLineDescription] = useState('');
    const [industry, setIndustry] = useState('');
    const [targetCustomer, setTargetCustomer] = useState('');
    const [stage, setStage] = useState('');

    // Problem & Urgency
    const [problemDescription, setProblemDescription] = useState('');
    const [whoFacesProblem, setWhoFacesProblem] = useState('');
    const [painLevel, setPainLevel] = useState(1);
    const [urgencyLevel, setUrgencyLevel] = useState('');
    const [currentAlternatives, setCurrentAlternatives] = useState('');

    // Solution & Advantage
    const [solutionSummary, setSolutionSummary] = useState('');
    const [primaryAdvantage, setPrimaryAdvantage] = useState('');
    const [differentiationStrength, setDifferentiationStrength] = useState(1);

    // Market Potential
    const [marketSize, setMarketSize] = useState('');
    const [marketGrowthTrend, setMarketGrowthTrend] = useState(''); // Stable default no longer default
    const [geographicScope, setGeographicScope] = useState(''); // National default no longer default

    // Revenue Model
    const [revenueModelType, setRevenueModelType] = useState('');
    const [expectedPricePerCustomer, setExpectedPricePerCustomer] = useState('');
    const [costIntensity, setCostIntensity] = useState('');

    // Execution Difficulty
    const [buildDifficulty, setBuildDifficulty] = useState('');
    const [timeToFirstVersion, setTimeToFirstVersion] = useState('');
    const [regulatoryDependency, setRegulatoryDependency] = useState('');

    // Validation
    const [validationLevel, setValidationLevel] = useState('');
    const [validationNotes, setValidationNotes] = useState('');

    // Sale & Rights
    const [whatIsIncluded, setWhatIsIncluded] = useState('');
    const [buyerResaleRights, setBuyerResaleRights] = useState('');
    const [exclusivity, setExclusivity] = useState('');

    // Metadata
    const [price, setPrice] = useState(''); // Asking Price
    // Removed old category state since we use 'industry' now

    // Document State
    const [mainDocument, setMainDocument] = useState<File | null>(null);
    const [existingMainDocUrl, setExistingMainDocUrl] = useState<string | null>(null);
    const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
    const [existingAdditionalDocs, setExistingAdditionalDocs] = useState<string[]>([]);
    const [showAdditionalDocs, setShowAdditionalDocs] = useState(false);

    // AI & Other
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scores, setScores] = useState<AIScores | null>(null);

    // Legacy MVP fields (kept for compatibility or internal logic if needed, but UI removed)
    const [hasMVP, setHasMVP] = useState<boolean | null>(false);
    const [mvpMediaFiles, setMvpMediaFiles] = useState<File[]>([]);
    const [existingMvpMedia, setExistingMvpMedia] = useState<{ url: string, type: 'image' | 'video' }[]>([]);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    // Refs
    const mainFileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);
    const mvpMediaInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- Wizard State ---
    const [currentStep, setCurrentStep] = useState(1);
    const TOTAL_STEPS = 8;

    const stepTitles = [
        "Idea Snapshot",
        "Problem & Urgency",
        "Solution & Advantage",
        "Market Potential",
        "Revenue Model",
        "Execution & Validation",
        "Sale & Rights",
        "Supporting Documents"
    ];


    // --- Effects ---

    // Check for Edit Mode
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('edit');
        if (id) {
            setEditId(id);
            loadListingData(id);
        }
    }, []);

    const loadListingData = async (id: string) => {
        setIsLoadingData(true);
        try {
            const { data, error } = await getIdeaDetails(id);
            if (error || !data) throw error || new Error('Listing not found');

            // Populate State
            setTitle(data.title);
            setOneLineDescription(data.one_line_description || '');
            setIndustry(data.category || INDUSTRIES[0]);
            setTargetCustomer(data.target_customer_type || CUSTOMER_TYPES[0]);
            setStage(data.stage || STAGES[0]);

            setProblemDescription(data.problem_description || '');
            setWhoFacesProblem(data.who_faces_problem || '');
            setPainLevel(data.pain_level || 1);
            setUrgencyLevel(data.urgency_level || URGENCY_LEVELS[0]);
            setCurrentAlternatives(data.current_alternatives || '');

            setSolutionSummary(data.solution_summary || '');
            setPrimaryAdvantage(data.primary_advantage || PRIMARY_ADVANTAGES[0]);
            setDifferentiationStrength(data.differentiation_strength || 1);

            setMarketSize(data.market_size || MARKET_SIZES[0]);
            setMarketGrowthTrend(data.market_growth_trend || MARKET_GROWTH_TRENDS[1]);
            setGeographicScope(data.geographic_scope || GEOGRAPHIC_SCOPES[1]);

            setRevenueModelType(data.revenue_model_type || REVENUE_MODELS[0]);
            setExpectedPricePerCustomer(data.expected_price_per_customer || PRICE_PER_CUSTOMER[1]);
            setCostIntensity(data.cost_intensity || COST_INTENSITIES[1]);

            setBuildDifficulty(data.build_difficulty || BUILD_DIFFICULTIES[1]);
            setTimeToFirstVersion(data.time_to_first_version || TIMES_TO_VERSION[1]);
            setRegulatoryDependency(data.regulatory_dependency || REGULATORY_DEPENDENCIES[0]);

            setValidationLevel(data.validation_level || VALIDATION_LEVELS[0]);
            setValidationNotes(data.validation_notes || '');

            setWhatIsIncluded(data.what_is_included || WHATS_INCLUDED[0]);
            setBuyerResaleRights(data.buyer_resale_rights || BUYER_RIGHTS[0]);
            setExclusivity(data.exclusivity || EXCLUSIVITIES[0]);

            setPrice(data.price.toString());
            setExistingMainDocUrl(data.document_url);

            const extraDocs = [data.additional_doc_1, data.additional_doc_2, data.additional_doc_3].filter(Boolean) as string[];
            setExistingAdditionalDocs(extraDocs);
            if (extraDocs.length > 0) setShowAdditionalDocs(true);

            // Legacy MVP handling if needed (though UI is removed, we might keep state consistent)
            setHasMVP(data.mvp);

            // Populate Scores
            if (data.uniqueness !== undefined) {
                setScores({
                    uniqueness: data.uniqueness || 0,
                    demand: data.demand || 'Mid',
                    problem_impact: data.problem_impact || 0,
                    profitability: { estimatedRevenue: 0, estimatedProfit: 0, marginPercentage: 0 },
                    viability: data.viability || 0,
                    scalability: data.scalability || 0
                });
            }

        } catch (err) {
            console.error('Failed to load listing', err);
            alert('Failed to load listing for editing.');
        } finally {
            setIsLoadingData(false);
        }
    };

    // --- Handlers ---

    // Helper to compress images
    const compressImage = async (file: File): Promise<File> => {
        if (!file.type.startsWith('image/')) return file;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                }, file.type, 0.8);
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    };

    const handleMainDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Allow PDF and Images
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                alert("Please upload a PDF document or an Image (JPEG, PNG).");
                return;
            }
            // Basic size check (e.g. 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert("File size too large. Please upload a file smaller than 10MB.");
                return;
            }

            // Compress if image
            const processedFile = await compressImage(file);

            setMainDocument(processedFile);
            setExistingMainDocUrl(null); // Replace existing

            // Always run analysis for new file
            await runAnalysis(processedFile);
        }
    };

    const handleAdditionalDocsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: File[] = Array.from(e.target.files);
            const validFiles = newFiles.filter(f => f.type === 'application/pdf');

            const currentCount = additionalDocuments.length + existingAdditionalDocs.length;

            if (currentCount + validFiles.length > 3) {
                alert("You can only have up to 3 additional documents.");
                // Add as many as fit
                const remaining = 3 - currentCount;
                if (remaining > 0) {
                    setAdditionalDocuments([...additionalDocuments, ...validFiles.slice(0, remaining)]);
                }
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
        setExistingMainDocUrl(null);
        setScores(null);
    };

    const removeAdditionalDocument = (index: number) => {
        setAdditionalDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAdditionalDocument = (index: number) => {
        setExistingAdditionalDocs(prev => prev.filter((_, i) => i !== index));
    };

    const handleMvpMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const rawFiles = Array.from(e.target.files);
            const processedFiles = await Promise.all(rawFiles.map((f: File) => compressImage(f)));
            setMvpMediaFiles([...mvpMediaFiles, ...processedFiles]);
        }
    };

    const removeMvpMedia = (index: number) => {
        setMvpMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMvpMedia = (index: number) => {
        setExistingMvpMedia(prev => prev.filter((_, i) => i !== index));
    };


    // --- Validation & Limits ---

    const maxPriceLimit = useMemo(() => {
        let limit = 500;

        // Use scores if present (new analysis), otherwise check if editing (we might loosen limits or need stored scores)
        // For edit mode without new score, we might want to respect existing price or assume validation passed.
        // Assuming if editing, user already passed validation.
        if (editId && !scores) return 100000; // Allow existing prices in edit mode without re-scoring

        if (scores) {
            const { uniqueness, viability, scalability } = scores;
            const avgScore = (uniqueness + viability + scalability) / 3;
            const isHighTier = avgScore > 75;

            if (hasMVP) {
                limit = isHighTier ? 5000 : 1000;
            } else {
                limit = isHighTier ? 1000 : 500;
            }
        }
        return limit;
    }, [scores, hasMVP, editId]);

    const isPriceValid = useMemo(() => {
        const p = parseFloat(price);
        return !isNaN(p) && p > 0 && p <= maxPriceLimit;
    }, [price, maxPriceLimit]);

    const formValid = useMemo(() => {
        // In edit mode, document is valid if we have existing URL OR new file
        const hasMainDoc = mainDocument !== null || existingMainDocUrl !== null;

        return title.trim().length > 0 &&
            oneLineDescription.trim().length > 0 &&
            problemDescription.trim().length > 0 &&
            solutionSummary.trim().length > 0 &&
            hasMainDoc &&
            isPriceValid;
    }, [title, oneLineDescription, problemDescription, solutionSummary, mainDocument, existingMainDocUrl, isPriceValid]);

    // --- Submit ---

    const handleSubmit = async () => {
        setTouched(true);
        if (!formValid) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in');

            // 1. Upload new files if any
            let mainDocUrl = existingMainDocUrl || '';
            if (mainDocument) {
                const { data, error } = await uploadDocument(mainDocument, user.id, 'documents');
                if (error) throw error;
                mainDocUrl = data!.url;
            }

            const additionalDocUrls: string[] = [...existingAdditionalDocs];
            for (const doc of additionalDocuments) {
                const { data, error } = await uploadDocument(doc, user.id, 'documents');
                if (error) throw error;
                additionalDocUrls.push(data!.url);
            }

            // 2. Prepare Data
            const listingData = {
                title,
                one_line_description: oneLineDescription,
                category: industry,
                target_customer_type: targetCustomer,
                stage: stage,

                problem_description: problemDescription,
                who_faces_problem: whoFacesProblem,
                pain_level: painLevel,
                urgency_level: urgencyLevel,
                current_alternatives: currentAlternatives,

                solution_summary: solutionSummary,
                primary_advantage: primaryAdvantage,
                differentiation_strength: differentiationStrength,

                market_size: marketSize,
                market_growth_trend: marketGrowthTrend,
                geographic_scope: geographicScope,

                revenue_model_type: revenueModelType,
                expected_price_per_customer: expectedPricePerCustomer,
                cost_intensity: costIntensity,

                build_difficulty: buildDifficulty,
                time_to_first_version: timeToFirstVersion,
                regulatory_dependency: regulatoryDependency,

                validation_level: validationLevel,
                validation_notes: validationNotes,

                what_is_included: whatIsIncluded,
                buyer_resale_rights: buyerResaleRights,
                exclusivity: exclusivity,

                document_url: mainDocUrl,
                additional_doc_1: additionalDocUrls[0] || null,
                additional_doc_2: additionalDocUrls[1] || null,
                additional_doc_3: additionalDocUrls[2] || null,

                price: parseFloat(price)
            };

            // 3. Update or Create
            if (editId) {
                const { error } = await updateIdeaListing(editId, listingData);
                if (error) throw error;

                // Update Scores if new analysis
                if (scores) {
                    const profitabilityText = `Revenue: $${scores.profitability.estimatedRevenue.toLocaleString()}/yr, Profit: $${scores.profitability.estimatedProfit.toLocaleString()}/yr (${scores.profitability.marginPercentage}% Margin)`;
                    await updateAIScoring(editId, {
                        uniqueness: scores.uniqueness,
                        demand: scores.demand,
                        problem_impact: scores.problem_impact,
                        profitability: profitabilityText,
                        viability: scores.viability,
                        scalability: scores.scalability
                    });
                }
                alert('Listing updated successfully!');
            } else {
                // Create
                const { data: ideaData, error: ideaError } = await createIdeaListing({
                    ...listingData,
                    user_id: user.id
                });
                if (ideaError || !ideaData) throw ideaError || new Error('Failed to create');

                // Create Score
                const finalScores = scores || {
                    uniqueness: 70,
                    demand: 'Mid',
                    problem_impact: 70,
                    profitability: { estimatedRevenue: 10000, estimatedProfit: 1000, marginPercentage: 10 },
                    viability: 70,
                    scalability: 70
                };

                const profitabilityText = typeof finalScores.profitability === 'string'
                    ? finalScores.profitability
                    : `Revenue: $${finalScores.profitability.estimatedRevenue.toLocaleString()}/yr, Profit: $${finalScores.profitability.estimatedProfit.toLocaleString()}/yr (${finalScores.profitability.marginPercentage}% Margin)`;

                await createAIScoring({
                    idea_id: ideaData.idea_id,
                    uniqueness: finalScores.uniqueness,
                    demand: finalScores.demand as any,
                    problem_impact: finalScores.problem_impact,
                    profitability: profitabilityText,
                    viability: finalScores.viability,
                    scalability: finalScores.scalability
                });

                alert('Idea listed successfully!');
            }

            // Redirect
            onBack();

        } catch (error: any) {
            console.error('Submit error:', error);
            setSubmitError(error.message || 'Failed to submit.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Wizard Handlers ---

    const isStepValid = useMemo(() => {
        switch (currentStep) {
            case 1: // Snapshot
                return title.trim().length > 0 &&
                    oneLineDescription.trim().length > 0 &&
                    industry !== '' &&
                    targetCustomer !== '' &&
                    stage !== '';
            case 2: // Problem
                return problemDescription.trim().length > 0 && urgencyLevel !== '';
            case 3: // Solution
                return solutionSummary.trim().length > 0 && primaryAdvantage !== '';
            case 4: // Market Potential
                return marketSize !== '' && marketGrowthTrend !== '' && geographicScope !== '';
            case 5: // Revenue Model
                return revenueModelType !== '' && expectedPricePerCustomer !== '' && costIntensity !== '';
            case 6: // Execution & Validation
                return buildDifficulty !== '' && timeToFirstVersion !== '' && regulatoryDependency !== '' && validationLevel !== '';
            case 7: // Sale & Rights
                return whatIsIncluded !== '' && buyerResaleRights !== '' && exclusivity !== '' && isPriceValid;
            case 8: // Documents
                // valid if existing OR new
                return (mainDocument !== null || existingMainDocUrl !== null);
            default:
                return true;
        }
    }, [currentStep, title, oneLineDescription, industry, targetCustomer, stage, problemDescription, urgencyLevel, solutionSummary, primaryAdvantage, marketSize, marketGrowthTrend, geographicScope, revenueModelType, expectedPricePerCustomer, costIntensity, buildDifficulty, timeToFirstVersion, regulatoryDependency, validationLevel, whatIsIncluded, buyerResaleRights, exclusivity, isPriceValid, mainDocument, existingMainDocUrl]);

    const handleNext = () => {
        if (currentStep < TOTAL_STEPS && isStepValid) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    // --- Helper Components ---
    const CircularScore = ({ label, value }: { label: string, value: number }) => {
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;
        const getColor = (val: number) => val < 25 ? 'text-red-500' : val < 50 ? 'text-orange-500' : val < 75 ? 'text-yellow-500' : 'text-green-500';
        const colorClass = getColor(value);
        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r={radius} className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r={radius} className={`${colorClass.replace('text-', 'stroke-')} transition-all`} strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-2xl ${colorClass}`}>{value}</div>
                </div>
                <span className="text-xs font-mono uppercase text-zinc-400 text-center">{label}</span>
            </div>
        );
    };

    if (isLoadingData) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading data...</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pt-24 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Top Navigation */}
            <button onClick={onBack} className="group flex items-center space-x-2 text-zinc-500 hover:text-white mb-8 transition-colors">
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Cancel</span>
            </button>

            {/* Progress Header */}
            <div className="mb-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[#22C55E] font-mono text-xs uppercase tracking-wider">Step {currentStep} of {TOTAL_STEPS}</span>
                    <span className="text-zinc-500 text-xs">{Math.round((currentStep / TOTAL_STEPS) * 100)}% Completed</span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#22C55E] transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                    />
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col max-w-2xl mx-auto">
                {/* Subtle Green Glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#22C55E]/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col flex-grow">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-mono text-[#22C55E]">
                            {currentStep}
                        </span>
                        {stepTitles[currentStep - 1]}
                    </h2>

                    {submitError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-500 text-sm">{submitError}</div>
                    )}

                    <div className="flex-grow space-y-8">
                        {/* 1. Idea Snapshot */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <Label>Idea Title <span className="text-red-500">*</span></Label>
                                    <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="e.g. Uber for Dog Walking" />
                                </div>
                                <div>
                                    <Label>One-line Description <span className="text-red-500">*</span> <span className="text-xs text-zinc-500 ml-1">(Max 200 chars)</span></Label>
                                    <Input value={oneLineDescription} onChange={(e: any) => setOneLineDescription(e.target.value)} maxLength={200} placeholder="A brief hook for your idea..." />
                                </div>
                                <div>
                                    <Label>Industry / Category</Label>
                                    <Select value={industry} onChange={setIndustry} options={INDUSTRIES} />
                                </div>
                                <div>
                                    <Label>Target Customer Type</Label>
                                    <Select value={targetCustomer} onChange={setTargetCustomer} options={CUSTOMER_TYPES} />
                                </div>
                                <div>
                                    <Label>Stage</Label>
                                    <Select value={stage} onChange={setStage} options={STAGES} />
                                </div>
                            </div>
                        )}

                        {/* 2. Problem & Urgency */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <Label>Problem Description <span className="text-red-500">*</span></Label>
                                    <TextArea value={problemDescription} onChange={(e: any) => setProblemDescription(e.target.value)} placeholder="Describe the core problem this idea solves..." />
                                </div>
                                <div>
                                    <Label>Who Faces This Problem?</Label>
                                    <Input value={whoFacesProblem} onChange={(e: any) => setWhoFacesProblem(e.target.value)} placeholder="Specific persona or demographic" />
                                </div>
                                <div>
                                    <Label>Pain Level (1-5)</Label>
                                    <Range value={painLevel} onChange={(e: any) => setPainLevel(parseInt(e.target.value))} min={1} max={5} labels={["Minor", "Critical"]} />
                                </div>
                                <div>
                                    <Label>Urgency Level</Label>
                                    <Select value={urgencyLevel} onChange={setUrgencyLevel} options={URGENCY_LEVELS} />
                                </div>
                                <div>
                                    <Label>Current Alternatives</Label>
                                    <Input value={currentAlternatives} onChange={(e: any) => setCurrentAlternatives(e.target.value)} placeholder="How do people solve this now?" />
                                </div>
                            </div>
                        )}

                        {/* 3. Solution & Advantage */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <Label>Solution Summary <span className="text-red-500">*</span></Label>
                                    <TextArea value={solutionSummary} onChange={(e: any) => setSolutionSummary(e.target.value)} placeholder="How does your idea solve the problem?" />
                                </div>
                                <div>
                                    <Label>Primary Advantage</Label>
                                    <Select value={primaryAdvantage} onChange={setPrimaryAdvantage} options={PRIMARY_ADVANTAGES} />
                                </div>
                                <div>
                                    <Label>Differentiation Strength (1-5)</Label>
                                    <Range value={differentiationStrength} onChange={(e: any) => setDifferentiationStrength(parseInt(e.target.value))} min={1} max={5} labels={["Weak", "Strong"]} />
                                </div>
                            </div>
                        )}

                        {/* 4. Market Potential */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <Label>Market Size</Label>
                                    <Select value={marketSize} onChange={setMarketSize} options={MARKET_SIZES} />
                                </div>
                                <div>
                                    <Label>Growth Trend</Label>
                                    <Select value={marketGrowthTrend} onChange={setMarketGrowthTrend} options={MARKET_GROWTH_TRENDS} />
                                </div>
                                <div>
                                    <Label>Geographic Scope</Label>
                                    <Select value={geographicScope} onChange={setGeographicScope} options={GEOGRAPHIC_SCOPES} />
                                </div>
                            </div>
                        )}

                        {/* 5. Revenue Model */}
                        {currentStep === 5 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <Label>Revenue Type</Label>
                                    <Select value={revenueModelType} onChange={setRevenueModelType} options={REVENUE_MODELS} />
                                </div>
                                <div>
                                    <Label>Expected Price / Customer</Label>
                                    <Select value={expectedPricePerCustomer} onChange={setExpectedPricePerCustomer} options={PRICE_PER_CUSTOMER} />
                                </div>
                                <div>
                                    <Label>Cost Intensity</Label>
                                    <Select value={costIntensity} onChange={setCostIntensity} options={COST_INTENSITIES} />
                                </div>
                            </div>
                        )}

                        {/* 6. Execution & Validation */}
                        {currentStep === 6 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <Label>Build Difficulty</Label>
                                    <Select value={buildDifficulty} onChange={setBuildDifficulty} options={BUILD_DIFFICULTIES} />
                                </div>
                                <div>
                                    <Label>Time to v1</Label>
                                    <Select value={timeToFirstVersion} onChange={setTimeToFirstVersion} options={TIMES_TO_VERSION} />
                                </div>
                                <div>
                                    <Label>Regulatory / Legal</Label>
                                    <Select value={regulatoryDependency} onChange={setRegulatoryDependency} options={REGULATORY_DEPENDENCIES} />
                                </div>

                                <div className="pt-6 border-t border-zinc-800">
                                    <h3 className="text-lg font-medium text-white mb-4">Validation</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <Label>Validation Level</Label>
                                            <Select value={validationLevel} onChange={setValidationLevel} options={VALIDATION_LEVELS} />
                                        </div>
                                        <div>
                                            <Label>Validation Notes</Label>
                                            <TextArea value={validationNotes} onChange={(e: any) => setValidationNotes(e.target.value)} placeholder="Share any specific traction/validation details (optional)." rows={3} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. Sale & Rights */}
                        {currentStep === 7 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <Label>What Is Included</Label>
                                    <Select value={whatIsIncluded} onChange={setWhatIsIncluded} options={WHATS_INCLUDED} />
                                </div>
                                <div>
                                    <Label>Resale Rights</Label>
                                    <Select value={buyerResaleRights} onChange={setBuyerResaleRights} options={BUYER_RIGHTS} />
                                </div>
                                <div>
                                    <Label>Exclusivity</Label>
                                    <Select value={exclusivity} onChange={setExclusivity} options={EXCLUSIVITIES} />
                                </div>
                                <div>
                                    <Label>Asking Price ($)</Label>
                                    <Input type="number" value={price} onChange={(e: any) => setPrice(e.target.value)} placeholder="5000" />
                                    <p className="text-xs text-zinc-500 mt-1">Limit: ${maxPriceLimit.toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        {/* 8. Supporting Documents */}
                        {currentStep === 8 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className={`border rounded-xl p-6 bg-zinc-950/30 ${touched && !mainDocument && !existingMainDocUrl ? 'border-red-500/50' : 'border-zinc-800'}`}>
                                    <h3 className="text-lg font-medium text-white mb-4">Primary Document <span className="text-red-500">*</span></h3>

                                    {(mainDocument || existingMainDocUrl) ? (
                                        <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-3 rounded-lg border border-zinc-700">
                                            <span className="text-sm text-zinc-200 truncate max-w-xs">{mainDocument ? mainDocument.name : 'Existing Document'}</span>
                                            <button onClick={removeMainDocument} className="text-zinc-500 hover:text-red-400"><XMarkIcon className="w-5 h-5" /></button>
                                        </div>
                                    ) : (
                                        <div onClick={() => mainFileInputRef.current?.click()} className="border border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-500 transition-colors group">
                                            <DocumentPlusIcon className="w-8 h-8 text-zinc-500 group-hover:text-green-500 mx-auto mb-2 transition-colors" />
                                            <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Click to upload Prospectus</span>
                                            <span className="block text-xs text-zinc-500 mt-1">(PDF, JPEG, PNG - Max 10MB)</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={mainFileInputRef}
                                        className="hidden"
                                        accept="application/pdf,image/png,image/jpeg,image/webp"
                                        onChange={handleMainDocUpload}
                                    />

                                    {/* Additional Docs */}
                                    <div className="mt-6">
                                        <div className="flex justify-between mb-2"><span className="text-sm text-zinc-300">Additional Docs</span></div>
                                        {/* Existing */}
                                        {existingAdditionalDocs.map((url, i) => (
                                            <div key={`ex-${i}`} className="flex justify-between bg-zinc-800 px-3 py-2 rounded mb-2">
                                                <span className="text-xs text-zinc-400">Existing Doc {i + 1}</span>
                                                <button onClick={() => removeExistingAdditionalDocument(i)} className="text-red-400"><XMarkIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                        {/* New */}
                                        {additionalDocuments.map((doc, i) => (
                                            <div key={`new-${i}`} className="flex justify-between bg-zinc-800 px-3 py-2 rounded mb-2">
                                                <span className="text-xs text-zinc-300">{doc.name}</span>
                                                <button onClick={() => removeAdditionalDocument(i)} className="text-red-400"><XMarkIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                        {existingAdditionalDocs.length + additionalDocuments.length < 3 && (
                                            <button onClick={() => additionalFileInputRef.current?.click()} className="text-xs text-green-400 flex items-center gap-1 hover:text-green-300">+ Add More</button>
                                        )}
                                        <input type="file" ref={additionalFileInputRef} className="hidden" accept="application/pdf" multiple onChange={handleAdditionalDocsUpload} />
                                    </div>
                                </div>

                                {/* AI Metrics */}
                                {scores && (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mt-8">
                                        <h2 className="text-xl font-bold text-white mb-4">AI Metrics</h2>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <CircularScore label="Uniqueness" value={scores.uniqueness} />
                                            <CircularScore label="Viability" value={scores.viability} />
                                            <CircularScore label="Scalability" value={scores.scalability} />
                                            <CircularScore label="Impact" value={scores.problem_impact} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-800/50">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentStep === 1 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < TOTAL_STEPS ? (
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid}
                                className={`flex items-center gap-2 bg-[#22C55E] hover:bg-green-500 text-black px-6 py-2.5 rounded-lg text-sm font-bold transition-all transform hover:scale-105 shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_25px_rgba(34,197,94,0.5)] ${!isStepValid ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none' : ''}`}
                            >
                                Next Step
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formValid}
                                className={`flex items-center gap-2 bg-[#22C55E] hover:bg-green-500 text-black px-6 py-2.5 rounded-lg text-sm font-bold transition-all transform hover:scale-105 shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_25px_rgba(34,197,94,0.5)] ${(!formValid || isSubmitting) ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none' : ''}`}
                            >
                                {isSubmitting ? 'Processing...' : (editId ? 'Update Listing' : 'Publish Listing')}
                                <CheckCircleIconSolid className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
