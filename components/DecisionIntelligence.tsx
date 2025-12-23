/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Decision Intelligence Main Component (Ant Design)
 */

import React, { useState, useEffect } from 'react';
import {
    Steps,
    Card,
    Row,
    Col,
    Button,
    Badge,
    Typography,
    Tag,
    Spin,
    Modal,
    Divider,
    Space,
    Layout,
    Breadcrumb,
    Progress,
    ConfigProvider,
    theme
} from 'antd';
import {
    CheckCircleOutlined,
    LoadingOutlined,
    ClockCircleOutlined,
    RocketOutlined,
    SearchOutlined,
    CheckOutlined,
    BuildOutlined,
    FileSearchOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { runDecisionPipeline } from '../services/decisionIntelligence';
import { saveDecisionIntelligenceAnalysis, saveResearchSources } from '../services/databaseDI';
import { DecisionIntelligenceOutput, PipelineLog } from '../types/decisionIntelligence';

import SolutionComparison from './SolutionComparison';
import RoadmapViewer from './RoadmapViewer';
import ProofDisplay from './ProofDisplay';

const { Title, Paragraph, Text } = Typography;

interface DecisionIntelligenceProps {
    ventureId: string;
    ventureData: any;
    onComplete?: (analysis: DecisionIntelligenceOutput) => void;
}

export default function DecisionIntelligence({
    ventureId,
    ventureData,
    onComplete
}: DecisionIntelligenceProps) {

    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<PipelineLog[]>([]);
    const [result, setResult] = useState<DecisionIntelligenceOutput | null>(null);
    const [currentStage, setCurrentStage] = useState<number>(0);
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [showRoadmap, setShowRoadmap] = useState(false);
    const [showProof, setShowProof] = useState(false);

    useEffect(() => {
        startPipeline();
    }, []);

    const startPipeline = async () => {
        setIsRunning(true);
        setLogs([]);
        setResult(null);

        try {
            const output = await runDecisionPipeline(ventureData, (log: PipelineLog) => {
                setLogs(prev => [...prev, log]);
                setCurrentStage(log.stage);
            });

            setResult(output);

            const { data: analysisData } = await saveDecisionIntelligenceAnalysis(ventureId, output);

            if (analysisData) {
                await saveResearchSources(analysisData.analysis_id, output.research_dossier.all_sources);
            }

            if (onComplete) {
                onComplete(output);
            }
        } catch (error) {
            console.error('Pipeline failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSelectSolution = (solutionId: string) => {
        setSelectedSolutionId(solutionId);
        setShowRoadmap(true);
    };

    const selectedSolution = result?.solution_approaches.find(s => s.id === selectedSolutionId);

    // Get current step for Ant Design Steps
    const getCurrentStep = () => {
        if (currentStage === 0) return 0;
        if (currentStage <= 1) return 0;
        if (currentStage === 2) return 1;
        if (currentStage === 3) return 2;
        return 3;
    };

    const getStepStatus = (stage: number) => {
        const stageLogs = logs.filter(l => l.stage === stage);
        const lastLog = stageLogs[stageLogs.length - 1];
        if (!lastLog) return 'wait';
        if (lastLog.status === 'completed') return 'finish';
        if (lastLog.status === 'processing') return 'process';
        if (lastLog.status === 'error') return 'error';
        return 'wait';
    };

    const { Sider, Content } = Layout;

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#52c41a',
                    colorBgBase: '#111114',
                    borderRadius: 8,
                },
            }}
        >
            <div className="di-dashboard-wrapper">
                <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
                    {/* Left Sidebar - Pipeline Progress */}
                    <Sider
                        width={320}
                        className="di-sidebar"
                        breakpoint="lg"
                        collapsedWidth="0"
                    >
                        <div style={{ padding: '0 8px 32px 8px' }}>
                            <Title level={4} style={{ color: '#fff', marginBottom: 4 }}>
                                <RocketOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                                Decision Pipeline
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Strategic problem-solving engine
                            </Text>
                        </div>

                        <Title level={4} style={{ color: '#fff', marginBottom: 24 }}>Strategic Problem Solving Pipeline</Title>
                        <Steps
                            direction="vertical"
                            current={getCurrentStep()}
                            items={[
                                {
                                    title: 'Constraint Mapper',
                                    description: 'GPT-4.1',
                                    status: getStepStatus(1) as any,
                                    icon: getStepStatus(1) === 'process' ? <LoadingOutlined /> :
                                        getStepStatus(1) === 'finish' ? <CheckCircleOutlined /> :
                                            <ClockCircleOutlined />
                                },
                                {
                                    title: 'Solution Researcher',
                                    description: 'Perplexity Sonar',
                                    status: getStepStatus(2) as any,
                                    icon: getStepStatus(2) === 'process' ? <LoadingOutlined /> :
                                        getStepStatus(2) === 'finish' ? <CheckCircleOutlined /> :
                                            <ClockCircleOutlined />
                                },
                                {
                                    title: 'Decision Auditor',
                                    description: 'Gemini 2.5 Pro',
                                    status: getStepStatus(3) as any,
                                    icon: getStepStatus(3) === 'process' ? <LoadingOutlined /> :
                                        getStepStatus(3) === 'finish' ? <CheckCircleOutlined /> :
                                            <ClockCircleOutlined />
                                },
                                {
                                    title: 'Strategic Architect',
                                    description: 'GPT-5.1',
                                    status: getStepStatus(4) as any,
                                    icon: getStepStatus(4) === 'process' ? <LoadingOutlined /> :
                                        getStepStatus(4) === 'finish' ? <CheckCircleOutlined /> :
                                            <ClockCircleOutlined />
                                }
                            ]}
                        />

                        {isRunning && (
                            <div style={{ marginTop: 40, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                <Space direction="vertical" size="small">
                                    <Text style={{ color: '#52c41a', fontSize: 12 }} strong>CURRENT LOG:</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                                        {logs[logs.length - 1]?.message || 'Initializing...'}
                                    </Text>
                                </Space>
                            </div>
                        )}
                    </Sider>

                    {/* Main Content Area */}
                    <Layout style={{ marginLeft: 320, background: 'transparent' }}>
                        <Content className="di-content-area">
                            {/* Header / Breadcrumbs */}
                            <div style={{ marginBottom: 32 }}>
                                <Breadcrumb
                                    items={[
                                        { title: 'Home' },
                                        { title: 'Decision Intelligence' },
                                        { title: 'Strategic Analysis' }
                                    ]}
                                    style={{ marginBottom: 16 }}
                                />
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Title level={2} style={{ margin: '16px 0', color: '#fff' }}>
                                            Decision Support: {ventureData?.title || 'Operational Strategy'}
                                        </Title>
                                    </Col>
                                    <Col>
                                        <Space>
                                            <Button ghost icon={<CheckOutlined />} onClick={() => setShowProof(true)}>Verify Sources</Button>
                                            <Button type="primary" icon={< RocketOutlined />} onClick={startPipeline} loading={isRunning}>Re-Run Pipeline</Button>
                                        </Space>
                                    </Col>
                                </Row>
                            </div>

                            {!result && isRunning && (
                                <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48, color: '#52c41a' }} spin />} />
                                    <Title level={4} style={{ marginTop: 24, color: 'rgba(255,255,255,0.45)' }}>
                                        Generating Deep Decision Intelligence...
                                    </Title>
                                </div>
                            )}

                            {result && (
                                <div className="dashboard-grid">
                                    {/* TOP ROW: EXECUTIVE SUMMARY & KEY INSIGHTS */}
                                    <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                                        <Col xs={24} lg={16}>
                                            <Card className="premium-card" style={{ height: '100%' }}>
                                                <Row gutter={32}>
                                                    <Col span={6} className="credibility-gauge-container">
                                                        <Progress
                                                            type="circle"
                                                            percent={result.validation_analysis.credibility_assessment.overall_score}
                                                            strokeColor={{
                                                                '0%': '#108ee9',
                                                                '100%': '#52c41a',
                                                            }}
                                                            width={120}
                                                        />
                                                        <div className="gauge-label">
                                                            <Text strong style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>STRATEGIC CONFIDENCE</Text>
                                                            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{result.validation_analysis.credibility_assessment.overall_score}%</Title>
                                                        </div>
                                                    </Col>
                                                    <Col span={18}>
                                                        <Title level={3} style={{ color: '#fff', marginBottom: 16 }}>Executive Execution Summary</Title>
                                                        <Paragraph style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: '1.6' }}>
                                                            {result.executive_summary}
                                                        </Paragraph>
                                                        <Row gutter={16} style={{ marginTop: 24 }}>
                                                            <Col span={8}>
                                                                <Text type="secondary" style={{ display: 'block' }}>Market Size</Text>
                                                                <Text strong className="metric-highlight" style={{ display: 'block' }}>{result.research_dossier.market_analysis.market_size}</Text>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Text type="secondary" style={{ display: 'block' }}>Growth Rate</Text>
                                                                <Text strong className="metric-highlight" style={{ display: 'block' }}>{result.research_dossier.market_analysis.growth_rate}</Text>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Text type="secondary" style={{ display: 'block' }}>Proven Methods</Text>
                                                                <Text strong className="metric-highlight" style={{ display: 'block' }}>{result.research_dossier.proven_methods.length}</Text>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        </Col>

                                        <Col xs={24} lg={8}>
                                            <Card title="Key Strategic Insights" className="premium-card" style={{ height: '100%' }}>
                                                {result.key_insights.map((insight, i) => (
                                                    <div key={i} className="insight-item">
                                                        <CheckCircleOutlined className="insight-icon" />
                                                        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{insight}</Text>
                                                    </div>
                                                ))}
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* MIDDLE ROW: SOLUTION COMPARISON AREA */}
                                    <div style={{ marginBottom: 24 }}>
                                        <SolutionComparison
                                            solutions={result.solution_approaches}
                                            onSelectSolution={handleSelectSolution}
                                            selectedId={selectedSolutionId}
                                        />
                                    </div>

                                    {/* BOTTOM ROW: ACTIONABLE NEXT STEPS */}
                                    <Row gutter={[24, 24]}>
                                        <Col span={24}>
                                            <Card title="Immediate Tactical Roadmap" className="premium-card">
                                                <Row gutter={32}>
                                                    {result.next_steps.slice(0, 3).map((step, i) => (
                                                        <Col span={8} key={i}>
                                                            <div style={{ padding: '16px', borderLeft: '4px solid #52c41a', background: 'rgba(255,255,255,0.02)' }}>
                                                                <Text type="secondary" style={{ fontSize: 11, marginBottom: 8, display: 'block' }}>PHASE {i + 1}</Text>
                                                                <Text strong style={{ fontSize: 15, color: '#fff' }}>{step}</Text>
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )}
                        </Content>
                    </Layout>
                </Layout>

                {/* Roadmap Modal */}
                <Modal
                    open={showRoadmap}
                    onCancel={() => setShowRoadmap(false)}
                    width="90%"
                    style={{ top: 20 }}
                    footer={null}
                    destroyOnHidden
                >
                    {selectedSolution && <RoadmapViewer solution={selectedSolution} />}
                </Modal>

                {/* Proof Modal */}
                <Modal
                    open={showProof}
                    onCancel={() => setShowProof(false)}
                    width="90%"
                    style={{ top: 20 }}
                    footer={null}
                    destroyOnHidden
                >
                    {result && (
                        <ProofDisplay
                            researchDossier={result.research_dossier}
                            solutions={result.solution_approaches}
                        />
                    )}
                </Modal>
            </div>
        </ConfigProvider>
    );
}
