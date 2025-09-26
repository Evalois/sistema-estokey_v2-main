// Importando modulos
const conexao = require("./conexao");

// Definindo o modelo Produto
const Produto = conexao.sequelize.define(
  "tbl_produto",
  {
    pk_produto: {
      type: conexao.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    descricao_produto: {
      type: conexao.Sequelize.STRING,
      allowNull: false,
    },
    categoria_produto: {
      type: conexao.Sequelize.STRING,
      allowNull: false,
    },
    valor_compra_produto: {
      type: conexao.Sequelize.DOUBLE,
      allowNull: false,
    },
    valor_bruto_venda_produto: {
      type: conexao.Sequelize.DOUBLE,
      allowNull: false,
    },
    quantidade_produto: {
      type: conexao.Sequelize.INTEGER,
      allowNull: false,
    },
  },
  {
    freezeTableName: true, // Impede que o Sequelize altere o nome da tabela
    timestamps: false, // Desativa a criação automática das colunas createdAt e updatedAt
  }
);
Produto.getTotalProdutos = async () => {
  try {
    const total = await Produto.count();
    return total;
  } catch (erro) {
    console.error("Erro ao buscar a quantidade total de produtos:", erro);
    return 0; // Return 0 in case of an error to prevent the app from crashing
  }
};

// Sincronizando a tabela de produtos
Produto.sync({ force: false }) // Use `force: false` se não quiser recriar a tabela em cada execução
  .then(() => {
    console.log("Tabela 'tbl_produto' foi criada/recriada com sucesso!");
  })
  .catch((erro) => {
    console.error("Erro ao criar a tabela: ", erro);
  });

module.exports = Produto;