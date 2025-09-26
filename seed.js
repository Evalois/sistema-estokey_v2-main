// seed.js

const { faker } = require('@faker-js/faker/locale/pt_BR');
const { sequelize } = require('./DAO/conexao.js');
const Produto = require('./DAO/produto');
const Venda = require('./DAO/venda');

// A função de seeding agora é exportada para ser chamada por outro script
async function seedDatabase() {
    try {
        console.log("Sincronizando banco de dados...");
        // O 'force: true' apaga e recria as tabelas. Remova isso após o primeiro uso!
        await sequelize.sync({ force: true }); 
        console.log("Banco de dados sincronizado. Criando dados falsos...");

        // Catálogo base de produtos gamer e informática
        const produtosData = [
            // Placas de vídeo
            { descricao: 'Placa de Vídeo RTX 4060 Ti 16GB Gigabyte', categoria: 'Placa de Vídeo', valor_compra: 2500, valor_venda: 3200 },
            { descricao: 'Placa de Vídeo RX 7700 XT 12GB Asus', categoria: 'Placa de Vídeo', valor_compra: 2200, valor_venda: 2900 },
            { descricao: 'Placa de Vídeo RTX 4080 Super 16GB MSI', categoria: 'Placa de Vídeo', valor_compra: 5000, valor_venda: 6400 },
            { descricao: 'Placa de Vídeo NVIDIA RTX 5090', categoria: 'Placa de Vídeo', valor_compra: 6000, valor_venda: 8000 },
            { descricao: 'Placa de Vídeo Galax GeForce RTX 5080 1-Click OC White 16GB GDDR7', categoria: 'Placa de Vídeo', valor_compra: 6000, valor_venda: 7500 },
            { descricao: 'Placa de Video Gigabyte Radeon RX 7600 Gaming OC 8GB GDDR6', categoria: 'Placa de Vídeo', valor_compra: 1500, valor_venda: 2000 },
            { descricao: 'Placa de Video Galax GeForce RTX 5060 Ti 1-Click OC 16GB GDDR7', categoria: 'Placa de Vídeo', valor_compra: 3000, valor_venda: 4000 },
            { descricao: 'Placa de Video PNY Quadro K2200 4GB GDDR5', categoria: 'Placa de Vídeo', valor_compra: 800, valor_venda: 1100 },

            // Processadores
            { descricao: 'Processador AMD Ryzen 7 7800X3D', categoria: 'Processador', valor_compra: 2000, valor_venda: 2700 },
            { descricao: 'Processador Intel Core i7-13700KF', categoria: 'Processador', valor_compra: 1800, valor_venda: 2400 },
            { descricao: 'Processador Intel Core i9-14900K', categoria: 'Processador', valor_compra: 3200, valor_venda: 4000 },
            { descricao: 'Processador AMD Ryzen 9 9950X', categoria: 'Processador', valor_compra: 2500, valor_venda: 3200 },
            { descricao: 'Processador Intel Core i5-14600K', categoria: 'Processador', valor_compra: 1500, valor_venda: 2000 },
            { descricao: 'Processador AMD Ryzen 5 7600', categoria: 'Processador', valor_compra: 1000, valor_venda: 1400 },

            // Memórias
            { descricao: 'Memória RAM Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz', categoria: 'Memória RAM', valor_compra: 600, valor_venda: 850 },
            { descricao: 'Memória RAM Kingston Fury Beast 16GB DDR4 3200MHz', categoria: 'Memória RAM', valor_compra: 200, valor_venda: 320 },
            { descricao: 'Memória RAM HyperX Fury 16GB DDR4 3200MHz', categoria: 'Memória RAM', valor_compra: 200, valor_venda: 300 },
            { descricao: 'Memória RAM XPG Lancer 32GB (2x16GB) DDR5 6000MHz', categoria: 'Memória RAM', valor_compra: 600, valor_venda: 800 },

            // SSDs
            { descricao: 'SSD Samsung 980 PRO 2TB NVMe', categoria: 'SSD', valor_compra: 900, valor_venda: 1300 },
            { descricao: 'SSD Kingston NV2 1TB M.2 NVMe', categoria: 'SSD', valor_compra: 300, valor_venda: 450 },
            { descricao: 'SSD Team Group MS30 256GB M.2 SATA', categoria: 'SSD', valor_compra: 150, valor_venda: 250 },
            { descricao: 'SSD PNY CS900 2TB SATA', categoria: 'SSD', valor_compra: 500, valor_venda: 700 },
            { descricao: 'SSD Crucial P5 Plus 500GB PCIe NVMe', categoria: 'SSD', valor_compra: 400, valor_venda: 550 },

            // Placas-mãe
            { descricao: 'Placa-mãe ASUS TUF B650-Plus WiFi', categoria: 'Placa-mãe', valor_compra: 1100, valor_venda: 1500 },
            { descricao: 'Placa-mãe Gigabyte Z790 Aorus Elite AX', categoria: 'Placa-mãe', valor_compra: 1800, valor_venda: 2500 },
            { descricao: 'Placa Mae Gigabyte B760M Aorus Elite WiFi6E Gen5 DDR5 LGA1700', categoria: 'Placa-mãe', valor_compra: 1000, valor_venda: 1400 },
            { descricao: 'Placa Mae Pichau Danuri B550M-PX DDR4 AM4', categoria: 'Placa-mãe', valor_compra: 500, valor_venda: 700 },
            { descricao: 'Placa Mae ASRock B450M Steel Legend DDR4 AM4', categoria: 'Placa-mãe', valor_compra: 400, valor_venda: 600 },

            // Fontes
            { descricao: 'Fonte Corsair RM750x 750W 80 Plus Gold Modular', categoria: 'Fonte', valor_compra: 600, valor_venda: 850 },
            { descricao: 'Fonte Redragon RGPS 600W 80 Plus Bronze', categoria: 'Fonte', valor_compra: 300, valor_venda: 450 },
            { descricao: 'Fonte Corsair CX650M 650W 80 Plus Bronze Modular', categoria: 'Fonte', valor_compra: 400, valor_venda: 550 },
            { descricao: 'Fonte EVGA 600W 80 Plus White', categoria: 'Fonte', valor_compra: 300, valor_venda: 400 },

            // Resfriamento
            { descricao: 'Water Cooler Corsair iCUE H100i RGB Elite', categoria: 'Resfriamento', valor_compra: 600, valor_venda: 850 },
            { descricao: 'Cooler a Ar Cooler Master Hyper 212 Black', categoria: 'Resfriamento', valor_compra: 180, valor_venda: 280 },
            { descricao: 'Air Cooler DeepCool AK620', categoria: 'Resfriamento', valor_compra: 200, valor_venda: 300 },
            { descricao: 'Water Cooler NZXT Kraken 240', categoria: 'Resfriamento', valor_compra: 600, valor_venda: 800 },

            // Gabinetes
            { descricao: 'Gabinete Gamer Redragon CG-M612', categoria: 'Gabinete', valor_compra: 200, valor_venda: 320 },
            { descricao: 'Gabinete Lian Li Lancool 216 RGB', categoria: 'Gabinete', valor_compra: 500, valor_venda: 750 },
            { descricao: 'Gabinete Cooler Master MasterBox TD500 Mesh', categoria: 'Gabinete', valor_compra: 400, valor_venda: 600 },
            { descricao: 'Gabinete NZXT H510', categoria: 'Gabinete', valor_compra: 300, valor_venda: 450 },

            // Monitores
            { descricao: 'Monitor Gamer LG 27GP850-B 27" 165Hz QHD', categoria: 'Monitor', valor_compra: 1800, valor_venda: 2500 },
            { descricao: 'Monitor Gamer AOC 24G2SP 24" 165Hz', categoria: 'Monitor', valor_compra: 800, valor_venda: 1100 },
            { descricao: 'Monitor Gamer Pichau Nexus Wide 29 29" IPS Ultrawide', categoria: 'Monitor', valor_compra: 800, valor_venda: 1100 },
            { descricao: 'Monitor Gamer Mancer Valak Z3H 24" IPS 2K 180Hz', categoria: 'Monitor', valor_compra: 1000, valor_venda: 1400 },

            // Periféricos
            { descricao: 'Mouse Gamer Logitech G502 Hero', categoria: 'Periféricos', valor_compra: 180, valor_venda: 280 },
            { descricao: 'Teclado Mecânico Redragon K552', categoria: 'Periféricos', valor_compra: 200, valor_venda: 320 },
            { descricao: 'Headset Gamer HyperX Cloud II', categoria: 'Periféricos', valor_compra: 300, valor_venda: 450 },
            { descricao: 'Mousepad Gamer XXL Razer Goliathus', categoria: 'Periféricos', valor_compra: 150, valor_venda: 220 },
            { descricao: 'Mouse Gamer Logitech G PRO X Superlight', categoria: 'Periféricos', valor_compra: 400, valor_venda: 550 },
            { descricao: 'Teclado Mecânico HyperX Alloy Origins', categoria: 'Periféricos', valor_compra: 300, valor_venda: 450 },
            { descricao: 'Headset Gamer Razer BlackShark V2', categoria: 'Periféricos', valor_compra: 300, valor_venda: 450 },

            // Cadeiras
            { descricao: 'Cadeira Gamer DT3sports Spider', categoria: 'Cadeira Gamer', valor_compra: 700, valor_venda: 1100 },
            { descricao: 'Cadeira Gamer Redragon D900', categoria: 'Cadeira Gamer', valor_compra: 900, valor_venda: 1300 },
            { descricao: 'Cadeira Gamer ThunderX3 TGC12', categoria: 'Cadeira Gamer', valor_compra: 600, valor_venda: 900 },
            { descricao: 'Cadeira Gamer Cougar Armor Titan Pro Royal', categoria: 'Cadeira Gamer', valor_compra: 1500, valor_venda: 2000 },

            // Notebooks
            { descricao: 'Notebook Gamer Acer Nitro 5 RTX 4050', categoria: 'Notebook Gamer', valor_compra: 4500, valor_venda: 5500 },
            { descricao: 'Notebook Gamer Lenovo Legion 5 R7 RTX 4060', categoria: 'Notebook Gamer', valor_compra: 6000, valor_venda: 7200 },
            { descricao: 'Notebook Gamer Lenovo IdeaPad Gaming 3 i5 GTX 1650', categoria: 'Notebook Gamer', valor_compra: 3000, valor_venda: 4000 },
            { descricao: 'Notebook Gamer ASUS TUF Gaming A15 RTX 3060', categoria: 'Notebook Gamer', valor_compra: 5000, valor_venda: 6500 },

            // Consoles
            { descricao: 'Console PlayStation 5 Standard', categoria: 'Consoles', valor_compra: 2500, valor_venda: 3200 },
            { descricao: 'Console Nintendo Switch OLED', categoria: 'Consoles', valor_compra: 1500, valor_venda: 2000 },
            { descricao: 'Console Xbox Series X 1TB', categoria: 'Consoles', valor_compra: 2200, valor_venda: 2900 },
            { descricao: 'Console Xbox Series S 512GB', categoria: 'Consoles', valor_compra: 1500, valor_venda: 2000 },

            // Acessórios
            { descricao: 'Webcam Logitech C920 HD Pro', categoria: 'Acessórios', valor_compra: 250, valor_venda: 380 },
            { descricao: 'Fone de Ouvido Bluetooth JBL TUNE500BT', categoria: 'Acessórios', valor_compra: 150, valor_venda: 250 },
            { descricao: 'Roteador Gamer TP-Link Archer GX90 Wi-Fi 6', categoria: 'Acessórios', valor_compra: 900, valor_venda: 1300 },
            { descricao: 'Webcam Logitech C922 Pro HD', categoria: 'Acessórios', valor_compra: 200, valor_venda: 300 },
            { descricao: 'Roteador TP-Link Archer C80 AC1900', categoria: 'Acessórios', valor_compra: 200, valor_venda: 300 },
            { descricao: 'Fone de Ouvido Bluetooth Sony WH-CH710N', categoria: 'Acessórios', valor_compra: 150, valor_venda: 250 },
        ];

        // Criar produtos fixos
        const produtos = [];
        for (const produtoData of produtosData) {
            const produto = await Produto.create({
                descricao_produto: produtoData.descricao,
                categoria_produto: produtoData.categoria,
                valor_compra_produto: produtoData.valor_compra,
                valor_bruto_venda_produto: produtoData.valor_venda,
                quantidade_produto: faker.number.int({ min: 10, max: 150 })
            });
            produtos.push(produto);
        }

        // Listas de termos para gerar nomes de produtos de informática mais realistas
        const adjetivos = ['Gamer', 'Pro', 'Ultimate', 'RGB', 'Wireless', 'Mecânico', 'Titan', 'Fury', 'Viper'];
        const substantivos = ['Mouse', 'Teclado', 'Headset', 'Monitor', 'SSD', 'Placa de Vídeo', 'Webcam', 'Microfone'];
        
        // CORREÇÃO: A variável `categorias` precisa ser definida aqui
        const categorias = [
            'Placa de Vídeo', 'Processador', 'Memória RAM', 'SSD', 'Placa-mãe',
            'Fonte', 'Resfriamento', 'Gabinete', 'Monitor', 'Periféricos',
            'Notebook Gamer', 'Cadeira Gamer', 'Consoles', 'Acessórios'
        ];

        // Criar alguns produtos dinâmicos extras com nomes realistas
        for (let i = 0; i < 20; i++) {
            const categoria = faker.helpers.arrayElement(categorias);
            // CORREÇÃO: Removendo o faker.commerce.productName() para evitar nomes genéricos
            const descricao = `${faker.helpers.arrayElement(substantivos)} ${faker.helpers.arrayElement(adjetivos)} ${faker.string.alphanumeric(8).toUpperCase()}`;

            const produto = await Produto.create({
                descricao_produto: descricao,
                categoria_produto: categoria,
                valor_compra_produto: faker.number.int({ min: 150, max: 7000 }),
                valor_bruto_venda_produto: faker.number.int({ min: 200, max: 9000 }),
                quantidade_produto: faker.number.int({ min: 5, max: 80 })
            });
            produtos.push(produto);
        }

        // Criar uma lista ponderada para as formas de pagamento
        const formasPagamento = ['Cartão', 'Cartão', 'Cartão', 'Pix', 'Pix', 'Pix', 'Boleto', 'Boleto', 'Cartão Parcelado', 'Cartão Parcelado'];

        // Gerar vendas
        for (let i = 0; i < 5000; i++) {
            const produtoAleatorio = faker.helpers.arrayElement(produtos);
            const quantidadeVendida = faker.number.int({ min: 1, max: 5 });
            const totalPedido = produtoAleatorio.valor_bruto_venda_produto * quantidadeVendida;
            const desconto = faker.number.float({ min: 0, max: 0.15, precision: 0.01 });

            await Venda.create({
                data_venda: faker.date.recent({ days: 365 }),
                fk_produto: produtoAleatorio.pk_produto,
                fk_valor_venda_produto: produtoAleatorio.valor_bruto_venda_produto,
                quantidade_venda_produto: quantidadeVendida,
                total_pedido_venda: totalPedido,
                desconto_venda: totalPedido * (1 - desconto),
                total_pago_venda: totalPedido * (1 - desconto),
                forma_pag_venda: faker.helpers.arrayElement(formasPagamento)
            });
        }

        console.log("Dados falsos gerados com sucesso!");
    } catch (error) {
        console.error("Erro ao gerar dados falsos:", error);
    }
}

// Verifica se o script foi executado diretamente e não importado
if (require.main === module) {
    seedDatabase().then(() => {
      console.log('Seed do banco de dados concluído.');
      process.exit(0);
    }).catch(err => {
      console.error('Falha ao executar o seed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;