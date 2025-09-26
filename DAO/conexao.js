// Importando modulos
const mysql2 = require("mysql2");
const Sequelize = require("sequelize");

// Configuração da conexão com o banco de dados MySQL - REMOTO
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    // timestamps - retirada da criacao automatica das colunas createAt e updatedAt
    define: {
      timestamps: false,
    },
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    dialectModule: mysql2,
    port: process.env.MYSQL_PORT,
  }
);

// Verificacao da conexao com o banco de dados
sequelize
.authenticate()
.then(() => {
    console.log("Conexão bem sucedida ao banco de dados - MySQL");
})
.catch((erro) => {
    console.error("Erro ao conectar ao banco de dados: ", erro);
});

// Exportando modulos
module.exports = {
  Sequelize: Sequelize,
  sequelize: sequelize,
};