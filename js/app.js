let produtos = [];
let carrinho = [];
const numeroWhatsApp = "5521999999999"; // SUBSTITUA PELO NÚMERO DO HAMBURGÃO

// O link do seu Google Sheets (com tsv no final)
const urlPlanilha = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUKD76Prz_IblIIMZVmqU07cD47M1WN_J36Z1PtTQIC9neD3xPuv8v7m48x0JQb1HZZfuCfTht89cl/pub?output=tsv";

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(urlPlanilha);

if (!response.ok) {
    throw new Error(
        `Erro ao carregar a planilha: HTTP ${response.status}`
    );
}

const textoPlanilha = await response.text();
        produtos = processarDadosPlanilha(textoPlanilha);
        
        renderizarCategorias();
        renderizarProdutos(produtos);

        document.getElementById('busca')
            .addEventListener('input', buscarProduto);

        document.getElementById('btn-carrinho')
            .addEventListener('click', abrirCarrinho);

        document.getElementById('btn-fechar-carrinho')
            .addEventListener('click', fecharCarrinho);

        document.getElementById('btn-whatsapp')
            .addEventListener('click', finalizarPedido);
        
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        document.getElementById('produtos-grid').textContent =
            'Erro ao carregar o catálogo.';    }
});

// Função que transforma a folha de cálculo numa lista para o site
function processarDadosPlanilha(texto) {
    const linhas = texto.split('\n');
    const lista = [];

    // Começamos no 1 para ignorar a linha do cabeçalho (Id, Nome, Categoria...)
    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (linha === '') continue; // Salta linhas vazias

        const colunas = linha.split('\t');

        if (colunas.length >= 6) {
            // Verifica se está em oferta (aceita VERDADEIRO, TRUE ou SIM)
            const valorOferta = colunas[6] ? colunas[6].trim().toUpperCase() : '';
            const eOferta = valorOferta === 'VERDADEIRO' || valorOferta === 'TRUE' || valorOferta === 'SIM';

            const textoPreco = (colunas[3] || '').trim().replace(',', '.');
            const preco = parseFloat(textoPreco);

            if (!Number.isFinite(preco)) {
                console.warn(`Produto ignorado porque está sem preço válido: ${colunas[1]}`);
                continue;
}

            lista.push({
                id: parseInt(colunas[0]),
                nome: colunas[1].trim(),
                categoria: colunas[2].trim(),
                preco: preco, // Transforma 10,99 em 10.99 para o cálculo
                unidade: colunas[4].trim(),
                imagem: colunas[5].trim(),
                oferta: eOferta
            });
        }
    }
    return lista;
}


// Verifica se a imagem usa uma URL HTTPS válida
function urlImagemSegura(url) {
    try {
        const endereco = new URL(String(url || '').trim());

        if (endereco.protocol !== 'https:') {
            return '';
        }

        return endereco.href;

    } catch {
        return '';
    }
}


// Renderização segura dos produtos
function renderizarProdutos(lista) {

    const grid = document.getElementById('produtos-grid');

    // Limpa os produtos anteriores
    grid.replaceChildren();


    if (lista.length === 0) {

        const mensagem = document.createElement('p');
        mensagem.textContent = 'Nenhum produto encontrado.';

        grid.appendChild(mensagem);

        return;
    }


    lista.forEach(produto => {

        const card = document.createElement('div');
        card.className = 'produto-card';


        // OFERTA
        if (produto.oferta) {

            const badge = document.createElement('span');

            badge.className = 'badge-oferta';
            badge.textContent = '🔥 OFERTA';

            card.appendChild(badge);
        }


        // IMAGEM
        const imagemSegura =
            urlImagemSegura(produto.imagem);

        if (imagemSegura) {

            const img = document.createElement('img');

            img.src = imagemSegura;
            img.alt = `Imagem de ${produto.nome}`;
            img.loading = 'lazy';

            card.appendChild(img);
        }


        // NOME
        const nome = document.createElement('div');

        nome.className = 'produto-nome';

        nome.textContent =
            `${produto.nome} (${produto.unidade})`;

        card.appendChild(nome);


        // PREÇO
        const preco = document.createElement('div');

        preco.className = 'produto-preco';

        preco.textContent =
            `R$ ${produto.preco
                .toFixed(2)
                .replace('.', ',')}`;

        card.appendChild(preco);


        // BOTÃO ADICIONAR
        const botaoAdicionar =
            document.createElement('button');

        botaoAdicionar.type = 'button';
        botaoAdicionar.className = 'btn-add';
        botaoAdicionar.textContent = 'Adicionar';

        botaoAdicionar.addEventListener(
            'click',
            () => adicionarAoCarrinho(produto.id)
        );

        card.appendChild(botaoAdicionar);


        grid.appendChild(card);
    });
}


// Categorias e Filtros
function renderizarCategorias() {

    const container =
        document.getElementById('categorias-container');

    // Limpa os botões anteriores
    container.replaceChildren();


    // BOTÃO TODOS
    const botaoTodos =
        document.createElement('button');

    botaoTodos.type = 'button';
    botaoTodos.className = 'ativo';
    botaoTodos.textContent = 'Todos';

    botaoTodos.addEventListener(
        'click',
        () => filtrarCategoria('Todos', botaoTodos)
    );

    container.appendChild(botaoTodos);


    // BOTÃO OFERTAS
    const botaoOfertas =
        document.createElement('button');

    botaoOfertas.type = 'button';
    botaoOfertas.className = 'oferta-btn';
    botaoOfertas.textContent = '🔥 Ofertas';

    botaoOfertas.addEventListener(
        'click',
        () => filtrarCategoria('Ofertas', botaoOfertas)
    );

    container.appendChild(botaoOfertas);


    // Remove categorias vazias
    // e também elimina duplicadas
    const categorias = [
        ...new Set(
            produtos
                .map(produto =>
                    String(produto.categoria || '').trim()
                )
                .filter(Boolean)
        )
    ];


    // CRIA AS CATEGORIAS
    categorias.forEach(categoria => {

        const botao =
            document.createElement('button');

        botao.type = 'button';
        botao.textContent = categoria;

        botao.addEventListener(
            'click',
            () => filtrarCategoria(categoria, botao)
        );

        container.appendChild(botao);
    });
}

function filtrarCategoria(categoria, btnElement) {

    document
        .querySelectorAll('.categorias button')
        .forEach(btn => btn.classList.remove('ativo'));

    btnElement.classList.add('ativo');

    // Limpa a pesquisa
    document.getElementById('busca').value = '';

    let filtrados = produtos;

    if (categoria === 'Ofertas') {

        filtrados = produtos.filter(
            produto => produto.oferta
        );

        document.getElementById('titulo-secao').textContent =
            'Ofertas da Semana';

    } else if (categoria !== 'Todos') {

        filtrados = produtos.filter(
            produto => produto.categoria === categoria
        );

        document.getElementById('titulo-secao').textContent =
            categoria;

    } else {

        document.getElementById('titulo-secao').textContent =
            'Todos os Produtos';
    }

    renderizarProdutos(filtrados);
}


function buscarProduto() {

    const termo =
        document
            .getElementById('busca')
            .value
            .trim()
            .toLowerCase();

    const filtrados = produtos.filter(
        produto =>
            produto.nome
                .toLowerCase()
                .includes(termo)
    );

    if (termo === '') {

        document.getElementById('titulo-secao').textContent =
            'Todos os Produtos';

        renderizarProdutos(produtos);

        return;
    }

    document.getElementById('titulo-secao').textContent =
        'Resultados da busca';

    renderizarProdutos(filtrados);
}

// Lógica do Carrinho
function adicionarAoCarrinho(id) {

    const produto =
        produtos.find(p => p.id === id);

    if (!produto) {
        console.warn(
            'Produto inexistente:',
            id
        );
        return;
    }

    const itemExistente =
        carrinho.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }
    atualizarBadgeCarrinho();
}

function alterarQuantidade(id, delta) {
    const index = carrinho.findIndex(item => item.id === id);
    if (index !== -1) {
        carrinho[index].quantidade += delta;
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
    }
    atualizarInterfaceCarrinho();
    atualizarBadgeCarrinho();
}

function atualizarBadgeCarrinho() {

    const totalItens = carrinho.reduce(
        (acc, item) => acc + item.quantidade,
        0
    );

    document
        .getElementById('contador-carrinho')
        .textContent = String(totalItens);
}

function atualizarInterfaceCarrinho() {

    const container =
        document.getElementById('itens-carrinho');

    container.replaceChildren();

    let valorTotal = 0;

    carrinho.forEach(item => {

        const subtotal =
            item.preco * item.quantidade;

        valorTotal += subtotal;

        const itemDiv =
            document.createElement('div');

        itemDiv.className =
            'item-carrinho';

        const info =
            document.createElement('div');

        const nome =
            document.createElement('strong');

        nome.textContent = item.nome;

        const quebra =
            document.createElement('br');

        const preco =
            document.createElement('span');

        preco.textContent =
            `R$ ${item.preco
                .toFixed(2)
                .replace('.', ',')}`;

        info.appendChild(nome);
        info.appendChild(quebra);
        info.appendChild(preco);

        const controles =
            document.createElement('div');

        controles.className =
            'item-controles';

        const botaoMenos =
            document.createElement('button');

        botaoMenos.type = 'button';
        botaoMenos.textContent = '−';

        botaoMenos.setAttribute(
            'aria-label',
            `Diminuir quantidade de ${item.nome}`
        );

        botaoMenos.addEventListener(
            'click',
            () => alterarQuantidade(item.id, -1)
        );

        const quantidade =
            document.createElement('span');

        quantidade.textContent =
            String(item.quantidade);

        const botaoMais =
            document.createElement('button');

        botaoMais.type = 'button';
        botaoMais.textContent = '+';

        botaoMais.setAttribute(
            'aria-label',
            `Aumentar quantidade de ${item.nome}`
        );

        botaoMais.addEventListener(
            'click',
            () => alterarQuantidade(item.id, 1)
        );

        controles.appendChild(botaoMenos);
        controles.appendChild(quantidade);
        controles.appendChild(botaoMais);

        itemDiv.appendChild(info);
        itemDiv.appendChild(controles);

        container.appendChild(itemDiv);
    });

    document
        .getElementById('valor-total')
        .textContent =
        `R$ ${valorTotal
            .toFixed(2)
            .replace('.', ',')}`;
}


// Modal e WhatsApp
function abrirCarrinho() {
    atualizarInterfaceCarrinho();
    document.getElementById('modal-carrinho').classList.remove('hidden');
}

function fecharCarrinho() {
    document.getElementById('modal-carrinho').classList.add('hidden');
}

function finalizarPedido() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let mensagem = "*Olá! Gostaria de fazer este pedido:*\n\n";
    let valorTotal = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        valorTotal += subtotal;
        mensagem += `${item.quantidade}x ${item.nome} — R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    });

    mensagem += `\n*Total estimado: R$ ${valorTotal.toFixed(2).replace('.', ',')}*\n\n_Pedido enviado pelo catálogo digital._`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
   window.open(
    url,
    '_blank',
    'noopener,noreferrer'
);
}
