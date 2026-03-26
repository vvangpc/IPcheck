const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name-display');
const startBtn = document.getElementById('start-btn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const logArea = document.getElementById('log-area');

let currentFile = null;

// 点击触发文件选择
dropZone.addEventListener('click', () => fileInput.click());

// 处理文件选择
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectFile(e.target.files[0]);
    }
});

// 拖拽逻辑
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        selectFile(files[0]);
    }
});

function selectFile(file) {
    if (!file.name.endsWith('.docx')) {
        showStatus('请上传 .docx 格式的文件', 'error');
        return;
    }
    currentFile = file;
    fileNameDisplay.innerText = `已选择: ${file.name}`;
    fileNameDisplay.style.color = '#38bdf8';
    startBtn.disabled = false;
    showStatus('文件就绪，请点击“开始检查”', 'success');
    logArea.value = '';
}

startBtn.addEventListener('click', () => {
    if (!currentFile) return;
    performCheck(currentFile);
});

function appendLog(msg) {
    const now = new Date().toLocaleTimeString();
    logArea.value += `[${now}] ${msg}\n`;
    logArea.scrollTop = logArea.scrollHeight;
}

function performCheck(file) {
    startBtn.disabled = true;
    resultsDiv.innerHTML = '';
    showStatus('<div class="loader"></div> 正在执行校验...', 'processing');
    
    appendLog('开始读取文件: ' + file.name);
    appendLog('初始化专利解析引擎...');

    const formData = new FormData();
    formData.append('file', file);

    // 模拟分步日志（实际请求是异步一次完成，这里为了交互感模拟下过程）
    setTimeout(() => appendLog('正在解析权利要求树...'), 300);
    setTimeout(() => appendLog('正在比对说明书附图标记...'), 700);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        appendLog('校验逻辑执行完毕。');
        if (data.error) {
            showStatus('错误: ' + data.error, 'error');
            appendLog('发生错误: ' + data.error);
        } else {
            renderResults(data.errors);
            appendLog(`发现 ${data.errors.length} 处潜在问题。`);
        }
        startBtn.disabled = false;
    })
    .catch(err => {
        showStatus('服务器连接失败', 'error');
        appendLog('致命错误: 无法连接到本地服务');
        startBtn.disabled = false;
    });
}

function showStatus(msg, type) {
    statusDiv.innerHTML = msg;
    if (type === 'error') statusDiv.style.color = '#ef4444';
    else if (type === 'success') statusDiv.style.color = '#10b981';
    else statusDiv.style.color = '#38bdf8';
}

function renderResults(errors) {
    if (errors.length === 0) {
        showStatus('🎉 恭喜！未检测到明显逻辑格式问题。', 'success');
        return;
    }

    showStatus(`检测到 ${errors.length} 处潜在问题`, 'warning');

    errors.forEach(err => {
        const card = document.createElement('div');
        card.className = 'error-card';
        card.innerHTML = `
            <div class="error-header">
                <span class="error-type">${err.module} - ${err.type}</span>
                <span class="error-target">${err.target}</span>
            </div>
            <div class="error-detail">${err.detail}</div>
        `;
        resultsDiv.appendChild(card);
    });
}
