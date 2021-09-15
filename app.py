from pymongo import MongoClient
import jwt
import datetime
import hashlib
from flask import Flask, render_template, jsonify, request, redirect, url_for
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from decouple import config


SECRET_KEY = config('SECRET_KEY')
IP = config('IP')
PORT = config('DB_PORT')
DBNAME = config('DBNAME')

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['UPLOAD_FOLDER'] = "./static/profile_pics"

SECRET_KEY = SECRET_KEY
client = MongoClient(IP, int(PORT))
db = client.dbsparta_plus_week4


@app.route('/')
def home():
    return render_template('layout.html')


@app.route('/mypage')
def asd():
    return '민갑입니다.'


if __name__ == '__main__':
   app.run('0.0.0.0', port=5000, debug=True)