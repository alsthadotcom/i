/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, ArrowLeftIcon, ChevronRightIcon, CheckIcon, ArrowDownTrayIcon, ExclamationTriangleIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { createVenture, getAnonymousId, createIdeaListing, getIdeaListingById, getVentureByUserId, updateVenture, updateIdeaListing, saveVentureAnalysis } from '../services/database';
import { supabase } from '../services/supabase';
// import { runFullPipeline, ValidationLog, ValidationResult } from '../services/validationChain'; // File missing
import { TargetedModel, toonDecodeFromStorage, analyzeIdea } from '../services/puter';
import { generateHtmlReport } from '../services/reportGenerator';
// import DecisionIntelligence from './DecisionIntelligence';
// import { ConfigProvider, theme } from 'antd';

// --- Constants ---

const STAGES = ["Idea", "MVP", "Prototype", "Executed"];

const INDUSTRIES = [
    "Agriculture",
    "Hospitality",
    "Fintech",
    "Automobile–Manufacturing",
    "Government",
    "Tech–Digital",
    "Other"
];

const BUSINESS_TYPES = ["Product", "Service", "SaaS", "Marketplace", "Contract-based"];

const PAYERS = ["Consumers", "Businesses", "Government", "Mixed"];

const PROBLEMS_EARLY = [
    "Financial Problem",
    "Resource Problem",
    "Unaware of the market conditions (Demand & Supply, TAM, etc)",
    "Unaware of the market competitions",
    "Unaware of the legal stuffs",
    "Marketing & Branding Problem",
    "Need a Roadmap/Guide"
];

const PROBLEMS_EXECUTED = [
    "Financial Problem",
    "Resource Problem",
    "Marketing & Branding Problem",
    "Scaling Problem",
    "Market Competition Problem",
    "Total Addressable Market Problem",
    "Distribution & Logistics Problem",
    "Legal Problem"
];

// --- Interfaces ---

interface SellIdeaProps {
    onBack: () => void;
    initialIdeaId?: string | null;
}

interface ValidationLog {
    step: number;
    model: string;
    status: 'pending' | 'processing' | 'completed';
    message: string;
}

// --- Components ---

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className="block text-zinc-500 text-[10px] uppercase tracking-widest font-mono font-bold mb-3">
        {children} {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
);

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select Option"
}: {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
}) => {
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

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between px-6 py-4
                    bg-black/40 border rounded-xl transition-all duration-300 text-sm
                    ${isOpen ? 'border-[#22C55E]/50' : 'border-zinc-800/80 hover:border-zinc-700'}
                `}
            >
                <span className={value ? 'text-zinc-100' : 'text-zinc-500'}>
                    {value || placeholder}
                </span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#22C55E]' : 'text-zinc-500'}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
                    >
                        <div className="max-h-60 overflow-y-auto py-2">
                            {options.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full text-left px-5 py-3 text-sm transition-colors
                                        ${value === opt ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'}
                                    `}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ToggleOption: React.FC<{
    label: string;
    required: boolean;
    onChange: (val: boolean) => void;
}> = ({
    label,
    required,
    onChange
}) => {
        return (
            <div className={`
            flex items-center justify-between p-5 rounded-2xl border transition-all duration-300
            ${required ? 'bg-[#22C55E]/5 border-[#22C55E]/20' : 'bg-black/20 border-zinc-800 hover:border-zinc-700'}
        `}>
                <div className="flex flex-col gap-1">
                    <span className={`text-sm font-medium transition-colors ${required ? 'text-zinc-100' : 'text-zinc-400'}`}>
                        {label}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                        {required ? 'Required for analysis' : 'Not required'}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => onChange(!required)}
                    className={`
                    relative w-12 h-6 rounded-full p-1 transition-all duration-300
                    ${required ? 'bg-[#22C55E]' : 'bg-zinc-800'}
                `}
                >
                    <motion.div
                        animate={{ x: required ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                </button>
            </div>
        );
    };


const PipelineStep = ({ model, role, logs, targetStep }: { model: string, role: string, logs: ValidationLog[], targetStep: number }) => {
    // Find logs for this specific step
    const stepLog = logs.find(l => l.step === targetStep && l.model === model);
    const isCompleted = logs.some(l => l.step > targetStep) || (stepLog?.status === 'completed');
    const isProcessing = stepLog?.status === 'processing';
    const isPending = !stepLog && !isCompleted;

    return (
        <div className={`
            flex items-center gap-4 p-4 rounded-xl border transition-all duration-500
            ${isProcessing ? 'bg-[#22C55E]/5 border-[#22C55E]/30 scale-105 shadow-lg shadow-[#22C55E]/10' : ''}
            ${isCompleted ? 'bg-zinc-900/50 border-zinc-800 opacity-60' : ''}
            ${isPending ? 'bg-black/20 border-zinc-800/50 opacity-40' : ''}
        `}>
            {/* Status Icon */}
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border transition-colors
                ${isCompleted ? 'bg-[#22C55E] border-[#22C55E] text-black' : ''}
                ${isProcessing ? 'bg-transparent border-[#22C55E] text-[#22C55E] animate-pulse' : ''}
                ${isPending ? 'bg-zinc-800 border-zinc-700 text-zinc-600' : ''}
            `}>
                {isCompleted ? <CheckIcon className="w-6 h-6" /> : (
                    <span className="font-mono font-bold text-xs">{targetStep}</span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`font-bold text-sm ${isProcessing ? 'text-white' : 'text-zinc-300'}`}>{model}</h4>
                    {isProcessing && <span className="text-[10px] text-[#22C55E] animate-pulse font-mono">PROCESSING</span>}
                    {isCompleted && <span className="text-[10px] text-zinc-500 font-mono">DONE</span>}
                </div>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">{role}</p>

                {/* Real-time Log Message */}
                <div className="h-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {stepLog?.message && (
                            <motion.p
                                key={stepLog.message}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-zinc-400 truncate"
                            >
                                {stepLog.message}
                            </motion.p>
                        )}
                        {!stepLog?.message && isPending && <p className="text-xs text-zinc-600">Waiting to start...</p>}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export const SellIdea: React.FC<SellIdeaProps> = ({ onBack, initialIdeaId }) => {
    // --- State ---
    const [currentStep, setCurrentStep] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [editIdeaId, setEditIdeaId] = useState<string | null>(null);
    const [editVentureId, setEditVentureId] = useState<string | null>(null);

    // Step 1: Identification
    const [coreIdea, setCoreIdea] = useState("");
    const [stage, setStage] = useState("");
    const [industry, setIndustry] = useState("");
    const [otherIndustry, setOtherIndustry] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [payer, setPayer] = useState("");

    // Step 2: Problem Toggles
    const [requiredProblems, setRequiredProblems] = useState<Record<string, boolean>>({});

    // Step 3+: Problem Details
    const [problemDetails, setProblemDetails] = useState<Record<string, string>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [debugData, setDebugData] = useState<{ input: any; output: any } | null>(null);
    const [pipelineLogs, setPipelineLogs] = useState<ValidationLog[]>([]);
    const [finalAnalysis, setFinalAnalysis] = useState<any>(null);

    // New states for analysis
    const [loading, setLoading] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState("Initializing...");
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isAnalysisReady, setIsAnalysisReady] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    // Prevent accidental tab close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isAnalysisReady && !hasDownloaded) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser alert
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isAnalysisReady, hasDownloaded]);

    // Auto-play video if stuck on roadmap for >5 seconds
    const isRoadmapStage = analysisProgress.toLowerCase().includes('roadmap');

    useEffect(() => {
        if (!loading || !isRoadmapStage) {
            setShowVideo(false);
            return;
        }

        // Timer now only resets if we leave roadmap stage or stop loading
        const timer = setTimeout(() => {
            setShowVideo(true);
        }, 5000); // 5 seconds

        return () => clearTimeout(timer);
    }, [isRoadmapStage, loading]);


    // --- Effects ---
    useEffect(() => {
        const loadDataForEdit = async () => {
            const params = new URLSearchParams(window.location.search);
            const id = initialIdeaId || params.get('id');
            if (!id) return;

            setEditIdeaId(id);
            setIsEditing(true);

            try {
                // 1. Fetch the listing to ensure ownership/existence
                const { data: idea, error: ideaError } = await getIdeaListingById(id);
                if (ideaError || !idea) throw new Error("Listing not found");

                // Pre-fill core idea from existing listing description
                if (idea.one_line_description) {
                    setCoreIdea(idea.one_line_description);
                }

                // 2. Fetch the corresponding venture (heuristic: latest for this user)
                // In a stricter schema, we'd use a foreign key.
                const { data: venture, error: ventureError } = await getVentureByUserId(idea.user_id);

                if (venture) {
                    setEditVentureId(venture.id);
                    setStage(venture.stage);
                    setIndustry(venture.industry); // Might be "Other" or specific
                    if (!INDUSTRIES.includes(venture.industry) && venture.industry !== 'Other') {
                        // Simplify logic: if not in list, assume 'Other' + val, or just set raw if list is flexible
                        // For now, if it's not in known list and exists, put it in 'Other'
                        // But for simplicity, let's just set it directly if it matches logic
                    }
                    if (venture.industry && !INDUSTRIES.includes(venture.industry)) {
                        setIndustry('Other');
                        setOtherIndustry(venture.industry);
                    } else {
                        setIndustry(venture.industry);
                    }

                    setBusinessType(venture.business_type);
                    setPayer(venture.payer);

                    // Populate Problems
                    if (venture.problem_details) {
                        setProblemDetails(venture.problem_details as any);
                        const problems = Object.keys(venture.problem_details);
                        const newReq: Record<string, boolean> = {};
                        problems.forEach(p => newReq[p] = true);
                        setRequiredProblems(newReq);
                    }
                }
            } catch (err) {
                console.error("Failed to load edit data", err);
            }
        };

        loadDataForEdit();
    }, []);

    // --- Derived State ---
    const isEarlyStage = stage === "Idea" || stage === "MVP" || stage === "Prototype";
    const problemList = isEarlyStage ? PROBLEMS_EARLY : PROBLEMS_EXECUTED;

    const selectedProblemSteps = useMemo(() => {
        return problemList.filter(p => requiredProblems[p]);
    }, [problemList, requiredProblems]);

    const totalSteps = 2 + selectedProblemSteps.length;

    // --- Handlers ---
    const handleToggleProblem = (prob: string, val: boolean) => {
        setRequiredProblems(prev => ({ ...prev, [prob]: val }));
    };

    const handleNext = () => {
        if (currentStep === totalSteps) {
            handleSubmit();
            return;
        }
        if (currentStep === 1) {
            if (!stage || !industry || (industry === 'Other' && !otherIndustry) || !businessType || !payer) return;
        }
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const downloadFile = (filename: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatAnalysisToText = (data: any): string => {
        if (!data) return "";

        let text = "================================================================\n";
        text += "FINAL STRATEGIC ANALYSIS REPORT\n";
        text += "================================================================\n\n";

        // 1. Competitors
        text += "1. TOP 5 COMPETITORS\n";
        text += "--------------------\n";
        if (Array.isArray(data.competitors)) {
            data.competitors.forEach((c: string) => text += `• ${c}\n`);
        }
        text += "\n";

        // 2. Solutions
        text += "2. KEY STRATEGIC SOLUTIONS\n";
        text += "--------------------------\n";
        if (Array.isArray(data.solutions)) {
            data.solutions.forEach((s: string) => text += `• ${s}\n`);
        }
        text += "\n";

        // 3. Case Studies
        text += "3. RELEVANT CASE STUDIES\n";
        text += "------------------------\n";
        if (Array.isArray(data.case_studies)) {
            data.case_studies.forEach((cs: any) => {
                text += `• Company: ${cs.company}\n`;
                text += `  Outcome: ${cs.outcome}\n\n`;
            });
        }
        text += "\n";

        // 4. Sources
        text += "4. VERIFIED SOURCES\n";
        text += "-------------------\n";
        if (Array.isArray(data.sources)) {
            data.sources.forEach((s: string, i: number) => text += `${i + 1}. ${s}\n`);
        }
        text += "\n";

        // 5. Roadmap
        text += "5. EXECUTION ROADMAP\n";
        text += "--------------------\n";
        text += `${data.roadmap || "No roadmap provided."}\n\n`;

        text += "================================================================\n";
        text += "Generated by IDA Decision Intelligence\n";

        return text;
    };

    const downloadResources = (input: any, output: any) => {
        const date = new Date().toISOString().split('T')[0];

        // 1. Download Input
        if (input) {
            downloadFile(`idea_input_${date}.txt`, JSON.stringify(input, null, 2));
        }

        // 2. Download Output (HTML)
        if (output) {
            const htmlContent = generateHtmlReport(output);
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `idea_analysis_${date}.html`;

            setTimeout(() => {
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1500); // 1.5s delay
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Get current user or generate anonymous ID
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || getAnonymousId();

            // 1. Create OR Update Venture Record
            let targetVentureId = isEditing ? editVentureId : null;

            if (isEditing && editVentureId) {
                const { error: updateError } = await updateVenture(editVentureId, {
                    stage: stage as any,
                    industry: industry === 'Other' ? otherIndustry : industry,
                    business_type: businessType,
                    payer: payer,
                    problem_details: problemDetails
                });
                if (updateError) throw updateError;
            } else {
                const { data: venture, error: ventureError } = await createVenture({
                    user_id: userId,
                    stage: stage as any,
                    industry: industry === 'Other' ? otherIndustry : industry,
                    business_type: businessType,
                    payer: payer,
                    problem_details: problemDetails
                });
                if (ventureError) throw ventureError;
                if (venture) targetVentureId = venture.id;
            }

            // 2. Create OR Update Idea Listing Record
            const finalIndustry = industry === 'Other' ? otherIndustry : industry;
            const generatedTitle = `${finalIndustry} ${businessType} Concept`;
            // Use user's core idea description if provided, otherwise generate default
            const finalDescription = coreIdea && coreIdea.trim().length > 0
                ? coreIdea
                : `A ${stage} stage ${businessType} project in the ${finalIndustry} sector.`;

            if (isEditing && editIdeaId) {
                const { error: ideaError } = await updateIdeaListing(editIdeaId, {
                    title: generatedTitle,
                    one_line_description: finalDescription,
                    category: finalIndustry,
                });
                if (ideaError) throw ideaError;
            } else {
                const { data: idea, error: ideaError } = await createIdeaListing({
                    user_id: userId,
                    title: generatedTitle,
                    one_line_description: finalDescription,
                    category: finalIndustry,
                    price: 0, // Default price
                    document_url: '',
                });
                if (ideaError) throw ideaError;
            }

            // 3. Trigger Decision Intelligence View
            // Instead of running pipeline here, we pass data to the component
            if (targetVentureId) {
                setEditVentureId(targetVentureId);
                const pipelineInput = {
                    core_idea: coreIdea, // Pass the core description to AI
                    stage,
                    industry: finalIndustry,
                    business_type: businessType,
                    payer,
                    problem_details: problemDetails,
                    required_problems: requiredProblems
                };

                // End submission phase, start analysis phase
                setIsSubmitting(false);
                setIsSuccess(true);
                setLoading(true); // Start Analysis Loading
                setAnalysisProgress("Initializing AI Agents...");

                try {
                    // NEW: Run Analysis with Progress Tracking
                    const result = await analyzeIdea(
                        pipelineInput,
                        // @ts-ignore
                        pipelineInput.required_problems || [],
                        (stage) => setAnalysisProgress(stage)
                    );

                    setAnalysisResult({
                        input: pipelineInput,
                        output: result
                    });
                    setIsAnalysisReady(true);
                    setLoading(false);

                    // AUTOMATIC UPLOAD: Save JSON to Storage & DB
                    try {
                        const jsonString = JSON.stringify({ input: pipelineInput, output: result }, null, 2);
                        const blob = new Blob([jsonString], { type: 'application/json' });
                        const file = new File([blob], `analysis_${targetVentureId}.json`, { type: 'application/json' });

                        // Upload
                        const { data: uploadData, error: uploadError } = await import('../services/database').then(m => m.uploadDocument(file, userId, 'documents'));

                        if (uploadData && editIdeaId) {
                            // Update Listing
                            await updateIdeaListing(editIdeaId, { document_url: uploadData.url });
                            console.log("Analysis saved to DB:", uploadData.url);
                        }
                    } catch (uploadErr) {
                        console.error("Auto-save failed:", uploadErr);
                    }

                } catch (error) {
                    console.error("Analysis Failed:", error);
                    setAnalysisProgress("Analysis failed. Please try again.");
                    setLoading(false);


                }
            }


        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to submit venture");
            setIsSubmitting(false);
        }
    };



    const handleDownloadReport = () => {
        if (!analysisResult) return;

        // Mark as downloaded so exit warning is disabled
        setHasDownloaded(true);

        // Download Input
        const date = new Date().toISOString().split('T')[0];
        try {
            const inputBlob = new Blob([JSON.stringify(analysisResult.input, null, 2)], { type: 'text/plain' });
            const inputUrl = URL.createObjectURL(inputBlob);
            const a = document.createElement('a');
            a.href = inputUrl;
            a.download = `idea_input_${date}.txt`;
            a.click();
            URL.revokeObjectURL(inputUrl);

            // Download HTML Report
            setTimeout(() => {
                const htmlContent = generateHtmlReport(analysisResult.output);
                const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                const htmlUrl = URL.createObjectURL(htmlBlob);
                const b = document.createElement('a');
                b.href = htmlUrl;
                b.download = `idea_analysis_${date}.html`;
                b.click();
                URL.revokeObjectURL(htmlUrl);
            }, 1000);

            // Download PDF Report
            setTimeout(async () => {
                try {
                    const htmlContent = generateHtmlReport(analysisResult.output);
                    const response = await fetch('/api/generate-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ html: htmlContent }),
                    });

                    if (!response.ok) throw new Error('PDF generation failed');

                    const pdfBlob = await response.blob();
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const c = document.createElement('a');
                    c.href = pdfUrl;
                    c.download = `idea_analysis_${date}.pdf`;
                    c.click();
                    URL.revokeObjectURL(pdfUrl);
                } catch (pdfErr) {
                    console.error("PDF download failed", pdfErr);
                }
            }, 2500);
        } catch (e) {
            console.error("Download failed", e);
            alert("Download failed. Please check console.");
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isStep1Valid = coreIdea && stage && industry && (industry !== 'Other' || otherIndustry) && businessType && payer;

    // --- Renderers ---

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-[#22C55E]">
                            1
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Identification {isEditing && <span className="text-xs text-green-500 ml-2 font-mono">(EDIT MODE)</span>}</h2>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <Label required>Describe your core idea</Label>
                            <AutoResizeTextarea
                                value={coreIdea}
                                onChange={(e) => setCoreIdea(e.target.value)}
                                placeholder="e.g., A platform for sharing surplus food with neighbors..."
                                className="w-full min-h-[100px] bg-black/40 border border-zinc-800 rounded-2xl p-6 text-base text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-[#22C55E]/30 leading-relaxed"
                            />
                        </div>

                        <div>
                            <Label required>What stage is your business in?</Label>
                            <CustomSelect value={stage} onChange={setStage} options={STAGES} placeholder="Choose stage..." />
                        </div>

                        <div>
                            <Label required>Which industry best fits your business?</Label>
                            <CustomSelect value={industry} onChange={setIndustry} options={INDUSTRIES} placeholder="Choose industry..." />
                            <AnimatePresence>
                                {industry === 'Other' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4"
                                    >
                                        <input
                                            type="text"
                                            value={otherIndustry}
                                            onChange={(e) => setOtherIndustry(e.target.value)}
                                            placeholder="Please specify your industry"
                                            className="w-full bg-black/40 border border-zinc-800 rounded-xl px-6 py-4 text-sm text-white focus:border-[#22C55E]/50 outline-none transition-all placeholder:text-zinc-600"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <Label required>What are you selling?</Label>
                                <CustomSelect value={businessType} onChange={setBusinessType} options={BUSINESS_TYPES} placeholder="SaaS, Product..." />
                            </div>
                            <div>
                                <Label required>Who pays you?</Label>
                                <CustomSelect value={payer} onChange={setPayer} options={PAYERS} placeholder="Consumers..." />
                            </div>
                        </div>
                    </div>
                </motion.div>
            );
        }

        if (currentStep === 2) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-[#22C55E]">
                            2
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Analysis Scope</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {problemList.map((prob) => (
                            <ToggleOption
                                key={prob}
                                label={prob}
                                required={!!requiredProblems[prob]}
                                onChange={(val) => handleToggleProblem(prob, val)}
                            />
                        ))}
                    </div>
                </motion.div>
            );
        }

        const detailStepIndex = currentStep - 3;
        const currentProblem = selectedProblemSteps[detailStepIndex];

        if (currentProblem) {
            return (
                <motion.div
                    key={currentProblem}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-[#22C55E]">
                            {currentStep}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{currentProblem}</h2>
                    </div>

                    <section>
                        <Label required>What problem are you facing in this area?</Label>
                        <AutoResizeTextarea
                            value={problemDetails[currentProblem] || ''}
                            onChange={(e) => setProblemDetails(prev => ({ ...prev, [currentProblem]: e.target.value }))}
                            placeholder="Elaborate on the challenges, roadblocks, or needs..."
                            className="w-full min-h-[160px] bg-black/40 border border-zinc-800 rounded-2xl p-6 text-base text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-[#22C55E]/30 leading-relaxed"
                        />
                    </section>
                </motion.div>
            );
        }

        return null;
    };

    if (isSubmitting) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative bg-zinc-950 px-4">
                <div className="text-white">Creating Venture Record...</div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative bg-zinc-950 px-4 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />

                {loading ? (
                    // LOADING STATE
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700 relative z-10">
                        <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 border-t-2 border-[#22C55E] rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-r-2 border-blue-500 rounded-full animate-spin reverse"></div>
                            <div className="absolute inset-4 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                        </div>
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#22C55E] via-blue-500 to-purple-500 mb-4">
                            Analyzing Your Vision
                        </h3>
                        <div className="text-zinc-400 text-lg animate-pulse font-mono bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
                            {analysisProgress}
                        </div>

                        {showVideo && (
                            <div className="mt-12 animate-in fade-in zoom-in duration-500">
                                <div className="text-zinc-500 text-sm mb-4">While you wait, enjoy this tune...</div>
                                <iframe
                                    width="560"
                                    height="315"
                                    src="https://www.youtube.com/embed/Ikuy_izf_Bo?autoplay=1&si=lZJ36enXIPimPRjQ"
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="rounded-xl border-2 border-zinc-800 shadow-[0_0_60px_rgba(34,211,238,0.2)]"
                                ></iframe>
                            </div>
                        )}
                    </div>
                ) : isAnalysisReady ? (
                    // DOWNLOAD STATE
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500 relative z-10 max-w-lg">
                        <div className="w-24 h-24 bg-[#22C55E]/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                            <CheckIcon className="w-12 h-12 text-[#22C55E]" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6">Analysis Complete!</h2>
                        <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                            Your strategic report is ready. It includes market research, competitor analysis, and an execution roadmap.
                        </p>

                        <button
                            onClick={handleDownloadReport}
                            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#22C55E] text-black text-xl font-bold rounded-2xl hover:bg-[#1eb054] shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all transform hover:scale-[1.02]"
                        >
                            <ArrowDownTrayIcon className="w-6 h-6 stroke-[2.5]" />
                            Download Intelligence Report
                        </button>

                        <div className="mt-8 flex items-center gap-2 text-yellow-500/80 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/20">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Please download before closing this tab.</span>
                        </div>
                    </div>
                ) : (
                    // FALLBACK SUCCESS (Should generally not reach here if analysis runs)
                    <div className="text-white">Analysis Data Missing.</div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full lg:w-[85%] xl:w-[75%] mx-auto px-4 sm:px-8 transition-all duration-500">
            {/* Header Header */}
            <div className="flex items-center justify-between mb-8 px-2 sm:px-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Cancel
                </button>

                <div className="text-[#22C55E] font-mono text-xs font-bold tracking-widest">
                    STEP {currentStep} OF {totalSteps}
                </div>
            </div>

            {/* Card Container */}
            <div className="bg-[#111111]/60 border border-zinc-800/50 rounded-2xl relative overflow-hidden backdrop-blur-xl">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800">
                    <motion.div
                        className="h-full bg-[#22C55E]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="p-8 sm:p-12 md:p-20">
                    <AnimatePresence mode="wait">
                        <div key={currentStep} className="w-full">
                            {renderStepContent()}
                        </div>
                    </AnimatePresence>

                    {/* Card Footer */}
                    <div className="mt-16 flex items-center justify-between pt-8 border-t border-zinc-800/50">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`
                                text-sm font-medium transition-colors
                                ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-zinc-500 hover:text-white'}
                            `}
                        >
                            Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={currentStep === 1 && !isStep1Valid}
                            className={`
                                flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-sm transition-all
                                ${currentStep === 1 && !isStep1Valid
                                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'bg-[#22C55E] text-black hover:bg-[#1eb054] shadow-[0_0_30px_rgba(34,197,94,0.15)]'
                                }
                            `}
                        >
                            {currentStep === totalSteps ? (isEditing ? 'Update & Analyze' : 'Finish & Analyze') : 'Next Step'}
                            <ChevronRightIcon className="w-4 h-4 stroke-[3]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
