const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');

// 点击触发文件选择
dropZone.addEventListener('click', () => fileInput.click());

// 处理文件选择
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
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
        handleFile(files[0]);
    }
});

function handleFile(file) {
    if (!file.name.endsWith('.docx')) {
        showStatus('请上传 .docx 格式的文件', 'error');
        return;
    }

    showStatus('<div class="loader"></div> 正在解析校验中，请稍候...', 'processing');
    resultsDiv.innerHTML = '';

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showStatus('错误: ' + data.error, 'error');
        } else {
            renderResults(data.errors);
        }
    })
    .catch(err => {
        showStatus('服务器连接失败', 'error');
        console.error(err);
    });
}

function showStatus(msg, type) {
    statusDiv.innerHTML = msg;
    statusDiv.style.color = type === 'error' ? '#ef4444' : '#38bdf8';
}

function renderResults(errors) {
    if (errors.length === 0) {
        showStatus('🎉 恭喜！未检测到明显逻辑格式问题。', 'success');
        statusDiv.style.color = '#10b981';
        return;
    }

    showStatus(`检测到 ${errors.length} 处潜在问题`, 'warning');
    statusDiv.style.color = '#f59e0b';

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
