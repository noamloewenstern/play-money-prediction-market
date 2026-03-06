import { addMonths, endOfYear } from 'date-fns'

export type MarketTemplateType = 'binary' | 'multi' | 'list'

export type MarketTemplate = {
  id: string
  name: string
  description: string
  icon: string
  type: MarketTemplateType
  question: string
  options: Array<{ name: string; color: string }>
  tags: Array<string>
  getCloseDate: () => Date
  resolutionCriteria: string
}

export const MARKET_TEMPLATES: Array<MarketTemplate> = [
  {
    id: 'sports-outcome',
    name: 'Sports Outcome',
    description: 'Will a team win a championship or game?',
    icon: '🏆',
    type: 'binary',
    question: 'Will [Team] win the [Championship/Tournament]?',
    options: [
      { name: 'Yes', color: '#4caf50' },
      { name: 'No', color: '#f44336' },
    ],
    tags: ['sports'],
    getCloseDate: () => endOfYear(new Date()),
    resolutionCriteria:
      'Resolves YES if [Team] wins the [Championship/Tournament] based on official results from the governing body.',
  },
  {
    id: 'political-election',
    name: 'Political Election',
    description: 'Who will win an election or political race?',
    icon: '🗳️',
    type: 'multi',
    question: 'Who will win the [Election Year] [Office] election?',
    options: [
      { name: 'Candidate A', color: '#2196f3' },
      { name: 'Candidate B', color: '#f44336' },
      { name: 'Candidate C', color: '#9c27b0' },
    ],
    tags: ['politics', 'elections'],
    getCloseDate: () => endOfYear(new Date()),
    resolutionCriteria:
      'Resolves to the candidate certified as the winner by the official election authority.',
  },
  {
    id: 'tech-product-launch',
    name: 'Tech Product Launch',
    description: 'Will a company release a product or feature?',
    icon: '💻',
    type: 'binary',
    question: 'Will [Company] release [Product/Feature] by [Date]?',
    options: [
      { name: 'Yes', color: '#009688' },
      { name: 'No', color: '#607d8b' },
    ],
    tags: ['technology', 'tech'],
    getCloseDate: () => addMonths(new Date(), 6),
    resolutionCriteria:
      'Resolves YES if [Company] officially announces and ships [Product/Feature] to the public by the specified date.',
  },
  {
    id: 'financial-benchmark',
    name: 'Financial Benchmark',
    description: 'Will an asset reach a price target?',
    icon: '📈',
    type: 'binary',
    question: 'Will [Asset] reach $[Target Price] by [Date]?',
    options: [
      { name: 'Yes', color: '#4caf50' },
      { name: 'No', color: '#f44336' },
    ],
    tags: ['finance', 'markets', 'crypto'],
    getCloseDate: () => endOfYear(new Date()),
    resolutionCriteria:
      'Resolves YES if [Asset] trades at or above $[Target Price] on any major exchange before the close date.',
  },
  {
    id: 'award-ceremony',
    name: 'Award Ceremony',
    description: 'Who will win a major award?',
    icon: '🎬',
    type: 'multi',
    question: 'Who will win [Award Category] at the [Award Show Year] [Award Show]?',
    options: [
      { name: 'Nominee A', color: '#ffc107' },
      { name: 'Nominee B', color: '#ff9800' },
      { name: 'Nominee C', color: '#f44336' },
      { name: 'Nominee D', color: '#9c27b0' },
    ],
    tags: ['entertainment', 'awards', 'film'],
    getCloseDate: () => addMonths(new Date(), 3),
    resolutionCriteria:
      'Resolves to the winner announced at the official [Award Show] ceremony.',
  },
  {
    id: 'science-milestone',
    name: 'Scientific Milestone',
    description: 'Will a scientific or space achievement happen?',
    icon: '🚀',
    type: 'binary',
    question: 'Will [Organization] successfully [Milestone] by [Date]?',
    options: [
      { name: 'Yes', color: '#3f51b5' },
      { name: 'No', color: '#607d8b' },
    ],
    tags: ['science', 'technology', 'space'],
    getCloseDate: () => endOfYear(new Date()),
    resolutionCriteria:
      'Resolves YES if [Organization] publicly confirms successful completion of [Milestone] by the close date.',
  },
  {
    id: 'ai-capabilities',
    name: 'AI Capabilities',
    description: 'Will an AI system achieve a capability?',
    icon: '🤖',
    type: 'binary',
    question: 'Will [AI System/Company] achieve [Capability/Benchmark] by [Date]?',
    options: [
      { name: 'Yes', color: '#009688' },
      { name: 'No', color: '#607d8b' },
    ],
    tags: ['ai', 'technology', 'machine-learning'],
    getCloseDate: () => endOfYear(new Date()),
    resolutionCriteria:
      'Resolves YES if [AI System] publicly demonstrates [Capability] with credible verification by the close date.',
  },
  {
    id: 'comparison-list',
    name: 'Comparison List',
    description: 'A set of yes/no questions about a topic',
    icon: '📋',
    type: 'list',
    question: 'What will be true of [Topic] by [Date]?',
    options: [
      { name: 'Question 1 about [Topic]', color: '#2196f3' },
      { name: 'Question 2 about [Topic]', color: '#4caf50' },
      { name: 'Question 3 about [Topic]', color: '#ffc107' },
      { name: 'Question 4 about [Topic]', color: '#f44336' },
    ],
    tags: [],
    getCloseDate: () => addMonths(new Date(), 6),
    resolutionCriteria: '',
  },
]
