/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Solution Comparison Component (Ant Design + AntV)
 */

import React, { useState } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    Radio,
    Typography,
    Tag,
    Space,
    Divider,
    Table,
    Badge
} from 'antd';
import {
    RocketOutlined,
    DollarOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { Column, Bar, Radar } from '@ant-design/charts';
import { motion } from 'framer-motion';
import { SolutionApproach } from '../types/decisionIntelligence';

const { Title, Text, Paragraph } = Typography;

interface SolutionComparisonProps {
    solutions: SolutionApproach[];
    onSelectSolution?: (solutionId: string) => void;
    selectedId?: string | null;
}

export default function SolutionComparison({
    solutions,
    onSelectSolution,
    selectedId
}: SolutionComparisonProps) {

    const [filter, setFilter] = useState<'all' | 'human_expertise_driven' | 'technology_driven' | 'capital_driven'>('all');
    const [viewMode, setViewMode] = useState<'cards' | 'table' | 'charts'>('cards');

    const filteredSolutions = filter === 'all'
        ? solutions
        : solutions.filter(s => s.category === filter);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'human_expertise_driven': return 'green';
            case 'technology_driven': return 'gold';
            case 'capital_driven': return 'red';
            default: return 'blue';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'success';
            case 'medium': return 'warning';
            case 'high': return 'error';
            default: return 'default';
        }
    };

    // Prepare data for charts
    const capitalChartData = filteredSolutions.flatMap(s => [
        { name: s.name, type: 'Min', value: s.capital_required.min },
        { name: s.name, type: 'Max', value: s.capital_required.max }
    ]);

    const timelineChartData = filteredSolutions.flatMap(s => [
        { name: s.name, type: 'Min', value: s.time_to_market.min_months },
        { name: s.name, type: 'Max', value: s.time_to_market.max_months }
    ]);

    const radarChartData = filteredSolutions.flatMap(s => [
        { name: s.name, metric: 'Speed', value: 100 - (s.time_to_market.max_months / 24 * 100) },
        { name: s.name, metric: 'Capital Efficiency', value: 100 - (s.capital_required.max / 300000 * 100) },
        { name: s.name, metric: 'Low Risk', value: s.risk_level === 'low' ? 100 : s.risk_level === 'medium' ? 60 : 30 },
        { name: s.name, metric: 'Proven Success', value: (s.proven_examples.length / 5) * 100 },
        { name: s.name, metric: 'Scalability', value: s.category === 'technology_driven' ? 95 : s.category === 'capital_driven' ? 80 : 50 }
    ]);

    return (
        <div>
            <Card
                className="premium-card"
                title={
                    <Space>
                        <RocketOutlined style={{ color: '#52c41a' }} />
                        <Title level={3} style={{ margin: 0, color: '#fff' }}>Solution Approaches</Title>
                    </Space>
                }
                extra={
                    <Space>
                        <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
                            <Radio.Button value="cards">Cards</Radio.Button>
                            <Radio.Button value="charts">Charts</Radio.Button>
                            <Radio.Button value="table">Table</Radio.Button>
                        </Radio.Group>
                    </Space>
                }
                style={{ marginBottom: 24 }}
            >
                <Paragraph style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)' }}>
                    Multiple strategies tailored to your resources and constraints
                </Paragraph>

                {/* Filters */}
                <Space style={{ marginBottom: 24 }} wrap>
                    <Button
                        type={filter === 'all' ? 'primary' : 'default'}
                        onClick={() => setFilter('all')}
                        ghost
                    >
                        All Approaches ({solutions.length})
                    </Button>
                    <Button
                        type={filter === 'human_expertise_driven' ? 'primary' : 'default'}
                        onClick={() => setFilter('human_expertise_driven')}
                        ghost
                    >
                        Human Expertise
                    </Button>
                    <Button
                        type={filter === 'technology_driven' ? 'primary' : 'default'}
                        onClick={() => setFilter('technology_driven')}
                        ghost
                    >
                        Technology Driven
                    </Button>
                    <Button
                        type={filter === 'capital_driven' ? 'primary' : 'default'}
                        onClick={() => setFilter('capital_driven')}
                        ghost
                    >
                        Capital Driven
                    </Button>
                </Space>

                {/* Cards View */}
                {viewMode === 'cards' && (
                    <Row gutter={[16, 16]}>
                        {filteredSolutions.map((solution, index) => (
                            <Col xs={24} md={12} lg={8} key={solution.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card
                                        hoverable
                                        className="premium-card"
                                        style={{
                                            height: '100%',
                                            border: selectedId === solution.id ? '2px solid #52c41a' : undefined
                                        }}
                                    >
                                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                            {/* Header */}
                                            <div>
                                                <Title level={4} style={{ marginBottom: 8 }}>
                                                    {solution.name}
                                                </Title>
                                                <Tag color={getCategoryColor(solution.category)}>
                                                    {solution.category.replace('_', ' ').toUpperCase()}
                                                </Tag>
                                            </div>

                                            {/* Capital */}
                                            <div>
                                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                                                    <DollarOutlined /> Capital Required
                                                </Text>
                                                <Title level={5} style={{ margin: '4px 0', color: '#fff' }}>
                                                    ${solution.capital_required.min.toLocaleString()} - ${solution.capital_required.max.toLocaleString()}
                                                </Title>
                                            </div>

                                            {/* Timeline */}
                                            <div>
                                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                                                    <ClockCircleOutlined /> Time to Market
                                                </Text>
                                                <Title level={5} style={{ margin: '4px 0', color: '#fff' }}>
                                                    {solution.time_to_market.min_months} - {solution.time_to_market.max_months} months
                                                </Title>
                                            </div>

                                            {/* Risk */}
                                            <div>
                                                <Badge
                                                    status={getRiskColor(solution.risk_level) as any}
                                                    text={`${solution.risk_level.toUpperCase()} RISK`}
                                                />
                                            </div>

                                            {/* Team Size */}
                                            <div>
                                                <Text type="secondary">
                                                    <TeamOutlined /> Team Size: <strong>{solution.resource_requirements.team_size}</strong>
                                                </Text>
                                            </div>

                                            {/* Phases */}
                                            <Divider style={{ margin: '8px 0' }} />
                                            <div>
                                                <Text strong>{solution.phases.length} Phases:</Text>
                                                <div style={{ marginTop: 8 }}>
                                                    {solution.phases.map((phase, i) => (
                                                        <Tag key={i} style={{ marginBottom: 4 }}>
                                                            {i + 1}. {phase.name}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Proven Examples */}
                                            {solution.proven_examples.length > 0 && (
                                                <div>
                                                    <Badge
                                                        count={solution.proven_examples.length}
                                                        style={{ backgroundColor: '#52c41a' }}
                                                    >
                                                        <Text>
                                                            <CheckCircleOutlined /> Proven Examples
                                                        </Text>
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Why This Approach */}
                                            <div>
                                                <Text strong style={{ color: '#fff' }}>Why This Approach?</Text>
                                                <Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 8, color: 'rgba(255,255,255,0.85)' }}>
                                                    {solution.why_this_approach}
                                                </Paragraph>
                                            </div>

                                            {/* Action Button */}
                                            <Button
                                                type="primary"
                                                block
                                                icon={<ArrowRightOutlined />}
                                                onClick={() => onSelectSolution && onSelectSolution(solution.id)}
                                            >
                                                View Detailed Roadmap
                                            </Button>
                                        </Space>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Charts View */}
                {viewMode === 'charts' && (
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Card title="Capital Requirements Comparison" bordered={false}>
                                <Bar
                                    data={capitalChartData}
                                    xField="value"
                                    yField="name"
                                    seriesField="type"
                                    isGroup={true}
                                    color={['#52c41a', '#faad14']}
                                    legend={{ position: 'top-right' }}
                                    label={{
                                        position: 'right',
                                        formatter: (datum: any) => `$${datum.value.toLocaleString()}`
                                    }}
                                />
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card title="Timeline Comparison" bordered={false}>
                                <Column
                                    data={timelineChartData}
                                    xField="name"
                                    yField="value"
                                    seriesField="type"
                                    isGroup={true}
                                    color={['#1890ff', '#fa8c16']}
                                    legend={{ position: 'top-right' }}
                                    label={{
                                        position: 'top',
                                        formatter: (datum: any) => `${datum.value}mo`
                                    }}
                                />
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card title="Multi-Dimensional Comparison" bordered={false}>
                                <Radar
                                    data={radarChartData}
                                    xField="metric"
                                    yField="value"
                                    seriesField="name"
                                    color={['#52c41a', '#faad14', '#f5222d']}
                                    area={{}}
                                    point={{
                                        size: 3
                                    }}
                                    legend={{ position: 'bottom' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                    <Table
                        dataSource={filteredSolutions}
                        rowKey="id"
                        pagination={false}
                        columns={[
                            {
                                title: 'Approach',
                                dataIndex: 'name',
                                key: 'name',
                                render: (name, record) => (
                                    <Space>
                                        <Text strong>{name}</Text>
                                        <Tag color={getCategoryColor(record.category)}>
                                            {record.category}
                                        </Tag>
                                    </Space>
                                )
                            },
                            {
                                title: 'Capital',
                                key: 'capital',
                                render: (_, record) => (
                                    <Text>
                                        ${record.capital_required.min.toLocaleString()} - ${record.capital_required.max.toLocaleString()}
                                    </Text>
                                )
                            },
                            {
                                title: 'Timeline',
                                key: 'timeline',
                                render: (_, record) => (
                                    <Text>
                                        {record.time_to_market.min_months}-{record.time_to_market.max_months} mo
                                    </Text>
                                )
                            },
                            {
                                title: 'Risk',
                                dataIndex: 'risk_level',
                                key: 'risk',
                                render: (risk) => (
                                    <Badge status={getRiskColor(risk) as any} text={risk.toUpperCase()} />
                                )
                            },
                            {
                                title: 'Team',
                                key: 'team',
                                render: (_, record) => record.resource_requirements.team_size
                            },
                            {
                                title: 'Proven',
                                key: 'proven',
                                render: (_, record) => (
                                    <Badge
                                        count={record.proven_examples.length}
                                        style={{ backgroundColor: '#52c41a' }}
                                    />
                                )
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                render: (_, record) => (
                                    <Button
                                        type="link"
                                        onClick={() => onSelectSolution && onSelectSolution(record.id)}
                                    >
                                        View Roadmap
                                    </Button>
                                )
                            }
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
