import random
from pymongo import MongoClient
from bson.objectid import ObjectId

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

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['UPLOAD_FOLDER'] = "./static/profile_pics"

SECRET_KEY = SECRET_KEY
client = MongoClient(IP, int(PORT))
DBNAME = client.dbsparta_plus_week4
db = client.dbsparta_plus_week4

@app.route('/')
def home():
    token_receive = request.cookies.get('mytoken')
    if token_receive is None:
        return redirect(url_for("login"))

    food_receive = request.args.get("food_give")
    user = list(db.users.find({}))
    for item in user:
        item["_id"] = str(item["_id"])
    random_user = random.sample(user, 3)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        user_info = db.users.find_one({"username": payload["id"]})
        if food_receive == None:
            # 최근순으로 작성되어지는 포스트 솔팅해서 구현.
            posts = list(db.posts.find({}))
            return render_template("index.html", list=posts, rec_user=random_user, user_info=user_info)
        else:
            # 최근순으로 작성되어지는 포스트 솔팅하기.
            search_result = list(db.posts.find({'post_title': food_receive}))

            return render_template("index.html", list=search_result, rec_user=random_user, user_info=user_info)
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/login')
def login():
    token_receive = request.cookies.get('mytoken')
    msg = request.args.get("msg")
    if token_receive is not None and msg is None:
        return redirect(url_for("home"))
    else:
        return render_template('login.html', msg=msg)

@app.route('/sign_in', methods=['POST'])
def sign_in():
    username_receive = request.form['username_give']
    password_receive = request.form['password_give']

    pw_hash = hashlib.sha256(password_receive.encode('utf-8')).hexdigest()
    result = db.users.find_one({'username': username_receive, 'password': pw_hash})

    if result is not None:
        payload = {
         'id': username_receive,
         'exp': datetime.utcnow() + timedelta(seconds=60 * 60 * 24)  # 로그인 24시간 유지
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        return jsonify({'result': 'success', 'token': token})
    else:
        return jsonify({'result': 'fail', 'msg': '아이디/비밀번호가 일치하지 않습니다.'})


@app.route('/sign_up/save', methods=['POST'])
def sign_up():
    username_receive = request.form['username_give']
    password_receive = request.form['password_give']
    password_hash = hashlib.sha256(password_receive.encode('utf-8')).hexdigest()
    profile_receive = request.form['profile_name_receive']
    doc = {
        "username": username_receive,
        "password": password_hash,
        "profile_name": profile_receive,
        "profile_pic": "",
        "profile_pic_real": "profile_pics/profile_placeholder.png",
        "profile_info": ""
    }
    db.users.insert_one(doc)
    return jsonify({'result': 'success'})


@app.route('/sign_up/check_dup', methods=['POST'])
def check_dup():
    username_receive = request.form['username_give']
    exists = bool(db.users.find_one({"username": username_receive}))
    return jsonify({'result': 'success', 'exists': exists})


@app.route('/new', methods=['POST'])
def add_post():
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])

        username = payload["id"]
        user_info = db.users.find_one({'username': username}, {"_id": False})

        post_title = request.form['title_give']
        post_day = request.form['day_give']
        post_comment = request.form['comment_give']

        new_doc = {
            "username": user_info['username'],
            "profile_name": user_info['profile_name'],
            "profile_pic_real": user_info['profile_pic_real'],
            "post_title": post_title,
            "post_day": post_day,
            "post_comment": post_comment
        }

        if 'file_give' in request.files:
            file = request.files["file_give"]
            filename = secure_filename(file.filename)
            extension = filename.split(".")[-1]
            # file_path = f"post_pics/{username}_{post_day}_{str(datetime.utcnow())}.{extension}"
            file_path = f"post_pics/{username}_{post_day}.{extension}"
            file.save("./static/" + file_path)

            new_doc["post_pic"] = filename
            new_doc["post_pic_real"] = file_path

        db.posts.insert_one(new_doc)
        return jsonify({"result": "success", 'msg': '프로필을 업데이트했습니다.'})
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))

@app.route('/user/<username>')
def user(username):
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        status = (username == payload["id"])
        user_info = db.users.find_one({"username": username}, {"_id": False})
        posts_info = list(db.posts.find({"username": username}).sort("date", -1).limit(20))
        for post in posts_info:
            print(str(post["_id"]))
            post["_id"] = str(post["_id"])

        return render_template('user.html', user_info=user_info, status=status, posts_info=posts_info)
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/user/<username>', methods=['PATCH'])
def update_user(username):
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        if payload['id'] == username:
            new_doc = {}
            nick_receive = request.form['nick_give']
            if nick_receive: new_doc['profile_name'] = nick_receive

            if 'file_give' in request.files:
                file = request.files["file_give"]
                filename = secure_filename(file.filename)
                extension = filename.split(".")[-1]

                file_path = f"profile_pics/{username}.{extension}"
                file.save("./static/" + file_path)

                new_doc["profile_pic"] = filename
                new_doc["profile_pic_real"] = file_path

            db.users.update_one({'username': username}, {'$set': new_doc})
            return jsonify({'result': 'success', 'msg': '정상적으로 수정이 완료되었습니다!'}), 200
        else:
            return jsonify({'result': 'failure'}), 403
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))

@app.route('/user/<username>', methods=['DELETE'])
def delete_user(username):
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        if payload['id'] == username:
            db.users.delete_one({'username': username})
            db.posts.delete_many({'username': username})

            return jsonify({'result': 'success', 'message': '그동안 저희 서비스를 이용해주셔서 감사했습니다'})
        else:
            return jsonify({'result': 'failure', 'message': '올르지 않은 접근입니다'}), 403
    except jwt.ExpiredSignatureError:
            return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/p/<post_id>', methods=['GET'])
def get_post_detail(post_id):
    token_receive = request.cookies.get('mytoken')
    post = db.posts.find_one({'_id': ObjectId(post_id)}, {'_id': False})
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        is_valid_user = True if (post['username'] == payload['id']) else False
        user = db.users.find_one({'username': payload['id']}, {'_id': False})
        return jsonify({
            'user': user,
            'post': post,
            'status': is_valid_user
        })
    except jwt.ExpiredSignatureError:
            return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
            return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


if __name__ == '__main__':
   app.run('0.0.0.0', port=5000, debug=True)