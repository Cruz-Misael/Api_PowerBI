const express = require('express');
const mariadb = require('mariadb');
const bodyParser = require('body-parser');
const cors = require("cors");
const app = express();

require('dotenv').config();

app.use(cors()); // Agora está depois da inicialização
app.use(express.json());

const PORT = process.env.PORT || 5000; // Porta dinâmica do Render

app.get("/", (req, res) => {
  res.send("API funcionando! 🚀");
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));



// Configurações do banco de dados
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10,  // Aumente o limite
  acquireTimeout: 20000, // Tempo maior para adquirir conexão
});


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint para autenticação
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await pool.getConnection();
    // Modificando a consulta para buscar o nível de acesso
    const query = 'SELECT email, accessLevel FROM DHO_users WHERE email = ? AND password = ?';
    const rows = await connection.query(query, [email, password]);

    connection.release();

    if (rows.length > 0) {
      const user = rows[0];
      res.status(200).json({
        success: true,
        message: 'Login bem-sucedido!',
        accessLevel: user.accessLevel, 
        email: user.email,
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos.',
      });
    }
  } catch (err) {
    console.error('Erro no servidor:', err);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor.',
    });
  }
});

// Rota para listar todos os usuários
app.get('/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT id, name, email, accessLevel FROM DHO_users'; 
    const rows = await connection.query(query);

    connection.release();

    res.status(200).json(rows); // Retorna os usuários como um array JSON
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


// Endpoint para deletar um usuário pelo ID
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM DHO_users WHERE id = ?';
    await connection.query(query, [id]);
    connection.release();

    res.status(200).json({ message: 'Usuário excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

app.post('/users', async (req, res) => {
  const { name, email, accessLevel } = req.body;

  try {
    const connection = await pool.getConnection();
    const query = 'INSERT INTO DHO_users (name, email, accessLevel) VALUES (?, ?, ?)';
    await connection.query(query, [name, email, accessLevel]);
    connection.release();

    res.status(201).json({ success: true, message: 'Usuário salvo com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
});



// Endpoint para atualizar senha do usuário
app.put('/users/update-password', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE DHO_users SET password = ? WHERE email = ?';
    const result = await connection.query(query, [password, email]);
    connection.release();

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Senha atualizada com sucesso!' });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


app.post('/users/update-password', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE DHO_users SET password = ? WHERE email = ?';
    const result = await connection.query(query, [password, email]);
    connection.release();

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Senha atualizada com sucesso!' });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao atualizar a senha:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});



// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rota para salvar novas vagas
app.post('/opportunities', async (req, res) => {
  const {
    dataAbertura, cargo, motivo, nomeSubstituido, time,
    area, local, status, prazo, dataTerminoSLA, dataAceite,
    situacaoPrazo, recrutador, dataAdmissao, nome,
    posicao, gestor, observacao,
  } = req.body;

  const query = `
    INSERT INTO DHO_opportunities (
      \`DATA ABERTURA\`, \`CARGO\`, \`MOTIVO\`, \`NOME SUBSTITUIDO\`,
      \`TIME\`, \`AREA\`, \`LOCAL\`, \`STATUS\`, \`PRAZO\`,
      \`DATA TERMINO SLA\`, \`DATA ACEITE\`,
      \`SITUACAO PRAZO\`, \`RECRUTADOR\`, \`DATA ADMISSAO\`, \`NOME\`,
      \`POSICAO\`, \`GESTOR\`, \`OBSERVACAO\`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const connection = await pool.getConnection();
    await connection.query(query, [
      dataAbertura, cargo, motivo, nomeSubstituido, time,
      area, local, status, prazo, dataTerminoSLA, dataAceite,
      situacaoPrazo, recrutador, dataAdmissao, nome,
      posicao, gestor, observacao,
    ]);
    connection.release();

    res.status(201).send('Vaga criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    res.status(500).send('Erro ao criar vaga');
  }
});

// Rota para capturar opções de formulário
app.get('/form-options', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const columns = ['CARGO', 'MOTIVO', 'TIME', 'AREA', 'LOCAL', 'RECRUTADOR', 'GESTOR'];
    const options = { STATUS: ['Aberta', 'Fechada', 'Stand By', 'Cancelada'] };

    for (const column of columns) {
      const query = `SELECT DISTINCT \`${column}\` FROM DHO_settings WHERE \`${column}\` IS NOT NULL`;
      const result = await connection.query(query);
      options[column] = result.map((row) => row[column]);
    }

    connection.release();
    res.json(options);
  } catch (error) {
    console.error('Erro ao buscar opções:', error);
    res.status(500).json({ error: 'Erro ao buscar opções para o formulário.' });
  }
});

// Rota para listar oportunidades
app.get('/opportunities', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM DHO_opportunities';
    const results = await connection.query(query);
    connection.release();

    res.status(200).json(results);
  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error);
    res.status(500).json({ error: 'Erro interno ao buscar dados.' });
  }
});


//CAPTURA OS CADASTROS DAS CAIXAS DE SELEÇÕES
app.get('/form-options', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const columns = ['CARGO', 'MOTIVO', 'TIME', 'AREA', 'LOCAL', 'RECRUTADOR', 'GESTOR'];
    const options = { STATUS: ['Aberta', 'Fechada', 'Stand By', 'Cancelada'] }; // Adiciona STATUS

    for (const column of columns) {
      const query = `SELECT DISTINCT \`${column}\` FROM DHO_Application.DHO_settings WHERE \`${column}\` IS NOT NULL`;
      const result = await connection.query(query);
      options[column] = result.map((row) => row[column]);
    }

    connection.release();
    res.json(options);
  } catch (error) {
    console.error('Erro ao buscar opções:', error);
    res.status(500).json({ error: 'Erro ao buscar opções para o formulário.' });
  }
});