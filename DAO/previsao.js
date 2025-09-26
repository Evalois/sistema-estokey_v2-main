// Módulo avançado de previsão de demanda com ML
const Produto = require("./produto");
const Venda = require("./venda");
const tf = require("@tensorflow/tfjs-node");
let PolynomialRegression = null;
try {
  PolynomialRegression = require("ml-regression-polynomial");
} catch (err) {
  console.warn("ml-regression-polynomial não encontrado — previsão polinomial ficará indisponível.", err.message);
}

// Métricas de avaliação
function calcularMAE(real, previsto) {
  const n = real.length;
  const erro = real.reduce((acc, val, i) => acc + Math.abs(val - previsto[i]), 0);
  return erro / n;
}
function calcularRMSE(real, previsto) {
  const n = real.length;
  const erro = real.reduce((acc, val, i) => acc + Math.pow(val - previsto[i], 2), 0);
  return Math.sqrt(erro / n);
}

// Regressão linear simples
function linearOLS(dados) {
  const n = dados.length;
  if (n === 0) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of dados) {
    const x = Number(p.x);
    const y = Number(p.y);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { m: 0, b: sumY / n };
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b, predict: (x) => m * x + b };
}

// Rede neural com TensorFlow.js
async function redeNeuralPrevisao(xs, ys, diasFuturos) {
  const inputTensor = tf.tensor2d(xs.map(x => [x]), [xs.length, 1]);
  const outputTensor = tf.tensor2d(ys, [ys.length, 1]);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, inputShape: [1], activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  await model.fit(inputTensor, outputTensor, { epochs: 200, verbose: 0 });

  const futuroX = tf.tensor2d([[xs.length + diasFuturos]]);
  const previsaoTensor = model.predict(futuroX);
  const previsao = (await previsaoTensor.data())[0];
  return Math.max(0, Math.round(previsao));
}

// Função genérica de regressão
function regressao(dados, tipo) {
  if (!dados || dados.length === 0) return null;
  if (tipo === "linear") return linearOLS(dados);
  if (tipo === "polinomial" && PolynomialRegression) {
    const xs = dados.map(d => Number(d.x));
    const ys = dados.map(d => Number(d.y));
    const reg = new PolynomialRegression(xs, ys, 2);
    return { predict: (x) => reg.predict(x), coefficients: reg.coefficients };
  }
  return null;
}

// Previsão por produto
async function preverDemanda(idProduto, diasFuturos) {
  const vendas = await Venda.findAll({
    where: { fk_produto: idProduto },
    order: [["data_venda", "ASC"]],
  });
  if (!vendas || vendas.length < 2) return { error: "Dados insuficientes." };

  const dados = vendas.map(v => ({
    x: new Date(v.data_venda).getTime(),
    y: Number(v.quantidade_venda_produto),
  }));

  const xs = dados.map(d => d.x);
  const ys = dados.map(d => d.y);

  const modeloLinear = linearOLS(dados.map((d, i) => ({ x: i + 1, y: d.y })));
  const previsaoLinear = modeloLinear.predict(dados.length + diasFuturos);

  const previsaoNN = await redeNeuralPrevisao(xs, ys, diasFuturos);

  return {
    produtoId: idProduto,
    dias: diasFuturos,
    linear: Math.max(0, Math.round(previsaoLinear)),
    neural: previsaoNN,
    modelo: { m: modeloLinear.m, b: modeloLinear.b },
  };
}

//Previsão por categoria
async function preverDemandaPorCategoria(categoria, diasFuturos) {
  const vendasCategoria = await Venda.findAll({
    include: [{ model: Produto, as: "tbl_produto", where: { categoria_produto: categoria } }],
    order: [["data_venda", "ASC"]],
  });
  if (!vendasCategoria || vendasCategoria.length < 5) return { error: "Dados insuficientes." };

  const vendasPorDia = {};
  vendasCategoria.forEach(v => {
    const data = new Date(v.data_venda).toISOString().slice(0, 10);
    vendasPorDia[data] = (vendasPorDia[data] || 0) + Number(v.quantidade_venda_produto);
  });

  const datasOrdenadas = Object.keys(vendasPorDia).sort();
  const dados = datasOrdenadas.map((d, i) => ({ x: new Date(d).getTime(), y: vendasPorDia[d] }));

  const xs = dados.map(d => d.x);
  const ys = dados.map(d => d.y);

  const modeloPolinomial = PolynomialRegression ? new PolynomialRegression(xs, ys, 2) : null;
  const previsaoPolinomial = modeloPolinomial ? modeloPolinomial.predict(xs.length + diasFuturos) : null;

  const previsaoNN = await redeNeuralPrevisao(xs, ys, diasFuturos);

  return {
    categoria,
    dias: diasFuturos,
    polinomial: modeloPolinomial ? Math.max(0, Math.round(previsaoPolinomial)) : null,
    neural: previsaoNN,
    coefficients: modeloPolinomial?.coefficients || null,
  };
}

module.exports = {
  preverDemanda,
  preverDemandaPorCategoria,
  regressao,
  calcularMAE,
  calcularRMSE,
};
