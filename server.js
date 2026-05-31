import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const VALID_ELEMENTS = new Set([
    'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
    'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
    'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
    'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
    'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'Hf', 'Ta', 'W', 'Re',
    'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At',
    'Rn', 'Fr', 'Ra', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu',
    'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Ac', 'Th',
    'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
    'Md', 'No', 'Lr'
]);

function validateChemicalFormula(formula) {
    if (!formula || typeof formula !== 'string') {
        return { valid: false, error: '分子式不能为空' };
    }

    const trimmed = formula.trim();
    if (trimmed.length === 0) {
        return { valid: false, error: '分子式不能为空' };
    }

    if (trimmed.length > 50) {
        return { valid: false, error: '分子式过长' };
    }

    const formulaRegex = /^([A-Z][a-z]?)(\d*)(([A-Z][a-z]?)(\d*))*$/;
    if (!formulaRegex.test(trimmed)) {
        return { valid: false, error: '分子式格式不正确，仅支持元素符号加数字' };
    }

    const elements = trimmed.match(/[A-Z][a-z]?/g) || [];
    for (const element of elements) {
        if (!VALID_ELEMENTS.has(element)) {
            return { valid: false, error: `未知元素: ${element}` };
        }
    }

    const counts = trimmed.match(/\d+/g) || [];
    for (const count of counts) {
        const num = parseInt(count, 10);
        if (num < 1 || num > 999) {
            return { valid: false, error: `原子数量无效: ${count}` };
        }
    }

    return { valid: true, formula: trimmed };
}

app.use(cors());
app.use(express.json());

const staticDir = NODE_ENV === 'production' 
  ? path.join(__dirname, 'dist') 
  : path.join(__dirname, 'public');
app.use(express.static(staticDir));

console.log(`Environment: ${NODE_ENV}`);
console.log(`Serving static files from: ${staticDir}`);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'molecules.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS molecule_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    formula TEXT NOT NULL,
    temperature REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.get('/api/configs', (req, res) => {
  db.all('SELECT * FROM molecule_configs ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/configs', (req, res) => {
  const { formula, temperature } = req.body;
  
  if (!formula || temperature === undefined) {
    res.status(400).json({ error: '分子式和温度参数不能为空' });
    return;
  }

  const formulaValidation = validateChemicalFormula(formula);
  if (!formulaValidation.valid) {
    res.status(400).json({ error: formulaValidation.error });
    return;
  }

  const tempNum = parseFloat(temperature);
  if (isNaN(tempNum) || tempNum < 0 || tempNum > 10000) {
    res.status(400).json({ error: '温度参数无效，范围: 0-10000K' });
    return;
  }
  
  db.run('INSERT INTO molecule_configs (formula, temperature) VALUES (?, ?)',
    [formulaValidation.formula, tempNum],
    function(err) {
      if (err) {
        res.status(500).json({ error: '数据库错误: ' + err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        formula: formulaValidation.formula, 
        temperature: tempNum,
        message: '配置保存成功'
      });
    }
  );
});

app.delete('/api/configs/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM molecule_configs WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deleted: this.changes });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
