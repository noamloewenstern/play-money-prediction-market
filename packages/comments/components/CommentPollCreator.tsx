'use client'

import { Plus, Trash2 } from 'lucide-react'
import React from 'react'
import { Button } from '@play-money/ui/button'
import { Input } from '@play-money/ui/input'
import { Label } from '@play-money/ui/label'
import { cn } from '@play-money/ui/utils'

export type PollDraft = {
  question: string
  options: Array<string>
}

export function CommentPollCreator({
  value,
  onChange,
  className,
}: {
  value: PollDraft
  onChange: (poll: PollDraft) => void
  className?: string
}) {
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, question: e.target.value })
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...value.options]
    newOptions[index] = text
    onChange({ ...value, options: newOptions })
  }

  const handleAddOption = () => {
    if (value.options.length >= 4) return
    onChange({ ...value, options: [...value.options, ''] })
  }

  const handleRemoveOption = (index: number) => {
    if (value.options.length <= 2) return
    onChange({ ...value, options: value.options.filter((_, i) => i !== index) })
  }

  return (
    <div className={cn('space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3', className)}>
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Poll Question</Label>
        <Input
          placeholder="Ask a question..."
          value={value.question}
          onChange={handleQuestionChange}
          maxLength={200}
          className="text-sm"
          data-testid="poll-question-input"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Options (2–4)</Label>
        {value.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {index + 1}
            </div>
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              maxLength={100}
              className="text-sm"
              data-testid={`poll-option-input-${index}`}
            />
            {value.options.length > 2 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(index)}
                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ))}

        {value.options.length < 4 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddOption}
            className="h-8 gap-1 text-xs text-muted-foreground"
            data-testid="poll-add-option-button"
          >
            <Plus className="h-3.5 w-3.5" />
            Add option
          </Button>
        ) : null}
      </div>
    </div>
  )
}
