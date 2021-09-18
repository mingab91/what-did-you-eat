function toggle_like(post_id, type) {
    let $a_like = $(`#${post_id} a[aria-label='thumbs']`);
    let $i_like = $a_like.find("i");

    if ($i_like.hasClass("fas")) {
        $.ajax({
            type: "POST",
            url: "/update_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "unlike"
            },
            success: function (response) {
                $i_like.addClass("far").removeClass("fas")
                $a_like.find("span.like-num").text(response["count"])
            }
        });
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
    const food = $('#search-bar').val();
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