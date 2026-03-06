'use client'

import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@play-money/ui/button'
import { cn } from '@play-money/ui/utils'
import { type MarketTemplate, MARKET_TEMPLATES } from '../lib/marketTemplates'

type MarketTemplateSelectorProps = {
  onSelect: (template: MarketTemplate) => void
  selectedTemplateId?: string | null
}

export function MarketTemplateSelector({ onSelect, selectedTemplateId }: MarketTemplateSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/50 hover:text-foreground"
      >
        <SparklesIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left">Start from a template</span>
        {isExpanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
      </button>

      {isExpanded ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="template-grid">
          {MARKET_TEMPLATES.map((template) => {
            const isSelected = template.id === selectedTemplateId
            return (
              <button
                key={template.id}
                type="button"
                data-testid={`template-${template.id}`}
                onClick={() => {
                  onSelect(template)
                  setIsExpanded(false)
                }}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all duration-150',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/40 hover:border-muted-foreground/20 hover:bg-muted/70'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none" role="img" aria-label={template.name}>
                    {template.icon}
                  </span>
                  <span className="text-xs font-semibold leading-tight">{template.name}</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">{template.description}</p>
                <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {template.type === 'binary' ? 'Yes/No' : template.type === 'multi' ? 'Multiple choice' : 'List'}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {selectedTemplateId && !isExpanded ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <SparklesIcon className="size-3.5" />
          <span>
            Template applied:{' '}
            <span className="font-medium text-foreground">
              {MARKET_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-5 px-1.5 text-[11px]"
            onClick={() => onSelect({ id: '' } as MarketTemplate)}
          >
            Clear
          </Button>
        </div>
      ) : null}
    </div>
  )
}
