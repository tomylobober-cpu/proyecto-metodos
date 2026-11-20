import React, { useState, useEffect, useRef } from 'react';
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
  Trash2
} from 'lucide-react';

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
      { id: 'simpson_18', name: 'Simpson 1/3 (1/8)', group: 'integracion' },
      { id: 'simpson_38', name: 'Simpson 3/8', group: 'integracion' },
    ]
  },
  {
    id: 'interpolacion',
    title: 'Interpolación',
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

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('raices');
  const [method, setMethod] = useState('biseccion');

  // Common inputs
  const [funcStr, setFuncStr] = useState('x^3 - x - 2');
  const [derivStr, setDerivStr] = useState('3*x^2 - 1'); // For Newton-Raphson
  const [limitA, setLimitA] = useState(1);
  const [limitB, setLimitB] = useState(2);
  const [tolerance, setTolerance] = useState(0.0001);
  const [iterations, setIterations] = useState(20);
  const [stopCondition, setStopCondition] = useState('tolerance');

  // Integration inputs
  const [integInputType, setIntegInputType] = useState('function'); // 'function' | 'table'
  const [integN, setIntegN] = useState(6); // Subintervals
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
  const [optiGoal, setOptiGoal] = useState('max'); // 'max' or 'min'
  const [multiFuncStr, setMultiFuncStr] = useState('2*x*y + 2*x - x^2 - 2*y^2');
  const [multiX0, setMultiX0] = useState(0);
  const [multiY0, setMultiY0] = useState(0);
  const [multiLimX, setMultiLimX] = useState([-2, 4]);
  const [multiLimY, setMultiLimY] = useState([-2, 4]);

  // Interpolation & Regression inputs
  const [points, setPoints] = useState([
    { x: 1, y: 3 },
    { x: 2, y: 6 },
    { x: 3, y: 19 }
  ]);
  const [xEval, setXEval] = useState(2.5);
  const [regModel, setRegModel] = useState('lineal');

  // Results & UI
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTable, setShowTable] = useState(false);
  const canvasRef = useRef(null);
  const errorCanvasRef = useRef(null);

  // Helper safe evaluator
  const evaluateF = (expr, scope) => {
    try {
      return expr.evaluate(scope);
    } catch {
      return NaN;
    }
  };

  // Add / remove points for Interpolation/Regression
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

  // Add / remove points for Integration Table
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
    const parsedExpr = math.compile(funcStr);
    let parsedDeriv = null;
    if (method === 'newton_raphson') {
      try {
        parsedDeriv = math.compile(derivStr);
      } catch {
        throw new Error('Sintaxis inválida en la derivada f\'(x).');
      }
    }

    const a0 = parseFloat(limitA);
    const b0 = parseFloat(limitB);

    if (isNaN(a0)) throw new Error('El valor inicial x₀ debe ser un número válido.');
    if (method !== 'newton_raphson' && isNaN(b0)) throw new Error('El valor inicial x₁ / Límite B debe ser un número válido.');

    // Bisección y Falsa posición require a < b and sign change
    if (method === 'biseccion' || method === 'falsa_posicion') {
      if (a0 >= b0) throw new Error('El límite A debe ser menor que el límite B.');

      const fa0 = evaluateF(parsedExpr, { x: a0 });
      const fb0 = evaluateF(parsedExpr, { x: b0 });

      if (fa0 * fb0 > 0) {
        throw new Error(`No se garantiza raíz en [${a0}, ${b0}]: f(A) y f(B) tienen el mismo signo.`);
      }
    }

    let a = a0, b = b0, xr = 0, xrPrev = 0, ea = 100;
    const history = [];
    const maxIters = stopCondition === 'iterations' ? parseInt(iterations, 10) : 100;
    const tol = stopCondition === 'tolerance' ? parseFloat(tolerance) : 1e-12;

    for (let iter = 1; iter <= maxIters; iter++) {
      const fa = evaluateF(parsedExpr, { x: a });
      const fb = evaluateF(parsedExpr, { x: b });

      if (method === 'biseccion') xr = (a + b) / 2;
      else if (method === 'falsa_posicion') xr = b - (fb * (a - b)) / (fa - fb);
      else if (method === 'secante') {
        if (Math.abs(fb - fa) < 1e-15) throw new Error('División por cero en el método de la Secante (f(x₁) ≈ f(x₀)).');
        xr = b - (fb * (b - a)) / (fb - fa);
      } else if (method === 'newton_raphson') {
        const dfx = evaluateF(parsedDeriv, { x: a });
        if (isNaN(dfx) || Math.abs(dfx) < 1e-14) {
          throw new Error(`Derivada f'(${a.toFixed(4)}) ≈ 0. División por cero en Newton-Raphson.`);
        }
        xr = a - fa / dfx;
      }

      ea = iter > 1 ? Math.abs((xr - xrPrev) / (xr === 0 ? 1 : xr)) * 100 : 100;
      const fxr = evaluateF(parsedExpr, { x: xr });

      history.push({
        iteration: iter,
        a, b, xr, fa, fb, fxr,
        error: iter === 1 ? '-' : ea.toFixed(6) + '%'
      });

      if (stopCondition === 'tolerance' && iter > 1 && ea < tol) break;
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

  // 2. Numerical Integration Methods (Trapecio, Simpson 1/3, Simpson 3/8)
  const runNumericalIntegration = () => {
    let a, b, n, xs = [], ys = [];
    let parsedExpr = null;

    if (integInputType === 'function') {
      a = parseFloat(limitA);
      b = parseFloat(limitB);
      n = parseInt(integN, 10);

      if (isNaN(a) || isNaN(b)) throw new Error('Los límites a y b deben ser números válidos.');
      if (a >= b) throw new Error('El límite inferior a debe ser menor que el límite superior b.');
      if (n < 1) throw new Error('El número de subintervalos n debe ser al menos 1.');

      // Validation for Simpson rules
      if (method === 'simpson_18' && n % 2 !== 0) {
        throw new Error(`Simpson 1/8 (1/3) requiere un número PAR de subintervalos n. Actual: ${n}`);
      }
      if (method === 'simpson_38' && n % 3 !== 0) {
        throw new Error(`Simpson 3/8 requiere un número de subintervalos n que sea MÚLTIPLO DE 3. Actual: ${n}`);
      }

      parsedExpr = math.compile(funcStr);
      const h = (b - a) / n;
      for (let i = 0; i <= n; i++) {
        const xi = a + i * h;
        const yi = evaluateF(parsedExpr, { x: xi });
        if (isNaN(yi) || !isFinite(yi)) throw new Error(`Función indefinida en x = ${xi.toFixed(4)}`);
        xs.push(xi);
        ys.push(yi);
      }
    } else {
      // Table input mode
      const sorted = [...integPoints].sort((p1, p2) => p1.x - p2.x);
      xs = sorted.map(p => Number(p.x));
      ys = sorted.map(p => Number(p.y));
      n = xs.length - 1;
      a = xs[0];
      b = xs[xs.length - 1];

      if (n < 1) throw new Error('Se requieren al menos 2 puntos en la tabla de datos.');

      // Check equally spaced points
      const h0 = xs[1] - xs[0];
      for (let i = 1; i < xs.length - 1; i++) {
        const hi = xs[i + 1] - xs[i];
        if (Math.abs(hi - h0) > 1e-4) {
          throw new Error('Los puntos de la tabla deben estar igualmente espaciados.');
        }
      }

      if (method === 'simpson_18' && n % 2 !== 0) {
        throw new Error(`Simpson 1/8 requiere un número PAR de subintervalos (número impar de puntos). Puntos actuales: ${xs.length} (n = ${n})`);
      }
      if (method === 'simpson_38' && n % 3 !== 0) {
        throw new Error(`Simpson 3/8 requiere que n sea múltiplo de 3. Actualmente n = ${n}`);
      }
    }

    const h = (b - a) / n;
    let integral = 0;
    const history = [];

    if (method === 'trapecio') {
      let sumInternal = 0;
      for (let i = 1; i < n; i++) {
        sumInternal += ys[i];
      }
      integral = (h / 2) * (ys[0] + 2 * sumInternal + ys[n]);
    } else if (method === 'simpson_18') {
      let sumOdd = 0;
      let sumEven = 0;
      for (let i = 1; i < n; i++) {
        if (i % 2 !== 0) sumOdd += ys[i];
        else sumEven += ys[i];
      }
      integral = (h / 3) * (ys[0] + 4 * sumOdd + 2 * sumEven + ys[n]);
    } else if (method === 'simpson_38') {
      let sum3k = 0;
      let sumOther = 0;
      for (let i = 1; i < n; i++) {
        if (i % 3 === 0) sum3k += ys[i];
        else sumOther += ys[i];
      }
      integral = ((3 * h) / 8) * (ys[0] + 3 * sumOther + 2 * sum3k + ys[n]);
    }

    for (let i = 0; i <= n; i++) {
      history.push({
        i,
        x: xs[i],
        y: ys[i]
      });
    }

    // Richardson extrapolation reference to calculate relative error for numerical integration
    let relError = null;
    if (parsedExpr && (method === 'trapecio' || method === 'simpson_18')) {
      const n2 = n * 2;
      const h2 = (b - a) / n2;
      let i2 = 0;
      if (method === 'trapecio') {
        let sumInt2 = 0;
        for (let j = 1; j < n2; j++) {
          sumInt2 += evaluateF(parsedExpr, { x: a + j * h2 });
        }
        i2 = (h2 / 2) * (ys[0] + 2 * sumInt2 + ys[n]);
      } else if (method === 'simpson_18') {
        let sumOdd2 = 0, sumEven2 = 0;
        for (let j = 1; j < n2; j++) {
          const val = evaluateF(parsedExpr, { x: a + j * h2 });
          if (j % 2 !== 0) sumOdd2 += val;
          else sumEven2 += val;
        }
        i2 = (h2 / 3) * (ys[0] + 4 * sumOdd2 + 2 * sumEven2 + ys[n]);
      }
      relError = Math.abs((i2 - integral) / (i2 === 0 ? 1 : i2)) * 100;
    }

    // 2. Build error convergence history for all n subintervals (for integration error plot)
    const errorHistory = [];
    if (parsedExpr) {
      const stepIntervals = [2, 4, 6, 8, 12, 16, 24];
      let prevInt = null;
      stepIntervals.forEach((k) => {
        if (method === 'simpson_18' && k % 2 !== 0) return;
        if (method === 'simpson_38' && k % 3 !== 0) return;
        const hk = (b - a) / k;
        let ik = 0;
        if (method === 'trapecio') {
          let s = 0;
          for (let j = 1; j < k; j++) s += evaluateF(parsedExpr, { x: a + j * hk });
          ik = (hk / 2) * (evaluateF(parsedExpr, { x: a }) + 2 * s + evaluateF(parsedExpr, { x: b }));
        } else if (method === 'simpson_18') {
          let sOdd = 0, sEven = 0;
          for (let j = 1; j < k; j++) {
            const v = evaluateF(parsedExpr, { x: a + j * hk });
            if (j % 2 !== 0) sOdd += v; else sEven += v;
          }
          ik = (hk / 3) * (evaluateF(parsedExpr, { x: a }) + 4 * sOdd + 2 * sEven + evaluateF(parsedExpr, { x: b }));
        } else if (method === 'simpson_38') {
          let s3k = 0, sOther = 0;
          for (let j = 1; j < k; j++) {
            const v = evaluateF(parsedExpr, { x: a + j * hk });
            if (j % 3 === 0) s3k += v; else sOther += v;
          }
          ik = ((3 * hk) / 8) * (evaluateF(parsedExpr, { x: a }) + 3 * sOther + 2 * s3k + evaluateF(parsedExpr, { x: b }));
        }
        if (prevInt !== null) {
          const err = Math.abs((ik - prevInt) / (ik === 0 ? 1 : ik)) * 100;
          errorHistory.push({ iteration: k, errorVal: err, label: `n=${k}` });
        }
        prevInt = ik;
      });
    }

    setResult({
      type: 'integration',
      integral,
      h,
      n,
      a,
      b,
      finalError: relError,
      history,
      errorHistory: errorHistory.length > 0 ? errorHistory : null,
      parsedExpr,
      points: history.map(item => ({ x: item.x, y: item.y })),
      aRange: a,
      bRange: b
    });
  };

  // 3. Sección Dorada Univariada (Opti.pdf)
  const runGoldenSectionUni = () => {
    const parsedExpr = math.compile(funcStr);
    let xl = parseFloat(limitA);
    let xu = parseFloat(limitB);
    if (isNaN(xl) || isNaN(xu)) throw new Error('Define los límites [a, b].');
    if (xl >= xu) throw new Error('El límite a debe ser menor que el límite b.');

    const R = (Math.sqrt(5) - 1) / 2;
    let d = R * (xu - xl);
    let x1 = xl + d;
    let x2 = xu - d;
    let f1 = evaluateF(parsedExpr, { x: x1 });
    let f2 = evaluateF(parsedExpr, { x: x2 });

    const maxIters = stopCondition === 'iterations' ? parseInt(iterations, 10) : 60;
    const tol = stopCondition === 'tolerance' ? parseFloat(tolerance) : 1e-6;
    const history = [];
    let xOpt = optiGoal === 'max' ? (f1 > f2 ? x1 : x2) : (f1 < f2 ? x1 : x2);
    let ea = 100;

    for (let iter = 1; iter <= maxIters; iter++) {
      d = R * d;
      xOpt = optiGoal === 'max' ? (f1 > f2 ? x1 : x2) : (f1 < f2 ? x1 : x2);
      if (iter > 1) {
        ea = Math.abs((1 - R) * (xu - xl) / (xOpt === 0 ? 1 : xOpt)) * 100;
      }

      history.push({
        iteration: iter,
        xl, xu, x1, x2, f1, f2,
        xOpt,
        fOpt: evaluateF(parsedExpr, { x: xOpt }),
        error: iter === 1 ? '-' : ea.toFixed(5) + '%'
      });

      if (stopCondition === 'tolerance' && iter > 1 && ea < tol) break;

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

  // 4. Sección Dorada Multivariada (Opti.pdf)
  const runGoldenSectionMulti = () => {
    const parsedExpr = math.compile(multiFuncStr);
    let currX = parseFloat(multiX0);
    let currY = parseFloat(multiY0);
    const R = (Math.sqrt(5) - 1) / 2;
    const cycles = stopCondition === 'iterations' ? parseInt(iterations, 10) : 15;
    const tol = stopCondition === 'tolerance' ? parseFloat(tolerance) : 1e-5;
    const history = [];
    let prevVal = evaluateF(parsedExpr, { x: currX, y: currY });
    let ea = 100;

    for (let c = 1; c <= cycles; c++) {
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
      currX = optiGoal === 'max' ? (f1 > f2 ? x1 : x2) : (f1 < f2 ? x1 : x2);

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
      currY = optiGoal === 'max' ? (f1 > f2 ? x1 : x2) : (f1 < f2 ? x1 : x2);

      const currentVal = evaluateF(parsedExpr, { x: currX, y: currY });
      ea = Math.abs((currentVal - prevVal) / (currentVal === 0 ? 1 : currentVal)) * 100;
      prevVal = currentVal;

      history.push({
        iteration: c,
        xOpt: currX,
        yOpt: currY,
        fOpt: currentVal,
        error: c === 1 ? '-' : ea.toFixed(5) + '%'
      });

      if (stopCondition === 'tolerance' && c > 1 && ea < tol) break;
    }

    setResult({
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
      throw new Error('Todos los valores xᵢ deben ser distintos entre sí.');
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

    setResult({
      type: 'interpolation',
      degree: n,
      coeffs,
      polyStr,
      xEval,
      yEstimated,
      parsedExpr,
      points,
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

    if (regModel === 'lineal') {
      const sumX = math.sum(xs);
      const sumY = math.sum(ys);
      const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
      const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
      const b = (sumY / n) - m * (sumX / n);

      modelStr = `y = ${m.toFixed(4)}·x + ${b.toFixed(4)}`.replace('+-', '- ');
      parsedExpr = math.compile(`${m}*x + ${b}`);
      evalFunc = (x) => m * x + b;

      const meanY = sumY / n;
      const ssTot = ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
      const ssRes = ys.reduce((acc, y, i) => acc + Math.pow(y - evalFunc(xs[i]), 2), 0);
      r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
      // Residual errors history for chart
      var regHistory = points.map((p, idx) => {
        const yPred = evalFunc(p.x);
        const err = Math.abs((p.y - yPred) / (p.y === 0 ? 1 : p.y)) * 100;
        return { iteration: idx + 1, errorVal: err, label: `P${idx + 1}` };
      });
    } else if (regModel === 'polinomial_2') {
      if (n < 3) throw new Error('Se requieren al menos 3 puntos para modelo cuadrático.');
      const sumX = math.sum(xs);
      const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
      const sumX3 = xs.reduce((acc, x) => acc + Math.pow(x, 3), 0);
      const sumX4 = xs.reduce((acc, x) => acc + Math.pow(x, 4), 0);
      const sumY = math.sum(ys);
      const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
      const sumX2Y = xs.reduce((acc, x, i) => acc + x * x * ys[i], 0);

      const M = [
        [n, sumX, sumX2],
        [sumX, sumX2, sumX3],
        [sumX2, sumX3, sumX4]
      ];
      const B = [sumY, sumXY, sumX2Y];
      const a = math.lusolve(M, B).map(v => v[0]);

      modelStr = `y = ${a[2].toFixed(4)}·x² + ${a[1].toFixed(4)}·x + ${a[0].toFixed(4)}`.replace(/\+\s\-/g, '- ');
      parsedExpr = math.compile(`${a[2]}*x^2 + ${a[1]}*x + ${a[0]}`);
      evalFunc = (x) => a[2] * x * x + a[1] * x + a[0];

      const meanY = sumY / n;
      const ssTot = ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
      const ssRes = ys.reduce((acc, y, i) => acc + Math.pow(y - evalFunc(xs[i]), 2), 0);
      r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
      var regHistory = points.map((p, idx) => {
        const yPred = evalFunc(p.x);
        const err = Math.abs((p.y - yPred) / (p.y === 0 ? 1 : p.y)) * 100;
        return { iteration: idx + 1, errorVal: err, label: `P${idx + 1}` };
      });
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
      var regHistory = points.map((p, idx) => {
        const yPred = evalFunc(p.x);
        const err = Math.abs((p.y - yPred) / (p.y === 0 ? 1 : p.y)) * 100;
        return { iteration: idx + 1, errorVal: err, label: `P${idx + 1}` };
      });
    }

    setResult({
      type: 'regression',
      modelStr,
      r2: Math.max(0, r2),
      parsedExpr,
      points,
      history: regHistory,
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

  const handleSelectMethod = (catId, methodId) => {
    setSelectedCategory(catId);
    setMethod(methodId);
    // Auto-adjust subintervals according to rules
    if (methodId === 'simpson_18' && integN % 2 !== 0) setIntegN(integN + 1);
    if (methodId === 'simpson_38' && integN % 3 !== 0) setIntegN(Math.ceil(integN / 3) * 3 || 6);
  };

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth);
    const height = (canvas.height = canvas.parentElement.clientHeight);

    ctx.clearRect(0, 0, width, height);

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

    // Integration Area Fill & Segment Dividers
    if (result?.type === 'integration' && result.history) {
      ctx.fillStyle = 'rgba(217, 70, 239, 0.18)';
      ctx.beginPath();
      const firstX = toX(result.history[0].x);
      const yZero = toY(0);
      ctx.moveTo(firstX, yZero);
      result.history.forEach(pt => {
        ctx.lineTo(toX(pt.x), toY(pt.y));
      });
      ctx.lineTo(toX(result.history[result.history.length - 1].x), yZero);
      ctx.closePath();
      ctx.fill();

      // Draw vertical segment slices
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.45)';
      ctx.lineWidth = 1;
      result.history.forEach(pt => {
        ctx.beginPath();
        ctx.moveTo(toX(pt.x), yZero);
        ctx.lineTo(toX(pt.x), toY(pt.y));
        ctx.stroke();
      });
    }

    // Curve
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      pts.forEach((pt, idx) => {
        const cx = toX(pt.x), cy = toY(pt.y);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    // Data points
    if (result?.points) {
      result.points.forEach((p) => {
        const px = toX(p.x), py = toY(p.y);
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // Root or Golden Optimum
    if (result?.value !== undefined) {
      const rx = toX(result.value);
      const ry = toY(result.type === 'root' ? 0 : result.fval);

      ctx.beginPath();
      ctx.arc(rx, ry, 11, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [result, funcStr, method]);

  // Draw Error Convergence Chart
  useEffect(() => {
    const canvas = errorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth);
    const height = (canvas.height = canvas.parentElement.clientHeight);

    ctx.clearRect(0, 0, width, height);

    // Extract error values
    let errorPoints = [];
    if (result?.errorHistory) {
      errorPoints = result.errorHistory.map(item => ({ x: item.iteration, y: item.errorVal, label: item.label }));
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
      ctx.fillText('Gráfica de convergencia de error no aplicable o cálculo completado en 1 paso.', width / 2, height / 2);
      return;
    }

    const xs = errorPoints.map(p => p.x);
    const ys = errorPoints.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) === minX ? minX + 1 : Math.max(...xs);
    const minY = 0;
    const maxY = Math.max(...ys) * 1.15 || 10;

    const toX = (x) => 50 + ((x - minX) / (maxX - minX)) * (width - 80);
    const toY = (y) => height - 30 - (y / maxY) * (height - 50);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const gy = 20 + (i / 5) * (height - 50);
      ctx.beginPath();
      ctx.moveTo(50, gy);
      ctx.lineTo(width - 30, gy);
      ctx.stroke();

      const yVal = maxY - (i / 5) * maxY;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`${yVal.toFixed(2)}%`, 45, gy + 3);
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(50, height - 30);
    ctx.lineTo(width - 30, height - 30);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px Plus Jakarta Sans';
    ctx.textAlign = 'left';
    ctx.fillText('Error Relativo Ea (%)', 55, 16);
    ctx.textAlign = 'right';
    ctx.fillText('Iteración / Muestra', width - 30, height - 12);

    // Plot Error Line (Pink / Rose Gradient)
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

      // Tick on X-axis
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.x}`, px, height - 14);
    });
  }, [result]);

  const currentMethodObj = METHOD_CATEGORIES.flatMap(c => c.methods).find(m => m.id === method);
  const currentMethodName = currentMethodObj?.name || 'Selecciona un método';

  return (
    <div className="app-container">
      <div className="content-wrapper">
        
        {/* Header */}
        <div className="header-section">
          <h1 className="main-title">Vista tabulada con métodos numéricos</h1>
          <p className="main-subtitle">
            Selecciona la familia y método numérico para desplegar sus parámetros requeridos
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

        {/* Active Selection Banner */}
        {selectedCategory && (
          <div className="method-selection-bar">
            <div className="method-selection-info">
              <span style={{ color: '#c4b5fd', fontSize: '0.9rem' }}>Grupo activo:</span>
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.95rem' }}>
                {METHOD_CATEGORIES.find(c => c.id === selectedCategory)?.title}
              </span>
              {method && (
                <>
                  <span style={{ color: '#64748b' }}>•</span>
                  <span style={{ color: '#c4b5fd', fontSize: '0.9rem' }}>Método:</span>
                  <span className="method-selection-chip">{currentMethodName}</span>
                </>
              )}
            </div>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Interfaz adaptada a los requerimientos del método
            </span>
          </div>
        )}

        {/* Function Graph Section */}
        <div className="glass-panel">
          <div className="chart-container">
            <div className="chart-header">
              <span className="chart-title">
                <Sparkles size={18} color="#d946ef" />
                Gráfica del método — [{currentMethodName}]
              </span>
              <div className="legend-badge">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="dot dot-curve"></span> Curva f(x) / Modelo
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="dot dot-root"></span> Raíz / Óptimo / Área
                </div>
              </div>
            </div>

            <div className="canvas-wrapper">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Error Convergence Graph Section (Except Direct Interpolation) */}
        {method !== 'interp_directa' && (
          <div className="glass-panel">
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title" style={{ color: '#fca5a5' }}>
                  <TrendingUp size={18} color="#f43f5e" />
                  Gráfica del Error Relativo — [{currentMethodName}]
                </span>
                <div className="legend-badge">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="dot dot-root"></span> Error Relativo Ea (%) vs Iteración
                  </div>
                </div>
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
                  <label className="input-label">Derivada de la función f'(x)</label>
                  <div className="function-input-wrapper">
                    <span className="function-icon" style={{ color: '#38bdf8' }}>f'(x)=</span>
                    <input
                      type="text"
                      className="function-input"
                      value={derivStr}
                      onChange={(e) => setDerivStr(e.target.value)}
                      placeholder="Ejemplo: 3*x^2 - 1"
                    />
                  </div>
                </div>
              )}

              <div className="limits-row">
                <div>
                  <label className="input-label">
                    {method === 'newton_raphson' ? 'Aproximación inicial x₀' : method === 'secante' ? 'Primera aproximación inicial x₀' : 'Límite A (inferior)'}
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
                      {method === 'secante' ? 'Segunda aproximación inicial x₁' : 'Límite B (superior)'}
                    </label>
                    <div className="stepper-input-group">
                      <button type="button" className="stepper-btn" onClick={() => setLimitB(prev => parseFloat((Number(prev) - 0.5).toFixed(2)))}><ChevronDown size={18} /></button>
                      <input type="number" step="any" className="stepper-input" value={limitB} onChange={e => setLimitB(parseFloat(e.target.value) || 0)} />
                      <button type="button" className="stepper-btn" onClick={() => setLimitB(prev => parseFloat((Number(prev) + 0.5).toFixed(2)))}><ChevronUp size={18} /></button>
                    </div>
                  </div>
                )}
              </div>

              <div className="switch-params-row">
                <div>
                  <label className="input-label">Criterio de parada</label>
                  <div className="mode-toggle-box">
                    <button type="button" className={`mode-option-btn ${stopCondition === 'tolerance' ? 'active' : ''}`} onClick={() => setStopCondition('tolerance')}>Por Tolerancia</button>
                    <button type="button" className={`mode-option-btn ${stopCondition === 'iterations' ? 'active' : ''}`} onClick={() => setStopCondition('iterations')}>Por Iteraciones</button>
                  </div>
                </div>
                <div>
                  <label className="input-label">{stopCondition === 'tolerance' ? 'Tolerancia deseada (ε)' : 'Iteraciones máximas'}</label>
                  <div className="stepper-input-group">
                    {stopCondition === 'tolerance' ? (
                      <input type="number" step="any" className="stepper-input" value={tolerance} onChange={e => setTolerance(parseFloat(e.target.value) || 0.0001)} />
                    ) : (
                      <input type="number" min="1" className="stepper-input" value={iterations} onChange={e => setIterations(parseInt(e.target.value, 10) || 1)} />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CASE 2: INTEGRACIÓN NUMÉRICA (Trapecio, Simpson 1/8, Simpson 3/8) */}
          {['trapecio', 'simpson_18', 'simpson_38'].includes(method) && (
            <>
              <div>
                <label className="input-label">Tipo de entrada</label>
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
                        placeholder="Ejemplo: x^2 + 2*x + 1"
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
                      Número de subintervalos n {method === 'simpson_18' ? '(Debe ser PAR)' : method === 'simpson_38' ? '(Debe ser MÚLTIPLO DE 3)' : '(Cualquier entero ≥ 1)'}
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
                <label className="input-label">Función objetivo unimodal f(x)</label>
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
                  <label className="input-label">Límite inferior del intervalo [a]</label>
                  <input type="number" step="any" className="stepper-input" style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} value={limitA} onChange={e => setLimitA(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="input-label">Límite superior del intervalo [b]</label>
                  <input type="number" step="any" className="stepper-input" style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} value={limitB} onChange={e => setLimitB(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div className="switch-params-row">
                <div>
                  <label className="input-label">Meta de Optimización</label>
                  <div className="mode-toggle-box">
                    <button type="button" className={`mode-option-btn ${optiGoal === 'max' ? 'active' : ''}`} onClick={() => setOptiGoal('max')}>Encontrar Máximo</button>
                    <button type="button" className={`mode-option-btn ${optiGoal === 'min' ? 'active' : ''}`} onClick={() => setOptiGoal('min')}>Encontrar Mínimo</button>
                  </div>
                </div>
                <div>
                  <label className="input-label">Tolerancia del error (proporción áurea)</label>
                  <input type="number" step="any" className="stepper-input" style={{ background: 'rgba(14, 8, 24, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} value={tolerance} onChange={e => setTolerance(parseFloat(e.target.value) || 0.0001)} />
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
                    placeholder="2*x*y + 2*x - x^2 - 2*y^2"
                  />
                </div>
              </div>

              <div className="limits-row">
                <div>
                  <label className="input-label">Punto inicial de partida (x₀, y₀)</label>
                  <div className="dual-input-group">
                    <div className="coord-field">
                      <span className="coord-label">x₀:</span>
                      <input 
                        type="number" 
                        step="any" 
                        className="coord-input" 
                        placeholder="0" 
                        value={multiX0} 
                        onChange={e => setMultiX0(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="coord-field">
                      <span className="coord-label">y₀:</span>
                      <input 
                        type="number" 
                        step="any" 
                        className="coord-input" 
                        placeholder="0" 
                        value={multiY0} 
                        onChange={e => setMultiY0(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label">Direcciones y Meta</label>
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
                      <input 
                        type="number" 
                        step="any" 
                        className="coord-input" 
                        placeholder="x_min" 
                        value={multiLimX[0]} 
                        onChange={e => setMultiLimX([parseFloat(e.target.value) || 0, multiLimX[1]])} 
                      />
                    </div>
                    <div className="coord-field">
                      <span className="coord-label">y:</span>
                      <input 
                        type="number" 
                        step="any" 
                        className="coord-input" 
                        placeholder="y_min" 
                        value={multiLimY[0]} 
                        onChange={e => setMultiLimY([parseFloat(e.target.value) || 0, multiLimY[1]])} 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label">Límite superior (x_max, y_max)</label>
                  <div className="dual-input-group">
                    <div className="coord-field">
                      <span className="coord-label">x:</span>
                      <input 
                        type="number" 
                        step="any" 
                        className="coord-input" 
                        placeholder="x_max" 
                        value={multiLimX[1]} 
                        onChange={e => setMultiLimX([multiLimX[0], parseFloat(e.target.value) || 0])} 
                      />
                    </div>
                    <div className="coord-field">
                      <span className="coord-label">y:</span>
                      <input 
                        type="number" 
                        step="any" 
                        className="coord-input" 
                        placeholder="y_max" 
                        value={multiLimY[1]} 
                        onChange={e => setMultiLimY([multiLimY[0], parseFloat(e.target.value) || 0])} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="switch-params-row">
                <div>
                  <label className="input-label">Criterio de parada</label>
                  <div className="mode-toggle-box">
                    <button type="button" className={`mode-option-btn ${stopCondition === 'tolerance' ? 'active' : ''}`} onClick={() => setStopCondition('tolerance')}>Por Tolerancia</button>
                    <button type="button" className={`mode-option-btn ${stopCondition === 'iterations' ? 'active' : ''}`} onClick={() => setStopCondition('iterations')}>Por Ciclos Fijos</button>
                  </div>
                </div>
                <div>
                  <label className="input-label">{stopCondition === 'tolerance' ? 'Tolerancia entre ciclos' : 'Número de ciclos'}</label>
                  <div className="stepper-input-group">
                    {stopCondition === 'tolerance' ? (
                      <input type="number" step="any" className="stepper-input" value={tolerance} onChange={e => setTolerance(parseFloat(e.target.value) || 0.0001)} />
                    ) : (
                      <input type="number" min="1" className="stepper-input" value={iterations} onChange={e => setIterations(parseInt(e.target.value, 10) || 1)} />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CASE 5: INTERPOLACIÓN DIRECTA */}
          {method === 'interp_directa' && (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ margin: 0 }}>
                    Conjunto de n+1 puntos (xᵢ, yᵢ) [Determina grado {points.length - 1}]
                  </label>
                  <button type="button" className="add-pt-btn" onClick={handleAddPoint}>
                    <Plus size={16} /> Añadir punto
                  </button>
                </div>

                <div className="points-table-container">
                  {points.map((pt, idx) => (
                    <div key={idx} className="point-row">
                      <span className="point-index">P{idx}</span>
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

              <div>
                <label className="input-label">Valor x donde se quiere estimar y (x_eval)</label>
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

          {/* CASE 6: REGRESIÓN POR MÍNIMOS CUADRADOS */}
          {method === 'regresion_mc' && (
            <>
              <div>
                <label className="input-label">Tipo de modelo a ajustar</label>
                <select 
                  className="select-model-dropdown"
                  value={regModel}
                  onChange={(e) => setRegModel(e.target.value)}
                >
                  <option value="lineal">Regresión Lineal: y = m·x + b</option>
                  <option value="polinomial_2">Regresión Polinomial Grado 2: y = a₂·x² + a₁·x + a₀</option>
                  <option value="exponencial">Regresión Exponencial: y = a·e^(b·x)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ margin: 0 }}>
                    Serie de puntos observados (xᵢ, yᵢ)
                  </label>
                  <button type="button" className="add-pt-btn" onClick={handleAddPoint}>
                    <Plus size={16} /> Añadir dato
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
            </>
          )}

          {/* Action button */}
          <div className="action-row">
            <button className="compute-btn" onClick={runCalculation}>
              <Play size={20} fill="#ffffff" />
              Calcular {currentMethodName}
            </button>
          </div>
        </div>

        {/* Results Banner */}
        {errorMsg ? (
          <div className="result-banner error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={28} color="#f87171" />
              <div>
                <div className="result-title">Error en los datos ingresados</div>
                <div style={{ color: '#fecaca', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                  {errorMsg}
                </div>
              </div>
            </div>
          </div>
        ) : result ? (
          <div className="result-banner">
            <div>
              <div className="result-title">Resultado — {currentMethodName}</div>
              
              {/* Integration */}
              {result.type === 'integration' && (
                <div>
                  <div className="result-value">Integral I ≈ {result.integral.toFixed(6)}</div>
                  <div style={{ color: '#86efac', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                    En el intervalo [{result.a}, {result.b}] con {result.n} subintervalos (h = {result.h.toFixed(5)})
                  </div>
                </div>
              )}

              {/* Root */}
              {result.type === 'root' && (
                <div className="result-value">Raíz x ≈ {result.value.toFixed(6)}</div>
              )}

              {/* Golden Section Univariate */}
              {result.type === 'opti_uni' && (
                <div>
                  <div className="result-value">x* = {result.value.toFixed(6)}</div>
                  <div style={{ color: '#86efac', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                    f(x*) = {result.fval.toFixed(6)} ({optiGoal === 'max' ? 'Máximo' : 'Mínimo'} local)
                  </div>
                </div>
              )}

              {/* Golden Section Multivariate */}
              {result.type === 'opti_multi' && (
                <div>
                  <div className="result-value">Óptimo: ({result.optPoint.x.toFixed(4)}, {result.optPoint.y.toFixed(4)})</div>
                  <div style={{ color: '#86efac', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                    f(x*, y*) = {result.fval.toFixed(6)}
                  </div>
                </div>
              )}

              {/* Interpolation */}
              {result.type === 'interpolation' && (
                <div>
                  <div className="result-value">y({result.xEval}) ≈ {result.yEstimated.toFixed(6)}</div>
                  <div style={{ color: '#e9d5ff', fontFamily: 'JetBrains Mono', fontSize: '0.95rem', marginTop: '0.35rem' }}>
                    P_{result.degree}(x) = {result.polyStr}
                  </div>
                </div>
              )}

              {/* Regression */}
              {result.type === 'regression' && (
                <div>
                  <div className="result-value">{result.modelStr}</div>
                  <div style={{ color: '#86efac', fontSize: '0.95rem', marginTop: '0.35rem' }}>
                    Coeficiente de Determinación R² = {(result.r2 * 100).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>

            {/* Stats badges */}
            <div className="stats-badges">
              {result.finalError !== undefined && result.finalError !== null && (
                <div className="stat-item" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.1)' }}>
                  Error Relativo (Ea): <strong style={{ color: '#fb7185' }}>{result.finalError.toFixed(4)}%</strong>
                </div>
              )}
              {result.n !== undefined && (
                <div className="stat-item">
                  Subintervalos n: <strong>{result.n}</strong>
                </div>
              )}
              {result.h !== undefined && (
                <div className="stat-item">
                  Paso h: <strong>{result.h.toFixed(4)}</strong>
                </div>
              )}
              {result.iterationsCount && (
                <div className="stat-item">
                  Iteraciones/Ciclos: <strong>{result.iterationsCount}</strong>
                </div>
              )}
              {result.degree !== undefined && (
                <div className="stat-item">
                  Grado: <strong>{result.degree}</strong>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Iterations / Evaluation Points Table Dropdown */}
        {result?.history && result.history.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <button
              className="table-toggle-btn"
              onClick={() => setShowTable(!showTable)}
            >
              <TableIcon size={18} />
              {showTable ? 'Ocultar tabla de detalle' : 'Ver tabla de detalle'}
            </button>

            {showTable && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {result.type === 'integration' ? (
                        <>
                          <th style={{ textAlign: 'center' }}>i</th>
                          <th>xᵢ</th>
                          <th>f(xᵢ)</th>
                        </>
                      ) : (
                        <>
                          <th style={{ textAlign: 'center' }}>Iteración</th>
                          {result.type === 'opti_uni' ? (
                            <>
                              <th>x_l</th>
                              <th>x_u</th>
                              <th>x₁</th>
                              <th>x₂</th>
                              <th>x* (Óptimo)</th>
                              <th>f(x*)</th>
                              <th>Error (%)</th>
                            </>
                          ) : result.type === 'opti_multi' ? (
                            <>
                              <th>x*</th>
                              <th>y*</th>
                              <th>f(x*, y*)</th>
                              <th>Error (%)</th>
                            </>
                          ) : (
                            <>
                              <th>a</th>
                              <th>b</th>
                              <th>xr (Raíz)</th>
                              <th>f(a)</th>
                              <th>f(b)</th>
                              <th>f(xr)</th>
                              <th>Error (%)</th>
                            </>
                          )}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.history.map((row, idx) => (
                      <tr key={idx}>
                        {result.type === 'integration' ? (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.i}</td>
                            <td>{row.x.toFixed(4)}</td>
                            <td style={{ color: '#38bdf8' }}>{row.y.toFixed(5)}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>
                              {row.iteration}
                            </td>
                            {result.type === 'opti_uni' ? (
                              <>
                                <td>{row.xl.toFixed(4)}</td>
                                <td>{row.xu.toFixed(4)}</td>
                                <td>{row.x1.toFixed(4)}</td>
                                <td>{row.x2.toFixed(4)}</td>
                                <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{row.xOpt.toFixed(5)}</td>
                                <td>{row.fOpt.toFixed(4)}</td>
                                <td style={{ color: '#f43f5e' }}>{row.error}</td>
                              </>
                            ) : result.type === 'opti_multi' ? (
                              <>
                                <td style={{ color: '#38bdf8' }}>{row.xOpt.toFixed(5)}</td>
                                <td style={{ color: '#38bdf8' }}>{row.yOpt.toFixed(5)}</td>
                                <td>{row.fOpt.toFixed(5)}</td>
                                <td style={{ color: '#f43f5e' }}>{row.error}</td>
                              </>
                            ) : (
                              <>
                                <td>{row.a.toFixed(5)}</td>
                                <td>{row.b.toFixed(5)}</td>
                                <td style={{ color: '#38bdf8', fontWeight: '600' }}>{row.xr.toFixed(6)}</td>
                                <td>{row.fa.toFixed(4)}</td>
                                <td>{row.fb.toFixed(4)}</td>
                                <td>{row.fxr.toExponential(3)}</td>
                                <td style={{ color: '#f43f5e' }}>{row.error}</td>
                              </>
                            )}
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

      </div>
    </div>
  );
}
