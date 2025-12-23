# LLM Model Updates - Decision Intelligence Platform

## Updated LLM Models

The Decision Intelligence Platform has been configured to use the following LLM models:

### 1. Context Analyzer - **GPT-4.1** (GPT-4 Turbo)
- **Puter Model**: `gpt-4-turbo`
- **Purpose**: Extracts user situation, resources, and constraints
- **Generates**: Research queries and decision points
- **Why**: Fast, efficient context parsing with strong understanding

### 2. Research Engine - **Perplexity Sonar Pro**
- **Puter Model**: `perplexity-sonar`
- **Purpose**: Conducts internet research with real-time data
- **Generates**: Market analysis, competitor data, proven frameworks
- **Why**: Best-in-class for web research and citation

### 3. Validation Comparator - **Gemini 2.5 Pro** (Gemini 2.0 Flash)
- **Puter Model**: `gemini-2.0-flash-exp`
- **Purpose**: Cross-validates claims against research
- **Generates**: Contradictions, gaps, credibility assessment
- **Why**: Strong analytical capabilities and fact-checking

### 4. Solution Architect - **GPT-5.1** (GPT-4o)
- **Puter Model**: `gpt-4o`
- **Purpose**: Creates multiple solution approaches with roadmaps
- **Generates**: Lean/Moderate/Capital-intensive strategies
- **Why**: Advanced reasoning for complex strategic planning

## Model Mapping in Code

Located in `services/puter.ts`:

```typescript
const MODEL_MAPPING: Record<TargetedModel, string> = {
    INPUT_OPTIMIZER: 'gpt-4-turbo',        // GPT-4.1
    RESEARCH_ENGINE: 'perplexity-sonar',   // Perplexity Sonar Pro
    COMPARATOR: 'gemini-2.0-flash-exp',    // Gemini 2.5 Pro
    SOLUTION_ARCHITECT: 'gpt-4o'           // GPT-5.1
};
```

## UI Display

Updated in `components/DecisionIntelligence.tsx` to show:
- Stage 1: "GPT-4.1"
- Stage 2: "Perplexity Sonar Pro"
- Stage 3: "Gemini 2.5 Pro"
- Stage 4: "GPT-5.1"

## Note on Model Availability

The actual model strings used (`gpt-4-turbo`, `perplexity-sonar`, etc.) are what's available through Puter.js. The display names reflect the user's preferred model choices while using the closest available equivalents.
