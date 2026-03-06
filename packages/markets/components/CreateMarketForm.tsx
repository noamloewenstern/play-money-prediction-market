'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
import { format, endOfDay, endOfWeek, endOfMonth, endOfYear, addMonths } from 'date-fns'
import shuffle from 'lodash/shuffle'
import { ToggleLeftIcon, XIcon, CircleIcon, CircleDotIcon, PlusIcon, AlignLeftIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon, GitMergeIcon, LockIcon, GlobeIcon, BarChart2Icon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CirclePicker } from 'react-color'
import { useFieldArray, useForm } from 'react-hook-form'
import { mutate } from 'swr'
import { z } from 'zod'
import { createMarket, createMarketGenerateTags } from '@play-money/api-helpers/client'
import { MY_BALANCE_PATH } from '@play-money/api-helpers/client/hooks'
import { MarketSchema, MarketOptionSchema, MarketVisibilitySchema, QuestionContributionPolicySchema } from '@play-money/database'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { INITIAL_MARKET_LIQUIDITY_PRIMARY } from '@play-money/finance/economy'
import { calculateTotalCost } from '@play-money/lists/lib/helpers'
import { useStatefulAction } from '@play-money/ui'
import { Button } from '@play-money/ui/button'
import { Card } from '@play-money/ui/card'
import { Checkbox } from '@play-money/ui/checkbox'
import { Editor } from '@play-money/ui/editor'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { InfoTooltip } from '@play-money/ui/info-tooltip'
import { Input } from '@play-money/ui/input'
import { Label } from '@play-money/ui/label'
import { MultiSelect } from '@play-money/ui/multi-select'
import { Popover, PopoverContent, PopoverTrigger } from '@play-money/ui/popover'
import { RadioGroup, RadioGroupItem } from '@play-money/ui/radio-group'
import { toast } from '@play-money/ui/use-toast'
import { DraftRecoveryBanner } from '@play-money/ui/DraftRecoveryBanner'
import { cn } from '@play-money/ui/utils'
import { useUser } from '@play-money/users/context/UserContext'
import { clearPresistedData, getPersistedData, usePersistForm } from '../../ui/src/hooks/usePersistForm'
import { parseQuestionForDate, slugifyTitle } from '../lib/helpers'
import { type MarketTemplate, MARKET_TEMPLATES } from '../lib/marketTemplates'
import { MarketPreviewCard } from './MarketPreviewCard'
import { MarketTemplateSelector } from './MarketTemplateSelector'

const CREATE_MARKET_FORM_KEY = 'create-market-form'
const QUESTION_MAX_LENGTH = 200
const TAG_MAX_COUNT = 5

const COLORS = [
  '#f44336',
  '#9c27b0',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#8bc34a',
  '#ffc107',
  '#ff9800',
  '#795548',
  '#607d8b',
]

const marketCreateFormSchema = MarketSchema.pick({
  question: true,
  description: true,
  resolutionCriteria: true,
  tags: true,
}).extend({
  question: z.string().trim().min(1, { message: 'Question is required' }).max(QUESTION_MAX_LENGTH, {
    message: `Question must be ${QUESTION_MAX_LENGTH} characters or less`,
  }),
  closeDate: z.coerce.date().nullable().refine(
    (date) => !date || date > new Date(),
    { message: 'Close date must be in the future' }
  ),
  tags: z.string().trim().array().max(TAG_MAX_COUNT, { message: `Maximum ${TAG_MAX_COUNT} tags allowed` }),
}).and(
  z.object({
    options: z.array(MarketOptionSchema.pick({ name: true, color: true })),
    type: z.enum(['binary', 'multi', 'list', 'numeric']),
    contributionPolicy: QuestionContributionPolicySchema,
    visibility: MarketVisibilitySchema.default('PUBLIC'),
    parentMarketId: z.string().optional(),
    conditionResolution: z.string().optional(),
    numericMin: z.coerce.number().optional(),
    numericMax: z.coerce.number().optional(),
    numericUnit: z.string().optional(),
  })
)
type MarketCreateFormValues = z.infer<typeof marketCreateFormSchema>

export function CreateMarketForm({
  colors = COLORS,
  onSuccess,
  initialQuestion,
  initialTags,
  initialValues,
}: {
  colors?: Array<string>
  onSuccess?: () => Promise<void>
  initialQuestion?: string
  initialTags?: Array<string>
  initialValues?: Partial<MarketCreateFormValues>
}) {
  const { user } = useUser()
  const [SHUFFLED_COLORS] = useState(shuffle(colors))
  const router = useRouter()
  const tzName = /\((?<tz>[A-Za-z\s].*)\)/.exec(new Date().toString())?.groups?.tz ?? null

  const freshDefaults = useMemo(
    () => ({
      question: '',
      type: 'binary' as const,
      description: '',
      resolutionCriteria: null,
      closeDate: endOfMonth(addMonths(new Date(), 1)),
      options: [
        { name: 'Yes', color: SHUFFLED_COLORS[0] },
        { name: 'No', color: SHUFFLED_COLORS[1] },
      ],
      contributionPolicy: 'OWNERS_ONLY' as const,
      visibility: 'PUBLIC' as const,
      tags: [] as Array<string>,
      numericMin: undefined as number | undefined,
      numericMax: undefined as number | undefined,
      numericUnit: '' as string,
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps -- Only compute on mount
  )

  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window === 'undefined') return false
    if (initialValues) return false // Don't show draft banner when pre-filling from duplicate
    const raw = localStorage.getItem(CREATE_MARKET_FORM_KEY)
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw) as MarketCreateFormValues
      return Boolean(parsed.question)
    } catch {
      return false
    }
  })

  const getDefaultValues = useMemo(
    () => {
      if (initialValues) {
        // When initial values are provided (e.g. duplicating a market), skip localStorage draft
        return { ...freshDefaults, ...initialValues }
      }

      const persisted = getPersistedData<MarketCreateFormValues>({
        defaultValue: freshDefaults,
        localStorageKey: CREATE_MARKET_FORM_KEY,
      })

      if (initialQuestion && !persisted.question) {
        persisted.question = initialQuestion
      }
      if (initialTags?.length && !persisted.tags?.length) {
        persisted.tags = initialTags
      }

      return persisted
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps -- Only compute on mount
  )

  const form = useForm<MarketCreateFormValues>({
    resolver: zodResolver(marketCreateFormSchema),
    defaultValues: getDefaultValues,
    mode: 'onBlur',
  })

  usePersistForm({ value: form.getValues(), localStorageKey: CREATE_MARKET_FORM_KEY })

  const handleDiscardDraft = useCallback(() => {
    clearPresistedData({ localStorageKey: CREATE_MARKET_FORM_KEY })
    form.reset(freshDefaults)
    form.reset(freshDefaults) // Requires double reset to work: https://github.com/orgs/react-hook-form/discussions/7589#discussioncomment-8295031
    setHasDraft(false)
  }, [form, freshDefaults])

  const handleRestoreDraft = useCallback(() => {
    setHasDraft(false)
  }, [])

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const { actionState: createActionState, setLoading: setCreateLoading, setSuccess: setCreateSuccess, setError: setCreateError } = useStatefulAction()

  async function onSubmit(market: MarketCreateFormValues) {
    try {
      setCreateLoading()
      const { data: created } = await createMarket({
        ...market,
        ...(market.type === 'numeric'
          ? { numericMin: market.numericMin, numericMax: market.numericMax, numericUnit: market.numericUnit ?? '' }
          : {}),
      })

      setCreateSuccess()
      clearPresistedData({ localStorageKey: CREATE_MARKET_FORM_KEY })
      form.reset({})
      form.reset({}) // Requires double reset to work: https://github.com/orgs/react-hook-form/discussions/7589#discussioncomment-8295031
      onSuccess?.()
      void mutate(MY_BALANCE_PATH)

      if (created.market) {
        toast({
          title: 'Your question has been created',
          description: market.question,
          variant: 'success',
        })
        router.push(`/questions/${created.market.id}/${created.market.slug}`)
      } else if (created.list) {
        toast({
          title: 'Your list has been created',
          description: market.question,
          variant: 'success',
        })
        router.push(`/lists/${created.list.id}/${created.list.slug}`)
      }
    } catch (error) {
      console.error(error)
      setCreateError()
      toast({
        title: 'Failed to create market',
        description: (error as Error).message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = form.handleSubmit(onSubmit)

  const { fields, replace, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'options',
  })

  function applyTemplate(template: MarketTemplate) {
    if (!template.id) {
      // Clear template
      setSelectedTemplateId(null)
      return
    }

    const foundTemplate = MARKET_TEMPLATES.find((t) => t.id === template.id)
    if (!foundTemplate) return

    setSelectedTemplateId(foundTemplate.id)
    form.setValue('type', foundTemplate.type)
    form.setValue('question', foundTemplate.question)
    form.setValue('tags', foundTemplate.tags)
    form.setValue('closeDate', foundTemplate.getCloseDate())
    if (foundTemplate.resolutionCriteria) {
      form.setValue('resolutionCriteria', foundTemplate.resolutionCriteria)
    }
    replace(foundTemplate.options)
  }

  const [showPreview, setShowPreview] = useState(true)
  const [isConditional, setIsConditional] = useState(false)

  const type = form.watch('type')
  const watchedQuestion = form.watch('question')
  const watchedOptions = form.watch('options')
  const watchedTags = form.watch('tags')
  const watchedCloseDate = form.watch('closeDate')
  const slugPreview = useMemo(() => (watchedQuestion ? slugifyTitle(watchedQuestion) : ''), [watchedQuestion])

  useEffect(
    function replaceOptionsIfMulti() {
      if (type === 'binary') {
        const options = form.getValues('options') || []

        if (options[0] && !options[0].name) {
          update(0, { ...options[0], name: 'Yes' })
        }

        if (options[1] && !options[1].name) {
          update(1, { ...options[1], name: 'No' })
        }

        if (options.length > 3 && !options[3]?.name) {
          remove(3)
        }
        if (options.length > 2 && !options[2]?.name) {
          remove(2)
        }
      } else if (type === 'multi') {
        const options = form.getValues('options')

        if (fields.length === 2) {
          if (options[0].name === 'Yes') {
            update(0, { ...options[0], name: '' })
          }
          if (options[1].name === 'No') {
            update(1, { ...options[1], name: '' })
          }
          append({ name: '', color: SHUFFLED_COLORS[2] })
        }

        if (options.length > 3 && !options[3]?.name) {
          remove(3)
        }
      } else if (type === 'list') {
        const options = form.getValues('options')
        if (options.length === 2) {
          if (options[0].name === 'Yes') {
            update(0, { ...options[0], name: '' })
          }
          if (options[1].name === 'No') {
            update(1, { ...options[1], name: '' })
          }

          append({ name: '', color: SHUFFLED_COLORS[2] })
          append({ name: '', color: SHUFFLED_COLORS[3] })
        } else if (options.length === 3) {
          append({ name: '', color: SHUFFLED_COLORS[3] })
        }
      } else if (type === 'numeric') {
        // Numeric markets auto-generate options from the range; clear manual options
        replace([])
      }
      // TODO: List
    },
    [type]
  )

  async function handleQuestionBlur() {
    const question = form.getValues('question')
    if (!form.getValues('tags')?.length) {
      const { data: tags } = await createMarketGenerateTags({ question })
      form.setValue('tags', tags)
    }

    if (!form.formState.dirtyFields.closeDate) {
      const closeDate = parseQuestionForDate(question)
      if (closeDate) {
        form.setValue('closeDate', closeDate)
      }
    }
  }

  const cost = type === 'list' ? calculateTotalCost(fields.length) : INITIAL_MARKET_LIQUIDITY_PRIMARY

  return (
    <div className="mx-auto w-full max-w-screen-sm">
      <div className="relative">
        {!user ? (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-24">
            <div className="rounded-lg border bg-background/95 p-6 text-center shadow-soft-lg backdrop-blur">
              <p className="mb-2 text-lg font-semibold">Sign in to create a question</p>
              <p className="mb-4 text-sm text-muted-foreground">You need to be signed in to create a question.</p>
              <Link href="/login">
                <Button>Sign in</Button>
              </Link>
            </div>
          </div>
        ) : null}
        {hasDraft ? (
          <DraftRecoveryBanner
            className="mb-3"
            preview={getDefaultValues.question}
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
          />
        ) : null}
        <Card className={cn('flex flex-1 p-6 md:p-8', !user && 'pointer-events-none opacity-50')}>
        <Form {...form}>
          <form autoComplete="off" className="flex-1 space-y-6" onSubmit={(e) => void handleSubmit(e)}>

          <MarketTemplateSelector onSelect={applyTemplate} selectedTemplateId={selectedTemplateId} />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Market type</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <FormItem
                        className={cn(
                          'flex rounded-xl border-2 border-transparent transition-all duration-150 hover:border-muted-foreground/20',
                          field.value === 'binary' && 'border-primary bg-primary/5 hover:border-primary'
                        )}
                      >
                        <FormControl>
                          <RadioGroupItem value="binary" className="hidden" />
                        </FormControl>
                        <FormLabel className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 p-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                            <ToggleLeftIcon className="size-5" />
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-semibold">Binary</div>
                            <div className="text-[11px] text-muted-foreground">Yes/no question</div>
                          </div>
                        </FormLabel>
                      </FormItem>
                      <FormItem
                        className={cn(
                          'flex rounded-xl border-2 border-transparent transition-all duration-150 hover:border-muted-foreground/20',
                          field.value === 'multi' && 'border-primary bg-primary/5 hover:border-primary'
                        )}
                      >
                        <FormControl>
                          <RadioGroupItem value="multi" className="hidden" />
                        </FormControl>
                        <FormLabel className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 p-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                            <div className="flex">
                              <CircleIcon className="size-3.5 stroke-[3px]" />
                              <CircleDotIcon className="size-3.5 stroke-[3px]" />
                              <CircleIcon className="size-3.5 stroke-[3px]" />
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-semibold">Multiple choice</div>
                            <div className="text-[11px] text-muted-foreground">Many options</div>
                          </div>
                        </FormLabel>
                      </FormItem>

                      <FormItem
                        className={cn(
                          'flex rounded-xl border-2 border-transparent transition-all duration-150 hover:border-muted-foreground/20',
                          field.value === 'list' && 'border-primary bg-primary/5 hover:border-primary'
                        )}
                      >
                        <FormControl>
                          <RadioGroupItem value="list" className="hidden" />
                        </FormControl>
                        <FormLabel className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 p-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                            <AlignLeftIcon className="size-5" />
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-semibold">List</div>
                            <div className="text-[11px] text-muted-foreground">Multiple questions</div>
                          </div>
                        </FormLabel>
                      </FormItem>

                      <FormItem
                        data-testid="market-type-numeric"
                        className={cn(
                          'flex rounded-xl border-2 border-transparent transition-all duration-150 hover:border-muted-foreground/20',
                          field.value === 'numeric' && 'border-primary bg-primary/5 hover:border-primary'
                        )}
                      >
                        <FormControl>
                          <RadioGroupItem value="numeric" className="hidden" />
                        </FormControl>
                        <FormLabel className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 p-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                            <BarChart2Icon className="size-5" />
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-semibold">Numeric</div>
                            <div className="text-[11px] text-muted-foreground">Number range</div>
                          </div>
                        </FormLabel>
                      </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="question"
            render={({ field: { onBlur, ...field } }) => {
              const questionLen = field.value?.length ?? 0
              const isNearLimit = questionLen > QUESTION_MAX_LENGTH * 0.8
              const fieldState = form.getFieldState('question')
              const isValid = fieldState.isDirty && !fieldState.invalid && questionLen > 0
              return (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{type === 'list' ? 'Name' : 'Question'}</FormLabel>
                    {type === 'numeric' ? <span className="text-xs text-muted-foreground">What numeric outcome are you predicting?</span> : null}
                    {isValid ? <CheckCircle2Icon className="size-4 text-success" /> : null}
                  </div>
                  <FormControl>
                    <Input
                      placeholder={
                        type === 'binary'
                          ? 'Will bitcoin hit $76,543.21 by the end of 2024?'
                          : type === 'multi'
                            ? 'Who will win the 2024 US Presidential Election?'
                            : type === 'list'
                              ? 'What will be true of of the next iPhone?'
                              : type === 'numeric'
                                ? "What will Bitcoin's price be on Jan 1, 2026?"
                                : ''
                      }
                      maxLength={QUESTION_MAX_LENGTH}
                      onBlur={() => {
                        handleQuestionBlur()
                        onBlur()
                      }}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span
                      className={cn(
                        'ml-auto text-xs',
                        isNearLimit ? 'text-warning' : 'text-muted-foreground',
                        questionLen >= QUESTION_MAX_LENGTH && 'text-destructive'
                      )}
                    >
                      {questionLen}/{QUESTION_MAX_LENGTH}
                    </span>
                  </div>
                  {slugPreview ? (
                    <p className="text-xs text-muted-foreground">
                      Slug: <span className="font-mono">{slugPreview}</span>
                    </p>
                  ) : null}
                </FormItem>
              )
            }}
          />

          {type === 'numeric' ? (
            <div className="space-y-4" data-testid="numeric-fields">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="numericMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 40000"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numericMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 90000"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="numericUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit prefix <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. $, €, °F"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Displayed before each bracket value (e.g. &quot;$40k – $50k&quot;)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}

          {type !== 'numeric' ? (
          <div className="space-y-2">
            <Label>{type === 'list' ? 'Questions' : 'Options'}</Label>

            <Card className="divide-y">
              {fields.map((fieldItem, index) => (
                <div className="relative flex items-center gap-2 p-3" key={fieldItem.id}>
                  {(type === 'binary' && index > 1) ||
                  (type === 'multi' && index > 2) ||
                  (type === 'list' && index > 3) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -left-3 size-6 rounded-full border bg-background shadow-soft-xs"
                      onClick={() => {
                        remove(index)
                      }}
                    >
                      <XIcon className="size-3" />
                    </Button>
                  ) : null}
                  <div className="w-6 text-center text-xs font-semibold tabular-nums text-muted-foreground">{index + 1}</div>
                  <FormField
                    control={form.control}
                    name={`options.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={
                              type === 'binary'
                                ? index === 0
                                  ? 'Yes'
                                  : 'No'
                                : type === 'multi'
                                  ? index === 0
                                    ? 'Kamala Harris'
                                    : index === 1
                                      ? 'Donald Trump'
                                      : index === 2
                                        ? 'Nikki Haley'
                                        : ''
                                  : type === 'list'
                                    ? index === 0
                                      ? 'Will have a model with a single camera'
                                      : index === 1
                                        ? 'Will have under-display face ID'
                                        : index === 2
                                          ? 'There will be a thin "Air" model'
                                          : index === 3
                                            ? 'Will have an Apple-designed Wifi 7 chip'
                                            : ''
                                    : ''
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`options.${index}.color`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="icon" variant="outline">
                                <div style={{ backgroundColor: field.value }} className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <PopoverClose>
                                <CirclePicker
                                  onChangeComplete={(color) => field.onChange(color.hex)}
                                  color={field.value}
                                />
                              </PopoverClose>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </Card>

            {type === 'multi' || type === 'list' ? (
              <Button
                variant="ghost"
                type="button"
                size="sm"
                onClick={() => {
                  append({ name: '', color: SHUFFLED_COLORS[fields.length % SHUFFLED_COLORS.length] })
                }}
              >
                <PlusIcon className="size-4" />
                Add {type === 'multi' ? 'option' : 'question'}
              </Button>
            ) : null}
          </div>
          ) : null}

          {type === 'list' ? (
            <FormField
              control={form.control}
              name="contributionPolicy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value === 'PUBLIC'}
                      onCheckedChange={(change) => {
                        field.onChange(change ? 'PUBLIC' : 'OWNERS_ONLY')
                      }}
                    />
                  </FormControl>
                  <FormLabel className="text-muted-foreground">Allow public contributions to this list</FormLabel>
                  <InfoTooltip description="If enabled, anyone can contribute to this list by adding a new question." />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="resolutionCriteria"
            render={({ field: { ref, value, ...field } }) => (
              <FormItem>
                <FormLabel>Resolution criteria</FormLabel>
                <FormControl>
                  <div className="min-h-[80px]">
                    <Editor
                      inputClassName="border text-sm p-3 min-h-[80px]"
                      placeholder={
                        type === 'binary'
                          ? 'Resolves to the price listed on coindesk at midnight on Dec 31st.'
                          : type === 'multi'
                            ? 'Resolves to credible reporting on news sites such as CNN.'
                            : type === 'list'
                              ? 'Resolves to features announced at the 2025 iPhone event via Apple.'
                              : ''
                      }
                      value={value ?? ''}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field: { ref, ...field } }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <div className="min-h-[80px]">
                    <Editor
                      inputClassName="border text-sm p-3 min-h-[80px]"
                      placeholder="Additional context or background information..."
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Tags</FormLabel>
                  <span className={cn(
                    'text-xs',
                    (value?.length ?? 0) >= TAG_MAX_COUNT ? 'text-warning' : 'text-muted-foreground'
                  )}>
                    {value?.length ?? 0}/{TAG_MAX_COUNT}
                  </span>
                </div>
                <FormControl>
                  <MultiSelect
                    value={value?.map((v) => ({ value: v, label: v }))}
                    onChange={(values) => onChange(values?.map((v) => v.value))}
                    hideClearAllButton
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="closeDate"
            render={({ field }) => {
              const closeDateState = form.getFieldState('closeDate')
              const isCloseDateValid = field.value && !closeDateState.invalid && field.value > new Date()
              return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Close Date</FormLabel>
                  {isCloseDateValid ? <CheckCircle2Icon className="size-4 text-success" /> : null}
                </div>
                <FormControl>
                  <div>
                    <Input
                      type="datetime-local"
                      {...field}
                      className="w-auto"
                      onChange={(e) => {
                        const timestamp = Date.parse(e.target.value)

                        if (!isNaN(timestamp)) {
                          field.onChange(new Date(e.target.value))
                        }
                      }}
                      value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                    />

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={
                          format(field.value!, 'Pp') === format(endOfDay(new Date()), 'Pp') ? 'heavy' : 'secondary'
                        }
                        onClick={() => field.onChange(endOfDay(new Date()).toISOString())}
                        type="button"
                      >
                        Today
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          format(field.value!, 'Pp') === format(endOfWeek(new Date()), 'Pp') ? 'heavy' : 'secondary'
                        }
                        onClick={() => field.onChange(endOfWeek(new Date()).toISOString())}
                        type="button"
                      >
                        This Week
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          format(field.value!, 'Pp') === format(endOfMonth(new Date()), 'Pp') ? 'heavy' : 'secondary'
                        }
                        onClick={() => field.onChange(endOfMonth(new Date()).toISOString())}
                        type="button"
                      >
                        End of {format(new Date(), 'MMMM')}
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          format(field.value!, 'Pp') === format(endOfYear(new Date()), 'Pp') ? 'heavy' : 'secondary'
                        }
                        onClick={() => field.onChange(endOfYear(new Date()).toISOString())}
                        type="button"
                      >
                        End of {format(new Date(), 'yyyy')}
                      </Button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
              )
            }}
          />
          <p className="text-xs text-muted-foreground">
            Trading will stop at this time in your local timezone {tzName === null ? '' : `(${tzName})`}
          </p>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="isConditional"
                checked={isConditional}
                onCheckedChange={(checked) => {
                  setIsConditional(Boolean(checked))
                  if (!checked) {
                    form.setValue('parentMarketId', undefined)
                    form.setValue('conditionResolution', undefined)
                  }
                }}
              />
              <div className="flex items-center gap-1.5">
                <GitMergeIcon className="size-3.5 text-muted-foreground" />
                <Label htmlFor="isConditional" className="cursor-pointer text-muted-foreground">
                  Conditional market — only activates if a parent market resolves to a specific outcome
                </Label>
              </div>
            </div>
            {isConditional ? (
              <div className="ml-7 space-y-3 rounded-md border border-info/30 bg-info/5 p-3">
                <FormField
                  control={form.control}
                  name="parentMarketId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Market ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter the parent market ID (e.g. clxyz...)"
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        The ID of the market whose resolution determines if this market activates.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conditionResolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activating Resolution</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Yes"
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        The option name that activates this market (e.g. "Yes"). If the parent resolves to a different
                        option, this market will be automatically canceled.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </div>

          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value === 'PRIVATE'}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? 'PRIVATE' : 'PUBLIC')
                    }}
                  />
                </FormControl>
                <div className="flex items-center gap-1.5">
                  {field.value === 'PRIVATE' ? (
                    <LockIcon className="size-3.5 text-muted-foreground" />
                  ) : (
                    <GlobeIcon className="size-3.5 text-muted-foreground" />
                  )}
                  <FormLabel className="text-muted-foreground">
                    {field.value === 'PRIVATE' ? 'Private — only accessible via direct link' : 'Public — visible to everyone'}
                  </FormLabel>
                </div>
                <InfoTooltip description="Private markets are only accessible to people you share the link with. They won't appear in public listings." />
              </FormItem>
            )}
          />

          <div className="border-t pt-6">
            <Button actionState={createActionState} type="submit" size="lg" className="w-full">
              Create for
              <CurrencyDisplay value={cost} />
            </Button>
          </div>
          </form>
        </Form>
      </Card>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-1 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>
        {showPreview ? (
          <div>
            <p className="mb-2 px-1 text-xs text-muted-foreground">How your market will appear to others</p>
            <MarketPreviewCard
              question={watchedQuestion}
              options={watchedOptions ?? []}
              tags={watchedTags ?? []}
              closeDate={watchedCloseDate ?? null}
              type={type as 'binary' | 'multi' | 'list'}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
