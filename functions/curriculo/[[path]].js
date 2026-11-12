// Dossiês e currículos criados no admin só ganham página estática depois de gerada.
// Até lá, o endereço (ex.: /dossie/novo-slug/) precisa abrir o app, que lê o caminho e
// mostra o item. Páginas estáticas existentes são servidas normalmente (context.next()).
// Qualquer outro endereço do site que não exista cai no 404.html.
export async function onRequest(context) {
  const resposta = await context.next();
  if (resposta.status !== 404) return resposta;
  const home = await context.env.ASSETS.fetch(new URL("/", context.request.url));
  return new Response(home.body, { status: 200, headers: home.headers });
}
