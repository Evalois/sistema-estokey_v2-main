// Importando modulos
const conexao = require("./conexao");
const Produto = require("./produto");

//----------------------- Tela de Venda -----------------------------
const Venda = conexao.sequelize.define(
  "tbl_venda",
  {
    pk_venda: {
      type: conexao.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    data_venda: {
      type: conexao.Sequelize.DATEONLY,
      allowNull: false,
    },
    fk_produto: {
      type: conexao.Sequelize.INTEGER,
      allowNull: false,
    },
    fk_valor_venda_produto: {
      type: conexao.Sequelize.DOUBLE,
      allowNull: false,
    },
    quantidade_venda_produto: {
      type: conexao.Sequelize.INTEGER,
      allowNull: false,
    },
    total_pedido_venda: {
      type: conexao.Sequelize.DOUBLE,
      allowNull: false,
    },
    desconto_venda: {
      type: conexao.Sequelize.DOUBLE,
      allowNull: true,
    },
    total_pago_venda: {
      type: conexao.Sequelize.DOUBLE,
      allowNull: false,
    },
    forma_pag_venda: {
      type: conexao.Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true, // Impede que o Sequelize altere o nome da tabela
    timestamps: false, // Desativa a criacao automatica das colunas createdAt e updatedAt
  }
);

// Definir relacionamento (Uma Venda tem um Produto)
Venda.belongsTo(Produto, {
  constraint: true,
  foreignKey: "fk_produto",
  as: "tbl_produto",
});

// Sincronizando a tabela de vendas
Venda.sync({ force: false }) // Use `force: false` se não quiser recriar a tabela em cada execucao
  .then(() => {
    console.log("Tabela 'tbl_venda' criada/recriada com sucesso!");
  })
  .catch((erro) => {
    console.error("Erro ao criar a tabela 'tbl_venda': ", erro);
  });

module.exports = Venda;
