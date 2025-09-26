// index.js — versão corrigida e pronta para rodar
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { engine } = require("express-handlebars");
const Produto = require("./DAO/produto");
const Venda = require("./DAO/venda");
const { Op, Sequelize } = require("sequelize");
const methodOverride = require("method-override");

// Importar funções de previsão (assegure que ./DAO/previsao exporta essas 3)
const { preverDemanda, preverDemandaPorCategoria, regressao } = require("./DAO/previsao");

// Configuração do Handlebars
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

// Middlewares
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

// ----------------------- Rotas do Dashboard e ML ---------------------------

// Rota da API para os dados do dashboard (gráfico, etc.)
app.get("/api/dashboard-data", async (req, res) => {
  try {
    // Vendas por categoria (soma total pago)
    const vendasPorCategoriaRaw = await Venda.findAll({
      attributes: [
        [Sequelize.col("tbl_produto.categoria_produto"), "categoria_produto"],
        [Sequelize.fn("sum", Sequelize.col("total_pago_venda")), "totalVendas"],
      ],
      include: [
        {
          model: Produto,
          as: "tbl_produto",
          attributes: [],
        },
      ],
      group: ["tbl_produto.categoria_produto"],
      order: [[Sequelize.fn("sum", Sequelize.col("total_pago_venda")), "DESC"]],
    });

    // Vendas por mês (formato YYYY-MM) - MySQL DATE_FORMAT
    const vendasPorMesRaw = await Venda.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("data_venda"), "%Y-%m"), "mes"],
        [Sequelize.fn("sum", Sequelize.col("total_pago_venda")), "totalVendas"],
      ],
      group: ["mes"],
      order: [["mes", "ASC"]],
    });

    // Estoque por categoria
    const estoquePorCategoriaRaw = await Produto.findAll({
      attributes: [
        "categoria_produto",
        [Sequelize.fn("sum", Sequelize.col("quantidade_produto")), "quantidadeEmEstoque"],
      ],
      group: ["categoria_produto"],
      order: [[Sequelize.fn("sum", Sequelize.col("quantidade_produto")), "DESC"]],
    });

    // Produtos com menor venda (top 5)
    const produtosMenorVendaRaw = await Venda.findAll({
      attributes: [
        [Sequelize.col("tbl_produto.descricao_produto"), "descricao_produto"],
        [Sequelize.fn("sum", Sequelize.col("quantidade_venda_produto")), "totalVendido"],
      ],
      include: [
        {
          model: Produto,
          as: "tbl_produto",
          attributes: [],
        },
      ],
      group: ["tbl_produto.descricao_produto"],
      order: [[Sequelize.fn("sum", Sequelize.col("quantidade_venda_produto")), "ASC"]],
      limit: 5,
    });

    // Formas de pagamento
    const formasPagamentoRaw = await Venda.findAll({
      attributes: [
        "forma_pag_venda",
        [Sequelize.fn("count", Sequelize.col("forma_pag_venda")), "totalVendas"],
      ],
      group: ["forma_pag_venda"],
      order: [[Sequelize.fn("count", Sequelize.col("forma_pag_venda")), "DESC"]],
    });

    // KPIs (fallbacks protegidos)
    const kpis = {
      totalVendas: (await Venda.sum("total_pago_venda")) || 0,
      totalProdutos: (await Produto.count()) || 0,
      totalEstoque: (await Produto.sum("quantidade_produto")) || 0,
    };

    // Map to plain objects (evita problemas ao serializar)
    const vendasPorCategoria = vendasPorCategoriaRaw.map((r) => r.get({ plain: true }));
    const vendasPorMes = vendasPorMesRaw.map((r) => r.get({ plain: true }));
    const estoquePorCategoria = estoquePorCategoriaRaw.map((r) => r.get({ plain: true }));
    const produtosMenorVenda = produtosMenorVendaRaw.map((r) => r.get({ plain: true }));
    const formasPagamento = formasPagamentoRaw.map((r) => r.get({ plain: true }));

    // Detecção de queda de vendas e recomendação de reposição (subconjunto para performance)
    const produtosEmAnalise = await Produto.findAll({ limit: 200 });
    const alertas = [];
    const sugestoesReposicao = [];

    for (const produto of produtosEmAnalise) {
      try {
        const vendasRecentes = await Venda.findAll({
          where: { fk_produto: produto.pk_produto },
          order: [["data_venda", "DESC"]],
          limit: 30,
        });

        if (vendasRecentes.length >= 3) {
          // Construir pontos (do mais antigo para o mais recente)
          const dadosTendencia = vendasRecentes
            .slice()
            .reverse()
            .map((v, i) => ({ x: i + 1, y: Number(v.quantidade_venda_produto) }));

          // regressao deve ser função exportada do seu DAO/previsao
          const modelo = typeof regressao === "function" ? regressao(dadosTendencia, "linear") : null;

          if (modelo && typeof modelo.m === "number") {
            if (modelo.m < 0) {
              alertas.push({
                id: produto.pk_produto,
                descricao: produto.descricao_produto,
                mensagem: "Tendência de queda de vendas detectada.",
                tendencia: modelo.m,
              });
            } else if (modelo.m > 0) {
              const soma = dadosTendencia.reduce((s, it) => s + it.y, 0);
              const media = soma / dadosTendencia.length;
              if (produto.quantidade_produto < Math.ceil(media * 2)) {
                sugestoesReposicao.push({
                  id: produto.pk_produto,
                  descricao: produto.descricao_produto,
                  mensagem: "Vendas crescentes — sugerida reposição.",
                  estoqueAtual: produto.quantidade_produto,
                  mediaVendas: Math.round(media),
                });
              }
            }
          }
        }
      } catch (innerErr) {
        // não interrompe a coleta se um produto der problema
        console.error("Erro ao analisar produto (continua):", produto.pk_produto, innerErr);
      }
    }

    res.json({
      vendasPorCategoria,
      vendasPorMes,
      estoquePorCategoria,
      produtosMenorVenda,
      formasPagamento,
      kpis,
      alertas,
      sugestoesReposicao,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// Rota para exibir o dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

// Rota para a API de Machine Learning (previsão de demanda por produto)
app.get("/api/previsao/:idProduto/:dias", async (req, res) => {
  try {
    const idProduto = parseInt(req.params.idProduto);
    const dias = parseInt(req.params.dias);
    const resultado = await preverDemanda(idProduto, dias);
    res.json(resultado);
  } catch (error) {
    console.error("Erro em /api/previsao:", error);
    res.status(500).json({ error: "Erro ao obter previsão." });
  }
});

// Nova rota para API de ML (previsão por categoria)
app.get("/api/previsao-categoria/:categoria/:dias", async (req, res) => {
  try {
    const categoria = req.params.categoria;
    const dias = parseInt(req.params.dias);
    // preventiva: verificar se função existe
    if (typeof preverDemandaPorCategoria !== "function") {
      return res.status(500).json({ error: "Função preverDemandaPorCategoria não disponível no backend." });
    }
    const resultado = await preverDemandaPorCategoria(categoria, dias);
    res.json(resultado);
  } catch (error) {
    console.error("Erro em /api/previsao-categoria:", error);
    res.status(500).json({ error: "Erro ao obter previsão por categoria." });
  }
});

// -------------------------------------------------------------
// ROTAS NOVAS NECESSÁRIAS PELO FRONTEND (categorias / produtos)
// -------------------------------------------------------------
app.get("/api/categorias", async (req, res) => {
  try {
    const categoriasRaw = await Produto.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("categoria_produto")), "categoria_produto"]],
      order: [["categoria_produto", "ASC"]],
    });
    const categorias = categoriasRaw.map((c) => c.categoria_produto);
    res.json(categorias);
  } catch (err) {
    console.error("Erro em /api/categorias:", err);
    res.status(500).json({ error: "Erro ao buscar categorias." });
  }
});

app.get("/api/produtos-por-categoria/:categoria", async (req, res) => {
  try {
    const produtos = await Produto.findAll({
      where: { categoria_produto: req.params.categoria },
      attributes: ["pk_produto", "descricao_produto"],
      order: [["descricao_produto", "ASC"]],
    });
    res.json(produtos);
  } catch (err) {
    console.error("Erro em /api/produtos-por-categoria:", err);
    res.status(500).json({ error: "Erro ao buscar produtos da categoria." });
  }
});

// ----------------------- Rotas de Produto ---------------------------
app.get("/consultaProduto", async (req, res) => {
  try {
    const posts = await Produto.findAll();
    res.render("listagemProduto", { posts: posts });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return sendErrorResponse(res, "Erro ao buscar produtos!", "/consultaProduto");
  }
});

app.get("/cadastroProduto", (req, res) => {
  res.render("formularioProduto");
});

app.get("/", (req, res) => {
  res.render("inicial");
});

app.get("/deletar/:pk_produto", (req, res) => {
  Produto.destroy({ where: { pk_produto: req.params.pk_produto } })
    .then(() => {
      res.send(`
      <script>
      window.location.href = '/consultaProduto';
      </script>
      `);
    })
    .catch((error) => {
      console.error("Erro ao apagar produto: ", error);
      return sendErrorResponse(res, "Este produto não existe", "/consultaProduto");
    });
});

app.post("/tbl_produto", (req, res) => {
  Produto.create({
    descricao_produto: req.body.descProduto.toUpperCase(),
    categoria_produto: req.body.catProduto.toUpperCase(),
    valor_compra_produto: req.body.valorCompraProduto,
    valor_bruto_venda_produto: req.body.valorBrutoVendaProduto,
    quantidade_produto: req.body.quantidadeProduto,
  })
    .then(() => {
      return sendSuccessResponse(res, "Produto cadastrado com sucesso", "/cadastroProduto");
    })
    .catch((error) => {
      console.error("Erro ao inserir produto no banco de dados: " + error);
      return sendErrorResponse(res, "Erro ao inserir produto no banco de dados!", "/cadastroProduto");
    });
});

app.get("/editar/:id", async (req, res) => {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (produto) {
      res.render("editarProduto", { produto });
    } else {
      res.send("Produto não encontrado");
    }
  } catch (error) {
    console.error("Erro ao ir a tela de edicao de produto:", error);
    return sendErrorResponse(res, "Erro ao ir a tela de edicao de produto!", "/consultaProduto");
  }
});

app.put("/editar/:pk_produto", async (req, res) => {
  try {
    const { pk_produto } = req.params;
    const {
      descProduto,
      catProduto,
      valorCompraProduto,
      valorBrutoVendaProduto,
      quantidadeProduto,
    } = req.body;

    const produto = await Produto.findByPk(pk_produto);
    if (!produto) {
      return sendErrorResponse(res, "Produto não encontrado!", "/consultaProduto");
    }

    await Produto.update(
      {
        descricao_produto: descProduto,
        categoria_produto: catProduto,
        valor_compra_produto: valorCompraProduto,
        valor_bruto_venda_produto: valorBrutoVendaProduto,
        quantidade_produto: quantidadeProduto,
      },
      { where: { pk_produto: pk_produto } }
    );

    return sendSuccessResponse(res, "Produto atualizado com sucesso!", "/consultaProduto");
  } catch (error) {
    console.error("Erro ao editar produto:", error);
    return sendErrorResponse(res, "Erro ao atualizar produto!", "/consultaProduto");
  }
});

// ----------------------- Rotas de Venda -----------------------------
app.get("/consultaVenda", async (req, res) => {
  try {
    const venda = await Venda.findAll({
      attributes: ["pk_venda", "data_venda", "quantidade_venda_produto", "total_pago_venda", "forma_pag_venda"],
      include: [
        {
          model: Produto,
          as: "tbl_produto",
          required: true,
          attributes: ["descricao_produto", "valor_bruto_venda_produto"],
        },
      ],
    });

    res.render("listagemVenda", { posts: venda });
  } catch (error) {
    console.error("Erro ao buscar vendas: ", error);
    return sendErrorResponse(res, "Erro ao buscar vendas!", "/consultaVenda");
  }
});

app.get("/cadastroVenda", (req, res) => {
  res.render("formularioVenda");
});

app.get("/deletarVenda/:pk_venda", (req, res) => {
  Venda.destroy({ where: { pk_venda: req.params.pk_venda } })
    .then(() => {
      res.send(`
      <script>
      window.location.href = '/consultaVenda';
      </script>
      `);
    })
    .catch((error) => {
      console.error("Erro ao deletar venda (banco de dados): ", error);
      return sendErrorResponse(res, "Erro ao deletar venda (banco de dados)!", "/consultaVenda");
    });
});

app.get("/buscar-produto", async (req, res) => {
  try {
    const termoBusca = req.query.q;

    const produtos = await Produto.findAll({
      where: {
        descricao_produto: {
          [Op.like]: `%${termoBusca}%`,
        },
      },
    });

    if (produtos.length === 0) {
      return res.json([]);
    }

    res.json(
      produtos.map((produto) => ({
        descricao_produto: produto.descricao_produto,
        valor_bruto_venda_produto: produto.valor_bruto_venda_produto,
      }))
    );
  } catch (error) {
    console.error("Erro ao buscar produtos no campo texto:", error);
    return sendErrorResponse(res, "Erro ao buscar produtos no campo texto!", "/cadastroVenda");
  }
});

app.post("/tbl_venda", async (req, res) => {
  try {
    let {
      descProduto,
      qntVendaProduto,
      totalPedidoVenda,
      descontoVenda,
      totalPagoVenda,
      formaPagVenda,
    } = req.body;

    const produto = await Produto.findOne({
      where: { descricao_produto: descProduto },
    });

    if (!produto) {
      return sendErrorResponse(res, "Produto não encontrado!", "/cadastroVenda");
    }

    qntVendaProduto = Number(qntVendaProduto);
    if (produto.quantidade_produto < qntVendaProduto) {
      return sendErrorResponse(res, "Estoque insuficiente!", "/cadastroVenda");
    }

    await Produto.update(
      { quantidade_produto: produto.quantidade_produto - qntVendaProduto },
      { where: { pk_produto: produto.pk_produto } }
    );

    const dataVenda = new Date().toISOString().slice(0, 10); // formato YYYY-MM-DD
    descontoVenda = descontoVenda || 0;

    await Venda.create({
      data_venda: dataVenda,
      fk_produto: produto.pk_produto,
      fk_valor_venda_produto: produto.valor_bruto_venda_produto,
      quantidade_venda_produto: qntVendaProduto,
      total_pedido_venda: totalPedidoVenda,
      desconto_venda: descontoVenda,
      total_pago_venda: totalPagoVenda,
      forma_pag_venda: formaPagVenda,
    });

    return sendSuccessResponse(res, "Venda realizada com sucesso!", "/cadastroVenda");
  } catch (error) {
    console.error("Erro ao processar a venda:", error);
    return sendErrorResponse(res, "Erro ao cadastrar a venda. Tente novamente.", "/cadastroVenda");
  }
});

// ----------------------- Funções Auxiliares -----------------------------
function sendErrorResponse(res, message, redirectUrl) {
  res.send(`
<script>
alert('${message}');
window.location.href = '${redirectUrl}';
</script>
`);
}

function sendSuccessResponse(res, message, redirectUrl) {
  res.send(`
<script>
alert('${message}');
window.location.href = '${redirectUrl}';
</script>
`);
}

// start
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
