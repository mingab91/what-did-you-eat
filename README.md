<img src="https://user-images.githubusercontent.com/90446271/133872554-b084cc92-7986-42ae-957f-6972b6ac0e51.png">
<br><br>

# 항해99 3기 11조 프로젝트: 뭐먹었니?

#### 어제 뭐 먹었지? 친구들은 뭐 먹었을까? '뭐먹었니?'에서 함께하세요!  
#### 음식사진과 날짜, 설명을 업로드하면 친구들간 게시물이 공유되고, 좋아요로 유저간 소통할 수 있는 서비스입니다.  
#### 친구의 페이지에 방문해서 음식 취향을 알아보세요!
<br>

## 프로젝트 참가자
- 조민갑
- 박선웅
- 김현수
- 오세명
<br>

## 기술 스택
#### 프론트엔드
- HTML
- CSS(Bulma FrameWork)
- Javascript

#### 백엔드
- Python(Flask)

## API
|기능|URL|METHOD|REQUEST|RESPONSE|
|:----------------:|:----------:|:-------:|:---:|:---:|
|Render Home page|`/`|GET||HTML(index.html)|
|Render posts based on keyword|`/?food_give=val`|GET||HTML(index.html)|
|Login|`/login`|POST|nickname, userId, password|JSON|
|Check duplication id|`/sign_up/check_dup/`|POST|userId|JSON||
|Completion sign up|`/sign_up/save`|POST|userId, password, nickname|JSON|
|Upload Post|`/new`|POST|title, visitedDay, comment, photo|JSON|
|Update Like|`/update_like`|POST|postId, type, action|JSON|
|Render User Page|`/:userId`|GET||HTML(user.html)|
|Update User Account|`/:userId`|PATCH|profilePhoto, nickname, introduction|JSON|
|Delete User Account|`/:userId`|DELETE||JSON|
|Render Post Detail|`/p/:postId`|GET||JSON|
|Update Post Detail|`/p/:postId`|PATCH|comment|JSON|
|Delete Post Detail|`/p/:postId`|DELETE||JSON|
