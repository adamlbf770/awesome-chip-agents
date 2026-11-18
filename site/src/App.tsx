import { lazy, Suspense, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { ArrowRightIcon, ArrowUpRightIcon, SearchIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { catalog, index, isBenchmark, label, local, repoLink, route, text, type Locale, type Page, type Resource } from './model';
import { track } from './analytics';

const MarkdownContent = lazy(() => import('./MarkdownContent'));

function External({ href, children, resource, kind = 'source', locale, onClick, ...props }: Omit<ComponentProps<'a'>, 'href'> & {
  href: string; resource?: string; kind?: string; locale: Locale;
}) {
  return <a {...props} href={href} target="_blank" rel="noopener noreferrer" onClick={event => { track('outbound_link', {
    resource_id: resource || 'site', link_kind: kind, language: locale,
    destination: new URL(href).origin + new URL(href).pathname,
  }); onClick?.(event); }}>{children} <span aria-hidden="true">↗</span></a>;
}

function ResourceTags({ tags, locale }: { tags: string[]; locale: Locale }) {
  return <div className="tags">{tags.map(tag => <Badge key={tag} asChild variant="secondary">
    <a href={route({ locale, kind: 'catalog' }) + '?tag=' + tag}>{label(catalog.taxonomy.tags[tag], locale)}</a>
  </Badge>)}</div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="detail-panel" size="sm">
    <CardHeader><CardTitle asChild><h2>{title}</h2></CardTitle></CardHeader>
    <CardContent>{children}</CardContent>
  </Card>;
}

function ResourceCard({ resource: r, locale }: { resource: Resource; locale: Locale }) {
  const l = (en: string, zh: string) => text(locale, en, zh);
  const repository = r.repositories[0];
  return <Card className="resource-card" role="article">
    <CardHeader className="flex flex-1 flex-col gap-4">
    <div className="card-meta"><span>{label(catalog.taxonomy.directions[r.direction], locale)}</span><time>{r.date || l('Undated', '日期待核实')}</time></div>
    <CardTitle asChild><h3><a className="card-title-link" href={route({ locale, kind: 'resource', id: r.id })}>{r.name}<ArrowUpRightIcon aria-hidden="true" /></a></h3></CardTitle>
    <CardDescription>{label(r.summary, locale)}</CardDescription>
    </CardHeader>
    <CardContent><ResourceTags tags={r.tags.slice(0, 3)} locale={locale} /></CardContent>
    <CardFooter className="flex-col items-stretch gap-4"><Separator />
    <div className="card-bottom"><span>{r.types.map(type => label(catalog.taxonomy.types[type], locale)).join(' · ')}</span>
      {repository && <span title={l('GitHub snapshot; collection date in detail', 'GitHub 快照；采集时间见详情')}>☆ {repository.stars === undefined ? '—' : repository.stars.toLocaleString(locale)}{repository.fetch_error ? ' *' : ''}</span>}
    </div>
    </CardFooter>
  </Card>;
}

type Filters = { q: string; direction: string; type: string; tag: string; sort: string; collection: string };
const empty: Filters = { q: '', direction: '', type: '', tag: '', sort: 'date', collection: '' };
function replaceFilters(filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value && value !== empty[key as keyof Filters]) params.set(key, value);
  history.replaceState(null, '', location.pathname + (params.size ? '?' + params : ''));
  window.dispatchEvent(new Event('catalog-url-change'));
}

function Listing({ page }: { page: Page }) {
  const { locale } = page;
  const l = (en: string, zh: string) => text(locale, en, zh);
  const [filters, setFilters] = useState<Filters>(empty);
  useEffect(() => {
    const load = () => {
      const params = new URLSearchParams(location.search);
      setFilters(Object.fromEntries(Object.entries(empty).map(([key, fallback]) => [key, params.get(key) || fallback])) as Filters);
    };
    load();
    window.addEventListener('popstate', load);
    return () => window.removeEventListener('popstate', load);
  }, []);
  function update(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    replaceFilters(next);
    if (key !== 'q') track('catalog_filter', { filter: key, value, language: locale });
  }
  const direction = page.kind === 'direction' ? page.id : filters.direction;
  const words = filters.q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const resources = catalog.resources.filter(r => {
    const searchable = [r.name, r.title, ...r.summary, ...r.description, ...r.tags.flatMap(tag => catalog.taxonomy.tags[tag])].join(' ').toLocaleLowerCase();
    return (!direction || r.direction === direction || r.also_in.includes(direction)) &&
      (!filters.type || r.types.includes(filters.type)) && (!filters.tag || r.tags.includes(filters.tag)) &&
      (filters.collection !== 'benchmarks' || isBenchmark(r)) && words.every(word => searchable.includes(word));
  }).sort((a, b) => filters.sort === 'name' ? a.name.localeCompare(b.name) :
    (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id));
  const select = (key: 'direction' | 'type' | 'tag', vocabulary: 'directions' | 'types' | 'tags', title: string) =>
    <Field className="min-w-0 gap-2">
      <FieldLabel htmlFor={'filter-' + key}>{title}</FieldLabel>
      <NativeSelect id={'filter-' + key} value={filters[key]} onChange={event => update(key, event.target.value)}>
        <NativeSelectOption value="">{l('All', '全部')}</NativeSelectOption>
        {Object.entries(catalog.taxonomy[vocabulary]).map(([id, pair]) => <NativeSelectOption key={id} value={id}>{label(pair, locale)}</NativeSelectOption>)}
      </NativeSelect>
    </Field>;
  const reset = () => { setFilters(empty); replaceFilters(empty); };
  return <section className="catalog-section">
    <div className="section-heading"><div><p className="eyebrow">{l('THE RESOURCE LIBRARY', '资源库')}</p><h1>{page.kind === 'direction' ? label(catalog.taxonomy.directions[page.id!], locale) : l('Find your next building block.', '找到你的下一块积木。')}</h1></div>
      <span className="count">{resources.length} {l('resources', '项资源')}</span></div>
    <form className="catalog-form" role="search" aria-label={l('Search resources', '搜索资源')} onSubmit={event => { event.preventDefault(); track('catalog_search', { query_length: filters.q.length, results: resources.length, language: locale }); }}>
      <FieldGroup>
        <Field className="gap-0">
          <FieldLabel className="sr-only" htmlFor="resource-search">{l('Search resources', '搜索资源')}</FieldLabel>
          <InputGroup>
            <InputGroupInput id="resource-search" type="search" placeholder={l('Search papers, tools, benchmarks…', '搜索论文、工具、基准…')} value={filters.q} onChange={event => update('q', event.target.value)} />
            <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
            <InputGroupAddon align="inline-end"><Button type="submit">{l('Search', '搜索')}</Button></InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    <FieldGroup className={cn('filters', page.kind === 'direction' && 'direction-filters')}>
      {page.kind !== 'direction' && select('direction', 'directions', l('Direction', '方向'))}
      {select('type', 'types', l('Resource type', '资源类型'))}{select('tag', 'tags', l('Tag', '标签'))}
      <Field className="min-w-0 gap-2"><FieldLabel htmlFor="filter-sort">{l('Sort by', '排序')}</FieldLabel>
        <NativeSelect id="filter-sort" value={filters.sort} onChange={event => update('sort', event.target.value)}>
          <NativeSelectOption value="date">{l('Publication date', '发布日期')}</NativeSelectOption><NativeSelectOption value="name">{l('Name', '名称')}</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Button type="button" variant="ghost" onClick={reset}>{l('Reset', '重置')}</Button>
    </FieldGroup>
    </form>
    {filters.collection === 'benchmarks' && <p className="collection-note">{l('Showing benchmarks and datasets', '当前展示基准与数据集')}</p>}
    <div aria-live="polite" className="sr-only">{resources.length} {l('results', '条结果')}</div>
    <div className="resource-grid">{resources.map(resource => <ResourceCard key={resource.id} resource={resource} locale={locale} />)}</div>
    {!resources.length && <Empty><EmptyHeader><EmptyTitle role="heading" aria-level={2}>{l('No matching resources', '没有找到匹配的资源')}</EmptyTitle><EmptyDescription>{l('Try a broader keyword or reset the filters.', '试试更宽泛的关键词，或重置筛选条件。')}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={reset}>{l('Reset filters', '重置筛选')}</Button></EmptyContent></Empty>}
    <p className="fine-print">{l('Dates reflect publication, not repository activity. Stars are snapshots, not quality scores.', '日期采用资源发布时间，不采用仓库推送时间。Stars 为快照，不代表质量评分。')}</p>
  </section>;
}

function DownloadMetrics({ resource, locale }: { resource: Resource; locale: Locale }) {
  const l = (en: string, zh: string) => text(locale, en, zh);
  return <Panel title={l('Download metrics', '下载指标')}>
    {!resource.downloads.length ? <p>{l('No verified download source recorded.', '暂未记录经过核实的下载统计来源。')}</p> :
      resource.downloads.map(({ source, snapshot: s }) => <div className="download-row" key={source.id}>
        <strong>{source.provider === 'npm' ? l('npm package downloads', 'npm 包下载量') : source.provider === 'pypistats' ? l('PyPI package downloads · PyPI Stats', 'PyPI 包下载量 · PyPI Stats') : l('GitHub release asset downloads', 'GitHub Release 附件下载量')}</strong>
        <span className="metric-value">{s.value === undefined ? l('Unavailable', '暂无数据') : s.value.toLocaleString(locale)}</span>
        <p>{source.package || source.repository} · {s.start && s.end ? s.start + ' – ' + s.end : source.provider === 'pypistats' ? l('Recent reporting window: ', '最近统计窗口：') + (s.period || 'month') : l('Currently available matching release assets', '当前仍可用的匹配版本附件累计值')}</p>
        {source.tag_prefix && <small>{l('Release tag prefix: ', '版本标签前缀：')}{source.tag_prefix}</small>}
        {source.asset_pattern && <small>{l('Asset pattern: ', '附件匹配：')}{source.asset_pattern}</small>}
        {s.asset_count !== undefined && <small>{s.asset_count} {l('matching assets across ', '个匹配附件，来自 ')}{s.release_count} {l('releases', '个版本')}</small>}
        {s.url && <External href={s.url} locale={locale} resource={resource.id} kind="metric_source">{l('Data source', '数据来源')}</External>}
        <small>{l('Fetched (UTC): ', '采集时间（UTC）：')}{s.fetched_at || '—'}{s.fetch_error ? l(' · Refresh failed; previous snapshot retained', ' · 刷新失败，保留已有快照') : ''}</small>
      </div>)}
    <p className="fine-print">{l('Package or file downloads are not unique people or MCP installations. Website clicks are measured separately.', '包或文件的下载量不等于独立用户或 MCP 安装次数。本站链接点击另行统计。')}</p>
  </Panel>;
}

function Detail({ page }: { page: Page }) {
  const r = index[page.id!];
  const { locale } = page;
  const l = (en: string, zh: string) => text(locale, en, zh);
  function markdownHref(href: string) {
    if (/^https?:/.test(href) || href.startsWith('#')) return href;
    const resolved = new URL(href, 'https://source.invalid/' + r.path);
    const match = catalog.resources.find(record => '/' + record.path === resolved.pathname);
    return match ? route({ locale, kind: 'resource', id: match.id }) : repoLink('/blob/HEAD' + resolved.pathname + resolved.hash);
  }
  const notes: Record<string, string> = {
    source: l('Date recorded in the original source.', '日期沿用原始来源记录。'),
    'arxiv-month': l('arXiv identifier month; exact first-public day not verified.', '按 arXiv 编号月份归档；首次公开的具体日期尚未核实。'),
    'year-only': l('Publication year only; month not verified.', '仅记录发表年份，月份待核实。'),
    unknown: l('Publication date not recorded.', '尚未记录发布日期。'),
  };
  return <>
    <nav className="breadcrumb"><a href={route({ locale, kind: 'catalog' })}>{l('Resources', '资源库')}</a><span>/</span><a href={route({ locale, kind: 'direction', id: r.direction })}>{label(catalog.taxonomy.directions[r.direction], locale)}</a></nav>
    <div className="detail-heading"><p className="eyebrow">{r.types.map(type => label(catalog.taxonomy.types[type], locale)).join(' / ')}</p><h1>{r.name}</h1>
      {r.title !== r.name && <p className="original-title">{r.title}</p>}<p className="lead">{label(r.summary, locale)}</p>
      <ResourceTags tags={r.tags} locale={locale} />
    </div>
    <Separator />
    <div className="detail-layout"><article className="prose">
      <Suspense fallback={<p>{label(r.summary, locale)}</p>}><MarkdownContent link={(href, children) => {
        const url = markdownHref(href);
        return /^https?:/.test(url) ? <External href={url} locale={locale} resource={r.id} kind="description">{children}</External> : <a href={url}>{children}</a>;
      }}>{label(r.description, locale)}</MarkdownContent></Suspense>
      {r.related.length > 0 && <section><h2>{l('Related resources', '相关资源')}</h2><div className="related">{r.related.map(id => <a key={id} href={route({ locale, kind: 'resource', id })}>{index[id].name} →</a>)}</div></section>}
    </article><aside className="detail-sidebar">
      <Panel title={l('Original sources', '原始来源')}><div className="source-links">{r.links.map(link => <External key={link.url + link.label} href={link.url} locale={locale} resource={r.id} kind={link.kind}>{link.label}</External>)}</div>
        <p className="fine-print">{l('Published: ', '发布：')}{r.date || l('Unknown', '日期待核实')}<br />{notes[r.date_basis]}</p>
      </Panel>
      <Panel title={l('Repository activity', '仓库动态')}>
        {r.repositories.length ? r.repositories.map(repo => <div className="repo-stat" key={repo.name}>
          <External href={'https://github.com/' + repo.name} locale={locale} resource={r.id} kind="repository">{repo.name}</External>
          <strong>☆ {repo.stars === undefined ? l('Unavailable', '暂无数据') : repo.stars.toLocaleString(locale)}</strong>
          <small>{l('Last push (UTC): ', '最近推送（UTC）：')}{repo.pushed_at || '—'}</small>
          <small>{l('Fetched (UTC): ', '采集（UTC）：')}{repo.fetched_at || '—'}</small>
          {repo.fetch_error && <small className="status">{l('Refresh failed; previous snapshot retained', '刷新失败，保留已有快照')}</small>}
          {repo.archived && <small>{l('Archived', '已归档')}</small>}
        </div>) : <p>{l('No related public repository recorded.', '暂未记录相关公开仓库。')}</p>}
      </Panel>
      <DownloadMetrics resource={r} locale={locale} />
      {catalog.repository && <Panel title={l('Help improve this entry', '一起完善这条资源')}>
        <External href={repoLink('/edit/HEAD/' + r.path)} locale={locale} resource={r.id} kind="edit">{l('Edit on GitHub', '在 GitHub 上编辑')}</External>
        <External href={repoLink('/issues/new?template=resource-suggestion.yml&title=' + encodeURIComponent('Resource correction: ' + r.name))} locale={locale} resource={r.id} kind="contribute">{l('Report a correction', '反馈错误或补充')}</External>
      </Panel>}
    </aside></div>
  </>;
}

function Home({ locale }: { locale: Locale }) {
  const l = (en: string, zh: string) => text(locale, en, zh);
  return <>
    <section className="hero"><div><p className="eyebrow">{l('AN OPEN MAP OF CHIP DESIGN × AI', '芯片设计 × AI 的开放资源地图')}</p>
      <h1>{l('Discover the agents.', '发现芯片 Agent。')}<br /><em>{l('Build the next chip.', '探索设计新可能。')}</em></h1>
      <p>{l('Papers, tools, benchmarks, and infrastructure for LLM-assisted chip design. Curated in the open, connected by purpose.', '汇集芯片设计 LLM Agent 的论文、工具、评测基准与基础设施。公开维护，按用途连接，让探索更有方向。')}</p>
      <div className="hero-actions"><Button asChild size="lg"><a href={route({ locale, kind: 'catalog' })}>{l('Explore resources', '探索资源库')}<ArrowRightIcon data-icon="inline-end" aria-hidden="true" /></a></Button>
        {catalog.repository && <Button asChild variant="link"><External href={repoLink('/issues/new?template=resource-suggestion.yml')} locale={locale} kind="contribute">{l('Contribute a resource', '推荐一项资源')}</External></Button>}</div>
      <div className="hero-stats"><span><strong>{catalog.resources.length}</strong>{l('Resources', '项资源')}</span><span><strong>{Object.keys(catalog.taxonomy.directions).length}</strong>{l('Directions', '个方向')}</span><span><strong>EN / 中</strong>{l('One shared catalog', '同一份资源库')}</span></div>
    </div><div className="circuit" aria-hidden="true"><div className="circuit-label">CHIP AGENT STACK</div>
      <div className="circuit-chip"><span>LLM</span><strong>AGENT</strong><small>reason · act · verify</small></div>
      <div className="circuit-nodes"><span>RTL</span><span>EDA</span><span>MCP</span><span>SPICE</span></div><div className="circuit-foot">FROM IDEAS TO IMPLEMENTATION</div></div>
    </section>
    <section><div className="section-heading"><div><p className="eyebrow">{l('CHOOSE YOUR PATH', '从你的方向出发')}</p><h2>{l('Explore by direction', '按研究方向探索')}</h2></div><Button asChild variant="link"><a href={route({ locale, kind: 'catalog' })}>{l('View everything', '查看全部')}<ArrowRightIcon data-icon="inline-end" aria-hidden="true" /></a></Button></div>
      <div className="direction-grid">{Object.entries(catalog.taxonomy.directions).map(([id, pair], i) => {
        const count = catalog.resources.filter(r => r.direction === id && !r.types.some(type => ['news', 'video'].includes(type))).length;
        return <a href={route({ locale, kind: 'direction', id })} key={id}><span className="direction-number">0{i + 1}</span><h3>{label(pair, locale)}</h3><span>{count} {l('primary resources', '项主要资源')} →</span></a>;
      })}<a className="benchmark-tile" href={route({ locale, kind: 'catalog' }) + '?collection=benchmarks'}><span className="direction-number">↗</span><h3>{l('Benchmarks & datasets', '基准与数据集')}</h3><span>{l('Find your evaluation starting point', '找到评测的起点')} →</span></a></div>
    </section>
    <section><div className="section-heading"><div><p className="eyebrow">{l('RECENT PUBLICATIONS', '近期发布')}</p><h2>{l('Across the ecosystem', '看看领域新进展')}</h2></div><Button asChild variant="link"><a href={route({ locale, kind: 'catalog' })}>{l('Browse the library', '浏览资源库')}<ArrowRightIcon data-icon="inline-end" aria-hidden="true" /></a></Button></div>
      <div className="resource-grid">{catalog.resources.slice(0, 6).map(resource => <ResourceCard key={resource.id} resource={resource} locale={locale} />)}</div>
    </section>
    <section className="contribute-banner"><div><p className="eyebrow">{l('BUILT TOGETHER', '一起维护，一起探索')}</p><h2>{l('Know a resource we should include?', '有值得收录的资源？')}</h2><p>{l('Share a link, correct a detail, or help translate.', '推荐一个链接、纠正一处信息，或补充一段翻译。')}</p></div>
      {catalog.repository && <Button asChild size="lg"><a href={repoLink('/issues/new?template=resource-suggestion.yml')} onClick={() => track('contribute', { language: locale })}>{l('Suggest a resource', '推荐资源')}<ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" /></a></Button>}
    </section>
  </>;
}

function Metrics({ locale }: { locale: Locale }) {
  const l = (en: string, zh: string) => text(locale, en, zh);
  const configured = catalog.resources.filter(r => r.downloads.length);
  return <section className="metrics-page"><p className="eyebrow">{l('SOURCES & MEASUREMENT', '来源与统计口径')}</p><h1>{l('Understand the numbers.', '让每个数字都有依据。')}</h1>
    <p className="lead">{l('Activity and usage signals help discovery. They do not establish research quality.', '关注度和使用指标帮助了解资源，不代表研究质量。')}</p>
    <div className="metrics-explainer">
      <Card><CardHeader><CardTitle asChild><h2>GitHub Stars</h2></CardTitle><CardDescription>{l('Repository snapshots with collection timestamps. Failed refreshes retain the last successful value.', '展示带采集时间的仓库快照；刷新失败保留上次成功值。')}</CardDescription></CardHeader></Card>
      <Card><CardHeader><CardTitle asChild><h2>{l('Downloads', '外部下载量')}</h2></CardTitle><CardDescription>{l('npm and PyPI Stats report package downloads within reporting windows. GitHub counts matching release asset downloads. Providers and scopes are displayed separately.', 'npm 和 PyPI Stats 提供统计窗口内的包下载量；GitHub 统计匹配的 Release 附件下载。不同来源和口径分别展示。')}</CardDescription></CardHeader></Card>
      <Card><CardHeader><CardTitle asChild><h2>{l('Website link clicks', '本站链接点击')}</h2></CardTitle><CardDescription>{l('When configured, Umami records pageviews and outbound-link events. Maintainers can view counts in their analytics dashboard. Clicks are not downloads.', '配置后，Umami 接收页面访问和外链事件，维护者可在统计后台查看。链接点击不等于实际下载。')}</CardDescription></CardHeader></Card>
    </div>
    <h2>{l('Resources with download sources', '已配置下载来源的资源')}</h2>
    {configured.length ? configured.map(resource => <div className="metric-resource" key={resource.id}><h3><a href={route({ locale, kind: 'resource', id: resource.id })}>{resource.name} →</a></h3><DownloadMetrics resource={resource} locale={locale} /></div>) : <p>{l('Verified download sources will appear here once recorded.', '核实并配置下载来源后，将在这里展示。')}</p>}
    <p className="fine-print">{l('Analytics respects Do Not Track and Global Privacy Control. Search text and referrer URLs are excluded.', '访问统计遵循 Do Not Track 与 Global Privacy Control；不发送搜索原文和来源网址。')}</p>
  </section>;
}

export default function App({ page }: { page: Page }) {
  const { locale } = page;
  const l = (en: string, zh: string) => text(locale, en, zh);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const update = () => setQuery(location.search);
    update();
    window.addEventListener('catalog-url-change', update);
    window.addEventListener('popstate', update);
    return () => { window.removeEventListener('catalog-url-change', update); window.removeEventListener('popstate', update); };
  }, []);
  return <>
    <a className="skip-link" href="#main">{l('Skip to content', '跳转到正文')}</a>
    <header className="site-header"><a className="brand" href={route({ locale, kind: 'home' })}><span className="brand-mark" aria-hidden="true">▦</span><span>Awesome<br /><strong>Chip Agents</strong></span></a>
      <nav aria-label={l('Main navigation', '主导航')}><a href={route({ locale, kind: 'catalog' })} aria-current={['catalog', 'direction'].includes(page.kind) ? 'page' : undefined}>{l('Resources', '资源库')}</a><a href={route({ locale, kind: 'metrics' })} aria-current={page.kind === 'metrics' ? 'page' : undefined}>{l('Metrics', '数据与统计')}</a></nav>
      <div className="header-actions"><a className="language-switch" href={route({ ...page, kind: page.kind === 'missing' ? 'home' : page.kind, locale: locale === 'en' ? 'zh' : 'en' }) + query} lang={locale === 'en' ? 'zh-CN' : 'en'}>{locale === 'en' ? '简体中文' : 'English'}</a>
        {catalog.repository && <External href={catalog.repository} locale={locale} kind="site_repository">GitHub</External>}</div>
    </header>
    <main id="main" className="page-shell">{page.kind === 'home' ? <Home locale={locale} /> :
      page.kind === 'catalog' || page.kind === 'direction' ? <Listing page={page} /> :
      page.kind === 'resource' ? <Detail page={page} /> : page.kind === 'metrics' ? <Metrics locale={locale} /> :
      <Empty><EmptyHeader><EmptyTitle role="heading" aria-level={1}>404</EmptyTitle><EmptyDescription>{l('This page could not be found.', '找不到这个页面。')}</EmptyDescription></EmptyHeader><EmptyContent><Button asChild><a href={local(locale + '/catalog/')}>{l('Back to the catalog', '返回资源库')}</a></Button></EmptyContent></Empty>}</main>
    <footer className="site-footer"><div><strong>Awesome Chip Agents</strong><p>{l('An open catalog for the chip agent community.', '为芯片 Agent 社区共同维护的开放资源库。')}</p></div>
      <div><span>{l('Original content: MIT · Linked resources retain their own terms.', '原创内容采用 MIT；所链接资源保留各自条款。')}</span>
        <small>{l('Content revision: ', '内容版本：')}{catalog.revision.slice(0, 7) || 'local'}{catalog.working_tree ? l(' · local changes', ' · 含本地修改') : ''}</small>
        {catalog.repository && <a href={repoLink('/blob/HEAD/CONTRIBUTING.md')}>{l('Contributing guide', '贡献指南')} ↗</a>}</div>
    </footer>
  </>;
}
