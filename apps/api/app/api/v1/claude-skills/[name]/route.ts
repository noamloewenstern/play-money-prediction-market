import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

export const dynamic = 'force-dynamic'

const SKILLS_DIR = path.join(process.cwd(), 'skills')

export async function GET(_req: Request, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    const { name } = params
    const safeName = name.replace(/[^a-z0-9-]/g, '')
    const filePath = path.join(SKILLS_DIR, `${safeName}.md`)

    const content = await readFile(filePath, 'utf-8')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: `Skill '${params.name}' not found` }, { status: 404 })
    }
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
