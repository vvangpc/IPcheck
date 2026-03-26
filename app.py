import sys
import os
import threading
from flask import Flask, render_template, request, jsonify, send_from_directory
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtCore import QUrl
from engine import PatentEngine

# 获取当前脚本所在目录的绝对路径
base_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(base_dir, 'static')

app = Flask(__name__, static_folder=static_dir, template_folder=static_dir)

# 禁用 Flask 的日志输出以保持后台干净
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "没有文件被上传"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "未选择文件"}), 400
    
    # 保存临时文件
    temp_path = os.path.join(os.getcwd(), "temp_check.docx")
    file.save(temp_path)
    
    try:
        engine = PatentEngine(temp_path)
        errors = engine.run_all()
        # 清理临时文件
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"success": True, "errors": errors})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def run_flask():
    app.run(port=5000, debug=False, use_reloader=False)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("专利格式自动化校验工具 - 阶段一")
        self.resize(1100, 800)
        
        self.browser = QWebEngineView()
        self.browser.setUrl(QUrl("http://127.0.0.1:5000/"))
        self.setCentralWidget(self.browser)

if __name__ == "__main__":
    # 创建 static 文件夹
    if not os.path.exists('static'):
        os.makedirs('static')

    # 在后台线程运行 Flask
    threading.Thread(target=run_flask, daemon=True).start()
    
    # 运行 PySide6 GUI
    qt_app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(qt_app.exec())
