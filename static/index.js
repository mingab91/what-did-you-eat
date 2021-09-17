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

const validateExtension = (event) => {
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
};

function find_food() {
    const food = $('#search-bar').val();
    window.location.href = `/?food_give=${food}`;
}

function post() {
    const title = $('#title-post').val();
    const file = $('#input-pic')[0].files[0];
    const day = $("#day-post").val();
    const comment = $("#comment-post").val();

    if (!title || !file || !day || !comment) {
        alert('게시물의 각 항목을 모두 입력해주세요');
        return;
    }

    const fileSize = file.size;
    if (fileSize >= 2097152) {
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

(function toggling() {
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