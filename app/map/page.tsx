import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ForceGraph from '@/components/ForceGraph'
import { Article, Tag } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: articlesRaw } = await supabase
    .from('articles')
    .select(`
      *,
      article_tags(tag_id, tags(*))
    `)
    .order('created_at', { ascending: false })

  const { data: allTags } = await supabase.from('tags').select('*')

  const articles: Article[] = (articlesRaw ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    user_id: a.user_id as string,
    title: a.title as string,
    body: a.body as string,
    summary: a.summary as string | null,
    created_at: a.created_at as string,
    tags: ((a.article_tags as Array<{ tags: Tag }>) ?? []).map((at) => at.tags).filter(Boolean),
  }))

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <ForceGraph articles={articles} tags={(allTags ?? []) as Tag[]} />
    </div>
  )
}
