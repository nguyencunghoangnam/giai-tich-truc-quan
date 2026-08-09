// ==================== STATE MANAGEMENT ====================
let state = {
    currentFunction: '',
    compiledFunction: null,
    lastResult: null,
    isDarkMode: false
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference();
    updateModeOptions();
});

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.querySelector('.theme-toggle').textContent = '🌙';
        state.isDarkMode = true;
    }
}

// ==================== THEME TOGGLE ====================
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.body.classList.toggle('dark');
    document.querySelector('.theme-toggle').textContent = state.isDarkMode ? '🌙' : '☀️';
    localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
}

// ==================== NUCLEAR-GRADE SAFE EVALUATION ====================
function safeEvaluate(functionString, variables) {
    try {
        // Strategy 1: Direct evaluation
        let result = math.evaluate(functionString, variables);

        // Strategy 2: Handle all possible return types
        if (typeof result === 'number') {
            return result;
        }

        // Strategy 3: If it's a function, try to invoke it
        if (typeof result === 'function') {
            try {
                result = result();
                if (typeof result === 'number') return result;
            } catch (e) {
                // Continue to next strategy
            }
        }

        // Strategy 4: If it's a complex number
        if (result && typeof result === 'object' && 're' in result) {
            return typeof result.re === 'number' ? result.re : Number(result.re);
        }

        // Strategy 5: If it's a math.js type (Unit, BigNumber, Fraction)
        if (result && typeof result.toNumber === 'function') {
            return result.toNumber();
        }

        // Strategy 6: Parse and re-evaluate with explicit scope
        const node = math.parse(functionString);
        const compiled = node.compile();
        result = compiled.evaluate(variables);

        if (typeof result === 'number') {
            return result;
        }

        // Strategy 7: String coercion and parse
        const strResult = String(result);
        const numResult = parseFloat(strResult);
        if (!isNaN(numResult) && isFinite(numResult)) {
            return numResult;
        }

        // Strategy 8: Last resort - try numeric evaluation
        try {
            // Replace variables with their values in the string
            let expr = functionString;
            for (const [varName, varValue] of Object.entries(variables)) {
                const regex = new RegExp('\\b' + varName + '\\b', 'g');
                expr = expr.replace(regex, `(${varValue})`);
            }
            result = math.evaluate(expr);
            if (typeof result === 'number') return result;
            if (typeof result.toNumber === 'function') return result.toNumber();
        } catch (e) {
            // Continue to error
        }

        throw new Error(`Không thể tính thành số. Kiểu dữ liệu: ${typeof result}, giá trị: ${result}`);

    } catch (error) {
        throw new Error(`Tính toán thất bại: ${error.message}`);
    }
}

// ==================== SAFE EXPRESSION VALIDATION ====================
function validateExpressionSyntax(expression) {
    if (!/^[0-9a-zA-Z_+\-*/^().,\s]+$/.test(expression)) {
        throw new Error('Biểu thức chứa ký tự không được hỗ trợ.');
    }

    const allowedNames = new Set([
        'x', 'y', 'z', 'e', 'pi',
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
        'sqrt', 'abs', 'exp', 'log', 'ln', 'floor', 'ceil', 'round'
    ]);
    const names = expression.match(/[a-zA-Z_]+/g) || [];
    const unsupported = names.find(name => !allowedNames.has(name));
    if (unsupported) {
        throw new Error(`Tên “${unsupported}” không được hỗ trợ.`);
    }
}

function hybridEvaluate(functionString, variables) {
    const result = safeEvaluate(functionString, variables);
    if (typeof result === 'number' && isFinite(result)) {
        return result;
    }
    throw new Error('Kết quả không phải là một số hữu hạn.');
}

// ==================== INPUT VALIDATION ====================
function normalizeFunction(input) {
    return input
        .replace(/\s+/g, '')
        .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
        .replace(/\)(\d)/g, ')*$1')
        .replace(/\)([a-zA-Z(])/g, ')*$1');
}

function validateFunction() {
    const input = document.getElementById('functionInput').value.trim();
    const preview = document.getElementById('preview');

    if (!input) {
        preview.textContent = 'Nhập một hàm số để bắt đầu...';
        preview.className = 'preview-box';
        state.currentFunction = '';
        state.compiledFunction = null;
        return false;
    }

    try {
        validateExpressionSyntax(input);
        const normalized = normalizeFunction(input);

        // Test with multiple evaluation strategies
        let testPassed = false;
        let testResult;

        // Test 1: Try at x=1
        try {
            testResult = hybridEvaluate(normalized, { x: 1, y: 1, z: 1 });
            testPassed = typeof testResult === 'number' && isFinite(testResult);
        } catch (e) {
            // Try another point
        }

        // Test 2: If first test failed, try x=0
        if (!testPassed) {
            try {
                testResult = hybridEvaluate(normalized, { x: 0.5, y: 0.5, z: 0.5 });
                testPassed = typeof testResult === 'number' && isFinite(testResult);
            } catch (e) {
                // Continue
            }
        }

        if (!testPassed) {
            throw new Error('Không thể tính giá trị số của biểu thức này');
        }

        state.currentFunction = normalized;
        state.compiledFunction = normalized; // Store string, not compiled object

        preview.innerHTML = `<strong>✓</strong> Hợp lệ: ${normalized} <span style="opacity:0.6">(kiểm tra: f(1) = ${testResult.toFixed(4)})</span>`;
        preview.className = 'preview-box valid';
        return true;
    } catch (error) {
        preview.innerHTML = `<strong>⚠</strong> ${error.message}`;
        preview.className = 'preview-box error';
        state.currentFunction = '';
        state.compiledFunction = null;
        return false;
    }
}

// ==================== TEMPLATE INSERTION ====================
function insertTemplate(template) {
    document.getElementById('functionInput').value = template;
    validateFunction();
}

// ==================== SETTING UPDATES ====================
function updatePrecision(value) {
    document.getElementById('precisionValue').textContent = value;
}

function updateResolution(value) {
    document.getElementById('resolutionValue').textContent = value;
}

// ==================== MODE OPTIONS ====================
function updateModeOptions() {
    const mode = document.getElementById('operationMode').value;
    const container = document.getElementById('modeOptions');

    const options = {
        basic: `
            <div class="option-group">
                <label class="option-label">Phép toán</label>
                <select id="basicOp">
                    <option value="derivative">Đạo hàm cấp một</option>
                    <option value="derivative2">Đạo hàm cấp hai</option>
                    <option value="integral">Nguyên hàm</option>
                    <option value="definite">Tích phân xác định</option>
                </select>
            </div>
            <div class="option-group" id="limitsGroup" style="display:none;">
                <label class="option-label">Cận dưới</label>
                <input type="number" id="lowerLimit" placeholder="0" step="0.1">
                <label class="option-label" style="margin-top:8px;">Cận trên</label>
                <input type="number" id="upperLimit" placeholder="1" step="0.1">
            </div>
        `,
        advanced: `
            <div class="option-group">
                <label class="option-label">Phương pháp tích phân</label>
                <select id="integrationMethod">
                    <option value="auto">Tự động nhận dạng</option>
                    <option value="substitution">Đổi biến số</option>
                    <option value="parts">Tích phân từng phần</option>
                    <option value="partial">Phân tích phân thức</option>
                    <option value="trig">Đổi biến lượng giác</option>
                </select>
            </div>
            <div class="option-group">
                <label class="option-label">Cận dưới (không bắt buộc)</label>
                <input type="text" id="advLower" placeholder="Để trống nếu tính nguyên hàm">
                <label class="option-label" style="margin-top:8px;">Cận trên (không bắt buộc)</label>
                <input type="text" id="advUpper" placeholder="Để trống nếu tính nguyên hàm">
            </div>
        `,
        differential: `
            <div class="option-group">
                <label class="option-label">Loại phương trình</label>
                <select id="odeType">
                    <option value="firstOrder">Vi phân cấp một</option>
                    <option value="secondOrder">Vi phân cấp hai</option>
                    <option value="system">Hệ phương trình vi phân</option>
                </select>
            </div>
            <div class="option-group">
                <label class="option-label">Điều kiện đầu</label>
                <input type="text" id="initialCond" placeholder="Ví dụ: y(0)=1">
                <p class="option-hint">Chế độ này mới chỉ phân tích cơ bản, chưa giải phương trình hoàn chỉnh.</p>
            </div>
        `,
        series: `
            <div class="option-group">
                <label class="option-label">Loại khai triển</label>
                <select id="seriesType">
                    <option value="taylor">Chuỗi Taylor</option>
                    <option value="maclaurin">Chuỗi Maclaurin</option>
                    <option value="power">Chuỗi lũy thừa</option>
                </select>
            </div>
            <div class="option-group">
                <label class="option-label">Tâm khai triển (a)</label>
                <input type="number" id="expansionPoint" value="0" step="0.1">
                <label class="option-label" style="margin-top:8px;">Số số hạng</label>
                <input type="number" id="numTerms" value="5" min="1" max="20">
            </div>
        `,
        multivariable: `
            <div class="option-group">
                <label class="option-label">Phép toán</label>
                <select id="multiOp">
                    <option value="partial">Đạo hàm riêng</option>
                    <option value="gradient">Vectơ gradient</option>
                    <option value="divergence">Độ phân kỳ (thử nghiệm)</option>
                    <option value="curl">Độ xoáy (thử nghiệm)</option>
                    <option value="double">Tích phân kép (thử nghiệm)</option>
                </select>
            </div>
            <div class="option-group">
                <label class="option-label">Các biến (ngăn cách bằng dấu phẩy)</label>
                <input type="text" id="multiVars" placeholder="x,y">
            </div>
        `
    };

    container.innerHTML = options[mode] || options.basic;
    container.classList.remove('hidden');

    // Add event listener for basic operation change
    if (mode === 'basic') {
        const basicOp = document.getElementById('basicOp');
        basicOp.addEventListener('change', function() {
            const limitsGroup = document.getElementById('limitsGroup');
            limitsGroup.style.display = this.value === 'definite' ? 'block' : 'none';
        });
    }
}

// ==================== MAIN COMPUTE FUNCTION ====================
async function compute() {
    if (!validateFunction()) {
        showAlert('Hãy nhập một hàm số hợp lệ trước khi tính.', 'error');
        return;
    }

    const mode = document.getElementById('operationMode').value;
    const computeBtn = document.getElementById('computeBtn');

    // Show loading state
    computeBtn.classList.add('loading');
    computeBtn.innerHTML = '<div class="spinner"></div><span>Đang tính...</span>';

    try {
        let result;

        switch(mode) {
            case 'basic':
                result = await computeBasic();
                break;
            case 'advanced':
                result = await computeAdvanced();
                break;
            case 'differential':
                result = await computeDifferential();
                break;
            case 'series':
                result = await computeSeries();
                break;
            case 'multivariable':
                result = await computeMultivariable();
                break;
        }

        state.lastResult = result;
        displayResult(result);
        switchTab('results');

    } catch (error) {
        showAlert('Lỗi tính toán: ' + error.message, 'error');
    } finally {
        computeBtn.classList.remove('loading');
        computeBtn.innerHTML = '<span>🚀</span><span>Tính toán</span>';
    }
}

// ==================== BASIC CALCULUS ====================
async function computeBasic() {
    const operation = document.getElementById('basicOp').value;

    switch(operation) {
        case 'derivative':
            return computeDerivative(1);
        case 'derivative2':
            return computeDerivative(2);
        case 'integral':
            return computeSymbolicIntegral();
        case 'definite':
            return computeDefiniteIntegral();
    }
}

function computeDerivative(order) {
    try {
        let node = math.parse(state.currentFunction);
        let result = node;

        for (let i = 0; i < order; i++) {
            result = math.derivative(result, 'x');
        }

        const simplified = math.simplify(result);

        return {
            type: order === 1 ? 'derivative' : 'derivative2',
            symbolic: simplified.toString(),
            original: state.currentFunction,
            steps: generateDerivativeSteps(order)
        };
    } catch (error) {
        throw new Error('Không thể tính đạo hàm: ' + error.message);
    }
}

function computeSymbolicIntegral() {
    try {
        // Attempt symbolic integration with Algebrite
        const expr = state.currentFunction
            .replace(/\*/g, ' ')
            .replace(/log/g, 'ln');

        const result = Algebrite.run(`integral(${expr}, x)`);
        const resultStr = String(result);

        // Check if Algebrite actually integrated it
        if (resultStr.includes('integral(') || resultStr === expr) {
            // Try common patterns
            const pattern = tryCommonIntegrals(state.currentFunction);
            if (pattern) {
                return {
                    type: 'integral',
                    symbolic: pattern + ' + C',
                    method: 'Nhận dạng công thức',
                    original: state.currentFunction,
                    steps: generateIntegralSteps('pattern')
                };
            }

            return {
                type: 'integral',
                symbolic: 'Chưa tìm được nguyên hàm dưới dạng ký hiệu',
                note: 'Có thể thử tích phân xác định bằng phương pháp số.',
                method: 'N/A',
                original: state.currentFunction,
                steps: []
            };
        }

        return {
            type: 'integral',
            symbolic: resultStr + ' + C',
            method: 'Tính toán ký hiệu bằng Algebrite',
            original: state.currentFunction,
            steps: generateIntegralSteps('symbolic')
        };
    } catch (error) {
        throw new Error('Không thể tính nguyên hàm: ' + error.message);
    }
}

function tryCommonIntegrals(func) {
    const patterns = {
        'x': '(x^2)/2',
        'x^2': '(x^3)/3',
        'x^3': '(x^4)/4',
        'sin(x)': '-cos(x)',
        'cos(x)': 'sin(x)',
        'e^x': 'e^x',
        '1/x': 'ln(|x|)',
        'tan(x)': '-ln(|cos(x)|)',
        'sec(x)^2': 'tan(x)',
        '1/sqrt(1-x^2)': 'asin(x)',
        '1/(1+x^2)': 'atan(x)'
    };

    return patterns[func] || null;
}

function computeDefiniteIntegral() {
    const lower = parseFloat(document.getElementById('lowerLimit').value);
    const upper = parseFloat(document.getElementById('upperLimit').value);

    if (isNaN(lower) || isNaN(upper)) {
        throw new Error('Hãy nhập cận dưới và cận trên hợp lệ.');
    }

    if (lower >= upper) {
        throw new Error('Cận dưới phải nhỏ hơn cận trên.');
    }

    const points = parseInt(document.getElementById('resolution').value);
    const n = points % 2 === 0 ? points : points + 1;
    const h = (upper - lower) / n;
    let sum = 0;
    let errors = [];

    try {
        const funcStr = state.currentFunction;

        for (let i = 0; i <= n; i++) {
            const x = lower + i * h;

            let y;
            try {
                y = hybridEvaluate(funcStr, { x: x });
            } catch (evalError) {
                errors.push(`x=${x.toFixed(6)}: ${evalError.message}`);
                continue;
            }

            if (!isFinite(y)) {
                errors.push(`x=${x.toFixed(6)}: non-finite value (${y})`);
                continue;
            }

            // Simpson's rule coefficients
            if (i === 0 || i === n) {
                sum += y;
            } else if (i % 2 === 0) {
                sum += 2 * y;
            } else {
                sum += 4 * y;
            }
        }

        if (errors.length > n * 0.1) {
            throw new Error(`Có quá nhiều điểm không tính được (${errors.length}/${n}). Ví dụ: ${errors[0]}`);
        }

        const result = (h / 3) * sum;
        const precision = parseInt(document.getElementById('precision').value);

        return {
            type: 'definite',
            value: result.toFixed(precision),
            lower: lower,
            upper: upper,
            method: 'Quy tắc Simpson',
            points: n,
            warnings: errors.length > 0 ? `Đã bỏ qua ${errors.length} điểm` : null,
            original: state.currentFunction,
            steps: generateDefiniteSteps(lower, upper, result, n)
        };
    } catch (error) {
        throw new Error('Tích phân số thất bại: ' + error.message);
    }
}

// ==================== ADVANCED INTEGRATION ====================
async function computeAdvanced() {
    const method = document.getElementById('integrationMethod').value;
    const lower = document.getElementById('advLower').value.trim();
    const upper = document.getElementById('advUpper').value.trim();

    // If limits provided, do numerical
    if (lower && upper) {
        const lowerVal = parseFloat(lower);
        const upperVal = parseFloat(upper);

        if (isNaN(lowerVal) || isNaN(upperVal)) {
            throw new Error('Các cận tích phân không hợp lệ.');
        }

        return computeDefiniteWithMethod(lowerVal, upperVal, method);
    }

    // Otherwise attempt symbolic with method hint
    return computeSymbolicWithMethod(method);
}

function computeSymbolicWithMethod(method) {
    try {
        con…4444 tokens truncated…      `;
    } else if (result.type === 'definite') {
        html += `
            <div class="result-card">
                <div class="result-title">
                    <div class="result-icon">∫</div>
                    <span>Tích phân xác định</span>
                </div>
                <div class="result-content">
                    <strong>∫<sub>${result.lower}</sub><sup>${result.upper}</sup> f(x) dx ≈</strong> ${result.value}
                </div>
                <div class="result-meta">
                    Phương pháp: ${result.method} (${result.points} điểm)<br>
                    Hàm số ban đầu: ${escapeHtml(result.original)}
                </div>
            </div>
        `;
    } else if (result.type === 'advanced') {
        html += `
            <div class="result-card">
                <div class="result-title">
                    <div class="result-icon">∫</div>
                    <span>Tích phân nâng cao</span>
                </div>
                <div class="result-content">
                    ${result.value ? `<strong>Kết quả ≈</strong> ${result.value}` : `<strong>Kết quả:</strong> ${escapeHtml(result.symbolic)}`}
                </div>
                <div class="result-meta">
                    Phương pháp: ${result.method}<br>
                    ${result.suggestion ? result.suggestion : ''}
                    ${result.lower !== undefined ? `Các cận: [${result.lower}, ${result.upper}]` : ''}
                </div>
            </div>
        `;
    } else if (result.type === 'series') {
        if (result.expansion) {
            html += `
                <div class="result-card">
                    <div class="result-title">
                        <div class="result-icon">Σ</div>
                        <span>Khai triển chuỗi</span>
                    </div>
                    <div class="result-content">
                        ${escapeHtml(result.expansion)}
                    </div>
                    <div class="result-meta">
                        Loại chuỗi: ${result.seriesType}<br>
                        Tâm khai triển: x = ${result.point}<br>
                        Số số hạng: ${result.terms}
                    </div>
                </div>
            `;
        } else if (result.terms) {
            html += `
                <div class="result-card">
                    <div class="result-title">
                        <div class="result-icon">Σ</div>
                        <span>Khai triển chuỗi</span>
                    </div>
                    <div class="result-content">
                        ${result.terms.map(t => escapeHtml(t.term)).join(' + ')}
                    </div>
                    <div class="result-meta">
                        Tâm khai triển: x = ${result.point}<br>
                        Số số hạng đã tính: ${result.numTerms}
                    </div>
                </div>
            `;
        }
    } else if (result.type === 'differential') {
        html += `
            <div class="result-card">
                <div class="result-title">
                    <div class="result-icon">∂</div>
                    <span>Phương trình vi phân</span>
                </div>
                <div class="result-content">
                    ${escapeHtml(result.solution)}
                </div>
                <div class="result-meta">
                    Loại: ${result.odeType}<br>
                    Điều kiện đầu: ${result.initialConditions}<br>
                    ${result.note}
                </div>
            </div>
        `;
    } else if (result.type === 'multivariable') {
        html += `
            <div class="result-card">
                <div class="result-title">
                    <div class="result-icon">∇</div>
                    <span>${translateOperation(result.operation)}</span>
                </div>
                <div class="result-content">
        `;

        if (result.operation === 'Partial Derivatives' && typeof result.result === 'object') {
            html += '<strong>Các đạo hàm riêng:</strong><br><br>';
            for (const [varName, derivative] of Object.entries(result.result)) {
                html += `∂f/∂${varName} = ${escapeHtml(derivative)}<br><br>`;
            }
        } else if (result.operation === 'Gradient Vector' && Array.isArray(result.result)) {
            html += `<strong>${result.notation || 'Gradient'}</strong><br><br>`;
            result.result.forEach((component, idx) => {
                html += `Thành phần ${idx + 1}: ${escapeHtml(component)}<br>`;
            });
        } else {
            html += escapeHtml(String(result.result));
        }

        html += `
                </div>
                <div class="result-meta">
                    Các biến: ${result.variables.join(', ')}<br>
                    ${result.note ? result.note + '<br>' : ''}
                    ${result.suggestion ? result.suggestion : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Display steps
    displaySteps(stepsContainer, result.steps || []);
}

function displaySteps(container, steps) {
    if (!steps || steps.length === 0) {
        container.classList.remove('show-timeline');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📖</div>
                <h3>Chưa có các bước chi tiết</h3>
                <p>Phép tính này chưa hỗ trợ lời giải từng bước.</p>
            </div>
        `;
        return;
    }

    container.classList.add('show-timeline');
    let html = '';
    steps.forEach((step, index) => {
        html += `
            <div class="step-card" style="--delay:${index * 80}ms">
                <div class="step-header">
                    <div class="step-number">${step.num}</div>
                    <div class="step-title">${step.title}</div>
                </div>
                <div class="step-content">${step.content}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function translateOperation(operation) {
    const labels = {
        'Partial Derivatives': 'Đạo hàm riêng',
        'Gradient Vector': 'Vectơ gradient',
        'Divergence': 'Độ phân kỳ',
        'Curl (2D Vorticity)': 'Độ xoáy hai chiều',
        'Curl (3D)': 'Độ xoáy ba chiều',
        'Double Integral': 'Tích phân kép'
    };
    return labels[operation] || operation;
}

// ==================== PLOTTING WITH LIBRARY VALIDATION ====================
function checkPlotlyAvailable() {
    if (typeof Plotly === 'undefined') {
        throw new Error('Thư viện vẽ đồ thị chưa tải được. Hãy tải lại trang.');
    }
    return true;
}

function switchTab(tabName, tabButton) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const activeButton = tabButton || document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (activeButton) activeButton.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'plot' && state.currentFunction) {
        plot2D();
    } else if (tabName === 'plot3d' && state.currentFunction) {
        plot3D();
    }
}

function plot2D() {
    if (!state.currentFunction) {
        showAlert('Hãy nhập một hàm số hợp lệ trước.', 'error');
        return;
    }

    const plotDiv = document.getElementById('plot2d');

    try {
        checkPlotlyAvailable();

        const resolution = parseInt(document.getElementById('resolution').value);
        const xMin = -10;
        const xMax = 10;
        const step = (xMax - xMin) / resolution;

        const xValues = [];
        const yValues = [];
        let skipCount = 0;

        const funcStr = state.currentFunction;

        for (let i = 0; i <= resolution; i++) {
            const x = xMin + i * step;

            try {
                const y = hybridEvaluate(funcStr, { x: x });

                if (isFinite(y) && Math.abs(y) < 1e10) {
                    xValues.push(x);
                    yValues.push(y);
                } else {
                    skipCount++;
                }
            } catch (e) {
                skipCount++;
            }
        }

        if (xValues.length < 10) {
            throw new Error('Hàm số có quá nhiều điểm gián đoạn nên không thể vẽ.');
        }

        const trace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            line: {
                color: '#667eea',
                width: 3
            },
            name: 'f(x)'
        };

        const isDark = document.body.classList.contains('dark');
        const textColor = isDark ? '#f5f5f7' : '#1d1d1f';
        const borderColor = isDark ? '#38383a' : '#d2d2d7';

        const layout = {
            title: {
                text: `f(x) = ${state.currentFunction}`,
                font: {
                    family: '-apple-system, BlinkMacSystemFont',
                    size: 18,
                    color: textColor
                }
            },
            xaxis: {
                title: 'x',
                gridcolor: borderColor,
                zerolinecolor: borderColor,
                color: textColor
            },
            yaxis: {
                title: 'f(x)',
                gridcolor: borderColor,
                zerolinecolor: borderColor,
                color: textColor
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {
                color: textColor
            },
            margin: { t: 60, r: 40, b: 60, l: 60 }
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        };

        Plotly.newPlot(plotDiv, [trace], layout, config);

        if (skipCount > 0) {
            plotDiv.insertAdjacentHTML('afterend',
                `<div style="padding:10px;text-align:center;color:var(--text-secondary);font-size:12px;">
                    ℹ️ Đã bỏ qua ${skipCount} điểm gián đoạn
                </div>`
            );
        }

    } catch (error) {
        console.error('Plot error:', error);
        plotDiv.innerHTML = `
            <div class="alert alert-error">
                <span class="alert-icon">⚠</span>
                <div>
                    <strong>Không thể vẽ đồ thị</strong><br>
                    ${escapeHtml(error.message)}
                    ${error.message.includes('Plotly') ? '<br><small>Hãy tải lại trang để nạp lại thư viện đồ thị.</small>' : ''}
                </div>
            </div>
        `;
    }
}

function plot3D() {
    const func = state.currentFunction;
    const plotDiv = document.getElementById('plot3dDiv');

    if (!func.includes('y')) {
        plotDiv.innerHTML = `
            <div class="alert alert-warning">
                <span class="alert-icon">ℹ️</span>
                <span>Đồ thị 3D yêu cầu hàm có cả hai biến x và y, ví dụ: sin(x)*cos(y).</span>
            </div>
        `;
        return;
    }

    try {
        checkPlotlyAvailable();

        const gridSize = 40;
        const range = 5;
        const step = (2 * range) / gridSize;

        const xValues = [];
        const yValues = [];
        const zValues = [];
        let skipCount = 0;

        for (let i = 0; i <= gridSize; i++) {
            const row = [];
            const x = -range + i * step;
            xValues.push(x);

            for (let j = 0; j <= gridSize; j++) {
                const y = -range + j * step;

                if (i === 0) {
                    yValues.push(y);
                }

                try {
                    const z = hybridEvaluate(func, { x: x, y: y });
                    if (isFinite(z) && Math.abs(z) < 1e6) {
                        row.push(z);
                    } else {
                        row.push(null);
                        skipCount++;
                    }
                } catch (e) {
                    row.push(null);
                    skipCount++;
                }
            }
            zValues.push(row);
        }

        const validValues = [];
        zValues.forEach(row => row.forEach(value => {
            if (typeof value === 'number' && isFinite(value)) {
                validValues.push(value);
            }
        }));

        if (validValues.length < 25) {
            throw new Error('Mặt 3D không có đủ điểm hợp lệ. Hãy điều chỉnh hàm số hoặc miền khảo sát.');
        }

        let zMin = Math.min(...validValues);
        let zMax = Math.max(...validValues);

        if (!isFinite(zMin) || !isFinite(zMax)) {
            zMin = -1;
            zMax = 1;
        }

        if (zMin === zMax) {
            const padding = Math.max(1, Math.abs(zMin) * 0.1 || 1);
            zMin -= padding;
            zMax += padding;
        }

        const isDark = document.body.classList.contains('dark');
        const textColor = isDark ? '#f5f5f7' : '#0f172a';
        const gridColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.12)';
        const axisLineColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.4)';
        const sceneBackground = isDark ? 'rgba(5,8,15,0.95)' : 'rgba(255,255,255,0.92)';
        const surfaceColorscale = isDark
            ? [
                [0, '#1d4ed8'],
                [0.5, '#a855f7'],
                [1, '#f472b6']
            ]
            : [
                [0, '#0f172a'],
                [0.5, '#2563eb'],
                [1, '#60a5fa']
            ];

        const trace = {
            x: xValues,
            y: yValues,
            z: zValues,
            type: 'surface',
            colorscale: surfaceColorscale,
            showscale: true,
            opacity: 0.98,
            lighting: {
                ambient: 0.5,
                diffuse: 0.8,
                specular: 0.3,
                roughness: 0.6
            },
            contours: {
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: isDark ? '#22d3ee' : '#0ea5e9',
                    project: { z: true }
                }
            }
        };

        const layout = {
            title: {
                text: `f(x,y) = ${func}`,
                font: {
                    family: '-apple-system, BlinkMacSystemFont',
                    size: 18,
                    color: textColor
                }
            },
            scene: {
                xaxis: {
                    title: 'x',
                    color: textColor,
                    gridcolor: gridColor,
                    zerolinecolor: axisLineColor,
                    linecolor: axisLineColor,
                    range: [-range, range],
                    tickfont: { color: textColor }
                },
                yaxis: {
                    title: 'y',
                    color: textColor,
                    gridcolor: gridColor,
                    zerolinecolor: axisLineColor,
                    linecolor: axisLineColor,
                    range: [-range, range],
                    tickfont: { color: textColor }
                },
                zaxis: {
                    title: 'f(x,y)',
                    color: textColor,
                    gridcolor: gridColor,
                    zerolinecolor: axisLineColor,
                    linecolor: axisLineColor,
                    range: [zMin, zMax],
                    tickfont: { color: textColor }
                },
                bgcolor: sceneBackground,
                aspectmode: 'cube'
            },
            paper_bgcolor: sceneBackground,
            font: {
                color: textColor
            },
            margin: { t: 60, r: 20, b: 20, l: 20 }
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        };

        Plotly.newPlot(plotDiv, [trace], layout, config);

    } catch (error) {
        console.error('3D Plot error:', error);
        plotDiv.innerHTML = `
            <div class="alert alert-error">
                <span class="alert-icon">⚠</span>
                <div>
                    <strong>Không thể tạo đồ thị 3D</strong><br>
                    ${escapeHtml(error.message)}
                    ${error.message.includes('Plotly') ? '<br><small>Hãy tải lại trang để nạp lại thư viện đồ thị.</small>' : ''}
                </div>
            </div>
        `;
    }
}

// ==================== ALERTS ====================
function showAlert(message, type = 'error') {
    const container = document.getElementById('results');
    const icons = {
        error: '⚠',
        success: '✓',
        warning: 'ℹ️'
    };

    container.innerHTML = `
        <div class="alert alert-${type}">
            <span class="alert-icon">${icons[type]}</span>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
}

// ==================== UTILITY FUNCTIONS ====================
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function clearAll() {
    document.getElementById('functionInput').value = '';
    document.getElementById('preview').textContent = 'Nhập một hàm số để bắt đầu...';
    document.getElementById('preview').className = 'preview-box';

    state.currentFunction = '';
    state.compiledFunction = null;
    state.lastResult = null;

    document.getElementById('results').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🧮</div>
            <h3>Sẵn sàng tính toán</h3>
            <p>Nhập hàm số và chọn phép toán để bắt đầu</p>
        </div>
    `;

    const stepsElement = document.getElementById('steps');
    stepsElement.classList.remove('show-timeline');
    stepsElement.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📖</div>
            <h3>Hướng dẫn từng bước</h3>
            <p>Các bước tính toán sẽ xuất hiện tại đây</p>
        </div>
    `;

    document.getElementById('plot2d').innerHTML = '';
    document.getElementById('plot3dDiv').innerHTML = '';
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to compute
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        compute();
    }

    // Ctrl/Cmd + K to clear
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearAll();
    }
});

// ==================== AUTO-SAVE ====================
let autoSaveTimeout;
document.getElementById('functionInput').addEventListener('input', function() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        localStorage.setItem('lastFunction', this.value);
    }, 1000);
});

// Load last function on startup
window.addEventListener('load', function() {
    const lastFunction = localStorage.getItem('lastFunction');
    if (lastFunction) {
        document.getElementById('functionInput').value = lastFunction;
        validateFunction();
    }
});
