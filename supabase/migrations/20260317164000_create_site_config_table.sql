create table if not exists public.site_config (
  key text primary key,
  navigation jsonb not null default '[]'::jsonb,
  filters jsonb not null default '[]'::jsonb,
  labels jsonb not null default '{}'::jsonb,
  page_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger site_config_set_updated_at
before update on public.site_config
for each row
execute procedure public.set_updated_at();

alter table public.site_config enable row level security;

create policy "Public can read site config"
on public.site_config
for select
to anon, authenticated
using (true);

create policy "Admins can manage site config"
on public.site_config
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.site_config (
  key,
  navigation,
  filters,
  labels,
  page_content
)
values (
  'main',
  jsonb_build_array(
    jsonb_build_object('id', 'inicio', 'label', 'Início'),
    jsonb_build_object('id', 'portfolio', 'label', 'Portfólio'),
    jsonb_build_object('id', 'quem', 'label', 'Quem somos'),
    jsonb_build_object('id', 'contato', 'label', 'Contato')
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'destaques',
      'label', 'Destaques',
      'summary', 'Seleção curada',
      'description', 'Comece pelos projetos que sintetizam melhor a linguagem do estúdio.'
    ),
    jsonb_build_object(
      'id', 'editoras',
      'label', 'Editoras',
      'summary', 'Navegação por catálogo',
      'description', 'Percorra o acervo pelas casas editoriais e seus conjuntos.'
    ),
    jsonb_build_object(
      'id', 'temas',
      'label', 'Temas',
      'summary', 'Assuntos e linguagens',
      'description', 'Cruze temas, técnicas e atmosferas sem perder o contexto.'
    ),
    jsonb_build_object(
      'id', 'cores',
      'label', 'Cores',
      'summary', 'Percurso cromático',
      'description', 'Uma entrada mais lúdica e visual para descobrir relações no acervo.'
    ),
    jsonb_build_object(
      'id', 'livros',
      'label', 'Livros',
      'summary', 'Projetos editoriais',
      'description', 'Livros completos, encadernados e de leitura longa.'
    ),
    jsonb_build_object(
      'id', 'hqs',
      'label', 'HQs',
      'summary', 'Narrativa sequencial',
      'description', 'Percursos em quadrinhos, capas e universos gráficos seriados.'
    ),
    jsonb_build_object(
      'id', 'revistas',
      'label', 'Revistas',
      'summary', 'Publicações periódicas',
      'description', 'Edições, dossiês e desdobramentos de linguagem editorial.'
    ),
    jsonb_build_object(
      'id', 'especiais',
      'label', 'Projetos especiais',
      'summary', 'Formatos híbridos',
      'description', 'Peças que fogem do livro tradicional e abrem outras entradas.'
    ),
    jsonb_build_object(
      'id', 'outros',
      'label', 'Outros',
      'summary', 'Outros formatos',
      'description', 'Materiais que ampliam o portfólio para além das categorias centrais.'
    )
  ),
  jsonb_build_object(
    'ilustracoes', 'Ilustrações',
    'projeto-grafico', 'Projeto gráfico',
    'infantil', 'Infantil',
    'ilustrado', 'Ilustrado',
    'lettering', 'Lettering',
    'mitologia', 'Mitologia',
    'gaiman', 'Gaiman',
    'preto', 'Preto',
    'branco', 'Branco',
    'cinza', 'Cinza',
    'grafite', 'Grafite',
    'verde', 'Verde',
    'azul', 'Azul',
    'turquesa', 'Turquesa',
    'vermelho', 'Vermelho',
    'vinho', 'Vinho',
    'amarelo', 'Amarelo',
    'ocre', 'Ocre',
    'laranja', 'Laranja',
    'rosa', 'Rosa',
    'roxo', 'Roxo',
    'marrom', 'Marrom',
    'bege', 'Bege',
    'creme', 'Creme',
    'dourado', 'Dourado',
    'prata', 'Prata',
    'destaque', 'Destaques',
    'livro', 'Livros',
    'hq', 'HQ',
    'revista', 'Revistas',
    'especial', 'Projetos especiais',
    'outros', 'Outros',
    'intrinseca', 'Intrínseca',
    'permanencia', 'Permanência'
  ),
  jsonb_build_object(
    'inicio', $$<div class="panel-inner">
  <h1>GIZ</h1>
  <p class="small-note">
    Oficina editorial especializada em livros, revistas e projetos especiais.
  </p>
  <div class="panel-actions">
    <button class="panel-button" type="button" data-action="open-page" data-page-id="portfolio">Entrar no portfólio</button>
    <button class="panel-button panel-button-secondary" type="button" data-action="open-page" data-page-id="contato">Falar com a Giz</button>
  </div>
</div>$$,
    'portfolio', $$<div class="panel-inner panel-inner-intro">
  <div class="panel-heading-stack">
    <p class="panel-kicker">Portfólio</p>
    <h1>Explore o acervo por trilhas.</h1>
    <p class="small-note">
      Escolha um caminho de navegação ou combine filtros depois, sem perder a leitura do conjunto.
    </p>
  </div>

  <div class="portfolio-overview" data-portfolio-overview></div>
  <div class="portfolio-botoes" data-portfolio-buttons></div>
</div>$$,
    'quem', $$<div class="panel-inner">
<h1>Quem somos</h1>
<p class="small-note">
Nós somos. Nós fazemos. Ninguém faz melhor do que nós.
</p>
</div>$$,
    'contato', $$<div class="panel-inner">
  <h1>Contato</h1>
  <p class="small-note">
    Entre em contato para projetos editoriais, capas, revistas e trabalhos especiais.
  </p>
  <p class="small-note">
    Email<br>
    WhatsApp<br>
    Cidade / país
  </p>
</div>$$
  )
)
on conflict (key) do update
set
  navigation = excluded.navigation,
  filters = excluded.filters,
  labels = excluded.labels,
  page_content = excluded.page_content;
