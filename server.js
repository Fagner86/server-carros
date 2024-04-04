const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors()); // Isso permite solicitações CORS de qualquer origem

const port = process.env.PORT || 8080;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vendas_carros',
  password: '123456',
  port: 5432,
});

app.use(express.json());

// Rota para obter todos os carros
app.get('/api/cars', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM carros');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter os carros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para excluir um carro pelo ID
app.delete('/api/cars/:carId', async (req, res) => {
  const { carId } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM carros WHERE carro_id = $1', [carId]);
    if (result.rowCount === 1) {
      res.status(200).json({ message: 'Carro excluído com sucesso' });
    } else {
      res.status(404).json({ error: 'Carro não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir o carro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para adicionar um novo carro
app.post('/api/cars', async (req, res) => {
  const { modelo, marca, ano, preco } = req.body; // Recupera os dados do corpo da requisição

  try {
    const result = await pool.query('INSERT INTO carros (modelo, marca, ano, preco) VALUES ($1, $2, $3, $4) RETURNING *', [modelo, marca, ano, preco]);
    const novoCarro = result.rows[0];
    res.status(201).json(novoCarro); // Retorna o novo carro adicionado com o status 201 (Created)
  } catch (error) {
    console.error('Erro ao adicionar o carro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/cars/sell/:carId', async (req, res) => {
  const { carId } = req.params;
  const { clienteId, dataVenda, preco } = req.body;

  try {
    // Registrar os detalhes da venda na tabela 'vendas'
    await pool.query('INSERT INTO vendas (carro_id, cliente_id, data_venda, valor) VALUES ($1, $2, $3, $4)', [carId, clienteId, dataVenda, preco]);
      
    res.status(200).json({ message: 'Carro vendido com sucesso' });
  } catch (error) {
    console.error('Erro ao vender o carro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Rota para atualizar um carro pelo ID
app.put('/api/cars/:carId', async (req, res) => {
  const { carId } = req.params;
  const { modelo, marca, ano, preco } = req.body;

  try {
    const result = await pool.query('UPDATE carros SET modelo = $1, marca = $2, ano = $3, preco = $4 WHERE carro_id = $5', [modelo, marca, ano, preco, carId]);
    if (result.rowCount === 1) {
      res.status(200).json({ message: 'Carro atualizado com sucesso' });
    } else {
      res.status(404).json({ error: 'Carro não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar o carro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter todos os carros vendidos
app.get('/api/sold_cars', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM carrosvendidos'); // Alterado para o nome correto da tabela
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter os carros vendidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter todos os clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter os clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter as vendas por marca
app.get('/api/vendas_por_marca', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendaspormarca');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter as vendas por marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar o total vendido
app.get('/api/total_vendido', async (req, res) => {
  try {
    const result = await pool.query('SELECT calcular_total_vendas()');
    const totalVendido = result.rows[0].calcular_total_vendas;
    res.json({ total_vendido: totalVendido });
  } catch (error) {
    console.error('Erro ao obter o total vendido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar a marca mais vendida
app.get('/api/marca_mais_vendida', async (req, res) => {
  try {
    const result = await pool.query('SELECT marca_mais_vendida()');
    const marcaMaisVendida = result.rows[0].marca_mais_vendida;
    res.json({ marca_mais_vendida: marcaMaisVendida });
  } catch (error) {
    console.error('Erro ao obter a marca mais vendida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/cars/:carId', async (req, res) => {
  const carId = req.params.carId;
  const updatedDetails = req.body;

  try {
    // Construa a consulta SQL para atualizar os detalhes do carro
    const query = {
      text: 'UPDATE carros SET modelo = $1, marca = $2, ano = $3, preco = $4 WHERE carro_id = $5 RETURNING *',
      values: [updatedDetails.modelo, updatedDetails.marca, updatedDetails.ano, updatedDetails.preco, carId],
    };

    // Execute a consulta SQL
    const result = await pool.query(query);

    // Verifique se algum registro foi atualizado
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Carro não encontrado' });
    }

    // Se a atualização for bem-sucedida, retorne os detalhes atualizados do carro
    const updatedCar = result.rows[0];
    res.json(updatedCar);
  } catch (error) {
    console.error('Erro ao atualizar os detalhes do carro:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar os detalhes do carro' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
