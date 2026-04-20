'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Article, Tag } from '@/lib/types'
import ArticleDrawer from './ArticleDrawer'

interface GraphNode {
  id: string
  type: 'article' | 'tag'
  label: string
  color: string
  article?: Article
  tag?: Tag
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
}

interface ForceGraphProps {
  articles: Article[]
  tags: Tag[]
}

export default function ForceGraph({ articles, tags }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [highlightedTagId, setHighlightedTagId] = useState<string | null>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  const handleClose = useCallback(() => setSelectedArticle(null), [])

  useEffect(() => {
    if (!svgRef.current) return
    const container = svgRef.current.parentElement!
    const W = container.clientWidth || 900
    const H = container.clientHeight || 600

    // Build graph data
    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

    tags.forEach((tag) => {
      nodes.push({ id: `tag:${tag.id}`, type: 'tag', label: tag.name, color: tag.color, tag })
    })

    articles.forEach((article) => {
      const articleTags = article.tags ?? []
      const dominantColor = articleTags[0]?.color ?? '#888888'
      nodes.push({
        id: `article:${article.id}`,
        type: 'article',
        label: article.title,
        color: dominantColor,
        article,
      })
      articleTags.forEach((t) => {
        links.push({ source: `article:${article.id}`, target: `tag:${t.id}` })
      })
    })

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

    const g = svg.append('g')

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    // Simulation
    const sim = d3.forceSimulation<GraphNode, GraphLink>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => (d.type === 'tag' ? 22 : 12)))

    simulationRef.current = sim

    // Links
    const link = g.append('g')
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.5)

    // Node groups
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // Tag nodes: larger circle + label
    node.filter((d) => d.type === 'tag')
      .append('circle')
      .attr('r', 14)
      .attr('fill', (d) => d.color + '33')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1.5)

    // Article nodes: smaller dot
    node.filter((d) => d.type === 'article')
      .append('circle')
      .attr('r', 6)
      .attr('fill', (d) => d.color + 'bb')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1)

    // Tag labels (always visible)
    node.filter((d) => d.type === 'tag')
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', (d) => d.color)
      .attr('font-size', '9px')
      .attr('font-family', 'inherit')
      .attr('letter-spacing', '0.06em')
      .attr('pointer-events', 'none')

    // Hover tooltip for article nodes
    const tooltip = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'var(--surface-2)')
      .style('border', '1px solid var(--border)')
      .style('padding', '6px 10px')
      .style('font-size', '11px')
      .style('font-family', 'inherit')
      .style('color', 'var(--text)')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '10')
      .style('max-width', '220px')
      .style('line-height', '1.4')

    node.filter((d) => d.type === 'article')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', '1')
          .text(d.label)
      })
      .on('mousemove', (event) => {
        const rect = container.getBoundingClientRect()
        tooltip
          .style('left', `${event.clientX - rect.left + 12}px`)
          .style('top', `${event.clientY - rect.top - 10}px`)
      })
      .on('mouseout', () => tooltip.style('opacity', '0'))

    // Click handlers
    node.filter((d) => d.type === 'article')
      .on('click', (event, d) => {
        event.stopPropagation()
        if (d.article) setSelectedArticle(d.article)
      })

    node.filter((d) => d.type === 'tag')
      .on('click', (event, d) => {
        event.stopPropagation()
        const tagId = d.tag?.id ?? null
        setHighlightedTagId((prev) => (prev === tagId ? null : tagId))
      })

    // Click on background clears highlights
    svg.on('click', () => {
      setHighlightedTagId(null)
      setSelectedArticle(null)
    })

    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    // Let simulation warm up then slow down
    sim.alpha(1).restart()
    setTimeout(() => sim.alphaTarget(0), 3000)

    return () => {
      sim.stop()
      tooltip.remove()
    }
  }, [articles, tags])

  // Apply highlight effect when highlightedTagId changes
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)

    if (!highlightedTagId) {
      svg.selectAll<SVGCircleElement, GraphNode>('circle')
        .attr('opacity', 1)
      svg.selectAll<SVGLineElement, GraphLink>('line')
        .attr('stroke-opacity', 0.5)
      return
    }

    const connectedArticleIds = new Set<string>()
    const linkEls = svg.selectAll<SVGLineElement, GraphLink>('line')
    linkEls.each((d) => {
      const src = d.source as GraphNode
      const tgt = d.target as GraphNode
      if (tgt.id === `tag:${highlightedTagId}`) connectedArticleIds.add(src.id)
      if (src.id === `tag:${highlightedTagId}`) connectedArticleIds.add(tgt.id)
    })

    svg.selectAll<SVGGElement, GraphNode>('g > g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .attr('opacity', function() {
        const parentNode = (d3.select(this.parentNode as SVGGElement).datum() as GraphNode)
        if (parentNode.id === `tag:${highlightedTagId}`) return 1
        if (parentNode.type === 'article' && connectedArticleIds.has(parentNode.id)) return 1
        return 0.12
      })

    linkEls.attr('stroke-opacity', (d) => {
      const tgt = d.target as GraphNode
      const src = d.source as GraphNode
      if (tgt.id === `tag:${highlightedTagId}` || src.id === `tag:${highlightedTagId}`) return 0.8
      return 0.05
    })
  }, [highlightedTagId])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {highlightedTagId && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            fontSize: '11px',
            color: 'var(--text-dim)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '6px 10px',
          }}
        >
          Tag highlighted — click background to clear
        </div>
      )}

      {articles.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            fontSize: '13px',
            pointerEvents: 'none',
          }}
        >
          No articles yet. Add some to build your map.
        </div>
      )}

      <ArticleDrawer article={selectedArticle} onClose={handleClose} />
    </div>
  )
}
