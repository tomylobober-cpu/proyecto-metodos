import React, { useState, useEffect, useRef, Component } from 'react';
import * as math from 'mathjs';
import { 
  ChevronUp, 
  ChevronDown, 
  Play, 
  AlertCircle, 
  Table as TableIcon,
  Sparkles,
  Search,
  Sigma,
  Binary,
  TrendingUp,
  Plus,
  Trash2,
  Upload,
  FileText,
  Check,
  RefreshCw
} from 'lucide-react';

// Error Boundary to prevent black screen on any unhandled error
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#0c0814', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>Se ha recuperado de una excepción en la interfaz</h2>
          <p style={{ color: '#cbd5e1', maxWidth: '600px', marginBottom: '1.5rem' }}>{this.state.error?.message || 'Error inesperado'}</p>
          <button 
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ padding: '0.75rem 1.5rem', background: '#c084fc', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
          >
            Reiniciar aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safe formatting helpers that never crash on undefined, null, or NaN
const fmt = (v, digits = 4) => {
  if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
    return v.toFixed(digits);
  }
  return v !== undefined && v !== null && v !== '' ? String(v) : '-';
};

const fmtExp = (v, digits = 3) => {
  if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
    return v.toExponential(digits);
  }
  return v !== undefined && v !== null && v !== '' ? String(v) : '-';
};

const METHOD_CATEGORIES = [
  {
    id: 'raices',
    title: 'Búsqueda de raíces',
    icon: Search,
    methods: [
      { id: 'biseccion', name: 'Bisección', group: 'raices' },
      { id: 'falsa_posicion', name: 'Falsa Posición', group: 'raices' },
      { id: 'secante', name: 'Secante', group: 'raices' },
      { id: 'newton_raphson', name: 'Newton - Raphson', group: 'raices' },
    ]
  },
  {
    id: 'integracion',
    title: 'Integración numérica',
    icon: Sigma,
    methods: [
      { id: 'trapecio', name: 'Trapecio', group: 'integracion' },
      { id: 'simpson_18', name: 'Simpson 1/3', group: 'integracion' },
      { id: 'simpson_38', name: 'Simpson 3/8', group: 'integracion' },
    ]
  },
  {
    id: 'interpolacion',
    title: 'Interpolación y Regresión',
    icon: Binary,
    methods: [
      { id: 'interp_directa', name: 'Interpolación directa', group: 'interpolacion' },
      { id: 'regresion_mc', name: 'Regresión por mínimos cuadrados', group: 'interpolacion' },
    ]
  },
  {
    id: 'optimizacion',
    title: 'Optimización',
    icon: TrendingUp,
    methods: [
      { id: 'seccion_dorada_uni', name: 'Sección dorada univariada', group: 'optimizacion' },
      { id: 'seccion_dorada_multi', name: 'Sección dorada multivariada', group: 'optimizacion' },
    ]
  }
];

function MainApp() {
  const [selectedCategory, setSelectedCategory] = useState('raices');
  const [method, setMethod] = useState('biseccion');

  // Common inputs
  const [funcStr, setFuncStr] = useState('x^3 - x - 2');
  const [derivStr, setDerivStr] = useState('3*x^2 - 1'); // For Newton-Raphson
  const [limitA, setLimitA] = useState(1);
  const [limitB, setLimitB] = useState(2);
  const [tolerance, setTolerance] = useState(0.0001);
  const [sigFigs, setSigFigs] = useState(4); // Criterio de Scarborough
  const [iterations, setIterations] = useState(20);
  const [stopCondition, setStopCondition] = useState('sig_figs'); // 'sig_figs' | 'iterations' | 'tolerance'

  // Integration inputs
  const [integInputType, setIntegInputType] = useState('function'); // 'function' | 'table'
  const [integN, setIntegN] = useState(6);
  const [integPoints, setIntegPoints] = useState([
    { x: 0, y: 1 },
    { x: 1, y: 3 },
    { x: 2, y: 7 },
    { x: 3, y: 13 },
    { x: 4, y: 21 },
    { x: 5, y: 31 },
    { x: 6, y: 43 }
  ]);

  // Optimization inputs
  const [optiGoal, setOptiGoal] = useState('max');
  const [multiFuncStr, setMultiFuncStr] = useState('(x - 1)^2 + (y + 2)^2');
  const [multiX0, setMultiX0] = useState(0);
  const [multiY0, setMultiY0] = useState(0);
  const [multiLimX, setMultiLimX] = useState([-3, 5]);
  const [multiLimY, setMultiLimY] = useState([-5, 3]);

  // Interpolation & Regression inputs
  const [points, setPoints] = useState([
    { x: 1, y: 2 },
    { x: 2, y: 4.1 },
    { x: 3, y: 5.9 },
    { x: 4, y: 8.2 }
  ]);
  const [xEval, setXEval] = useState(2.5);
  const [regModel, setRegModel] = useState('polinomial');
  const [regDegree, setRegDegree] = useState(1);

  // File Upload State
  const fileInputRef = useRef(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fileRows, setFileRows] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [colX, setColX] = useState(0);
  const [colY, setColY] = useState(1);

  // Results & UI
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTable, setShowTable] = useState(true);
  const canvasRef = useRef(null);
  const errorCanvasRef = useRef(null);

  // Scarborough tolerance: Es = 0.5 * 10^(2 - m) %
  const scarboroughTol = 0.5 * Math.pow(10, 2 - parseInt(sigFigs || 4, 10));

  // Helper safe evaluator
  const evaluateF = (expr, scope) => {
    try {
      return expr.evaluate(scope);
    } catch {
      return NaN;
    }
  };

  // Auto calculate derivative for Newton Raphson when funcStr changes
  useEffect(() => {
    if (method === 'newton_raphson' && funcStr) {
      try {
        const d = math.derivative(funcStr, 'x');
        setDerivStr(d.toString());
      } catch {}
    }
  }, [funcStr, method]);

  // File Upload Handler (CSV / TXT / TSV)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length === 0) throw new Error('El archivo está vacío.');

        const firstLine = lines[0];
        let delim = ',';
        if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length) delim = ';';
        else if (firstLine.includes('\t')) delim = '\t';
        else if (!firstLine.includes(',') && firstLine.includes(' ')) delim = /\s+/;

        const rawRows = lines.map(l => l.trim().split(delim).map(c => c.trim().replace(/^["']|["']$/g, '')));
        const isNumRow = rawRows[0].every(val => !isNaN(parseFloat(val)) && isFinite(val));

        let headers = [];
        let data = [];
        if (isNumRow) {
          headers = rawRows[0].map((_, i) => `Columna ${i + 1}`);
          data = rawRows;
        } else {
          headers = rawRows[0].map((h, i) => h || `Columna ${i + 1}`);
          data = rawRows.slice(1);
        }

        setFileHeaders(headers);
        setFileRows(data);
        const defaultColX = 0;
        const defaultColY = headers.length > 1 ? 1 : 0;
        setColX(defaultColX);
        setColY(defaultColY);
        applyColumns(data, defaultColX, defaultColY);
      } catch (err) {
        alert('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const applyColumns = (rowsData, cx, cy) => {
    const rows = rowsData || fileRows;
    const parsed = [];
    rows.forEach(r => {
      const vx = parseFloat(r[cx]);
      const vy = parseFloat(r[cy]);
      if (!isNaN(vx) && !isNaN(vy) && isFinite(vx) && isFinite(vy)) {
        parsed.push({ x: vx, y: vy });
      }
    });

    if (parsed.length >= 2) {
      if (integInputType === 'table' && ['trapecio', 'simpson_18', 'simpson_38'].includes(method)) {
        setIntegPoints(parsed);
      } else {
        setPoints(parsed);
      }
    } else {
      alert('Se requieren al menos 2 pares de datos numéricos válidos en las columnas seleccionadas.');
    }
  };

  const handleAddPoint = () => {
    const nextX = points.length > 0 ? Number(points[points.length - 1].x) + 1 : 1;
    setPoints([...points, { x: nextX, y: 0 }]);
  };

  const handleRemovePoint = (index) => {
    if (points.length <= 2) {
      alert('Se requieren al menos 2 puntos.');
      return;
    }
    setPoints(points.filter((_, i) => i !== index));
  };

  const handlePointChange = (index, field, value) => {
    const updated = [...points];
    updated[index][field] = parseFloat(value) || 0;
    setPoints(updated);
  };

  const handleAddIntegPoint = () => {
    const lastX = integPoints.length > 0 ? Number(integPoints[integPoints.length - 1].x) : 0;
    const prevX = integPoints.length > 1 ? Number(integPoints[integPoints.length - 2].x) : lastX - 1;
    const step = lastX - prevX > 0 ? lastX - prevX : 1;
    setIntegPoints([...integPoints, { x: lastX + step, y: 0 }]);
  };

  const handleRemoveIntegPoint = (index) => {
    if (integPoints.length <= 2) {
      alert('Se requieren al menos 2 puntos para integrar.');
      return;
    }
    setIntegPoints(integPoints.filter((_, i) => i !== index));
  };

  const handleIntegPointChange = (index, field, value) => {
    const updated = [...integPoints];
    updated[index][field] = parseFloat(value) || 0;
    setIntegPoints(updated);
  };

  // Load Rubric Suggested Benchmark Cases
  const loadTestCase = (mId) => {
    setErrorMsg('');
    if (['biseccion', 'falsa_posicion', 'secante'].includes(mId)) {
      setFuncStr('x^3 - x - 2');
      setLimitA(1);
      setLimitB(2);
      setStopCondition('sig_figs');
      setSigFigs(4);
    } else if (mId === 'newton_raphson') {
      setFuncStr('x^3 - x - 2');
      setDerivStr('3*x^2 - 1');
      setLimitA(1.5);
      setStopCondition('sig_figs');
      setSigFigs(4);
    } else if (['trapecio', 'simpson_18', 'simpson_38'].includes(mId)) {
      setIntegInputType('function');
      setFuncStr('sin(x)');
      setLimitA(0);
      setLimitB(3.141592653589793);
      setIntegN(6);
    } else if (mId === 'regresion_mc') {
      setPoints([
        { x: 1, y: 2 },
        { x: 2, y: 4.1 },
        { x: 3, y: 5.9 },
        { x: 4, y: 8.2 }
      ]);
      setRegModel('polinomial');
      setRegDegree(1);
      setXEval(2.5);
    } else if (mId === 'interp_directa') {
      setPoints([
        { x: 1, y: 1 },
        { x: 2, y: 8 },
        { x: 3, y: 27 }
      ]);
      setXEval(2.5);
    } else if (mId === 'seccion_dorada_uni') {
      setFuncStr('2*sin(x) - x^2/10');
      setLimitA(0);
      setLimitB(4);
      setOptiGoal('max');
      setStopCondition('sig_figs');
      setSigFigs(4);
    } else if (mId === 'seccion_dorada_multi') {
      setMultiFuncStr('(x - 1)^2 + (y + 2)^2');
      setMultiX0(0);
      setMultiY0(0);
      setMultiLimX([-3, 5]);
      setMultiLimY([-5, 3]);
      setOptiGoal('min');
      setStopCondition('iterations');
      setIterations(15);
    }
  };

  // Main Calculation Router
  const runCalculation = () => {
    setErrorMsg('');
    setResult(null);

    try {
      if (['biseccion', 'falsa_posicion', 'secante', 'newton_raphson'].includes(method)) {
        runRootFinding();
      } else if (method === 'seccion_dorada_uni') {
        runGoldenSectionUni();
      } else if (method === 'seccion_dorada_multi') {
        runGoldenSectionMulti();
      } else if (method === 'interp_directa') {
        runDirectInterpolation();
      } else if (method === 'regresion_mc') {
        runRegressionMC();
      } else if (['trapecio', 'simpson_18', 'simpson_38'].includes(method)) {
        runNumericalIntegration();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error en el cálculo numérico.');
    }
  };

  // 1. Root Finding Methods
  const runRootFinding = () => {
    let parsedExpr;
    try {
      parsedExpr = math.compile(funcStr);
    } catch {
      throw new Error('Sintaxis matemática inválida en f(x).');
    }

    let parsedDeriv = null;
    if (method === 'newton_raphson') {
      try {
        let dStr = derivStr;
        if (!dStr || !dStr.trim()) {
          const d = math.derivative(funcStr, 'x');
          dStr = d.toString();
          setDerivStr(dStr);
        }
        parsedDeriv = math.compile(dStr);
      } catch {
        throw new Error("No se pudo calcular la derivada analítica f'(x). Revisa la expresión.");
      }
    }

    const a0 = parseFloat(limitA);
    const b0 = parseFloat(limitB);

    if (isNaN(a0)) throw new Error('El valor inicial x₀ / límite inferior debe ser un número válido.');
    if (method !== 'newton_raphson' && isNaN(b0)) throw new Error('El valor inicial x₁ / límite superior debe ser un número válido.');

    if (method === 'biseccion' || method === 'falsa_posicion') {
      if (a0 >= b0) throw new Error('El límite A debe ser estrictamente menor que el límite B.');

      const fa0 = evaluateF(parsedExpr, { x: a0 });
      const fb0 = evaluateF(parsedExpr, { x: b0 });

      if (isNaN(fa0) || isNaN(fb0)) throw new Error('La función no está definida en los extremos del intervalo.');

      if (fa0 * fb0 >= 0) {
        throw new Error(
          `No se cumple el teorema de Bolzano: f(A)·f(B) = (${fa0.toFixed(4)})·(${fb0.toFixed(4)}) = ${(fa0 * fb0).toFixed(4)} ≥ 0. ` +
          `Debe existir un cambio de signo (f(a)·f(b) < 0) para garantizar al menos una raíz en el intervalo.`
        );
      }
    }

    let a = a0, b = b0, xr = 0, xrPrev = 0, ea = 100;
    const history = [];

    const maxIters = stopCondition === 'iterations' ? parseInt(iterations, 10) : 100;
    let targetTol = 1e-12;
    if (stopCondition === 'sig_figs') {
      targetTol = scarboroughTol;
    } else if (stopCondition === 'tolerance') {
      targetTol = parseFloat(tolerance);
    }

    for (let iter = 1; iter <= maxIters; iter++) {
      const fa = evaluateF(parsedExpr, { x: a });
      const fb = evaluateF(parsedExpr, { x: b });

      if (method === 'biseccion') {
        xr = (a + b) / 2;
      } else if (method === 'falsa_posicion') {
        if (Math.abs(fb - fa) < 1e-15) throw new Error('División por cero en Falsa Posición.');
        xr = b - (fb * (a - b)) / (fa - fb);
      } else if (method === 'secante') {
        if (Math.abs(fb - fa) < 1e-15) throw new Error('División por cero en la Secante: f(x_i) ≈ f(x_{i-1}).');
        xr = b - (fb * (b - a)) / (fb - fa);
      } else if (method === 'newton_raphson') {
        const dfx = evaluateF(parsedDeriv, { x: a });
        if (isNaN(dfx) || Math.abs(dfx) < 1e-14) {
          throw new Error(`Derivada nula: f'(${a.toFixed(5)}) = 0. División por cero en Newton-Raphson.`);
        }
        xr = a - fa / dfx;
      }

      ea = iter > 1 ? Math.abs((xr - xrPrev) / (xr === 0 ? 1 : xr)) * 100 : 100;
      const fxr = evaluateF(parsedExpr, { x: xr });
      const eaStr = iter === 1 ? '-' : ea.toFixed(6) + '%';

      if (method === 'biseccion') {
        history.push({
          iteration: iter,
          xl: a,
          xu: b,
          xr,
          fxl: fa,
          fxr,
          prod: fa * fxr,
          error: eaStr,
          errorVal: iter === 1 ? null : ea
        });
      } else if (method === 'falsa_posicion') {
        history.push({
          iteration: iter,
          xl: a,
          xu: b,
          xr,
          fxl: fa,
          fxu: fb,
          fxr,
          error: eaStr,
          errorVal: iter === 1 ? null : ea
        });
      } else if (method === 'newton_raphson') {
        const dfx = evaluateF(parsedDeriv, { x: a });
        history.push({
          iteration: iter,
          xi: a,
          fxi: fa,
          dfxi: dfx,
          xnext: xr,
          error: eaStr,
          errorVal: iter === 1 ? null : ea
        });
      } else if (method === 'secante') {
        history.push({
          iteration: iter,
          xprev: a,
          xi: b,
          fxprev: fa,
          fxi: fb,
          xnext: xr,
          error: eaStr,
          errorVal: iter === 1 ? null : ea
        });
      }

      if (stopCondition !== 'iterations' && iter > 1 && ea < targetTol) break;
      if (Math.abs(fxr) < 1e-15) break;

      if (method === 'biseccion' || method === 'falsa_posicion') {
        if (fa * fxr < 0) b = xr;
        else if (fa * fxr > 0) a = xr;
        else break;
      } else if (method === 'secante') {
        a = b;
        b = xr;
      } else if (method === 'newton_raphson') {
        a = xr;
      }
      xrPrev = xr;
    }

    setResult({
      method,
      type: 'root',
      value: xr,
      fval: evaluateF(parsedExpr, { x: xr }),
      iterationsCount: history.length,
      finalError: ea,
      history,
      parsedExpr,
      aRange: a0,
      bRange: method === 'newton_raphson' ? a0 + 2 : b0
    });
  };

  // 2. Numerical Integration Methods
  const runNumericalIntegration = () => {
    let a, b, n, xs = [], ys = [];
    let parsedExpr = null;

    if (integInputType === 'function') {
      a = parseFloat(limitA);
      b = parseFloat(limitB);
      n = parseInt(integN, 10);

      if (isNaN(a) || isNaN(b)) throw new Error('Los límites a y b deben ser números válidos.');
      if (a >= b) throw new Error('El límite inferior a debe ser estrictamente menor que el límite superior b.');
      if (n < 1) throw new Error('El número de subintervalos n debe ser al menos 1.');

      if (method === 'simpson_18' && n % 2 !== 0) {
        throw new Error(`Simpson 1/3 exige que el número de subintervalos n sea PAR. Valor actual: ${n}`);
      }
      if (method === 'simpson_38' && n % 3 !== 0) {
        throw new Error(`Simpson 3/8 exige que el número de subintervalos n sea MÚLTIPLO DE 3. Valor actual: ${n}`);
      }

      parsedExpr = math.compile(funcStr);
      const h = (b - a) / n;
      for (let i = 0; i <= n; i++) {
        const xi = a + i * h;
        const yi = evaluateF(parsedExpr, { x: xi });
        if (isNaN(yi) || !isFinite(yi)) throw new Error(`Función indefinida o diverge en x = ${xi.toFixed(4)}`);
        xs.push(xi);
        ys.push(yi);
      }
    } else {
      const sorted = [...integPoints].sort((p1, p2) => p1.x - p2.x);
      xs = sorted.map(p => Number(p.x));
      ys = sorted.map(p => Number(p.y));
      n = xs.length - 1;
      a = xs[0];
      b = xs[xs.length - 1];

      if (n < 1) throw new Error('Se requieren al menos 2 puntos en la tabla de datos.');

      const h0 = xs[1] - xs[0];
      for (let i = 1; i < xs.length - 1; i++) {
        const hi = xs[i + 1] - xs[i];
        if (Math.abs(hi - h0) > 1e-4) {
          throw new Error('Los puntos de la tabla deben estar igualmente espaciados.');
        }
      }

      if (method === 'simpson_18' && n % 2 !== 0) {
        throw new Error(`Simpson 1/3 exige un número PAR de subintervalos. Puntos: ${xs.length} (n = ${n})`);
      }
      if (method === 'simpson_38' && n % 3 !== 0) {
        throw new Error(`Simpson 3/8 exige que n sea múltiplo de 3. Actualmente n = ${n}`);
      }
    }

    const computeIntegral = (evalXs, evalYs, subN) => {
      const stepH = (evalXs[evalXs.length - 1] - evalXs[0]) / subN;
      if (method === 'trapecio') {
        let sumInternal = 0;
        for (let i = 1; i < subN; i++) sumInternal += evalYs[i];
        return (stepH / 2) * (evalYs[0] + 2 * sumInternal + evalYs[subN]);
      } else if (method === 'simpson_18') {
        let sumOdd = 0, sumEven = 0;
        for (let i = 1; i < subN; i++) {
          if (i % 2 !== 0) sumOdd += evalYs[i];
          else sumEven += evalYs[i];
        }
        return (stepH / 3) * (evalYs[0] + 4 * sumOdd + 2 * sumEven + evalYs[subN]);
      } else if (method === 'simpson_38') {
        let sum3k = 0, sumOther = 0;
        for (let i = 1; i < subN; i++) {
          if (i % 3 === 0) sum3k += evalYs[i];
          else sumOther += evalYs[i];
        }
        return ((3 * stepH) / 8) * (evalYs[0] + 3 * sumOther + 2 * sum3k + evalYs[subN]);
      }
      return 0;
    };

    const finalIntegral = computeIntegral(xs, ys, n);
    const finalH = (b - a) / n;

    const history = [];
    if (parsedExpr) {
      let stepSize = method === 'simpson_38' ? 3 : method === 'simpson_18' ? 2 : 1;
      const subNList = [];
      for (let k = stepSize; k <= n; k += stepSize) {
        subNList.push(k);
      }
      if (subNList.length === 0 || subNList[subNList.length - 1] !== n) {
        subNList.push(n);
      }

      let prevInt = null;
      subNList.forEach((k, idx) => {
        const hk = (b - a) / k;
        const subXs = [], subYs = [];
        for (let j = 0; j <= k; j++) {
          const xj = a + j * hk;
          subXs.push(xj);
          subYs.push(evaluateF(parsedExpr, { x: xj }));
        }
        const ik = computeIntegral(subXs, subYs, k);
        const err = prevInt !== null ? Math.abs((ik - prevInt) / (ik === 0 ? 1 : ik)) * 100 : null;
        history.push({
          iteration: idx + 1,
          n: k,
          h: hk,
          integral: ik,
          error: err !== null ? err.toFixed(6) + '%' : '-',
          errorVal: err
        });
        prevInt = ik;
      });
    } else {
      history.push({
        iteration: 1,
        n,
        h: finalH,
        integral: finalIntegral,
        error: '-',
        errorVal: null
      });
    }

    const lastErr = history[history.length - 1]?.errorVal || null;

    setResult({
      method,
      type: 'integration',
      integral: finalIntegral,
      h: finalH,
      n,
      a,
      b,
      finalError: lastErr,
      history,
      errorHistory: history.filter(h => h.errorVal !== null),
      parsedExpr,
      points: xs.map((x, idx) => ({ x, y: ys[idx] })),
      aRange: a,
      bRange: b
    });
  };

  // 3. Sección Áurea Univariada
  const runGoldenSectionUni = () => {
    let parsedExpr;
    try {
      parsedExpr = math.compile(funcStr);
    } catch {
      throw new Error('Sintaxis matemática inválida en f(x).');
    }

    let xl = parseFloat(limitA);
    let xu = parseFloat(limitB);
    if (isNaN(xl) || isNaN(xu)) throw new Error('Define los límites [a, b].');
    if (xl >= xu) throw new Error('El límite a debe ser estrictamente menor que el límite b.');

    const R = (Math.sqrt(5) - 1) / 2;
    let d = R * (xu - xl);
    let x1 = xl + d;
    let x2 = xu - d;
    let f1 = evaluateF(parsedExpr, { x: x1 });
    let f2 = evaluateF(parsedExpr, { x: x2 });

    const maxIters = stopCondition === 'iterations' ? parseInt(iterations, 10) : 60;
    let targetTol = 1e-6;
    if (stopCondition === 'sig_figs') {
      targetTol = scarboroughTol;
    } else if (stopCondition === 'tolerance') {
      targetTol = parseFloat(tolerance);
    }

    const history = [];
    let xOpt = optiGoal === 'max' ? (f1 > f2 ? x1 : x2) : (f1 < f2 ? x1 : x2);
    let ea = 100;

    for (let iter = 1; iter <= maxIters; iter++) {
      xOpt = optiGoal === 'max' ? (f1 > f2 ? x1 : x2) : (f1 < f2 ? x1 : x2);
      if (iter > 1) {
        ea = Math.abs((1 - R) * (xu - xl) / (xOpt === 0 ? 1 : xOpt)) * 100;
      }

      history.push({
        iteration: iter,
        xl,
        xu,
        x1,
        x2,
        f1,
        f2,
        xOpt,
        fOpt: evaluateF(parsedExpr, { x: xOpt }),
        error: iter === 1 ? '-' : ea.toFixed(6) + '%',
        errorVal: iter === 1 ? null : ea
      });

      if (stopCondition !== 'iterations' && iter > 1 && ea < targetTol) break;

      const condition = optiGoal === 'max' ? f1 > f2 : f1 < f2;
      if (condition) {
        xl = x2;
        x2 = x1;
        f2 = f1;
        x1 = xl + R * (xu - xl);
        f1 = evaluateF(parsedExpr, { x: x1 });
      } else {
        xu = x1;
        x1 = x2;
        f1 = f2;
        x2 = xu - R * (xu - xl);
        f2 = evaluateF(parsedExpr, { x: x2 });
      }
    }

    setResult({
      method,
      type: 'opti_uni',
      value: xOpt,
      fval: evaluateF(parsedExpr, { x: xOpt }),
      iterationsCount: history.length,
      finalError: ea,
      history,
      parsedExpr,
      aRange: limitA,
      bRange: limitB
    });
  };

  // 4. Sección Áurea Multivariada
  const runGoldenSectionMulti = () => {
    let parsedExpr;
    try {
      parsedExpr = math.compile(multiFuncStr);
    } catch {
      throw new Error('Sintaxis matemática inválida en f(x, y).');
    }

    let currX = parseFloat(multiX0);
    let currY = parseFloat(multiY0);
    const R = (Math.sqrt(5) - 1) / 2;
    const maxCycles = stopCondition === 'iterations' ? parseInt(iterations, 10) : 15;
    let targetTol = 1e-5;
    if (stopCondition === 'sig_figs') {
      targetTol = scarboroughTol;
    } else if (stopCondition === 'tolerance') {
      targetTol = parseFloat(tolerance);
    }

    const history = [];
    let stepCount = 0;
    let prevVal = evaluateF(parsedExpr, { x: currX, y: currY });
    let ea = 100;

    for (let c = 1; c <= maxCycles; c++) {
      // Opt along X
      let xl = multiLimX[0], xu = multiLimX[1];
      let d = R * (xu - xl);
      let x1 = xl + d, x2 = xu - d;
      let f1 = evaluateF(parsedExpr, { x: x1, y: currY });
      let f2 = evaluateF(parsedExpr, { x: x2, y: currY });

      for (let i = 0; i < 20; i++) {
        if ((optiGoal === 'max' ? f1 > f2 : f1 < f2)) {
          xl = x2; x2 = x1; f2 = f1;
          x1 = xl + R * (xu - xl);
          f1 = evaluateF(parsedExpr, { x: x1, y: currY });
        } else {
          xu = x1; x1 = x2; f1 = f2;
          x2 = xu - R * (xu - xl);
          f2 = evaluateF(parsedExpr, { x: x2, y: currY });
        }
      }
      currX = (optiGoal === 'max' ? f1 > f2 : f1 < f2) ? x1 : x2;
      stepCount++;
      let currentValX = evaluateF(parsedExpr, { x: currX, y: currY });
      let eaX = Math.abs((currentValX - prevVal) / (currentValX === 0 ? 1 : currentValX)) * 100;
      prevVal = currentValX;

      history.push({
        iteration: stepCount,
        activeCoord: 'X',
        currX: currX.toFixed(5),
        currY: currY.toFixed(5),
        xl,
        xu,
        x1,
        x2,
        f1,
        f2,
        error: stepCount === 1 ? '-' : eaX.toFixed(5) + '%',
        errorVal: stepCount === 1 ? null : eaX
      });

      // Opt along Y
      let yl = multiLimY[0], yu = multiLimY[1];
      d = R * (yu - yl);
      let y1 = yl + d, y2 = yu - d;
      f1 = evaluateF(parsedExpr, { x: currX, y: y1 });
      f2 = evaluateF(parsedExpr, { x: currX, y: y2 });

      for (let i = 0; i < 20; i++) {
        if ((optiGoal === 'max' ? f1 > f2 : f1 < f2)) {
          yl = y2; y2 = y1; f2 = f1;
          y1 = yl + R * (yu - yl);
          f1 = evaluateF(parsedExpr, { x: currX, y: y1 });
        } else {
          yu = y1; y1 = y2; f1 = f2;
          y2 = yu - R * (yu - yl);
          f2 = evaluateF(parsedExpr, { x: currX, y: y2 });
        }
      }
      currY = (optiGoal === 'max' ? f1 > f2 : f1 < f2) ? y1 : y2;
      stepCount++;
      let currentValY = evaluateF(parsedExpr, { x: currX, y: currY });
      let eaY = Math.abs((currentValY - prevVal) / (currentValY === 0 ? 1 : currentValY)) * 100;
      prevVal = currentValY;
      ea = eaY;

      history.push({
        iteration: stepCount,
        activeCoord: 'Y',
        currX: currX.toFixed(5),
        currY: currY.toFixed(5),
        xl: yl,
        xu: yu,
        x1: y1,
        x2: y2,
        f1,
        f2,
        error: eaY.toFixed(5) + '%',
        errorVal: eaY
      });

      if (stopCondition !== 'iterations' && eaY < targetTol) break;
    }

    setResult({
      method,
      type: 'opti_multi',
      optPoint: { x: currX, y: currY },
      fval: evaluateF(parsedExpr, { x: currX, y: currY }),
      iterationsCount: history.length,
      finalError: ea,
      history,
      parsedExpr
    });
  };

  // 5. Interpolación Directa
  const runDirectInterpolation = () => {
    const n = points.length - 1;
    const xs = points.map(p => Number(p.x));
    const ys = points.map(p => Number(p.y));

    const uniqueXs = new Set(xs);
    if (uniqueXs.size !== xs.length) {
      throw new Error('Todos los valores xᵢ deben ser distintos entre sí para interpolar.');
    }

    const V = [];
    for (let i = 0; i <= n; i++) {
      const row = [];
      for (let j = 0; j <= n; j++) {
        row.push(Math.pow(xs[i], j));
      }
      V.push(row);
    }

    const coeffs = math.lusolve(V, ys).map(c => c[0]);

    const polyTerms = coeffs.map((c, i) => {
      const val = c.toFixed(4);
      if (i === 0) return `${val}`;
      if (i === 1) return `${val}·x`;
      return `${val}·x^${i}`;
    });
    const polyStr = polyTerms.reverse().join(' + ').replace(/\+\s\-/g, '- ');

    let yEstimated = 0;
    for (let i = 0; i <= n; i++) {
      yEstimated += coeffs[i] * Math.pow(xEval, i);
    }

    const parsedExpr = math.compile(polyStr.replace(/·/g, '*'));

    const history = points.map((p, idx) => {
      let pVal = 0;
      for (let j = 0; j <= n; j++) pVal += coeffs[j] * Math.pow(p.x, j);
      return {
        i: idx + 1,
        x: p.x,
        y: p.y,
        pVal: pVal.toFixed(4)
      };
    });

    setResult({
      method,
      type: 'interpolation',
      degree: n,
      coeffs,
      polyStr,
      xEval,
      yEstimated,
      parsedExpr,
      points,
      history,
      aRange: Math.min(...xs) - 1,
      bRange: Math.max(...xs) + 1
    });
  };

  // 6. Regresión por Mínimos Cuadrados
  const runRegressionMC = () => {
    const n = points.length;
    if (n < 2) throw new Error('Se requieren al menos 2 puntos para la regresión.');

    const xs = points.map(p => Number(p.x));
    const ys = points.map(p => Number(p.y));

    let modelStr = '';
    let parsedExpr;
    let r2 = 0;
    let evalFunc;
    let yEstimated = 0;

    if (regModel === 'polinomial') {
      const m = parseInt(regDegree, 10) || 1;
      if (n <= m) {
        throw new Error(`Para ajustar un polinomio de grado ${m} se requieren al menos ${m + 1} puntos observados.`);
      }

      const A = [];
      const B = [];
      for (let j = 0; j <= m; j++) {
        const row = [];
        for (let k = 0; k <= m; k++) {
          let sumX = 0;
          for (let i = 0; i < n; i++) sumX += Math.pow(xs[i], j + k);
          row.push(sumX);
        }
        A.push(row);

        let sumXY = 0;
        for (let i = 0; i < n; i++) sumXY += Math.pow(xs[i], j) * ys[i];
        B.push(sumXY);
      }

      const aCoeffs = math.lusolve(A, B).map(v => v[0]);

      evalFunc = (x) => {
        let val = 0;
        for (let k = 0; k <= m; k++) val += aCoeffs[k] * Math.pow(x, k);
        return val;
      };

      const polyTerms = aCoeffs.map((c, i) => {
        const val = c.toFixed(4);
        if (i === 0) return `${val}`;
        if (i === 1) return `${val}·x`;
        return `${val}·x^${i}`;
      });
      modelStr = `y = ` + polyTerms.reverse().join(' + ').replace(/\+\s\-/g, '- ');
      parsedExpr = math.compile(modelStr.replace('y = ', '').replace(/·/g, '*'));

      const meanY = math.sum(ys) / n;
      const ssTot = ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
      const ssRes = ys.reduce((acc, y, i) => acc + Math.pow(y - evalFunc(xs[i]), 2), 0);
      r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
      yEstimated = evalFunc(xEval);

    } else if (regModel === 'exponencial') {
      if (ys.some(y => y <= 0)) throw new Error('Para modelo exponencial todos los valores y deben ser > 0.');
      const lnY = ys.map(y => Math.log(y));
      const sumX = math.sum(xs);
      const sumLnY = math.sum(lnY);
      const sumXLnY = xs.reduce((acc, x, i) => acc + x * lnY[i], 0);
      const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

      const b = (n * sumXLnY - sumX * sumLnY) / (n * sumX2 - Math.pow(sumX, 2));
      const a0 = (sumLnY / n) - b * (sumX / n);
      const a = Math.exp(a0);

      modelStr = `y = ${a.toFixed(4)} · e^(${b.toFixed(4)}·x)`;
      parsedExpr = math.compile(`${a} * e^(${b} * x)`);
      evalFunc = (x) => a * Math.exp(b * x);

      const meanY = math.sum(ys) / n;
      const ssTot = ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
      const ssRes = ys.reduce((acc, y, i) => acc + Math.pow(y - evalFunc(xs[i]), 2), 0);
      r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
      yEstimated = evalFunc(xEval);
    }

    const history = points.map((p, idx) => {
      const yPred = evalFunc(p.x);
      const residual = p.y - yPred;
      const err = Math.abs((p.y - yPred) / (p.y === 0 ? 1 : p.y)) * 100;
      return {
        i: idx + 1,
        x: p.x,
        y: p.y,
        yPred: yPred.toFixed(4),
        residual: residual.toFixed(4),
        error: err.toFixed(4) + '%',
        errorVal: err
      };
    });

    setResult({
      method,
      type: 'regression',
      modelStr,
      r2: Math.max(0, r2),
      xEval,
      yEstimated,
      parsedExpr,
      points,
      history,
      aRange: Math.min(...xs) - 1,
      bRange: Math.max(...xs) + 1
    });
  };

  // Run automatically when switching method
  useEffect(() => {
    runCalculation();
  }, [method]);

  // Handle category toggle
  const handleSelectCategory = (catId) => {
    setSelectedCategory(selectedCategory === catId ? null : catId);
  };

  // Robust method switch: updates inputs to sensible defaults and clears stale results
  const handleSelectMethod = (catId, methodId) => {
    setSelectedCategory(catId);
    setMethod(methodId);
    setResult(null);
    setErrorMsg('');

    // Load appropriate defaults to ensure switching NEVER fails or clashes
    if (['biseccion', 'falsa_posicion'].includes(methodId)) {
      setFuncStr('x^3 - x - 2');
      setLimitA(1);
      setLimitB(2);
      setStopCondition('sig_figs');
      setSigFigs(4);
    } else if (methodId === 'newton_raphson') {
      setFuncStr('x^3 - x - 2');
      setLimitA(1.5);
      setStopCondition('sig_figs');
      setSigFigs(4);
      try {
        const d = math.derivative('x^3 - x - 2', 'x');
        setDerivStr(d.toString());
      } catch {}
    } else if (methodId === 'secante') {
      setFuncStr('x^3 - x - 2');
      setLimitA(1);
      setLimitB(2);
      setStopCondition('sig_figs');
      setSigFigs(4);
    } else if (['trapecio', 'simpson_18', 'simpson_38'].includes(methodId)) {
      setFuncStr('sin(x)');
      setLimitA(0);
      setLimitB(3.141592653589793);
      setIntegN(6);
    } else if (methodId === 'seccion_dorada_uni') {
      setFuncStr('2*sin(x) - x^2/10');
      setLimitA(0);
      setLimitB(4);
      setOptiGoal('max');
      setStopCondition('sig_figs');
      setSigFigs(4);
    } else if (methodId === 'seccion_dorada_multi') {
      setMultiFuncStr('(x - 1)^2 + (y + 2)^2');
      setMultiX0(0);
      setMultiY0(0);
      setMultiLimX([-3, 5]);
      setMultiLimY([-5, 3]);
      setOptiGoal('min');
      setStopCondition('iterations');
      setIterations(15);
    } else if (methodId === 'interp_directa') {
      setPoints([
        { x: 1, y: 1 },
        { x: 2, y: 8 },
        { x: 3, y: 27 }
      ]);
      setXEval(2.5);
    } else if (methodId === 'regresion_mc') {
      setPoints([
        { x: 1, y: 2 },
        { x: 2, y: 4.1 },
        { x: 3, y: 5.9 },
        { x: 4, y: 8.2 }
      ]);
      setRegModel('polinomial');
      setRegDegree(1);
      setXEval(2.5);
    }
  };

  // Draw Function / Curve Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 400);
    const height = (canvas.height = canvas.parentElement.clientHeight || 280);

    ctx.clearRect(0, 0, width, height);

    if (!result || result.method !== method) return;

    let parsedExpr = result?.parsedExpr;
    if (!parsedExpr && ['biseccion', 'falsa_posicion', 'secante', 'newton_raphson', 'seccion_dorada_uni', 'trapecio', 'simpson_18', 'simpson_38'].includes(method)) {
      try { parsedExpr = math.compile(funcStr); } catch {}
    }

    if (!parsedExpr && method !== 'seccion_dorada_multi' && !result?.points) return;

    let xMin = -2, xMax = 5;
    if (result?.points && result.points.length > 0) {
      const xs = result.points.map(p => p.x);
      xMin = Math.min(...xs) - 0.5;
      xMax = Math.max(...xs) + 0.5;
    } else if (result?.aRange !== undefined && result?.bRange !== undefined) {
      xMin = Math.min(result.aRange, result.bRange) - 1;
      xMax = Math.max(result.aRange, result.bRange) + 1;
    }

    const samples = 220;
    const pts = [];
    let minY = Infinity, maxY = -Infinity;

    if (parsedExpr) {
      for (let i = 0; i <= samples; i++) {
        const x = xMin + (i / samples) * (xMax - xMin);
        const y = evaluateF(parsedExpr, { x, e: Math.E, pi: Math.PI });
        if (!isNaN(y) && isFinite(y)) {
          pts.push({ x, y });
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (result?.points) {
      for (const p of result.points) {
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }

    if (minY === Infinity) { minY = -2; maxY = 8; }
    if (minY > 0) minY = -0.5;
    if (maxY < 0) maxY = 0.5;
    const ySpan = Math.max(maxY - minY, 1);
    const yStart = minY - ySpan * 0.15;
    const yEnd = maxY + ySpan * 0.15;

    const toX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toY = (y) => height - ((y - yStart) / (yEnd - yStart)) * height;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo((i / 8) * width, 0);
      ctx.lineTo((i / 8) * width, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (i / 8) * height);
      ctx.lineTo(width, (i / 8) * height);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    if (0 >= yStart && 0 <= yEnd) {
      const y0 = toY(0);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(width, y0);
      ctx.stroke();
    }
    if (0 >= xMin && 0 <= xMax) {
      const x0 = toX(0);
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, height);
      ctx.stroke();
    }

    // Draw Function Curve
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < pts.length; i++) {
        const px = toX(pts[i].x);
        const py = toY(pts[i].y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Plot observed data points
    if (result?.points) {
      for (const p of result.points) {
        const px = toX(p.x);
        const py = toY(p.y);
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Plot root or optimum point
    if (result?.type === 'root' && result?.value !== undefined) {
      const rx = toX(result.value);
      const ry = toY(result.fval || 0);
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (result?.type === 'opti_uni' && result?.value !== undefined) {
      const ox = toX(result.value);
      const oy = toY(result.fval || 0);
      ctx.beginPath();
      ctx.arc(ox, oy, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if ((result?.type === 'interpolation' || result?.type === 'regression') && result?.xEval !== undefined && result?.yEstimated !== undefined) {
      const ex = toX(result.xEval);
      const ey = toY(result.yEstimated);
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [result, funcStr, method]);

  // Draw Error Convergence Chart
  useEffect(() => {
    const canvas = errorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 400);
    const height = (canvas.height = canvas.parentElement.clientHeight || 240);

    ctx.clearRect(0, 0, width, height);

    if (!result || result.method !== method) return;

    let errorPoints = [];
    if (result?.errorHistory && result.errorHistory.length > 0) {
      errorPoints = result.errorHistory
        .map(item => ({ x: item.n || item.iteration, y: item.errorVal, label: `n=${item.n || item.iteration}` }))
        .filter(p => p.y !== null && !isNaN(p.y) && isFinite(p.y));
    } else if (result?.history) {
      errorPoints = result.history
        .map((item, idx) => {
          let errVal = null;
          if (typeof item.errorVal === 'number') errVal = item.errorVal;
          else if (item.error && item.error !== '-') {
            errVal = parseFloat(item.error.replace('%', ''));
          }
          return { x: item.iteration || idx + 1, y: errVal, label: `Iter ${item.iteration || idx + 1}` };
        })
        .filter(p => p.y !== null && !isNaN(p.y) && isFinite(p.y));
    }

    if (errorPoints.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '13px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Gráfica de convergencia de error no disponible o completado en 1 paso.', width / 2, height / 2);
      return;
    }

    const xs = errorPoints.map(p => p.x);
    const ys = errorPoints.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) === minX ? minX + 1 : Math.max(...xs);
    const minY = 0;
    const maxY = Math.max(...ys) * 1.15 || 10;

    const toX = (x) => 55 + ((x - minX) / (maxX - minX)) * (width - 85);
    const toY = (y) => height - 30 - (y / maxY) * (height - 50);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const gy = 20 + (i / 5) * (height - 50);
      ctx.beginPath();
      ctx.moveTo(55, gy);
      ctx.lineTo(width - 30, gy);
      ctx.stroke();

      const yVal = maxY - (i / 5) * maxY;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`${yVal.toFixed(2)}%`, 50, gy + 3);
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(55, 20);
    ctx.lineTo(55, height - 30);
    ctx.lineTo(width - 30, height - 30);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px Plus Jakarta Sans';
    ctx.textAlign = 'left';
    ctx.fillText('Error Relativo Aproximado Ea (%)', 60, 16);
    ctx.textAlign = 'right';
    ctx.fillText(result?.type === 'integration' ? 'Subintervalos (n)' : 'Iteración (i)', width - 30, height - 12);

    // Plot Error Line
    ctx.beginPath();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    errorPoints.forEach((p, idx) => {
      const px = toX(p.x);
      const py = toY(p.y);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Area below error curve
    ctx.lineTo(toX(errorPoints[errorPoints.length - 1].x), height - 30);
    ctx.lineTo(toX(errorPoints[0].x), height - 30);
    ctx.closePath();
    ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
    ctx.fill();

    // Plot Points and markers
    errorPoints.forEach((p) => {
      const px = toX(p.x);
      const py = toY(p.y);

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.x}`, px, height - 14);
    });
  }, [result, method]);

  const currentMethodObj = METHOD_CATEGORIES.flatMap(c => c.methods).find(m => m.id === method);
  const currentMethodName = currentMethodObj?.name || 'Selecciona un método';

  return (
    <div className="app-container">
      <div className="content-wrapper">
        
        {/* Header */}
        <div className="header-section">
          <div className="authors-badge">
            <span>Laura Sofia Artunduaga Pulido - Tomás Felipe Lobo Berbesi</span>
          </div>
          <h1 className="main-title">Proyecto Final — Métodos Numéricos</h1>
          <p className="main-subtitle">
            Plataforma interactiva de algoritmos numéricos, tablas de iteraciones y análisis de convergencia
          </p>
        </div>

        {/* Categories Section */}
        <div className="categories-nav-section">
          {METHOD_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isGroupActive = selectedCategory === cat.id;

            return (
              <div 
                key={cat.id} 
                className={`category-card ${isGroupActive ? 'active-group' : 'inactive-group'}`}
                onClick={() => handleSelectCategory(cat.id)}
              >
                <button 
                  className="category-header-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectCategory(cat.id);
                  }}
                >
                  <div className="category-icon-bubble">
                    <Icon size={19} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="category-title">{cat.title}</div>
                  </div>
                  <ChevronDown size={18} className="category-chevron" />
                </button>

                <div className={`methods-collapse-box ${isGroupActive ? 'expanded' : 'collapsed'}`}>
                  <ul className="methods-list">
                    {cat.methods.map((m) => {
                      const isSelected = method === m.id;
                      return (
                        <li key={m.id}>
                          <button
                            className={`method-item-btn ${isSelected ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMethod(cat.id, m.id);
                            }}
                          >
                            <span className="method-bullet"></span>
                            <span>{m.name}</span>
                            {isSelected && <span className="badge-tag">Activo</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="category-status-indicator">
                  <span>{isGroupActive ? '● Haz clic en un método' : 'Hacer clic para ver métodos'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Function Graph Section */}
        <div className="glass-panel">
          <div className="chart-container">
            <div className="chart-header">
              <span className="chart-title">
                Visualización Gráfica — {currentMethodName}
              </span>
              <button 
                type="button" 
                className="test-case-btn" 
                onClick={() => loadTestCase(method)}
                title="Cargar los valores del caso de prueba propuesto en la rúbrica oficial"
              >
                <Sparkles size={14} /> Cargar caso de prueba de la rúbrica
              </button>
            </div>
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Error Convergence Graph Section */}
        {['biseccion', 'falsa_posicion', 'secante', 'newton_raphson', 'seccion_dorada_uni', 'seccion_dorada_multi', 'trapecio', 'simpson_18', 'simpson_38', 'regresion_mc'].includes(method) && (
          <div className="glass-panel">
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title" style={{ color: '#fca5a5' }}>
                  Evolución del Error Relativo Aproximado (Ea %)
                </span>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  {method === 'regresion_mc' ? 'Residuos por muestra observada' : 'Curva de convergencia por iteración'}
                </span>
              </div>
              <div className="canvas-wrapper" style={{ height: '240px' }}>
                <canvas ref={errorCanvasRef} />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Controls Card tailored to each method */}
        <div className="glass-panel controls-grid">

          {/* CASE 1: BÚSQUEDA DE RAÍCES */}
          {['biseccion', 'falsa_posicion', 'secante', 'newton_raphson'].includes(method) && (
            <>
              <div>
                <label className="input-label">Función f(x)</label>
                <div className="function-input-wrapper">
                  <span className="function-icon">f(x)=</span>
                  <input
                    type="text"
                    className="function-input"
                    value={funcStr}
                    onChange={(e) => setFuncStr(e.target.value)}
                    placeholder="Ejemplo: x^3 - x - 2"
                  />
                </div>
              </div>

              {/* Specific for Newton-Raphson: Derivada f'(x) */}
              {method === 'newton_raphson' && (
                <div>
                  <label className="input-label">Derivada analítica f'(x) [Calculada automáticamente]</label>
                  <div className="function-input-wrapper">
                    <span className="function-icon" style={{ color: '#38bdf8' }}>f'(x)=</span>
                    <input
                      type="text"
                      className="function-input"
                      value={derivStr}
                      onChange={(e) => setDerivStr(e.target.value)}
                      placeholder="Calculada con math.derivative..."
                    />
                  </div>
                </div>
              )}

              <div className="limits-row">
                <div>
                  <label className="input-label">
                    {method === 'newton_raphson' ? 'Aproximación inicial x₀' : method === 'secante' ? 'Primera aproximación x₀ (x_{i-1})' : 'Límite inferior [xl / a]'}
                  </label>
                  <div className="stepper-input-group">
                    <button type="button" className="stepper-btn" onClick={() => setLimitA(prev => parseFloat((Number(prev) - 0.5).toFixed(2)))}><ChevronDown size={18} /></button>
                    <input type="number" step="any" className="stepper-input" value={limitA} onChange={e => setLimitA(parseFloat(e.target.value) || 0)} />
                    <button type="button" className="stepper-btn" onClick={() => setLimitA(prev => parseFloat((Number(prev) + 0.5).toFixed(2)))}><ChevronUp size={18} /></button>
                  </div>
                </div>

                {method !== 'newton_raphson' && (
                  <div>
                    <label className="input-label">
                      {method === 'secante' ? 'Segunda aproximación x₁ (x_i)' : 'Límite superior [xu / b]'}
                    </label>
                    <div className="stepper-input-group">
                      <button type="button" className="stepper-btn" onClick={() => setLimitB(prev => parseFloat((Number(prev) - 0.5).toFixed(2)))}><ChevronDown size={18} /></button>
                      <input type="number" step="any" className="stepper-input" value={limitB} onChange={e => setLimitB(parseFloat(e.target.value) || 0)} />
                      <button type="button" className="stepper-btn" onClick={() => setLimitB(prev => parseFloat((Number(prev) + 0.5).toFixed(2)))}><ChevronUp size={18} /></button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selector claro entre número de iteraciones y cifras significativas (Rúbrica 3) */}
              <div className="switch-params-row">
                <div>
                  <label className="input-label">Criterio de parada</label>
                  <div className="mode-toggle-box">
                    <button 
                      type="button" 
                      className={`mode-option-btn ${stopCondition === 'sig_figs' ? 'active' : ''}`} 
                      onClick={() => setStopCondition('sig_figs')}
                    >
                      Cifras significativas
                    </button>
                    <button 
                      type="button" 
                      className={`mode-option-btn ${stopCondition === 'iterations' ? 'active' : ''}`} 
                      onClick={() => setStopCondition('iterations')}
                    >
                      N° de Iteraciones
                    </button>
                    <button 
                      type="button" 
                      className={`mode-option-btn ${stopCondition === 'tolerance' ? 'active' : ''}`} 
                      onClick={() => setStopCondition('tolerance')}
                    >
                      Tolerancia (ε)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label">
                    {stopCondition === 'sig_figs' ? 'Cifras significativas (m)' : stopCondition === 'iterations' ? 'Iteraciones máximas' : 'Tolerancia deseada (ε %)'}
                  </label>
                  <div className="stepper-input-group">
                    {stopCondition === 'sig_figs' ? (
                      <input 
                        type="number" 
                        min="1" 
                        max="12" 
                        className="stepper-input" 
                        value={sigFigs} 
                        onChange={e => setSigFigs(parseInt(e.target.value, 10) || 1)} 
                      />
                    ) : stopCondition === 'iterations' ? (
                      <input 
                        type="number" 
                        min="1" 
                        className="stepper-input" 
                        value={iterations} 
                        onChange={e => setIterations(parseInt(e.target.value, 10) || 1)} 
                      />
                    ) : (
                      <input 
                        type="number" 
                        step="any" 
                        className="stepper-input" 
                        value={tolerance} 
                        onChange={e => setTolerance(parseFloat(e.target.value) || 0.0001)} 
                      />
                    )}
                  </div>
                  {stopCondition === 'sig_figs' && (
                    <div className="sig-figs-info">
                      Criterio de Scarborough: Es = 0.5 × 10^(2 - {sigFigs})% = {scarboroughTol.toFixed(6)}%
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CASE 2: INTEGRACIÓN NUMÉRICA */}
          {['trapecio', 'simpson_18', 'simpson_38'].includes(method) && (
            <>
              <div>
                <label className="input-label">Modo de integración</label>
                <div className="mode-toggle-box">
                  <button 
                    type="button" 
                    className={`mode-option-btn ${integInputType === 'function' ? 'active' : ''}`} 
                    onClick={() => setIntegInputType('function')}
                  >
                    Mediante Función f(x)
                  </button>
                  <button 
                    type="button" 
                    className={`mode-option-btn ${integInputType === 'table' ? 'active' : ''}`} 
                    onClick={() => setIntegInputType('table')}
                  >
                    Mediante Tabla de Datos (x, y)
                  </button>
                </div>
              </div>

              {integInputType === 'function' ? (
                <>
                  <div>
                    <label className="input-label">Función f(x) a integrar</label>
                    <div className="function-input-wrapper">
                      <span className="function-icon">f(x)=</span>
                      <input
                        type="text"
                        className="function-input"
                        value={funcStr}
                        onChange={(e) => setFuncStr(e.target.value)}
                        placeholder="Ejemplo: sin(x)"
                      />
                    </div>
                  </div>

                  <div className="limits-row">
                    <div>
                      <label className="input-label">Límite inferior [a]</label>
                      <input type="number" step="any" className="stepper-input" style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} value={limitA} onChange={e => setLimitA(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="input-label">Límite superior [b]</label>
                      <input type="number" step="any" className="stepper-input" style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} value={limitB} onChange={e => setLimitB(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">
                      Número de subintervalos n {method === 'simpson_18' ? '(Exige n PAR)' : method === 'simpson_38' ? '(Exige n MÚLTIPLO DE 3)' : '(Cualquier entero ≥ 1)'}
                    </label>
                    <div className="stepper-input-group">
                      <button 
                        type="button" 
                        className="stepper-btn" 
                        onClick={() => {
                          const step = method === 'simpson_38' ? 3 : method === 'simpson_18' ? 2 : 1;
                          setIntegN(prev => Math.max(step, Number(prev) - step));
                        }}
                      >
                        <ChevronDown size={18} />
                      </button>
                      <input 
                        type="number" 
                        min="1" 
                        className="stepper-input" 
                        value={integN} 
                        onChange={e => setIntegN(parseInt(e.target.value, 10) || 1)} 
                      />
                      <button 
                        type="button" 
                        className="stepper-btn" 
                        onClick={() => {
                          const step = method === 'simpson_38' ? 3 : method === 'simpson_18' ? 2 : 1;
                          setIntegN(prev => Number(prev) + step);
                        }}
                      >
                        <ChevronUp size={18} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="input-label" style={{ margin: 0 }}>
                      Tabla de datos igualmente espaciados (x, y) [Subintervalos n = {integPoints.length - 1}]
                    </label>
                    <button type="button" className="add-pt-btn" onClick={handleAddIntegPoint}>
                      <Plus size={16} /> Añadir fila
                    </button>
                  </div>

                  <div className="points-table-container">
                    {integPoints.map((pt, idx) => (
                      <div key={idx} className="point-row">
                        <span className="point-index">#{idx}</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="x"
                          className="stepper-input"
                          style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                          value={pt.x}
                          onChange={(e) => handleIntegPointChange(idx, 'x', e.target.value)}
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="y"
                          className="stepper-input"
                          style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                          value={pt.y}
                          onChange={(e) => handleIntegPointChange(idx, 'y', e.target.value)}
                        />
                        <button
                          type="button"
                          className="remove-pt-btn"
                          onClick={() => handleRemoveIntegPoint(idx)}
                          title="Eliminar punto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* CASE 3: SECCIÓN DORADA UNIVARIADA */}
          {method === 'seccion_dorada_uni' && (
            <>
              <div>
                <label className="input-label">Función objetivo f(x)</label>
                <div className="function-input-wrapper">
                  <span className="function-icon">f(x)=</span>
                  <input
                    type="text"
                    className="function-input"
                    value={funcStr}
                    onChange={(e) => setFuncStr(e.target.value)}
                    placeholder="Ejemplo: 2*sin(x) - x^2/10"
                  />
                </div>
              </div>

              <div className="limits-row">
                <div>
                  <label className="input-label">Límite inferior [xl / a]</label>
                  <input type="number" step="any" className="stepper-input" style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} value={limitA} onChange={e => setLimitA(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="input-label">Límite superior [xu / b]</label>
                  <input type="number" step="any" className="stepper-input" style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} value={limitB} onChange={e => setLimitB(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div className="switch-params-row">
                <div>
                  <label className="input-label">Objetivo de Optimización</label>
                  <div className="mode-toggle-box">
                    <button type="button" className={`mode-option-btn ${optiGoal === 'max' ? 'active' : ''}`} onClick={() => setOptiGoal('max')}>Encontrar Máximo</button>
                    <button type="button" className={`mode-option-btn ${optiGoal === 'min' ? 'active' : ''}`} onClick={() => setOptiGoal('min')}>Encontrar Mínimo</button>
                  </div>
                </div>

                <div>
                  <label className="input-label">Criterio de parada</label>
                  <div className="mode-toggle-box">
                    <button type="button" className={`mode-option-btn ${stopCondition === 'sig_figs' ? 'active' : ''}`} onClick={() => setStopCondition('sig_figs')}>Cifras significativas</button>
                    <button type="button" className={`mode-option-btn ${stopCondition === 'iterations' ? 'active' : ''}`} onClick={() => setStopCondition('iterations')}>N° de Iteraciones</button>
                  </div>
                  <div className="stepper-input-group" style={{ marginTop: '0.5rem' }}>
                    {stopCondition === 'sig_figs' ? (
                      <input type="number" min="1" max="10" className="stepper-input" value={sigFigs} onChange={e => setSigFigs(parseInt(e.target.value, 10) || 1)} />
                    ) : (
                      <input type="number" min="1" className="stepper-input" value={iterations} onChange={e => setIterations(parseInt(e.target.value, 10) || 1)} />
                    )}
                  </div>
                  {stopCondition === 'sig_figs' && (
                    <div className="sig-figs-info">
                      Es = 0.5 × 10^(2 - {sigFigs})% = {scarboroughTol.toFixed(6)}%
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CASE 4: SECCIÓN DORADA MULTIVARIADA */}
          {method === 'seccion_dorada_multi' && (
            <>
              <div>
                <label className="input-label">Función multivariada f(x, y)</label>
                <div className="function-input-wrapper">
                  <span className="function-icon">f(x,y)=</span>
                  <input
                    type="text"
                    className="function-input"
                    value={multiFuncStr}
                    onChange={(e) => setMultiFuncStr(e.target.value)}
                    placeholder="(x - 1)^2 + (y + 2)^2"
                  />
                </div>
              </div>

              <div className="limits-row">
                <div>
                  <label className="input-label">Punto inicial de partida (x₀, y₀)</label>
                  <div className="dual-input-group">
                    <div className="coord-field">
                      <span className="coord-label">x₀:</span>
                      <input type="number" step="any" className="coord-input" value={multiX0} onChange={e => setMultiX0(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="coord-field">
                      <span className="coord-label">y₀:</span>
                      <input type="number" step="any" className="coord-input" value={multiY0} onChange={e => setMultiY0(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label">Objetivo</label>
                  <div className="mode-toggle-box">
                    <button type="button" className={`mode-option-btn ${optiGoal === 'max' ? 'active' : ''}`} onClick={() => setOptiGoal('max')}>Maximizar</button>
                    <button type="button" className={`mode-option-btn ${optiGoal === 'min' ? 'active' : ''}`} onClick={() => setOptiGoal('min')}>Minimizar</button>
                  </div>
                </div>
              </div>

              <div className="limits-row">
                <div>
                  <label className="input-label">Límite inferior (x_min, y_min)</label>
                  <div className="dual-input-group">
                    <div className="coord-field">
                      <span className="coord-label">x:</span>
                      <input type="number" step="any" className="coord-input" value={multiLimX[0]} onChange={e => setMultiLimX([parseFloat(e.target.value) || 0, multiLimX[1]])} />
                    </div>
                    <div className="coord-field">
                      <span className="coord-label">y:</span>
                      <input type="number" step="any" className="coord-input" value={multiLimY[0]} onChange={e => setMultiLimY([parseFloat(e.target.value) || 0, multiLimY[1]])} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label">Límite superior (x_max, y_max)</label>
                  <div className="dual-input-group">
                    <div className="coord-field">
                      <span className="coord-label">x:</span>
                      <input type="number" step="any" className="coord-input" value={multiLimX[1]} onChange={e => setMultiLimX([multiLimX[0], parseFloat(e.target.value) || 0])} />
                    </div>
                    <div className="coord-field">
                      <span className="coord-label">y:</span>
                      <input type="number" step="any" className="coord-input" value={multiLimY[1]} onChange={e => setMultiLimY([multiLimY[0], parseFloat(e.target.value) || 0])} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="switch-params-row">
                <div>
                  <label className="input-label">Criterio de parada</label>
                  <div className="mode-toggle-box">
                    <button type="button" className={`mode-option-btn ${stopCondition === 'sig_figs' ? 'active' : ''}`} onClick={() => setStopCondition('sig_figs')}>Cifras significativas</button>
                    <button type="button" className={`mode-option-btn ${stopCondition === 'iterations' ? 'active' : ''}`} onClick={() => setStopCondition('iterations')}>N° de Iteraciones</button>
                  </div>
                </div>
                <div>
                  <label className="input-label">{stopCondition === 'sig_figs' ? 'Cifras significativas (m)' : 'Número de iteraciones'}</label>
                  <div className="stepper-input-group">
                    {stopCondition === 'sig_figs' ? (
                      <input type="number" min="1" max="10" className="stepper-input" value={sigFigs} onChange={e => setSigFigs(parseInt(e.target.value, 10) || 1)} />
                    ) : (
                      <input type="number" min="1" className="stepper-input" value={iterations} onChange={e => setIterations(parseInt(e.target.value, 10) || 1)} />
                    )}
                  </div>
                  {stopCondition === 'sig_figs' && (
                    <div className="sig-figs-info">
                      Es = 0.5 × 10^(2 - {sigFigs})% = {scarboroughTol.toFixed(6)}%
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CASE 5 & 6: INTERPOLACIÓN Y REGRESIÓN */}
          {(method === 'interp_directa' || method === 'regresion_mc') && (
            <>
              {/* File upload section */}
              <div className="file-upload-card">
                <div className="file-upload-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <FileText size={20} color="#c084fc" />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Carga de datos desde archivo (CSV, TXT, TSV)</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".csv,.txt,.tsv,.dat"
                    onChange={handleFileUpload}
                  />
                  <button 
                    type="button" 
                    className="file-upload-btn" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} /> Seleccionar archivo
                  </button>
                </div>

                {uploadedFileName && fileHeaders.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div className="file-status-tag">
                      <Check size={16} /> Archivo: {uploadedFileName} ({fileRows.length} filas detectadas)
                    </div>

                    <div className="column-selectors-grid">
                      <div>
                        <label className="input-label" style={{ margin: 0, fontSize: '0.8rem' }}>Elección de columna para X</label>
                        <select 
                          className="select-model-dropdown" 
                          value={colX}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setColX(val);
                            applyColumns(fileRows, val, colY);
                          }}
                        >
                          {fileHeaders.map((h, i) => (
                            <option key={i} value={i}>{h} (Columna {i + 1})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="input-label" style={{ margin: 0, fontSize: '0.8rem' }}>Elección de columna para f(x) / Y</label>
                        <select 
                          className="select-model-dropdown" 
                          value={colY}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setColY(val);
                            applyColumns(fileRows, colX, val);
                          }}
                        >
                          {fileHeaders.map((h, i) => (
                            <option key={i} value={i}>{h} (Columna {i + 1})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de Polinomio para Regresión */}
              {method === 'regresion_mc' && (
                <div className="limits-row">
                  <div>
                    <label className="input-label">Selector del modelo / polinomio</label>
                    <select 
                      className="select-model-dropdown"
                      value={regModel}
                      onChange={(e) => setRegModel(e.target.value)}
                    >
                      <option value="polinomial">Ajuste Polinomial (Grado m configurable)</option>
                      <option value="exponencial">Modelo Exponencial: y = a·e^(b·x)</option>
                    </select>
                  </div>

                  {regModel === 'polinomial' && (
                    <div>
                      <label className="input-label">Grado del polinomio elegido (m)</label>
                      <select 
                        className="select-model-dropdown"
                        value={regDegree}
                        onChange={(e) => setRegDegree(parseInt(e.target.value, 10))}
                      >
                        <option value={1}>Grado 1 — Lineal: y = a₁·x + a₀</option>
                        <option value={2}>Grado 2 — Cuadrático: y = a₂·x² + a₁·x + a₀</option>
                        <option value={3}>Grado 3 — Cúbico: y = a₃·x³ + a₂·x² + a₁·x + a₀</option>
                        <option value={4}>Grado 4 — Polinomio cuarto orden</option>
                        <option value={5}>Grado 5 — Polinomio quinto orden</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Points table editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ margin: 0 }}>
                    Datos cargados / puntos ({points.length} puntos observados)
                  </label>
                  <button type="button" className="add-pt-btn" onClick={handleAddPoint}>
                    <Plus size={16} /> Añadir fila
                  </button>
                </div>

                <div className="points-table-container">
                  {points.map((pt, idx) => (
                    <div key={idx} className="point-row">
                      <span className="point-index">#{idx + 1}</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="xᵢ"
                        className="stepper-input"
                        style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                        value={pt.x}
                        onChange={(e) => handlePointChange(idx, 'x', e.target.value)}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="yᵢ"
                        className="stepper-input"
                        style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                        value={pt.y}
                        onChange={(e) => handlePointChange(idx, 'y', e.target.value)}
                      />
                      <button
                        type="button"
                        className="remove-pt-btn"
                        onClick={() => handleRemovePoint(idx)}
                        title="Eliminar punto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluación en un x dado */}
              <div>
                <label className="input-label">Evaluación del modelo / curva ajustada en un valor x dado (x_eval)</label>
                <input
                  type="number"
                  step="any"
                  className="stepper-input"
                  style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
                  value={xEval}
                  onChange={(e) => setXEval(parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {/* Action button */}
          <div className="action-row">
            <button className="compute-btn" onClick={runCalculation}>
              <Play size={20} fill="#ffffff" />
              Ejecutar {currentMethodName}
            </button>
          </div>
        </div>

        {/* Results Banner */}
        {errorMsg ? (
          <div className="result-banner error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={28} color="#f87171" />
              <div>
                <div className="result-title">Validación / Error en el cálculo</div>
                <div style={{ color: '#fecaca', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                  {errorMsg}
                </div>
              </div>
            </div>
          </div>
        ) : (result && result.method === method) ? (
          <div className="result-banner">
            <div>
              <div className="result-title">Resultado — {currentMethodName}</div>
              
              {/* Integration */}
              {result.type === 'integration' && (
                <div>
                  <div className="result-value">Integral I ≈ {fmt(result.integral, 6)}</div>
                  <div className="result-subtext">
                    Evaluada con {result.n} subintervalos (paso h = {fmt(result.h, 6)})
                  </div>
                </div>
              )}

              {/* Root finding */}
              {result.type === 'root' && (
                <div>
                  <div className="result-value">Raíz x* ≈ {fmt(result.value, 6)}</div>
                  <div className="result-subtext">
                    f(x*) = {fmtExp(result.fval, 4)} en {result.iterationsCount} iteraciones
                  </div>
                </div>
              )}

              {/* Golden section univariate */}
              {result.type === 'opti_uni' && (
                <div>
                  <div className="result-value">Óptimo x* ≈ {fmt(result.value, 5)}</div>
                  <div className="result-subtext">
                    Valor óptimo f(x*) = {fmt(result.fval, 5)} ({optiGoal === 'max' ? 'Máximo' : 'Mínimo'} local alcanzado)
                  </div>
                </div>
              )}

              {/* Golden section multivariate */}
              {result.type === 'opti_multi' && (
                <div>
                  <div className="result-value">
                    Punto óptimo: ({fmt(result.optPoint?.x, 4)}, {fmt(result.optPoint?.y, 4)})
                  </div>
                  <div className="result-subtext">
                    f(x*, y*) = {fmt(result.fval, 5)} en {result.iterationsCount} pasos
                  </div>
                </div>
              )}

              {/* Direct interpolation */}
              {result.type === 'interpolation' && (
                <div>
                  <div className="result-value">p({result.xEval}) = {fmt(result.yEstimated, 5)}</div>
                  <div className="result-subtext" style={{ wordBreak: 'break-all' }}>
                    Polinomio ajustado: <strong>p(x) = {result.polyStr}</strong>
                  </div>
                </div>
              )}

              {/* Regression */}
              {result.type === 'regression' && (
                <div>
                  <div className="result-value">
                    Modelo: {result.modelStr}
                  </div>
                  <div className="result-subtext">
                    Coeficiente de determinación: <strong>R² = {fmt(result.r2, 4)}</strong> (Ajuste {fmt((result.r2 || 0) * 100, 2)}%)
                    <br />
                    Evaluación en x = {result.xEval}: <strong>ŷ({result.xEval}) = {fmt(result.yEstimated, 5)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Stats badges */}
            <div className="stats-badges">
              {result.finalError !== undefined && result.finalError !== null && (
                <div className="stat-item" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.1)' }}>
                  Error Relativo (Ea): <strong style={{ color: '#fb7185' }}>{fmt(result.finalError, 4)}%</strong>
                </div>
              )}
              {result.n !== undefined && (
                <div className="stat-item">
                  Subintervalos n: <strong>{result.n}</strong>
                </div>
              )}
              {result.h !== undefined && (
                <div className="stat-item">
                  Paso h: <strong>{fmt(result.h, 4)}</strong>
                </div>
              )}
              {result.iterationsCount && (
                <div className="stat-item">
                  Iteraciones: <strong>{result.iterationsCount}</strong>
                </div>
              )}
              {result.degree !== undefined && (
                <div className="stat-item">
                  Grado del polinomio: <strong>{result.degree}</strong>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Iterations / Evaluation Points Table */}
        {(result && result.method === method && result.history && result.history.length > 0) && (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <button
              className="table-toggle-btn"
              onClick={() => setShowTable(!showTable)}
            >
              <TableIcon size={18} />
              {showTable ? 'Ocultar tabla de iteraciones' : 'Ver tabla de iteraciones'}
            </button>

            {showTable && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {/* Bisección: i, xl, xu, xr, f(xl), f(xr), f(xl)·f(xr), error aproximado (%) */}
                      {method === 'biseccion' && (
                        <>
                          <th style={{ textAlign: 'center' }}>i</th>
                          <th>xl</th>
                          <th>xu</th>
                          <th>xr</th>
                          <th>f(xl)</th>
                          <th>f(xr)</th>
                          <th>f(xl)·f(xr)</th>
                          <th>Error aproximado (%)</th>
                        </>
                      )}

                      {/* Falsa Posición: i, xl, xu, xr, f(xl), f(xu), f(xr), error aproximado (%) */}
                      {method === 'falsa_posicion' && (
                        <>
                          <th style={{ textAlign: 'center' }}>i</th>
                          <th>xl</th>
                          <th>xu</th>
                          <th>xr</th>
                          <th>f(xl)</th>
                          <th>f(xu)</th>
                          <th>f(xr)</th>
                          <th>Error aproximado (%)</th>
                        </>
                      )}

                      {/* Newton-Raphson: i, x_i, f(x_i), f'(x_i), x_(i+1), error aproximado (%) */}
                      {method === 'newton_raphson' && (
                        <>
                          <th style={{ textAlign: 'center' }}>i</th>
                          <th>x_i</th>
                          <th>f(x_i)</th>
                          <th>f'(x_i)</th>
                          <th>x_(i+1)</th>
                          <th>Error aproximado (%)</th>
                        </>
                      )}

                      {/* Secante: i, x_(i-1), x_i, f(x_(i-1)), f(x_i), x_(i+1), error aproximado (%) */}
                      {method === 'secante' && (
                        <>
                          <th style={{ textAlign: 'center' }}>i</th>
                          <th>x_(i-1)</th>
                          <th>x_i</th>
                          <th>f(x_(i-1))</th>
                          <th>f(x_i)</th>
                          <th>x_(i+1)</th>
                          <th>Error aproximado (%)</th>
                        </>
                      )}

                      {/* Trapecio, Simpson 1/3, Simpson 3/8: Iteración, n, h, integral aproximada, error aproximado (%) */}
                      {['trapecio', 'simpson_18', 'simpson_38'].includes(method) && (
                        <>
                          <th style={{ textAlign: 'center' }}>Iteración</th>
                          <th>n (subintervalos)</th>
                          <th>h (paso)</th>
                          <th>Integral aproximada</th>
                          <th>Error aproximado (%)</th>
                        </>
                      )}

                      {/* Sección Áurea simple: i, xl, xu, x1, x2, f(x1), f(x2), error aproximado (%) */}
                      {method === 'seccion_dorada_uni' && (
                        <>
                          <th style={{ textAlign: 'center' }}>i</th>
                          <th>xl</th>
                          <th>xu</th>
                          <th>x1</th>
                          <th>x2</th>
                          <th>f(x1)</th>
                          <th>f(x2)</th>
                          <th>Error aproximado (%)</th>
                        </>
                      )}

                      {/* Sección Áurea multivariada */}
                      {method === 'seccion_dorada_multi' && (
                        <>
                          <th style={{ textAlign: 'center' }}>i</th>
                          <th>Coord. activa</th>
                          <th>Punto actual (x, y)</th>
                          <th>xl</th>
                          <th>xu</th>
                          <th>x1</th>
                          <th>x2</th>
                          <th>f(x1)</th>
                          <th>f(x2)</th>
                          <th>Error aproximado (%)</th>
                        </>
                      )}

                      {/* Regresión por Mínimos Cuadrados */}
                      {method === 'regresion_mc' && (
                        <>
                          <th style={{ textAlign: 'center' }}>Dato</th>
                          <th>xᵢ</th>
                          <th>yᵢ</th>
                          <th>ŷ (modelo)</th>
                          <th>Residuo (yᵢ - ŷ)</th>
                          <th>Error relativo (%)</th>
                        </>
                      )}

                      {/* Interpolación Directa */}
                      {method === 'interp_directa' && (
                        <>
                          <th style={{ textAlign: 'center' }}>Punto</th>
                          <th>xᵢ</th>
                          <th>yᵢ</th>
                          <th>p(xᵢ) evaluado</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.history.map((row, idx) => (
                      <tr key={idx}>
                        {/* Bisección */}
                        {method === 'biseccion' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.iteration}</td>
                            <td>{fmt(row.xl, 5)}</td>
                            <td>{fmt(row.xu, 5)}</td>
                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{fmt(row.xr, 6)}</td>
                            <td>{fmt(row.fxl, 5)}</td>
                            <td>{fmt(row.fxr, 5)}</td>
                            <td style={{ color: row.prod < 0 ? '#38bdf8' : '#f43f5e' }}>{fmtExp(row.prod, 3)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Falsa Posición */}
                        {method === 'falsa_posicion' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.iteration}</td>
                            <td>{fmt(row.xl, 5)}</td>
                            <td>{fmt(row.xu, 5)}</td>
                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{fmt(row.xr, 6)}</td>
                            <td>{fmt(row.fxl, 5)}</td>
                            <td>{fmt(row.fxu, 5)}</td>
                            <td>{fmt(row.fxr, 5)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Newton-Raphson */}
                        {method === 'newton_raphson' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.iteration}</td>
                            <td>{fmt(row.xi, 6)}</td>
                            <td>{fmtExp(row.fxi, 4)}</td>
                            <td>{fmt(row.dfxi, 4)}</td>
                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{fmt(row.xnext, 6)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Secante */}
                        {method === 'secante' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.iteration}</td>
                            <td>{fmt(row.xprev, 6)}</td>
                            <td>{fmt(row.xi, 6)}</td>
                            <td>{fmt(row.fxprev, 5)}</td>
                            <td>{fmt(row.fxi, 5)}</td>
                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{fmt(row.xnext, 6)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Trapecio, Simpson 1/3, Simpson 3/8 */}
                        {['trapecio', 'simpson_18', 'simpson_38'].includes(method) && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.iteration}</td>
                            <td>{row.n}</td>
                            <td>{fmt(row.h, 5)}</td>
                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{fmt(row.integral, 6)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Sección Áurea simple */}
                        {method === 'seccion_dorada_uni' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.iteration}</td>
                            <td>{fmt(row.xl, 5)}</td>
                            <td>{fmt(row.xu, 5)}</td>
                            <td>{fmt(row.x1, 5)}</td>
                            <td>{fmt(row.x2, 5)}</td>
                            <td>{fmt(row.f1, 5)}</td>
                            <td>{fmt(row.f2, 5)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Sección Áurea multivariada */}
                        {method === 'seccion_dorada_multi' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.iteration}</td>
                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{row.activeCoord}</td>
                            <td>({row.currX}, {row.currY})</td>
                            <td>{fmt(row.xl, 4)}</td>
                            <td>{fmt(row.xu, 4)}</td>
                            <td>{fmt(row.x1, 4)}</td>
                            <td>{fmt(row.x2, 4)}</td>
                            <td>{fmt(row.f1, 4)}</td>
                            <td>{fmt(row.f2, 4)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Regresión por Mínimos Cuadrados */}
                        {method === 'regresion_mc' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>P{row.i}</td>
                            <td>{fmt(row.x)}</td>
                            <td>{fmt(row.y)}</td>
                            <td style={{ color: '#38bdf8' }}>{fmt(row.yPred)}</td>
                            <td style={{ color: '#f59e0b' }}>{fmt(row.residual)}</td>
                            <td style={{ color: '#f43f5e' }}>{fmt(row.error)}</td>
                          </>
                        )}

                        {/* Interpolación Directa */}
                        {method === 'interp_directa' && (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>P{row.i}</td>
                            <td>{fmt(row.x)}</td>
                            <td>{fmt(row.y)}</td>
                            <td style={{ color: '#38bdf8' }}>{fmt(row.pVal)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="footer-section">
          <p>Proyecto Final de Métodos Numéricos</p>
          <p className="footer-authors">Laura Sofia Artunduaga Pulido - Tomás Felipe Lobo Berbesi</p>
        </footer>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
