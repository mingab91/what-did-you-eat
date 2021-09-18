import json
import random
from pymongo import MongoClient
from bson.objectid import ObjectId

import jwt
import datetime
import hashlib
import time

from flask import Flask, render_template, jsonify, request, redirect, url_for, abort
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from decouple import config


SECRET_KEY = config('SECRET_KEY')
MONGO_ADDRESS = config('ADDRESS')
PORT = config('DB_PORT')
ADMIN_NAME = config('ADMIN_NAME')
ADMIN_PASSWORD = config('ADMIN_PASSWORD')


app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['UPLOAD_FOLDER'] = "./static/profile_pics"

SECRET_KEY = SECRET_KEY

client = MongoClient(MONGO_ADDRESS, PORT, username=ADMIN_NAME, password=ADMIN_PASSWORD)
db = client.foodiary


class MyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, bytes):
            return str(obj, encoding='utf-8');
        return json.JSONEncoder.default(self, obj)


app.json_encoder = MyEncoder


@app.route('/')
def home():
    token_receive = request.cookies.get('mytoken')
    if token_receive is None:
        return redirect(url_for("login"))

    food_receive = request.args.get("food_give")
    user = list(db.users.find({}))

    # users 콜렉션에 첫번 째 필드들은 딕셔너리 형식이기 때문에 str()을 통해 문자열로 변환. 후에 사용하기 위함
    for item in user:
        item["_id"] = str(item["_id"])
    # 추천 사용자 목록을 구성하기 위해 무작위 유저 셋을 추출
    random_user = random.sample(user, 3)
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        user_info = db.users.find_one({"username": payload["id"]})
        # 조건문. food_receive는 클라이언트로부터 GET할 정보이며 정확히는 검색어 입력했을 시 서버로 전송되는 정보. 이게 None이라는 소리는 검색을 안 한 상태 = 첫 로딩 페이지이다.
        if food_receive is None:
            # 첫 로딩 페이지라면 최신순으로 posts 데이터를 가져와 20개 까지만 뿌려 주기
            posts = list(db.posts.find({}).sort("upload_time", -1).limit(20))
            # for 문을 돌며 posts에서 가져온 데이터를 수정 추가
            for post in posts:
                # 첫 번 째 field에 있는 _id를 사용할 수 있게 문자열로 형변환
                post['_id'] = str(post['_id'])
                # 좋아요 기능. 게시글 과 좋아요 종료(우리는 엄지 thumbs)의 수를 세어 posts에 count_thumbs로 추가
                post["count_thumbs"] = db.likes.count_documents({"post_id": post["_id"], "type": "thumbs"})
                # 사용자가 좋아요를 눌렀었는지 판단하는 로직. 좋아요, 좋아요 취소를 구현하기 위함
                post["thumbs_by_me"] = bool(db.likes.find_one({"post_id": post["_id"], "type": "thumbs", "username": payload['id']}))
            return render_template("index.html", list=posts, rec_user=random_user, user_info=user_info)
        # food_receive가 None이 아니라면, 다시 말해 있다면 검색어를 입력했고 그것이 food_receive로 넘어온 상태.
        else:
            # posts에서 food_receive와 같은 값을 가진 'post_title'을 찾아 최신순으로 메인페이지에 뿌려준다. 음식 이름을 검색했을 경우 그 값을 통해 메인페이지에 뿌려줌
            search_result = list(db.posts.find({'post_title': food_receive}).sort("date", -1).limit(20))
            # 포스트 아이디를 사용하기 위해 문자열로 형변환
            for post in search_result:
                post['_id'] = str(post['_id'])
            return render_template("index.html", list=search_result, rec_user=random_user, user_info=user_info)
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/login')
def login():
    token_receive = request.cookies.get('mytoken') # 유저 정보가 담긴 mytoken을 받기
    msg = request.args.get("msg") # 해당 메세지 요청
    if token_receive is not None and msg is None:
        return redirect(url_for("home")) # 토큰이 존재한다면 홈화면으로 리다이렉팅
    else:
        return render_template('login.html', msg=msg) # 없다면 메세지 출력


@app.route('/sign_in', methods=['POST'])
def sign_in():
    username_receive = request.form['username_give']
    password_receive = request.form['password_give']

    pw_hash = hashlib.sha256(password_receive.encode('utf-8')).hexdigest()
    result = db.users.find_one({'username': username_receive, 'password': pw_hash})

    if result is not None:
        payload = {
         'id': username_receive,
         'exp': datetime.utcnow() + timedelta(seconds=60 * 60 * 24) # 토큰 만료기간을 24시간으로 설정
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256') # HS256으로 암호화된 토큰 발급

        return jsonify({'result': 'success', 'token': token}) # 로그인 성공 및 토큰 저장
    else:
        return jsonify({'result': 'fail', 'msg': '아이디/비밀번호가 일치하지 않습니다.'}) # 로그인 실패시 메세지 출력


@app.route('/sign_up/save', methods=['POST'])
def sign_up():
    username_receive = request.form['username_give'] # 유저가 입력한 아이디 빋기
    password_receive = request.form['password_give'] # 유저가 입력한 비밀번호 빋기
    password_hash = hashlib.sha256(password_receive.encode('utf-8')).hexdigest() # 입력받은 비밀번호를 sha256을 적용하여 ㅇ마호화
    profile_receive = request.form['profile_name_receive'] # 유저가 입력한 닉네임 받기
    doc = { # DB에 저장되는 데이터
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
    exists = bool(db.users.find_one({"username": username_receive})) # 동일 ID가 있는지 bool함수로 검색
    return jsonify({'result': 'success', 'exists': exists}) # 로그인 성공하면 성공 문구 반환


@app.route('/new', methods=['POST'])
def add_post():
    # 로그인 토큰 확인
    token_receive = request.cookies.get('mytoken')
    try:
        # 로그인 토큰 암호화 불러오기
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        # 아이디 불러오기
        username = payload["id"]
        # 아이디 정보 불러오기
        user_info = db.users.find_one({'username': username}, {"_id": False})
        # 클라이언트로부터 받은 정보 서버에 전달
        post_title = request.form['title_give']
        post_day = request.form['day_give']
        post_comment = request.form['comment_give']
        now = request.form['now']
        # DB에 저장하기위한 딕셔너리 생성
        new_doc = {
            "username": user_info['username'],
            "profile_name": user_info['profile_name'],
            "profile_pic_real": user_info['profile_pic_real'],
            "post_title": post_title,
            "post_day": post_day,
            "post_comment": post_comment,
            "upload_time": round(time.time() * 1000)
        }

        if 'file_give' in request.files:
            # 클라이언트로부터 파일 받음
            file = request.files["file_give"]
            # 파일 이름 지정
            filename = secure_filename(file.filename)
            # 파일 확장자 지정
            extension = filename.split(".")[-1]
            # 저장 경로 설정
            file_path = f"post_pics/{username}_{post_day}_{now}.{extension}"
            # 저장
            file.save("./static/" + file_path)
            # 새로운 document에 동적으로 필드 추가
            new_doc["post_pic"] = filename
            new_doc["post_pic_real"] = file_path
        # DB에 새로운 딕서녀리 저장
        db.posts.insert_one(new_doc)
        return jsonify({"result": "success", 'msg': '게시물 등록이 완료되었어요!'})
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/update_like', methods=['POST'])
def update_like():
    token_receive = request.cookies.get('mytoken')
    # 가져온 jwt토큰을 이용해 로그인한 사용자인지 아닌지를 판단하기 위한 예외 처리문. 로그인
    try:
        # jwt코드를 디코드하여 payload에 할당
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        # 로그인한 유저를 디코드한 payload를 통해서 db에서 찾기
        user_info = db.users.find_one({"username": payload["id"]})
        # 게시물의 id를 클라이언트로부터 전송받기
        post_id_receive = request.form["post_id_give"]
        # 좋아요를 누른것의 타입(하트인지 손가락인지)을 클라이언트로부터 전송 받기
        type_receive = request.form["type_give"]
        # 좋아요 아이콘의 클래스를 통해 좋아요를 해야할지 좋아요 취소를 해야할지 판단하는 액션을 클라이언트로부터 전송 받기
        action_receive = request.form["action_give"]

        # db에 저장하기 위해 딕셔너리 형태로 만들기
        doc = {
            "post_id": post_id_receive,
            "username": user_info["username"],
            "type": type_receive
        }

        # 액션이 좋아요일 경우엔 저장
        if action_receive == "like":
            db.likes.insert_one(doc)
        # 아닐 경우엔 삭제
        else:
            db.likes.delete_one(doc)
        # 좋아요 갯수를 표시하기 위해 db에서 특정 게시글과 타입을 카운팅해서 클라언트로 넘겨주기
        count = db.likes.count_documents({"post_id": post_id_receive, "type": type_receive})
        return jsonify({"result": "success", 'msg': 'updated', "count": count})

    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/user/<username>', methods=['GET'])
def user(username):
    """
    :param username: userId
    :return: void
    :description: 1. 클라이언트가 해당 URL로 접속하면 jwt으로 사용자 인증을 마친 후 유저가 작성한 포스트를 변수로 담아 Jinja 템플릿에 리턴합니다.
                  2. jwt관련 에러가 발생하면 로그인 페이지로 리다이렉팅 합니다.
                  3. jwt로 디코딩한 id가 유저의 id와 같다면 수정에 관한 엘리먼트를 렌더링하기위해 관련 상태를 변수로 담아 Jinja 템플릿에 리턴합니다.
                  4. 유저의 정보가 없다면 404 에러를 던져줍니다.
    """
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        status = (username == payload["id"])
        user_info = db.users.find_one({"username": username}, {"_id": False})

        if user_info is None:
            abort(404)

        posts_info = list(db.posts.find({"username": username}).sort("upload_time", -1).limit(20))
        for post in posts_info:
            post["_id"] = str(post["_id"])
            post["count_thumbs"] = db.likes.count_documents({"post_id": post["_id"], "type": "thumbs"})
            post["thumbs_by_me"] = bool(db.likes.find_one({
                "post_id": post["_id"],
                "type": "thumbs",
                "username": payload['id']
            }))

        return render_template('user.html', user_info=user_info, status=status, posts_info=posts_info)
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/user/<username>', methods=['PATCH'])
def update_user(username):
    """
    :param username: userId
    :return: JSON based on authentication
    :description: 1. 디코딩된 token의 페이로드에 담겨있는 id가 url variable으로 보낸 유저 아이디와 같다면 db에 업데이트를 실시합니다.
                  1-1. users collection에 있는 document를 찾아 유저의 정보(프로필사진 또는 자기소개 부분)를 업데이트합니다.
                  1-2. posts collection에 있는 documents를 찾아 유저의 정보를 업데이트합니다.
                  2. PATCH를 사용한 이유: document의 전체 리소스를 추가하는 것이 아니기 때문에 PATCH를 사용해야 한다고 생각했습니다.
    """
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        if payload['id'] == username:
            new_doc = {}

            # 닉네임과 자기소개 부분만 Request body에 담아 전달된 상태입니다.
            nick_receive = request.form.get('nick_give')
            about_receive = request.form.get('about_give')

            if nick_receive:
                new_doc['profile_name'] = nick_receive
            if about_receive:
                new_doc['profile_info'] = about_receive

            # 유저의 프로필 사진에 관한 로직입니다.
            if 'file_give' in request.files:
                file = request.files["file_give"]
                filename = secure_filename(file.filename)
                extension = filename.split(".")[-1]

                file_path = f"profile_pics/{username}.{extension}"
                file.save("./static/" + file_path)

                new_doc["profile_pic"] = filename
                new_doc["profile_pic_real"] = file_path
                db.posts.update_many({'username': username}, {'$set': {
                    "profile_pic": filename,
                    "profile_pic_real": file_path,
                }})

            db.posts.update_many({'username': username}, {'$set': {"profile_name": nick_receive}})
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
    """
    :param username: userId
    :return: JSON based on authentication
    :description: jwt로부터 디코딩된 페이로드의 id가 유저의 아이디와 같다면 db에서 유저가 작성한 포스트들과 유저 정보를 삭제한 후 JSON을 리턴합니다.
    """
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        if payload['id'] == username:
            db.users.delete_one({'username': username})
            db.posts.delete_many({'username': username})

            return jsonify({'result': 'success', 'message': '그동안 저희 서비스를 이용해주셔서 감사했습니다'}), 200
        else:
            return jsonify({'result': 'failure', 'message': '올바르지 않은 접근입니다'}), 403
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/p/<post_id>', methods=['GET'])
def get_post_detail(post_id):
    """
    :param post_id: stringified ObjectID for post document in posts collection
    :return: JSON based on authentication
    :description: 1. 수정/삭제 버튼을 인증 조건부로 렌더링 하기 위하여 디코딩된 페이로드의 id와
                     posts collection의 다큐먼트에 저장된 id를 비교한 후 is_valid_user라는 변수에 담아 진자 템플릿에 리턴합니다.
                  2. post의 id가 db에 없다면 404를 던져줍니다.
    """
    token_receive = request.cookiesget('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        user = db.users.find_one({'username': payload['id']}, {'_id': False})

        try:
            post = db.posts.find_one({'_id': ObjectId(post_id)}, {'_id': False})
            is_valid_user = True if (post['username'] == payload['id']) else False
            return jsonify({
                'user': user,
                'post': post,
                'status': is_valid_user,
            })
        except:
            abort(404)

    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/p/<post_id>', methods=['PATCH'])
def update_comment(post_id):
    """
    :param post_id: stringified ObjectID for post document in posts collection
    :return: JSON based on authentication
    :description: /user/<userId>[PATCH] 의 로직과 동일하지만 comment만을 업데이트합니다.
    """
    token_receive = request.cookies.get('mytoken')
    updated_comment = request.form.get('comment_give')
    post = db.posts.find_one({'_id': ObjectId(post_id)}, {'_id': False})
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        if post['username'] == payload['id']:
            db.posts.update_one({'_id': ObjectId(post_id)}, {'$set': {
                'post_comment': updated_comment
            }})
            return jsonify({
                'result': 'success',
                'msg': '성공적으로 수정이 완료되었습니다.'
            }), 200
        else:
            return jsonify({
                'result': 'failure',
                'msg': '올바르지 않은 접근입니다. 관리자에게 문의해주세요.'
            }), 403
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.route('/p/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    """
    :param post_id: stringified ObjectID for post document in posts collection
    :return: /user/<userId>[DELETE]의 로직과 동일합지만, 클라이언트단에서 /user/<userId>[GET] 요청을 보낼 수 있도록 userId를 JSON에 리턴합니다.
    """
    token_receive = request.cookies.get('mytoken')
    post = db.posts.find_one({'_id': ObjectId(post_id)}, {'_id': False})
    user_id = post['username']
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        if post['username'] == payload['id']:
            db.posts.delete_one({'_id': ObjectId(post_id)})
            return jsonify({
                'result': 'success',
                'msg': '성공적으로 삭제가 완료되었습니다.',
                'userId': user_id
            }), 200
        else:
            return jsonify({
                'result': 'failure',
                'msg': '올바르지 않은 접근입니다. 관리자에게 문의해주세요.'
            }), 403
    except jwt.ExpiredSignatureError:
        return redirect(url_for("login", msg="로그인 시간이 만료되었습니다."))
    except jwt.exceptions.DecodeError:
        return redirect(url_for("login", msg="로그인 정보가 존재하지 않습니다."))


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


if __name__ == '__main__':
   app.run('0.0.0.0', port=5000, debug=True)