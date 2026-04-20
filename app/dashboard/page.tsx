import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Dashboard from '@/components/Dashboard'
import { Article, Comment, Tag } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ article?: string }>
}) {
  const { article: initialArticleId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch articles with their tags
  const { data: articlesRaw } = await supabase
    .from('articles')
    .select(`
      *,
      article_tags(tag_id, tags(*))
    `)
    .order('created_at', { ascending: false })

  // Fetch all user tags
  const { data: allTags } = await supabase.from('tags').select('*').order('name')

  // Fetch all comments for user's articles
  const { data: allComments } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true })

  // Shape articles to include tags array
  const articles: Article[] = (articlesRaw ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    user_id: a.user_id as string,
    title: a.title as string,
    body: a.body as string,
    summary: a.summary as string | null,
    created_at: a.created_at as string,
    tags: ((a.article_tags as Array<{ tags: Tag }>) ?? []).map((at) => at.tags).filter(Boolean),
  }))

  // Group comments by article_id
  const commentsByArticle: Record<string, Comment[]> = {}
  for (const c of allComments ?? []) {
    if (!commentsByArticle[c.article_id]) commentsByArticle[c.article_id] = []
    commentsByArticle[c.article_id].push(c as Comment)
  }

  return (
    <Dashboard
      articles={articles}
      allTags={(allTags ?? []) as Tag[]}
      commentsByArticle={commentsByArticle}
      initialArticleId={initialArticleId}
    />
  )
}
