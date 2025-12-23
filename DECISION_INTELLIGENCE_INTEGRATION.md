# Decision Intelligence Platform - Integration Guide

## Quick Start

### 1. Import Ant Design Styles

Add to your `index.tsx` or `App.tsx`:

```typescript
import 'antd/dist/reset.css'; // Ant Design reset styles
```

### 2. Add Mermaid Script

Add to `index.html` in the `<head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({ startOnLoad: false, theme: 'dark' });
</script>
```

### 3. Use Decision Intelligence Component

```typescript
import DecisionIntelligence from './components/DecisionIntelligence';

function MyPage() {
  const ventureData = {
    stage: 'idea',
    industry: 'Technology',
    business_type: 'SaaS',
    // ... other venture fields
  };
  
  return (
    <DecisionIntelligence
      ventureId={ventureId}
      ventureData={ventureData}
      onComplete={(result) => {
       console.log('Analysis complete:', result);
      }}
    />
  );
}
```

## Database Setup

Run the SQL schema:

```bash
psql -U your_user -d your_database -f DECISION_INTELLIGENCE_SCHEMA.sql
```

Or in Supabase SQL Editor, execute:
```sql
-- Copy contents from DECISION_INTELLIGENCE_SCHEMA.sql
```

## Components Overview

### DecisionIntelligence.tsx
**Main orchestrator component**
- Displays 4-stage pipeline with Ant Design Steps
- Shows research findings in Cards
- Integrates Solution Comparison, Roadmap, and Proof components
- Uses Modal for detailed views

### SolutionComparison.tsx
**Solution comparison interface**
- **AntV Charts**: Bar, Column, and Radar charts for data visualization
- **Three views**: Cards, Charts, Table
- **Ant Design**: Cards, Radio, Table, Tags, Badges

### RoadmapViewer.tsx
**Interactive roadmap display**
- **Mermaid**: Gantt-style timeline visualization
- **Ant Design**: Timeline, Collapse, Cards, Lists, Tags
- Shows phases, milestones, proven examples, resources, risks

### ProofDisplay.tsx
**Evidence and source display**
- **Ant Design**: Collapse, List, Badge, Alert
- Displays case studies and research sources
- Filterable by source type with credibility indicators

## Services

### decisionIntelligence.ts
Main orchestrator for 4-LLM pipeline:
1. **Context Analyzer** (GPT-4o-mini) - Extracts user situation
2. **Research Engine** (GPT-4o) - Conducts research, finds proven methods
3. **Validation Comparator** (Claude 3.5) - Cross-validates claims
4. **Solution Architect** (GPT-4o) - Generates multiple approaches

### webResearch.ts
Internet research simulation:
- Conducts research via LLM
- Extracts citations and sources
- Assesses credibility
- Can be upgraded to use real search APIs

### visualGenerator.ts
Visual generation utilities:
- Mermaid diagram generation for roadmaps
- Chart.js data prep (now AntV compatible)
- Timeline and comparison visualizations

### databaseDI.ts
Database operations:
- Save/retrieve decision intelligence analyses
- Manage research sources
- Link to ventures table

## Customization

### Theme Colors

Modify Ant Design theme in your config:

```typescript
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#00ff88', // Green accent
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#f5222d',
    },
  }}
>
  <App />
</ConfigProvider>
```

### Add Real Web Search

Replace LLM simulation in `webResearch.ts`:

```typescript
import axios from 'axios';

async function conductResearch(queries) {
  const results = await axios.post('https://api.tavily.com/search', {
    api_key: process.env.TAVILY_API_KEY,
    query: queries[0].query
  });
  
  return processResults(results.data);
}
```

## Next Steps

1. **Test the pipeline** with sample venture data
2. **Customize prompts** in `decisionIntelligence.ts` for your domain
3. **Add more visualization** using AntV charts
4. **Integrate with existing workflow** in SellIdea component
5. **Deploy database schema** to production

## Troubleshooting

**Mermaid not rendering?**
- Check browser console for errors
- Ensure script is loaded before React app
- Try `mermaid.initialize()` in useEffect

**AntV charts not displaying?**
- Verify data format matches chart requirements
- Check container has explicit height
- Import correct chart type from `@ant-design/charts`

**Database permissions?**
- Ensure RLS policies are enabled
- Check user has `authenticated` role
- Verify venture_id FK exists

## API Reference

See TypeScript types in:
- `types/decisionIntelligence.ts`
- Component prop interfaces in each file
