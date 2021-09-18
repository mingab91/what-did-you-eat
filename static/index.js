// index.html 좋아요 버튼에 달려 있던 onclick 함수. ajax를 통해 서버에 라벨링된 게시글의 id와 좋아요의 타입(우리는 엄지) 그리고 행동(좋아요, 좋아요 취소)를 전달해준다

function toggle_like(post_id, type) {
    // 좋아요 버튼 위치 변수 할당
    const $a_like = $(`#${post_id} a[aria-label='thumbs']`);
    // 좋아요 버튼 옆 좋아요 숫자 변수 할당
    const $i_like = $a_like.find("i");
    // 좋아요 상태라면
    if ($i_like.hasClass("fas")) {
        $.ajax({
            type: "POST",
            url: "/update_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "unlike" // 액션을 unlike로 갱신해주며
            },
            success: function (response) {
                // 아이콘의 모양과(두꺼운 엄지에서 얇은 엄지로) 좋아요 숫자를 갱신해준다
                $i_like.addClass("far").removeClass("fas")
                $a_like.find("span.like-num").text(response["count"])
            }
        });
        // 좋아요 상태가 아닌 경우에는 반대로 해준다
    } else {
        $.ajax({
            type: "POST",
            url: "/update_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "like"
            },
            success: function (response) {
                $i_like.addClass("fas").removeClass("far")
                $a_like.find("span.like-num").text(response["count"])
            }
        });
    }
}

/**
 @param {Event} event - onChangeEvent
 @return {void}
 @description - 1. input[type=file]의 accept 속성이 주는 한계를 보완하고자 만든 로직입니다.
                2. accept 속성에 해당하는 확장자와 일치하면 break를 통해 리턴하고, 그렇지 않으면 메세지를 보내고 파일을 초기화시킵니다.
 */

function validateExtension (event) {
    const that = event.currentTarget;
    const extension = that.value.match(/\.([^\.]+)$/)[1];
    switch (extension) {
        case 'jpg':
        case 'png':
            break;
        default:
            alert('올바르지 않은 파일 확장자입니다. png 또는 jpg 파일을 등록해주세요.');
            that.value = '';
    }
}

function find_food() {
    // 음식을 검색했을 시에 #search-bar라는 input박스의 값을 받아와
    const food = $('#search-bar').val();
    // 검색어를 서버에 넘겨준다. 이 과정에서 새로고침도 된다
    window.location.href = `/?food_give=${food}`;
}

/**
 @return {void}
 @description - 1. form의 모든 요소가 작성되어있는지, 파일 크기가 2mb를 넘는지 체크한 후 DB에 저장하는 요청을 보냅니다.
 */

const MAXIMUM_FILE_SIZE = 2097152;
function post() {
    const title = $('#title-post').val();
    const file = $('#input-pic')[0].files[0];
    const day = $("#day-post").val();
    const comment = $("#comment-post").val();

    if (!(title && file && day && comment)) {
        alert('게시물의 각 항목을 모두 입력해주세요');
        return;
    }

    const fileSize = file.size;
    if (fileSize >= MAXIMUM_FILE_SIZE) {
        alert('파일 크기는 2mb를 넘지 않아야 합니다.');
        return;
    }

    const formData = new FormData();
    const now = Date.now().toString();

    formData.append("file_give", file);
    formData.append("title_give", title);
    formData.append("comment_give", comment);
    formData.append("day_give", day);
    formData.append("now", now);

    $.ajax({
        type: "POST",
        url: "/new",
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function ({ result, msg }) {
            if (result === "success") {
                alert(msg);
                window.location.href= '/';
            }
        }
    });
}

/**
 @return {void}
 @description - 1. 클라이언트가 홈페이지에 있을 때에만 포스트 버튼의 위치를 스크롤에 따라 동적으로 결정하는 이벤트 핸들러를 부여하는 로직입니다.
                2. 베이스 템플릿(layout.html)에서 index.js를 내려주므로, 모든 페이지에 이벤트를 등록하지 않게끔 얼리 리턴 처리 하였습니다.
 */

(function addPostingButtonScrollEvent() {
    const postingIcon = document.getElementById('posting-icon');
    const mainInnerLeft = document.querySelector('.main__inner-left');
    if (!(postingIcon && mainInnerLeft)) {
        return;
    }

    document.addEventListener('scroll', () => {
        const offsetTop = mainInnerLeft.lastElementChild.offsetTop;
        const scrollY = window.scrollY;

        if (!scrollY) {
            postingIcon.style.top = '20px';
            return;
        }

        if (scrollY >= offsetTop) {
            postingIcon.style.top = `${offsetTop}px`;
        } else {
            postingIcon.style.top = `${scrollY - 75}px`;
        }
    });
}());


$('.logout-button').on('click', () => {
    $.removeCookie('mytoken', {path: '/'});
    window.location.href = '/login';
});