/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    ArrowLeftIcon,
    DocumentPlusIcon,
    XMarkIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    CheckCircleIcon as CheckCircleIconOutline
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { analyzeAssetScores } from '../services/gemini';
import { createIdeaListing, createAIScoring, uploadDocument, getIdeaDetails, updateIdeaListing, updateAIScoring } from '../services/database';
import { supabase } from '../services/supabase';
import type { DemandLevel } from '../types/database';
import { CATEGORIES } from '../constants/categories'; // Ensure this exists, otherwise use local array
import { ContentEditableList } from './ContentEditableList';

// Local Categories Fallback if constant not found (assuming it is in ../constants/categories)
const DEFAULT_CATEGORIES = [
    "Technology", "Finance", "Health", "Education", "Ecommerce",
    "Media & Content", "Real Estate", "Logistics", "Agriculture",
    "Energy", "Manufacturing", "Gaming", "Consumer Goods", "Other"
];

const INDUSTRIES = typeof CATEGORIES !== 'undefined' ? CATEGORIES : DEFAULT_CATEGORIES;

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

// --- Reusable Form Components ---

const Label = ({ children }: { children?: React.ReactNode }) => (
    <label className="block text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider text-[11px] font-mono">
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
    // Simple native select for robustness in this large refactor, or custom if preferred. 
    // Using the custom one I built earlier.
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
                <ChevronRightIcon
                    className={`
                  h-4 w-4 transition-transform duration-300 transform rotate-90
                  ${isOpen ? '-rotate-90 text-[#22C55E]' : 'text-zinc-500 group-hover:text-zinc-300'}
              `}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#09090b] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
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
            )}
        </div>
    );
};

export const SellIdea: React.FC<SellIdeaProps> = ({ onBack }) => {
    // --- State ---
    const [editId, setEditId] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Step 1: Idea Info
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [primaryCategory, setPrimaryCategory] = useState('');
    const [secondaryCategory, setSecondaryCategory] = useState('');

    // Step 2: Customer Pain (A)
    const [customerPain, setCustomerPain] = useState<string[]>(['']);

    // Step 3: Current Solutions (B)
    const [currentSolutions, setCurrentSolutions] = useState<string[]>(['']);

    // Step 4: Execution Steps (C)
    const [executionSteps, setExecutionSteps] = useState<string[]>(['']);

    // Step 5: Growth Plan (D)
    const [growthPlan, setGrowthPlan] = useState<string[]>(['']);

    // Step 6: Solution Details (E)
    // "ContentEditable lists for some and paragraphs for others" -> Solution Details is Paragraph
    const [solutionDetails, setSolutionDetails] = useState('');

    // Step 7: Revenue Plan (F) -> Paragraph
    const [revenuePlan, setRevenuePlan] = useState('');

    // Step 8: Impact (G) -> Paragraph
    const [impact, setImpact] = useState('');

    // Step 9: Documents & Price
    const [price, setPrice] = useState('');
    const [mainDocument, setMainDocument] = useState<File | null>(null);
    const [existingMainDocUrl, setExistingMainDocUrl] = useState<string | null>(null);
    const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
    const [existingAdditionalDocs, setExistingAdditionalDocs] = useState<string[]>([]);

    // AI & Meta
    const [scores, setScores] = useState<AIScores | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    // Navigation
    const [currentStep, setCurrentStep] = useState(1);
    const TOTAL_STEPS = 9;

    const stepTitles = [
        "Idea Info",
        "Customer Pain Narrative", // A
        "Current Solutions Narrative", // B
        "Execution Steps Narrative", // C
        "Growth Plan Narrative", // D
        "Solution Narrative", // E
        "Revenue Narrative", // F
        "Impact Narrative", // G
        "Finalize Listing"
    ];

    // --- Loading Edit Data ---
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
            setShortDescription(data.description || data.one_line_description || '');
            setPrimaryCategory(data.category || '');
            setSecondaryCategory(data.secondary_category || '');

            setCustomerPain(data.customer_pain || ['']);
            setCurrentSolutions(data.current_solutions || ['']);
            setExecutionSteps(data.execution_steps || ['']);
            setGrowthPlan(data.growth_plan || ['']);

            setSolutionDetails(data.solution_details || '');
            setRevenuePlan(data.revenue_plan || '');
            setImpact(data.impact || '');

            setPrice(data.price.toString());
            setExistingMainDocUrl(data.document_url);

            // Legacy Mappings (Cast data to any to access removed fields safely)
            const legacyData = data as any;
            if (!data.customer_pain && legacyData.problem_description) setCustomerPain([legacyData.problem_description]);
            if (!data.solution_details && legacyData.solution_summary) setSolutionDetails(legacyData.solution_summary);
            // ... add more if acceptable defaults exist

            const extraDocs = [data.additional_doc_1, data.additional_doc_2, data.additional_doc_3].filter(Boolean) as string[];
            setExistingAdditionalDocs(extraDocs);

        } catch (err) {
            console.error('Failed to load listing', err);
            alert('Failed to load listing for editing.');
        } finally {
            setIsLoadingData(false);
        }
    };

    // --- Validation ---

    // Helper to check valid list (at least one non-empty string)
    const isListValid = (list: string[]) => list.length > 0 && list.some(item => item.trim().length > 0);

    // Ensure mutable string array for Select
    const industryOptions = [...INDUSTRIES];

    const isStepValid = useMemo(() => {
        switch (currentStep) {
            case 1: // Info
                return title.trim().length > 0 &&
                    shortDescription.trim().length > 0 &&
                    primaryCategory !== '';
            case 2: // A. Pain
                return isListValid(customerPain);
            case 3: // B. Solutions
                return isListValid(currentSolutions);
            case 4: // C. Execution
                return isListValid(executionSteps);
            case 5: // D. Growth
                return isListValid(growthPlan);
            case 6: // E. Solution
                return solutionDetails.trim().length > 0;
            case 7: // F. Revenue
                return revenuePlan.trim().length > 0;
            case 8: // G. Impact
                return impact.trim().length > 0;
            case 9: // Docs & Price
                const hasDoc = (mainDocument !== null || existingMainDocUrl !== null);
                const validPrice = !isNaN(parseFloat(price)) && parseFloat(price) > 0;
                return hasDoc && validPrice;
            default:
                return true;
        }
    }, [currentStep, title, shortDescription, primaryCategory, customerPain, currentSolutions, executionSteps, growthPlan, solutionDetails, revenuePlan, impact, mainDocument, existingMainDocUrl, price]);

    // --- Handlers ---

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

    const handleSubmit = async () => {
        setTouched(true);
        if (!isStepValid) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in');

            // 1. Upload files
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

            // 2. Prepare Payload
            const listingData: any = {
                title,
                one_line_description: shortDescription,
                category: primaryCategory,
                secondary_category: secondaryCategory || null,

                customer_pain: customerPain.filter(s => s.trim()),
                current_solutions: currentSolutions.filter(s => s.trim()),
                execution_steps: executionSteps.filter(s => s.trim()),
                growth_plan: growthPlan.filter(s => s.trim()),

                solution_details: solutionDetails,
                revenue_plan: revenuePlan,
                impact: impact,

                price: parseFloat(price),
                document_url: mainDocUrl,
                additional_doc_1: additionalDocUrls[0] || null,
                additional_doc_2: additionalDocUrls[1] || null,
                additional_doc_3: additionalDocUrls[2] || null,
            };

            // 3. Save
            if (editId) {
                const { error } = await updateIdeaListing(editId, listingData);
                if (error) throw error;
                alert('Listing updated!');
            } else {
                const { data: ideaData, error } = await createIdeaListing({ ...listingData, user_id: user.id });
                if (error || !ideaData) throw error;

                // Create minimal Score placeholder (since we removed old inputs driving custom scores)
                // Or try to create a basic score entry
                await createAIScoring({
                    idea_id: ideaData.idea_id,
                    uniqueness: 50,
                    demand: 'Mid',
                    problem_impact: 50,
                    profitability: "Analysis Pending",
                    viability: 50,
                    scalability: 50
                });

                alert('Idea listed successfully!');
            }
            onBack();

        } catch (err: any) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMainDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setMainDocument(e.target.files[0]);
            setExistingMainDocUrl(null);
        }
    };

    // --- Render ---

    if (isLoadingData) return <div className="min-h-screen text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pt-24 pb-12 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-zinc-500 hover:text-white flex items-center gap-1 text-sm">
                    <ArrowLeftIcon className="w-4 h-4" /> Cancel
                </button>
                <div className="text-xs font-mono text-[#22C55E]">
                    STEP {currentStep} OF {TOTAL_STEPS}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-0.5 w-full bg-zinc-900 mb-12">
                <div className="h-full bg-[#22C55E] transition-all duration-300" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
            </div>

            {/* Main Content */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                {/* Glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#22C55E]/5 blur-[80px] rounded-full pointer-events-none"></div>

                <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-mono text-[#22C55E]">
                        {currentStep}
                    </span>
                    {stepTitles[currentStep - 1]}
                </h1>

                {submitError && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{submitError}</div>}

                <div className="relative z-10 min-h-[400px]">

                    {/* STEP 1: Idea Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <Label>Title <span className="text-red-500">*</span></Label>
                                <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Name of your idea" />
                            </div>
                            <div>
                                <Label>Short Description <span className="text-red-500">*</span></Label>
                                <Input value={shortDescription} onChange={(e: any) => setShortDescription(e.target.value)} placeholder="One line elevator pitch" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Primary Category <span className="text-red-500">*</span></Label>
                                    <Select value={primaryCategory} onChange={setPrimaryCategory} options={industryOptions} placeholder="Primary Category" />
                                </div>
                                <div>
                                    <Label>Secondary Category</Label>
                                    <Select value={secondaryCategory} onChange={setSecondaryCategory} options={industryOptions} placeholder="Secondary (Optional)" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Customer Pain */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <Label>Customer Pain Points (List) <span className="text-red-500">*</span></Label>
                            <div className="mb-4 text-xs text-zinc-500">
                                <p>• Who has this problem?</p>
                                <p>• What exactly is the problem and how does it affect them?</p>
                                <p>• How often does it happen?</p>
                            </div>
                            <ContentEditableList items={customerPain} onChange={setCustomerPain} placeholder="Identify a specific pain point..." />
                        </div>
                    )}

                    {/* STEP 3: Current Solutions */}
                    {currentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <Label>Current Solutions (List) <span className="text-red-500">*</span></Label>
                            <div className="mb-4 text-xs text-zinc-500">
                                <p>• How do people solve this today?</p>
                                <p>• Why are these insufficient?</p>
                                <p>• What frustrations remain?</p>
                            </div>
                            <ContentEditableList items={currentSolutions} onChange={setCurrentSolutions} placeholder="Describe a current alternative..." />
                        </div>
                    )}

                    {/* STEP 4: Execution Steps */}
                    {currentStep === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <Label>Execution Steps (List) <span className="text-red-500">*</span></Label>
                            <div className="mb-4 text-xs text-zinc-500">
                                <p>• How to build v1?</p>
                                <p>• Skills/resources required?</p>
                                <p>• Hardest parts to execute?</p>
                            </div>
                            <ContentEditableList items={executionSteps} onChange={setExecutionSteps} placeholder="Step 1: Build..." />
                        </div>
                    )}

                    {/* STEP 5: Growth Plan */}
                    {currentStep === 5 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <Label>Growth Plan (List) <span className="text-red-500">*</span></Label>
                            <div className="mb-4 text-xs text-zinc-500">
                                <p>• First 1,000 users strategy?</p>
                                <p>• Expansion opportunities?</p>
                            </div>
                            <ContentEditableList items={growthPlan} onChange={setGrowthPlan} placeholder="Growth strategy point..." />
                        </div>
                    )}

                    {/* STEP 6: Solution Detail */}
                    {currentStep === 6 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <Label>Solution Detailed Description <span className="text-red-500">*</span></Label>
                            <div className="mb-4 text-xs text-zinc-500">
                                <p>• How does it work step-by-step?</p>
                                <p>• Single biggest improvement?</p>
                            </div>
                            <TextArea value={solutionDetails} onChange={(e: any) => setSolutionDetails(e.target.value)} rows={8} placeholder="Deep dive into your solution..." />
                        </div>
                    )}

                    {/* STEP 7: Revenue Plan */}
                    {currentStep === 7 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <Label>Revenue Plan <span className="text-red-500">*</span></Label>
                            <div className="mb-4 text-xs text-zinc-500">
                                <p>• Who pays and for what?</p>
                                <p>• Why would they continue paying?</p>
                            </div>
                            <TextArea value={revenuePlan} onChange={(e: any) => setRevenuePlan(e.target.value)} rows={8} placeholder="Monetization strategy..." />
                        </div>
                    )}

                    {/* STEP 8: Impact */}
                    {currentStep === 8 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <Label>Impact <span className="text-red-500">*</span></Label>
                            <div className="mb-4 text-xs text-zinc-500">
                                <p>• Who benefits most?</p>
                                <p>• Does this improve access, efficiency, safety?</p>
                            </div>
                            <TextArea value={impact} onChange={(e: any) => setImpact(e.target.value)} rows={8} placeholder="Societal or market impact..." />
                        </div>
                    )}

                    {/* STEP 9: Finalize */}
                    {currentStep === 9 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <Label>Prospectus / Business Plan (PDF) <span className="text-red-500">*</span></Label>
                                {(mainDocument || existingMainDocUrl) ? (
                                    <div className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                                        <span className="text-zinc-200 text-sm truncate">{mainDocument?.name || 'Existing Document'}</span>
                                        <button onClick={() => { setMainDocument(null); setExistingMainDocUrl(null); }} className="text-red-400"><XMarkIcon className="w-5 h-5" /></button>
                                    </div>
                                ) : (
                                    <input type="file" onChange={handleMainDocUpload} accept=".pdf" className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-green-500 hover:file:bg-zinc-700" />
                                )}
                            </div>

                            <div>
                                <Label>Asking Price ($) <span className="text-red-500">*</span></Label>
                                <Input type="number" value={price} onChange={(e: any) => setPrice(e.target.value)} placeholder="e.g. 5000" />
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Nav */}
                <div className="mt-12 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <button onClick={handleBack} disabled={currentStep === 1} className={`flex items-center gap-2 text-sm font-medium ${currentStep === 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}>
                        <ChevronLeftIcon className="w-4 h-4" /> Back
                    </button>

                    {currentStep < TOTAL_STEPS ? (
                        <button onClick={handleNext} disabled={!isStepValid} className={`flex items-center gap-2 bg-[#22C55E] text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-green-400 transition-all ${!isStepValid ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}>
                            Next Step <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isSubmitting || !isStepValid} className={`flex items-center gap-2 bg-[#22C55E] text-black px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-green-400 transition-all ${(!isStepValid || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}>
                            {isSubmitting ? 'Publishing...' : 'Publish Listing'} <CheckCircleIconSolid className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
