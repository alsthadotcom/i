/**
 * Example Integration of Decision Intelligence Component
 * 
 * This file shows how to integrate the Decision Intelligence component
 * into your existing SellIdea workflow or create a standalone page.
 */

import React, { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import DecisionIntelligence from '../components/DecisionIntelligence';
import '../components/DecisionIntelligence.css';

// Example 1: Standalone Decision Intelligence Page
export function DecisionIntelligencePage() {
    const [ventureId] = useState('test-venture-id');

    const sampleVentureData = {
        stage: 'idea',
        industry: 'Technology',
        business_type: 'SaaS',
        payer: 'B2B',
        problem_details: {
            problem: 'Small businesses struggle with inventory management',
            target_customer: 'Small retail stores with 1-10 employees',
            current_solution: 'Excel spreadsheets and manual tracking'
        },
        solution_details: {
            solution: 'AI-powered inventory management SaaS',
            key_features: ['Real-time tracking', 'Demand forecasting', 'Automated ordering']
        },
        market_details: {
            market_size: 'Unknown',
            competitors: ['Traditional POS systems'],
            competitive_advantage: 'AI-powered predictions'
        }
    };

    const handleComplete = (result: any) => {
        console.log('Decision Intelligence Analysis Complete:', result);
        // Navigate to results page or show success message
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#00ff88',
                    colorSuccess: '#52c41a',
                    colorWarning: '#faad14',
                    colorError: '#f5222d',
                    borderRadius: 8,
                },
            }}
        >
            <div style={{ minHeight: '100vh', background: '#09090b', padding: '40px 20px' }}>
                <DecisionIntelligence
                    ventureId={ventureId}
                    ventureData={sampleVentureData}
                    onComplete={handleComplete}
                />
            </div>
        </ConfigProvider>
    );
}

// Example 2: Integration with SellIdea Component
export function SellIdeaWithDecisionIntelligence() {
    const [showDecisionIntelligence, setShowDecisionIntelligence] = useState(false);
    const [ventureId, setVentureId] = useState<string | null>(null);
    const [ventureData, setVentureData] = useState<any>(null);

    const handleFormSubmit = async (formData: any) => {
        // 1. Save venture to database
        // const { data } = await saveVenture(formData);
        const mockVentureId = 'venture-123';

        // 2. Set venture data and show Decision Intelligence
        setVentureId(mockVentureId);
        setVentureData(formData);
        setShowDecisionIntelligence(true);
    };

    const handleDecisionIntelligenceComplete = (result: any) => {
        console.log('Analysis complete:', result);
        // Navigate to venture dashboard or show results
    };

    return (
        <div>
            {!showDecisionIntelligence ? (
                <div>
                    {/* Your existing SellIdea form */}
                    <h1>Submit Your Idea</h1>
                    <button onClick={() => handleFormSubmit({
                        stage: 'idea',
                        industry: 'Technology',
                        // ... form fields
                    })}>
                        Submit & Analyze
                    </button>
                </div>
            ) : (
                ventureId && ventureData && (
                    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
                        <DecisionIntelligence
                            ventureId={ventureId}
                            ventureData={ventureData}
                            onComplete={handleDecisionIntelligenceComplete}
                        />
                    </ConfigProvider>
                )
            )}
        </div>
    );
}

// Example 3: Modal Integration
import { Modal, Button } from 'antd';

export function VentureDashboardWithAnalysis() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVenture, setSelectedVenture] = useState<any>(null);

    const handleAnalyzeVenture = (venture: any) => {
        setSelectedVenture(venture);
        setIsModalOpen(true);
    };

    return (
        <div>
            <h1>Your Ventures</h1>
            {/* List of ventures */}
            <Button
                type="primary"
                onClick={() => handleAnalyzeVenture({ id: '123', /* data */ })}
            >
                Run Decision Intelligence Analysis
            </Button>

            <Modal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                width="95%"
                footer={null}
                style={{ top: 20 }}
            >
                {selectedVenture && (
                    <DecisionIntelligence
                        ventureId={selectedVenture.id}
                        ventureData={selectedVenture}
                        onComplete={(result) => {
                            console.log('Analysis complete:', result);
                            setIsModalOpen(false);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}

// Example 4: Custom ConfigProvider Theme
export function CustomThemedDecisionIntelligence() {
    return (
        <ConfigProvider
            theme={{
                // Light mode option
                algorithm: theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#00ff88',
                    colorBgBase: '#ffffff',
                    borderRadius: 12,
                    fontSize: 14,
                },
                components: {
                    Card: {
                        borderRadiusLG: 16,
                    },
                    Button: {
                        borderRadius: 8,
                        controlHeight: 40,
                    },
                },
            }}
        >
            <DecisionIntelligencePage />
        </ConfigProvider>
    );
}

// Example 5: With Error Handling
export function DecisionIntelligenceWithErrorHandling() {
    const [error, setError] = useState<string | null>(null);

    const handleError = (err: Error) => {
        setError(err.message);
        console.error('Decision Intelligence Error:', err);
    };

    return (
        <div>
            {error && (
                <div style={{
                    padding: '16px',
                    background: '#ff4444',
                    color: 'white',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    Error: {error}
                </div>
            )}

            <DecisionIntelligence
                ventureId="test-id"
                ventureData={{ /* ... */ }}
                onComplete={(result) => console.log(result)}
            />
        </div>
    );
}

export default DecisionIntelligencePage;
