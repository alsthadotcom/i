/**
 * @license 
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Proof Display Component (Ant Design)
 */

import React, { useState } from 'react';
import {
    Card,
    Row,
    Col,
    Radio,
    Typography,
    Tag,
    Collapse,
    List,
    Badge,
    Space,
    Divider,
    Alert
} from 'antd';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    StarOutlined,
    LinkOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { ResearchDossier, SolutionApproach, SourceType } from '../types/decisionIntelligence';

const { Title, Text, Paragraph, Link } = Typography;
const { Panel } = Collapse;

interface ProofDisplayProps {
    researchDossier: ResearchDossier;
    solutions: SolutionApproach[];
}

export default function ProofDisplay({ researchDossier, solutions }: ProofDisplayProps) {

    const [filter, setFilter] = useState<'all' | SourceType>('all');

    const allCaseStudies = solutions.flatMap(s => s.proven_examples);

    const filteredSources = filter === 'all'
        ? researchDossier.all_sources
        : researchDossier.all_sources.filter(s => s.source_type === filter);

    const sourceTypeCounts = {
        all: researchDossier.all_sources.length,
        case_study: researchDossier.all_sources.filter(s => s.source_type === 'case_study').length,
        research_paper: researchDossier.all_sources.filter(s => s.source_type === 'research_paper').length,
        industry_report: researchDossier.all_sources.filter(s => s.source_type === 'industry_report').length,
        news_article: researchDossier.all_sources.filter(s => s.source_type === 'news_article').length,
    };

    const getCredibilityColor = (credibility: string) => {
        switch (credibility) {
            case 'high': return 'success';
            case 'medium': return 'warning';
            case 'low': return 'error';
            default: return 'default';
        }
    };

    return (
        <div style={{ padding: '24px 0' }}>
            {/* Header */}
            <Title level={2}>
                <FileTextOutlined /> Evidence & Proven Methods
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16 }}>
                All sources verified for credibility and relevance
            </Paragraph>

            {/* Filters */}
            <Radio.Group
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ marginBottom: 24 }}
                buttonStyle="solid"
            >
                <Radio.Button value="all">
                    All Sources ({sourceTypeCounts.all})
                </Radio.Button>
                <Radio.Button value="case_study">
                    Case Studies ({sourceTypeCounts.case_study})
                </Radio.Button>
                <Radio.Button value="research_paper">
                    Research Papers ({sourceTypeCounts.research_paper})
                </Radio.Button>
                <Radio.Button value="industry_report">
                    Industry Reports ({sourceTypeCounts.industry_report})
                </Radio.Button>
            </Radio.Group>

            <Row gutter={[24, 24]}>
                {/* Left: Case Studies */}
                <Col xs={24} lg={14}>
                    <Card title="Featured Case Studies">
                        <Collapse accordion>
                            {allCaseStudies.slice(0, 5).map((caseStudy, index) => (
                                <Panel
                                    key={index}
                                    header={
                                        <Space>
                                            <Text strong>{caseStudy.company_name}</Text>
                                            <Badge
                                                status={getCredibilityColor(caseStudy.source_credibility) as any}
                                                text={caseStudy.source_credibility}
                                            />
                                        </Space>
                                    }
                                >
                                    {caseStudy.publication && (
                                        <Text type="secondary">
                                            Published: {caseStudy.publication}, {caseStudy.year || 'Recent'}
                                        </Text>
                                    )}

                                    <Divider style={{ margin: '12px 0' }} />

                                    <Title level={5}>Success Metrics:</Title>
                                    <Space wrap style={{ marginBottom: 16 }}>
                                        {caseStudy.success_metrics.map((metric, i) => (
                                            <Tag key={i} color="success" icon={<StarOutlined />}>
                                                {metric}
                                            </Tag>
                                        ))}
                                    </Space>

                                    {caseStudy.case_study_url && (
                                        <>
                                            <Link href={caseStudy.case_study_url} target="_blank">
                                                <LinkOutlined /> View full study
                                            </Link>
                                            <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {caseStudy.case_study_url}
                                                </Text>
                                            </div>
                                        </>
                                    )}
                                </Panel>
                            ))}
                        </Collapse>
                    </Card>
                </Col>

                {/* Right: Research Sources */}
                <Col xs={24} lg={10}>
                    <Card title="Research Sources">
                        <List
                            dataSource={filteredSources}
                            renderItem={(source, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <Badge
                                                    status={getCredibilityColor(source.credibility) as any}
                                                />
                                            }
                                            title={
                                                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                                    <Text strong>{source.title}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {source.publication} · {source.date}
                                                    </Text>
                                                </Space>
                                            }
                                            description={
                                                <div>
                                                    {source.key_insights.length > 0 && (
                                                        <Paragraph
                                                            ellipsis={{ rows: 2 }}
                                                            style={{ fontSize: 13, marginBottom: 8 }}
                                                        >
                                                            "{source.key_insights[0]}"
                                                        </Paragraph>
                                                    )}
                                                    {source.url && (
                                                        <Link href={source.url} target="_blank" style={{ fontSize: 12 }}>
                                                            <LinkOutlined /> View source
                                                        </Link>
                                                    )}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                </motion.div>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Methodology Note */}
            <Alert
                message="Methodology Note"
                description="All sources have been verified for credibility and relevance. Citations include publication date, author credentials, and relevance scores. High credibility sources include academic journals, established business publications, and verified case studies."
                type="info"
                icon={<InfoCircleOutlined />}
                showIcon
                style={{ marginTop: 24 }}
            />
        </div>
    );
}
