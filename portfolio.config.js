window.GIZ_PORTFOLIO_CONFIG = {
  defaultPageId: "inicio",
  portfolioPageId: "portfolio",
  pages: [
    { id: "inicio", label: "Início", content: "inicio.html" },
    { id: "portfolio", label: "Portfólio", content: "portfolio.html" },
    { id: "quem", label: "Quem somos", content: "quem-somos.html" },
    { id: "contato", label: "Contato", content: "contato.html" },
    { id: "dossie", label: "Dossiê", content: "dossie.html" }
  ],
  filters: [
    {
      id: "destaques",
      label: "Destaques",
      source: "destaqueLabel",
      mode: "value",
      selectionOperator: "or",
      summary: "Seleção curada",
      description: "Os melhores projetos da casa, destacados e comentados em Dossiê."
    },
    {
      id: "editoras",
      label: "Editoras",
      source: "cliente",
      mode: "value",
      selectionOperator: "or",
      summary: "Navegação por catálogo",
      description: "Que nossas parcerias sejam tão duradouras quanto os livros que fazemos."
    },
    {
      id: "temas",
      label: "Temas",
      source: "tags",
      mode: "list",
      excludeSet: "colorTags",
      summary: "Assuntos e linguagens",
      description: "Projetos de continuidade, coleções, autores, e outros temas divertidos."
    },
    {
      id: "cores",
      label: "Cores",
      source: "tags",
      mode: "list",
      includeSet: "colorTags",
      summary: "Percurso cromático",
      description: "Explore os projetos navegando por seus tons dominantes."
    },
    {
      id: "genero",
      label: "Gênero",
      source: "tipo",
      mode: "value",
      selectionOperator: "or",
      fixedOptions: ["livro", "hq", "revista", "especial", "outros"],
      summary: "Formatos editoriais",
      description: "Explore o acervo pelo tipo de projeto."
    },
    {
      id: "oficio",
      label: "Ofício",
      source: "servico",
      mode: "csv",
      selectionOperator: "or",
      summary: "Por ofício realizado",
      description: "As pratas da casa, as jóias da coroa. O que fazemos de melhor."
    },
  ],
  tagSets: {
    colorTags: [
      "claros",
      "dourados",
      "beges",
      "ocres",
      "vermelhos",
      "violetas",
      "azuis",
      "verdes",
      "terrosos",
      "escuros",
      "prata"
    ]
  },
  labels: {
    "logos-intrinseca": "Logos Intrínseca",
    ilustracoes: "Ilustrações",
    "projeto-grafico": "Projeto gráfico",
    infantil: "Infantil",
    ilustrado: "Ilustrado",
    lettering: "Lettering",
    mitologia: "Mitologia",
    gaiman: "Gaiman",
    claros: "Claros",
    dourados: "Dourados",
    beges: "Beges",
    ocres: "Ocres",
    vermelhos: "Vermelhos",
    violetas: "Violetas",
    azuis: "Azuis",
    verdes: "Verdes",
    terrosos: "Terrosos",
    escuros: "Escuros",
    prata: "Prata",
    destaque: "Destaques",
    livro: "Livros",
    hq: "HQ",
    revista: "Revistas",
    especial: "Projetos especiais",
    outros: "Outros",
    intrinseca: "Intrínseca",
    permanencia: "Permanência"
  }
};
