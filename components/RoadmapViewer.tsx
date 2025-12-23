/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Roadmap Viewer Component (Ant Design + Mermaid)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    Timeline,
    Collapse,
    Row,
    Col,
    Tag,
    Typography,
    Space,
    Divider,
    List,
    Badge,
    Button
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    TeamOutlined,
    ToolOutlined,
    WarningOutlined,
    SafetyOutlined,
    RocketOutlined,
    StarOutlined,
    LinkOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { SolutionApproach } from '../types/decisionIntelligence';
import { generateRoadmapMermaid } from '../services/visualGenerator';

const { Title, Text, Paragraph, Link } = Typography;
const { Panel } = Collapse;

interface RoadmapViewerProps {
    solution: SolutionApproach;
}

export default function RoadmapViewer({ solution }: RoadmapViewerProps) {

    const [mermaidCode, setMermaidCode] = useState<string>('');
    const mermaidRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const code = generateRoadmapMermaid(solution);
        setMermaidCode(code);

        if (typeof window !== 'undefined' && (window as any).mermaid && mermaidRef.current) {
            try {
                (window as any).mermaid.initialize({ startOnLoad: false, theme: 'dark' });
                (window as any).mermaid.render('roadmap-diagram', code, (svgCode: string) => {
                    if (mermaidRef.current) {
                        mermaidRef.current.innerHTML = svgCode;
                    }
                });
            } catch (error) {
                console.warn('Mermaid rendering failed:', error);
            }
        }
    }, [solution]);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'success';
            case 'medium': return 'warning';
            case 'high': return 'error';
            default: return 'default';
        }
    };

    return (
        <div style={{ padding: '24px 0' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <RocketOutlined /> {solution.name} Roadmap
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 16 }}>
                    Based on {solution.proven_examples.length} proven case studies
                </Paragraph>
                <Space wrap>
                    <Tag color={getRiskColor(solution.risk_level)} icon={<WarningOutlined />}>
                        {solution.risk_level} Risk
                    </Tag>
                    <Tag color="blue" icon={<ClockCircleOutlined />}>
                        {solution.time_to_market.min_months}-{solution.time_to_market.max_months} months
                    </Tag>
                    <Tag color="gold" icon={<DollarOutlined />}>
                        ${solution.capital_required.min.toLocaleString()}-${solution.capital_required.max.toLocaleString()}
                    </Tag>
                </Space>
            </div>

            {/* Mermaid Diagram */}
            {mermaidCode && (
                <Card style={{ marginBottom: 24, background: '#001529' }}>
                    <div ref={mermaidRef} />
                </Card>
            )}

            {/* Timeline */}
            <Card title="Detailed Timeline" style={{ marginBottom: 24 }}>
                <Timeline mode="left">
                    {solution.phases.map((phase, index) => (
                        <Timeline.Item
                            key={index}
                            dot={<ClockCircleOutlined style={{ fontSize: 16 }} />}
                            color="green"
                        >
                            <Card type="inner" size="small">
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Title level={4} style={{ margin: 0 }}>
                                            Phase {index + 1}: {phase.name}
                                        </Title>
                                        <Tag>{phase.duration}</Tag>
                                    </Col>
                                    <Col>
                                        <Text strong style={{ fontSize: 18 }}>
                                            ${phase.estimated_cost.toLocaleString()}
                                        </Text>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '12px 0' }} />

                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Text strong>Milestones:</Text>
                                        <List
                                            size="small"
                                            dataSource={phase.milestones}
                                            renderItem={item => (
                                                <List.Item>
                                                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                                    {item}
                                                </List.Item>
                                            )}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Text strong>Deliverables:</Text>
                                        <List
                                            size="small"
                                            dataSource={phase.deliverables}
                                            renderItem={item => (
                                                <List.Item>
                                                    <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                                                    {item}
                                                </List.Item>
                                            )}
                                        />
                                    </Col>
                                </Row>

                                {phase.sources && phase.sources.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        <Text type="secondary">Based on: </Text>
                                        {phase.sources.map((source, i) => (
                                            <Tag key={i}>{source}</Tag>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </Card>

            {/* Proven Examples */}
            <Card title="Proven Examples" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                    {solution.proven_examples.map((example, index) => (
                        <Col xs={24} md={12} lg={8} key={index}>
                            <Card type="inner" hoverable>
                                <Badge.Ribbon
                                    text={example.source_credibility}
                                    color={example.source_credibility === 'high' ? 'green' : 'gold'}
                                >
                                    <Title level={5}>{example.company_name}</Title>
                                </Badge.Ribbon>

                                <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
                                    {example.success_metrics.map((metric, i) => (
                                        <Tag key={i} color="success" icon={<StarOutlined />}>
                                            {metric}
                                        </Tag>
                                    ))}

                                    {example.case_study_url && (
                                        <Link href={example.case_study_url} target="_blank">
                                            <LinkOutlined /> Read case study
                                        </Link>
                                    )}
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* Expandable Details */}
            <Collapse accordion>
                {/* Resources */}
                <Panel
                    header={<Text strong><TeamOutlined /> Resource Requirements</Text>}
                    key="1"
                >
                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Card type="inner" size="small">
                                <Statistic title="Team Size" value={solution.resource_requirements.team_size} suffix="people" />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card type="inner" size="small">
                                <Text strong>Skills Needed:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {solution.resource_requirements.skills_needed.map((skill, i) => (
                                        <Tag key={i}>{skill}</Tag>
                                    ))}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card type="inner" size="small">
                                <Text strong>Infrastructure:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {solution.resource_requirements.infrastructure.map((infra, i) => (
                                        <Tag key={i} icon={<ToolOutlined />}>{infra}</Tag>
                                    ))}
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Panel>

                {/* Risks */}
                <Panel
                    header={<Text strong><WarningOutlined /> Risk Factors & Mitigation</Text>}
                    key="2"
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Card type="inner" size="small" title="Risk Factors">
                                <List
                                    dataSource={solution.risk_factors}
                                    renderItem={item => (
                                        <List.Item>
                                            <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                                            {item}
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card type="inner" size="small" title="Mitigation Strategies">
                                <List
                                    dataSource={solution.mitigation_strategies}
                                    renderItem={item => (
                                        <List.Item>
                                            <SafetyOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                            {item}
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Panel>
            </Collapse>
        </div>
    );
}

// Add missing Statistic component wrapper
function Statistic({ title, value, suffix }: { title: string, value: number, suffix: string }) {
    return (
        <div>
            <Text type="secondary">{title}</Text>
            <Title level={3} style={{ margin: 0 }}>
                {value} <Text type="secondary" style={{ fontSize: 14 }}>{suffix}</Text>
            </Title>
        </div>
    );
}
