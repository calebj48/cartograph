export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
}

export interface Article {
  id: string
  user_id: string
  title: string
  body: string
  summary: string | null
  created_at: string
  tags?: Tag[]
}

export interface Comment {
  id: string
  article_id: string
  user_id: string
  body: string
  created_at: string
}

export interface ArticleTag {
  article_id: string
  tag_id: string
}
