from flask import Flask, render_template
app = Flask(__name__)


@app.route('/')
def home():
    return '잘부탁 드립니다!'


@app.route('/mypage')
def asd():
    return 'mypage!'


if __name__ == '__main__':
   app.run('0.0.0.0', port=5000, debug=True)